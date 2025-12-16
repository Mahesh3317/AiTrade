import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Broker OAuth configurations
const BROKER_CONFIGS: Record<string, { tokenUrl: string; clientId: string; clientSecret: string; redirectUri: string }> = {
  upstox: {
    tokenUrl: 'https://api.upstox.com/v2/login/authorization/token',
    clientId: Deno.env.get('UPSTOX_CLIENT_ID') || '',
    clientSecret: Deno.env.get('UPSTOX_CLIENT_SECRET') || '',
    redirectUri: `${Deno.env.get('SITE_URL') || ''}/broker-callback`,
  },
  angelone: {
    tokenUrl: 'https://apiconnect.angelbroking.com/rest/auth/angelbroking/jwt/v1/generateTokens',
    clientId: Deno.env.get('ANGELONE_CLIENT_ID') || '',
    clientSecret: Deno.env.get('ANGELONE_CLIENT_SECRET') || '',
    redirectUri: `${Deno.env.get('SITE_URL') || ''}/broker-callback`,
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, broker, userId } = await req.json();
    
    console.log(`Processing OAuth for broker: ${broker}, user: ${userId}`);

    const config = BROKER_CONFIGS[broker];
    if (!config) {
      throw new Error(`Unsupported broker: ${broker}`);
    }

    let accessToken = '';
    let refreshToken = '';

    if (broker === 'upstox') {
      // Upstox OAuth token exchange
      const tokenResponse = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: config.redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenResponse.json();
      console.log('Upstox token response:', JSON.stringify(tokenData));

      if (!tokenResponse.ok) {
        throw new Error(tokenData.message || 'Failed to get access token');
      }

      accessToken = tokenData.access_token;
      refreshToken = tokenData.refresh_token || '';
    }

    // Store connection in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: dbError } = await supabase
      .from('broker_connections')
      .upsert({
        user_id: userId,
        broker_name: broker,
        access_token: accessToken,
        refresh_token: refreshToken,
        is_connected: true,
        connected_at: new Date().toISOString(),
      }, { onConflict: 'user_id,broker_name' });

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      access_token: accessToken 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('OAuth error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'OAuth failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
