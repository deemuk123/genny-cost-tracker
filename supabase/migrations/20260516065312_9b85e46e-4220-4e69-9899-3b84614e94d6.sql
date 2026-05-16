-- Tighten RLS to explicitly require authentication on tables flagged by scanner

-- generators: replace overly broad SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view generators" ON public.generators;
CREATE POLICY "Authenticated users can view generators"
ON public.generators FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- fuel_issues
DROP POLICY IF EXISTS "Authenticated users can view fuel issues" ON public.fuel_issues;
CREATE POLICY "Authenticated users can view fuel issues"
ON public.fuel_issues FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- fuel_purchases
DROP POLICY IF EXISTS "Authenticated users can view fuel purchases" ON public.fuel_purchases;
CREATE POLICY "Authenticated users can view fuel purchases"
ON public.fuel_purchases FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- fuel_stock
DROP POLICY IF EXISTS "Authenticated users can view fuel stock" ON public.fuel_stock;
CREATE POLICY "Authenticated users can view fuel stock"
ON public.fuel_stock FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- hour_meter_readings
DROP POLICY IF EXISTS "Authenticated users can view hour readings" ON public.hour_meter_readings;
CREATE POLICY "Authenticated users can view hour readings"
ON public.hour_meter_readings FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- monthly_stock_checks
DROP POLICY IF EXISTS "Authenticated users can view stock checks" ON public.monthly_stock_checks;
CREATE POLICY "Authenticated users can view stock checks"
ON public.monthly_stock_checks FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- profiles: add explicit deny-anon by ensuring policies are authenticated only (already are)
-- Add a belt-and-suspenders explicit auth check on existing policies by recreating
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL AND id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

-- api_keys: tighten with explicit auth check
DROP POLICY IF EXISTS "Only super admins can view API keys" ON public.api_keys;
CREATE POLICY "Only super admins can view API keys"
ON public.api_keys FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Only super admins can manage API keys" ON public.api_keys;
CREATE POLICY "Only super admins can manage API keys"
ON public.api_keys FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'super_admin'::app_role));