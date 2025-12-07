import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MSTOCK_API_BASE = 'https://api.mstock.trade/openapi/typeb';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('MSTOCK_API_KEY');
    const accessToken = Deno.env.get('MSTOCK_ACCESS_TOKEN');

    if (!apiKey || !accessToken) {
      console.error('Missing mStock credentials');
      return new Response(
        JSON.stringify({ 
          error: 'mStock credentials not configured',
          message: 'Please configure MSTOCK_API_KEY and MSTOCK_ACCESS_TOKEN secrets'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, exchange, expiry, token, symbol } = await req.json();
    
    const headers = {
      'X-Mirae-Version': '1',
      'Authorization': `Bearer ${accessToken}`,
      'X-PrivateKey': apiKey,
      'Content-Type': 'application/json',
    };

    let response;
    let endpoint = '';

    switch (action) {
      case 'getOptionChainMaster':
        // Get option chain master data (list of all available symbols and expiries)
        // exchange: 1=NSE, 2=NFO
        endpoint = `${MSTOCK_API_BASE}/getoptionchainmaster/${exchange || 2}`;
        console.log(`Fetching option chain master from: ${endpoint}`);
        response = await fetch(endpoint, { headers });
        break;

      case 'getOptionChain':
        // Get option chain for specific symbol
        // exchange: 2=NFO, expiry: epoch timestamp, token: symbol token
        if (!expiry || !token) {
          return new Response(
            JSON.stringify({ error: 'Missing required parameters: expiry and token' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        endpoint = `${MSTOCK_API_BASE}/GetOptionChain/${exchange || 2}/${expiry}/${token}`;
        console.log(`Fetching option chain from: ${endpoint}`);
        response = await fetch(endpoint, { headers });
        break;

      case 'getQuote':
        // Get market quote for a symbol
        endpoint = `${MSTOCK_API_BASE}/getquote/${exchange || 1}/${token}`;
        console.log(`Fetching quote from: ${endpoint}`);
        response = await fetch(endpoint, { headers });
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Supported: getOptionChainMaster, getOptionChain, getQuote' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const data = await response.json();
    console.log(`mStock API response status: ${response.status}`);
    
    if (!response.ok) {
      console.error('mStock API error:', data);
      return new Response(
        JSON.stringify({ 
          error: 'mStock API error', 
          details: data,
          message: data.message || 'Unknown error from mStock API'
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
