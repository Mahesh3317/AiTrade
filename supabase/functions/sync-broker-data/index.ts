import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { broker, userId, accessToken } = await req.json();
    
    console.log(`Syncing data for broker: ${broker}, user: ${userId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get broker connection ID
    const { data: connection } = await supabase
      .from('broker_connections')
      .select('id')
      .eq('user_id', userId)
      .eq('broker_name', broker)
      .single();

    const brokerConnectionId = connection?.id;

    if (broker === 'upstox') {
      // Fetch fund and margin data
      const fundsResponse = await fetch('https://api.upstox.com/v2/user/get-funds-and-margin', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });
      
      if (fundsResponse.ok) {
        const fundsData = await fundsResponse.json();
        console.log('Funds data:', JSON.stringify(fundsData));
        
        // Store initial fund data as deposit
        if (fundsData.data?.equity?.available_margin) {
          await supabase.from('fund_flows').insert({
            user_id: userId,
            broker_connection_id: brokerConnectionId,
            flow_type: 'deposit',
            amount: fundsData.data.equity.available_margin,
            flow_date: new Date().toISOString(),
            description: 'Current available margin (synced from broker)',
          });
        }
      }

      // Fetch trade history (last 30 days)
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const tradesResponse = await fetch(
        `https://api.upstox.com/v2/order/trades/get-trades-for-day?from_date=${thirtyDaysAgo.toISOString().split('T')[0]}&to_date=${today.toISOString().split('T')[0]}`, 
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        }
      );

      if (tradesResponse.ok) {
        const tradesData = await tradesResponse.json();
        console.log('Trades data:', JSON.stringify(tradesData));

        if (tradesData.data && Array.isArray(tradesData.data)) {
          const tradesToInsert = tradesData.data.map((trade: any) => ({
            user_id: userId,
            broker_connection_id: brokerConnectionId,
            symbol: trade.trading_symbol || trade.tradingsymbol,
            underlying: trade.instrument_token,
            instrument_type: trade.instrument_type || 'EQ',
            option_type: trade.option_type || null,
            strike: trade.strike_price || null,
            expiry: trade.expiry || null,
            side: trade.transaction_type?.toLowerCase() || 'buy',
            quantity: Math.abs(trade.quantity || trade.filled_quantity || 0),
            lot_size: trade.lot_size || 1,
            avg_price: trade.average_price || trade.price || 0,
            entry_time: trade.trade_date || trade.order_timestamp || new Date().toISOString(),
            source: 'upstox',
            status: 'CLOSED',
            pnl: trade.pnl || 0,
            brokerage: trade.brokerage || 0,
            taxes: trade.taxes || 0,
          }));

          if (tradesToInsert.length > 0) {
            const { error: insertError } = await supabase
              .from('trades')
              .insert(tradesToInsert);

            if (insertError) {
              console.error('Error inserting trades:', insertError);
            } else {
              console.log(`Inserted ${tradesToInsert.length} trades`);
            }
          }
        }
      }

      // Fetch order book for pending/open orders
      const ordersResponse = await fetch('https://api.upstox.com/v2/order/retrieve-all', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        console.log('Orders data:', JSON.stringify(ordersData));
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Broker data synced successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Sync failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
