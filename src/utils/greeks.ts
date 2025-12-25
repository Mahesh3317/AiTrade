/**
 * Greeks Calculator using Black-Scholes Model
 * Calculates Delta, Gamma, Theta, Vega, and Rho for options
 */

export interface GreeksInput {
  spotPrice: number;
  strikePrice: number;
  timeToExpiry: number; // in days
  riskFreeRate: number; // annual rate (default 0.06 for 6%)
  volatility: number; // implied volatility as decimal (e.g., 0.15 for 15%)
  optionType: 'call' | 'put';
}

export interface Greeks {
  delta: number;
  gamma: number;
  theta: number; // per day
  vega: number; // per 1% change in IV
  rho: number; // per 1% change in interest rate
}

// Standard normal CDF approximation
function normCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2.0);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

// Standard normal PDF
function normPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export function calculateGreeks(input: GreeksInput): Greeks {
  const { spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility, optionType } = input;

  // Convert time to years
  const T = timeToExpiry / 365;
  
  // Avoid division by zero
  if (T <= 0 || volatility <= 0 || spotPrice <= 0 || strikePrice <= 0) {
    return {
      delta: optionType === 'call' ? 0.5 : -0.5,
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0,
    };
  }

  const S = spotPrice;
  const K = strikePrice;
  const r = riskFreeRate;
  const sigma = volatility;

  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  const N_d1 = normCDF(d1);
  const N_d2 = normCDF(d2);
  const N_neg_d1 = normCDF(-d1);
  const N_neg_d2 = normCDF(-d2);
  const n_d1 = normPDF(d1);

  let delta: number;
  let theta: number;
  let rho: number;

  if (optionType === 'call') {
    delta = N_d1;
    theta = (-(S * n_d1 * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * N_d2) / 365;
    rho = K * T * Math.exp(-r * T) * N_d2 / 100;
  } else {
    // Put
    delta = N_d1 - 1;
    theta = (-(S * n_d1 * sigma) / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * N_neg_d2) / 365;
    rho = -K * T * Math.exp(-r * T) * N_neg_d2 / 100;
  }

  // Gamma is same for both calls and puts
  const gamma = n_d1 / (S * sigma * Math.sqrt(T));

  // Vega is same for both calls and puts (per 1% change in IV)
  const vega = (S * n_d1 * Math.sqrt(T)) / 100;

  return {
    delta: Math.max(-1, Math.min(1, delta)),
    gamma: Math.max(0, gamma),
    theta: theta,
    vega: Math.max(0, vega),
    rho: rho,
  };
}

/**
 * Calculate days to expiry from expiry date string
 */
export function getDaysToExpiry(expiryDate: string): number {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Calculate Greeks for option chain row
 */
export function calculateOptionGreeks(
  spotPrice: number,
  strikePrice: number,
  expiryDate: string,
  iv: number, // as percentage (e.g., 15 for 15%)
  optionType: 'call' | 'put',
  riskFreeRate: number = 0.065 // 6.5% as specified
): Greeks {
  const daysToExpiry = getDaysToExpiry(expiryDate);
  const volatility = iv / 100; // Convert percentage to decimal

  return calculateGreeks({
    spotPrice,
    strikePrice,
    timeToExpiry: daysToExpiry,
    riskFreeRate,
    volatility,
    optionType,
  });
}

