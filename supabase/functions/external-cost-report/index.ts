import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get API key from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = authHeader.replace('Bearer ', '')

    // Hash the API key
    const encoder = new TextEncoder()
    const data = encoder.encode(apiKey)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Validate API key
    const { data: keyData, error: keyError } = await supabase
      .rpc('validate_api_key', { p_key_hash: keyHash })

    if (keyError || !keyData || keyData.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { key_id, permissions } = keyData[0]

    // Check permissions
    if (!permissions.includes('read:reports') && !permissions.includes('reports:read')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update last used timestamp
    await supabase.rpc('update_api_key_usage', { p_key_id: key_id })

    // Parse query parameters
    const url = new URL(req.url)
    const fromDate = url.searchParams.get('from')
    const toDate = url.searchParams.get('to')
    const generatorId = url.searchParams.get('generatorId')

    if (!fromDate || !toDate) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters: from and to dates' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(fromDate) || !dateRegex.test(toDate)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid date format. Use YYYY-MM-DD' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch generators
    let genQuery = supabase.from('generators').select('*').eq('is_active', true)
    if (generatorId) {
      genQuery = genQuery.eq('id', generatorId)
    }
    const { data: generators, error: genError } = await genQuery

    if (genError) {
      throw genError
    }

    // Fetch hour readings for period
    const { data: readings, error: readError } = await supabase
      .from('hour_meter_readings')
      .select('*')
      .gte('date', fromDate)
      .lte('date', toDate)

    if (readError) {
      throw readError
    }

    // Fetch fuel issues for period
    const { data: issues, error: issueError } = await supabase
      .from('fuel_issues')
      .select('*')
      .gte('date', fromDate)
      .lte('date', toDate)

    if (issueError) {
      throw issueError
    }

    // Fetch fuel purchases for average cost calculation
    const { data: purchases, error: purchaseError } = await supabase
      .from('fuel_purchases')
      .select('*')
      .lte('date', toDate)

    if (purchaseError) {
      throw purchaseError
    }

    // Calculate average cost per fuel type
    const avgCostByType: Record<string, number> = {}
    const purchasesByType = purchases?.reduce((acc: Record<string, { qty: number; cost: number }>, p: any) => {
      if (!acc[p.fuel_type]) acc[p.fuel_type] = { qty: 0, cost: 0 }
      acc[p.fuel_type].qty += p.quantity_litres
      acc[p.fuel_type].cost += p.total_amount || 0
      return acc
    }, {})

    for (const [type, data] of Object.entries(purchasesByType || {})) {
      avgCostByType[type] = (data as { qty: number; cost: number }).qty > 0 
        ? (data as { qty: number; cost: number }).cost / (data as { qty: number; cost: number }).qty 
        : 0
    }

    // Calculate report for each generator
    const report = (generators || []).map((gen: any) => {
      const genReadings = (readings || []).filter((r: any) => r.generator_id === gen.id)
      const genIssues = (issues || []).filter((i: any) => i.generator_id === gen.id)

      const totalHours = genReadings.reduce((sum: number, r: any) => sum + (r.hours_run || 0), 0)
      const totalFuelIssued = genIssues.reduce((sum: number, i: any) => sum + i.quantity_litres, 0)
      const avgCost = avgCostByType[gen.fuel_type] || 0
      const totalCost = totalFuelIssued * avgCost

      return {
        id: gen.id,
        name: gen.name,
        fuelType: gen.fuel_type,
        totalHours: Math.round(totalHours * 10) / 10,
        totalFuelUsed: Math.round(totalFuelIssued * 10) / 10,
        avgConsumption: totalHours > 0 ? Math.round((totalFuelIssued / totalHours) * 100) / 100 : 0,
        totalFuelCost: Math.round(totalCost * 100) / 100,
        hourlyCost: totalHours > 0 ? Math.round((totalCost / totalHours) * 100) / 100 : 0,
      }
    })

    const totals = report.reduce(
      (acc: any, r: any) => ({
        totalHours: acc.totalHours + r.totalHours,
        totalFuelUsed: acc.totalFuelUsed + r.totalFuelUsed,
        totalFuelCost: acc.totalFuelCost + r.totalFuelCost,
      }),
      { totalHours: 0, totalFuelUsed: 0, totalFuelCost: 0 }
    )

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          period: { from: fromDate, to: toDate },
          generators: report,
          totals: {
            totalHours: Math.round(totals.totalHours * 10) / 10,
            totalFuelUsed: Math.round(totals.totalFuelUsed * 10) / 10,
            totalFuelCost: Math.round(totals.totalFuelCost * 100) / 100,
          },
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
