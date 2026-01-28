import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HourReading {
  id: string;
  generator_id: string;
  date: string;
  opening_hour: number;
  closing_hour: number;
  hours_run: number | null;
}

interface Generator {
  id: string;
  name: string;
  fuel_type: string;
  is_active: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API key from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing or invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = authHeader.replace('Bearer ', '');

    // Hash the API key for comparison
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate API key
    const { data: keyData, error: keyError } = await supabase
      .rpc('validate_api_key', { p_key_hash: keyHash });

    if (keyError || !keyData || keyData.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { key_id, permissions } = keyData[0];

    // Check permissions
    if (!permissions.includes('read:reports') && !permissions.includes('read:hours')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update API key usage
    await supabase.rpc('update_api_key_usage', { p_key_id: key_id });

    // Get query parameters
    const url = new URL(req.url);
    const fromDate = url.searchParams.get('from');
    const toDate = url.searchParams.get('to');

    if (!fromDate || !toDate) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters: from and to dates' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fromDate) || !dateRegex.test(toDate)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid date format. Use YYYY-MM-DD' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch generators
    const { data: generators, error: genError } = await supabase
      .from('generators')
      .select('id, name, fuel_type, is_active')
      .eq('is_active', true)
      .order('name');

    if (genError) {
      throw genError;
    }

    // Fetch hour readings
    const { data: readings, error: readError } = await supabase
      .from('hour_meter_readings')
      .select('id, generator_id, date, opening_hour, closing_hour, hours_run')
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date', { ascending: false });

    if (readError) {
      throw readError;
    }

    // Group readings by date
    const readingsByDate = new Map<string, HourReading[]>();
    (readings as HourReading[]).forEach(reading => {
      if (!readingsByDate.has(reading.date)) {
        readingsByDate.set(reading.date, []);
      }
      readingsByDate.get(reading.date)!.push(reading);
    });

    // Format readings by date
    const formattedReadings = Array.from(readingsByDate.entries()).map(([date, dateReadings]) => ({
      date,
      entries: dateReadings.map(r => ({
        generatorId: r.generator_id,
        openingHour: r.opening_hour,
        closingHour: r.closing_hour,
        hoursRun: r.hours_run || 0,
      })),
    }));

    // Calculate totals
    const totalsByGenerator = new Map<string, number>();
    (readings as HourReading[]).forEach(reading => {
      const current = totalsByGenerator.get(reading.generator_id) || 0;
      totalsByGenerator.set(reading.generator_id, current + (reading.hours_run || 0));
    });

    const byGenerator = (generators as Generator[]).map(gen => ({
      generatorId: gen.id,
      name: gen.name,
      totalHours: totalsByGenerator.get(gen.id) || 0,
    }));

    const grandTotal = Array.from(totalsByGenerator.values()).reduce((sum, hours) => sum + hours, 0);

    const response = {
      success: true,
      data: {
        period: { from: fromDate, to: toDate },
        generators: (generators as Generator[]).map(g => ({
          id: g.id,
          name: g.name,
          fuelType: g.fuel_type,
        })),
        readings: formattedReadings,
        totals: {
          byGenerator,
          grandTotal,
        },
      },
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
