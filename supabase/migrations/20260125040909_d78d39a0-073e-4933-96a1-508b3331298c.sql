-- ============================================
-- PHASE 1: ENUM TYPE
-- ============================================
CREATE TYPE public.fuel_type AS ENUM ('diesel', 'petrol');

-- ============================================
-- PHASE 2: CORE TABLES
-- ============================================

-- Generators Table
CREATE TABLE public.generators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    generator_id VARCHAR(50),
    location VARCHAR(200),
    capacity_kva DECIMAL(10,2),
    fuel_type fuel_type NOT NULL DEFAULT 'diesel',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    initial_hour_reading DECIMAL(10,2) NOT NULL DEFAULT 0,
    initial_fuel_stock DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hour Meter Readings Table
CREATE TABLE public.hour_meter_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generator_id UUID NOT NULL REFERENCES public.generators(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    opening_hour DECIMAL(10,2) NOT NULL,
    closing_hour DECIMAL(10,2) NOT NULL,
    hours_run DECIMAL(10,2),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(generator_id, date)
);

-- Fuel Stock Table (create before purchases/issues for FK)
CREATE TABLE public.fuel_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fuel_type fuel_type NOT NULL UNIQUE,
    quantity_litres DECIMAL(10,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Initialize fuel stock entries
INSERT INTO public.fuel_stock (fuel_type, quantity_litres) VALUES 
    ('diesel', 0),
    ('petrol', 0);

-- Fuel Purchases Table
CREATE TABLE public.fuel_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    fuel_type fuel_type NOT NULL,
    quantity_litres DECIMAL(10,2) NOT NULL,
    rate_per_litre DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(12,2),
    vendor VARCHAR(200),
    invoice_number VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fuel Issues Table
CREATE TABLE public.fuel_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    generator_id UUID NOT NULL REFERENCES public.generators(id) ON DELETE CASCADE,
    fuel_type fuel_type NOT NULL,
    quantity_litres DECIMAL(10,2) NOT NULL,
    stock_after_issue DECIMAL(10,2),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Monthly Stock Checks Table
CREATE TABLE public.monthly_stock_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_date DATE NOT NULL,
    fuel_type fuel_type NOT NULL,
    fiscal_year VARCHAR(20),
    fiscal_month VARCHAR(50),
    opening_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_purchases DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_issues DECIMAL(10,2) NOT NULL DEFAULT 0,
    theoretical_closing DECIMAL(10,2),
    physical_closing DECIMAL(10,2) NOT NULL,
    variance DECIMAL(10,2),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- API Keys Table
CREATE TABLE public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    key_prefix VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    permissions TEXT[] NOT NULL DEFAULT ARRAY['read:reports'],
    created_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- PHASE 3: INDEXES
-- ============================================
CREATE INDEX idx_generators_active ON public.generators(is_active);
CREATE INDEX idx_generators_fuel_type ON public.generators(fuel_type);
CREATE INDEX idx_hour_readings_generator ON public.hour_meter_readings(generator_id);
CREATE INDEX idx_hour_readings_date ON public.hour_meter_readings(date);
CREATE INDEX idx_fuel_purchases_date ON public.fuel_purchases(date);
CREATE INDEX idx_fuel_purchases_fuel_type ON public.fuel_purchases(fuel_type);
CREATE INDEX idx_fuel_issues_generator ON public.fuel_issues(generator_id);
CREATE INDEX idx_fuel_issues_date ON public.fuel_issues(date);
CREATE INDEX idx_stock_checks_date ON public.monthly_stock_checks(check_date);
CREATE INDEX idx_api_keys_hash ON public.api_keys(key_hash);

-- ============================================
-- PHASE 4: TRIGGER FUNCTIONS
-- ============================================

-- Calculate hours run on insert/update
CREATE OR REPLACE FUNCTION public.calculate_hours_run()
RETURNS TRIGGER AS $$
BEGIN
    NEW.hours_run := NEW.closing_hour - NEW.opening_hour;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Calculate total amount on insert/update
CREATE OR REPLACE FUNCTION public.calculate_total_amount()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_amount := NEW.quantity_litres * NEW.rate_per_litre;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Update stock after fuel purchase
CREATE OR REPLACE FUNCTION public.update_stock_after_purchase()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.fuel_stock 
    SET quantity_litres = quantity_litres + NEW.quantity_litres,
        updated_at = NOW()
    WHERE fuel_type = NEW.fuel_type;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update stock after fuel issue
CREATE OR REPLACE FUNCTION public.update_stock_after_issue()
RETURNS TRIGGER AS $$
DECLARE
    current_stock DECIMAL(10,2);
BEGIN
    SELECT quantity_litres INTO current_stock 
    FROM public.fuel_stock 
    WHERE fuel_type = NEW.fuel_type;
    
    NEW.stock_after_issue := COALESCE(current_stock, 0) - NEW.quantity_litres;
    
    UPDATE public.fuel_stock 
    SET quantity_litres = NEW.stock_after_issue,
        updated_at = NOW()
    WHERE fuel_type = NEW.fuel_type;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update generators updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_generator_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Calculate stock check variance
CREATE OR REPLACE FUNCTION public.calculate_stock_check_variance()
RETURNS TRIGGER AS $$
BEGIN
    NEW.theoretical_closing := NEW.opening_stock + NEW.total_purchases - NEW.total_issues;
    NEW.variance := NEW.physical_closing - NEW.theoretical_closing;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================
-- PHASE 5: TRIGGERS
-- ============================================

CREATE TRIGGER trigger_calculate_hours_run
    BEFORE INSERT OR UPDATE ON public.hour_meter_readings
    FOR EACH ROW EXECUTE FUNCTION public.calculate_hours_run();

CREATE TRIGGER trigger_calculate_total_amount
    BEFORE INSERT OR UPDATE ON public.fuel_purchases
    FOR EACH ROW EXECUTE FUNCTION public.calculate_total_amount();

CREATE TRIGGER trigger_update_stock_after_purchase
    AFTER INSERT ON public.fuel_purchases
    FOR EACH ROW EXECUTE FUNCTION public.update_stock_after_purchase();

CREATE TRIGGER trigger_update_stock_after_issue
    BEFORE INSERT ON public.fuel_issues
    FOR EACH ROW EXECUTE FUNCTION public.update_stock_after_issue();

CREATE TRIGGER trigger_update_generator_timestamp
    BEFORE UPDATE ON public.generators
    FOR EACH ROW EXECUTE FUNCTION public.update_generator_timestamp();

CREATE TRIGGER trigger_calculate_stock_variance
    BEFORE INSERT OR UPDATE ON public.monthly_stock_checks
    FOR EACH ROW EXECUTE FUNCTION public.calculate_stock_check_variance();

-- ============================================
-- PHASE 6: HELPER FUNCTIONS FOR REPORTS
-- ============================================

-- Get last hour reading for a generator
CREATE OR REPLACE FUNCTION public.get_last_hour_reading(p_generator_id UUID)
RETURNS DECIMAL
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    last_reading DECIMAL(10,2);
    initial_reading DECIMAL(10,2);
BEGIN
    SELECT closing_hour INTO last_reading
    FROM public.hour_meter_readings
    WHERE generator_id = p_generator_id
    ORDER BY date DESC, created_at DESC
    LIMIT 1;
    
    IF last_reading IS NULL THEN
        SELECT initial_hour_reading INTO initial_reading
        FROM public.generators
        WHERE id = p_generator_id;
        RETURN COALESCE(initial_reading, 0);
    END IF;
    
    RETURN last_reading;
END;
$$;

-- Get total hours for a generator in date range
CREATE OR REPLACE FUNCTION public.get_total_hours(
    p_generator_id UUID, 
    p_from_date DATE, 
    p_to_date DATE
)
RETURNS DECIMAL
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(SUM(hours_run), 0)
    FROM public.hour_meter_readings
    WHERE generator_id = p_generator_id
      AND date BETWEEN p_from_date AND p_to_date;
$$;

-- Get total fuel issued to a generator in date range
CREATE OR REPLACE FUNCTION public.get_total_fuel_issued(
    p_generator_id UUID, 
    p_from_date DATE, 
    p_to_date DATE
)
RETURNS DECIMAL
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(SUM(quantity_litres), 0)
    FROM public.fuel_issues
    WHERE generator_id = p_generator_id
      AND date BETWEEN p_from_date AND p_to_date;
$$;

-- Get average fuel cost for a fuel type in date range
CREATE OR REPLACE FUNCTION public.get_avg_fuel_cost(
    p_fuel_type fuel_type, 
    p_from_date DATE, 
    p_to_date DATE
)
RETURNS DECIMAL
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        SUM(total_amount) / NULLIF(SUM(quantity_litres), 0),
        0
    )
    FROM public.fuel_purchases
    WHERE fuel_type = p_fuel_type
      AND date BETWEEN p_from_date AND p_to_date;
$$;

-- Validate API key and return permissions
CREATE OR REPLACE FUNCTION public.validate_api_key(p_key_hash VARCHAR(64))
RETURNS TABLE(key_id UUID, permissions TEXT[])
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT ak.id, ak.permissions
    FROM public.api_keys ak
    WHERE ak.key_hash = p_key_hash
      AND ak.is_active = true
      AND (ak.expires_at IS NULL OR ak.expires_at > NOW());
END;
$$;

-- Update API key last used timestamp
CREATE OR REPLACE FUNCTION public.update_api_key_usage(p_key_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    UPDATE public.api_keys 
    SET last_used_at = NOW() 
    WHERE id = p_key_id;
$$;

-- ============================================
-- PHASE 7: ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.generators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hour_meter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_stock_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- GENERATORS POLICIES
CREATE POLICY "Authenticated users can view generators"
ON public.generators FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and maintenance can create generators"
ON public.generators FOR INSERT
TO authenticated
WITH CHECK (
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'maintenance')
);

CREATE POLICY "Admins and maintenance can update generators"
ON public.generators FOR UPDATE
TO authenticated
USING (
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'maintenance')
);

CREATE POLICY "Only admins can delete generators"
ON public.generators FOR DELETE
TO authenticated
USING (
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin')
);

-- HOUR METER READINGS POLICIES
CREATE POLICY "Authenticated users can view hour readings"
ON public.hour_meter_readings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authorized users can create hour readings"
ON public.hour_meter_readings FOR INSERT
TO authenticated
WITH CHECK (
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'maintenance') OR 
    has_role(auth.uid(), 'operator')
);

CREATE POLICY "Admins can update hour readings"
ON public.hour_meter_readings FOR UPDATE
TO authenticated
USING (
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin') OR
    created_by = auth.uid()
);

CREATE POLICY "Only admins can delete hour readings"
ON public.hour_meter_readings FOR DELETE
TO authenticated
USING (
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin')
);

-- FUEL PURCHASES POLICIES
CREATE POLICY "Authenticated users can view fuel purchases"
ON public.fuel_purchases FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and maintenance can create fuel purchases"
ON public.fuel_purchases FOR INSERT
TO authenticated
WITH CHECK (
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'maintenance')
);

CREATE POLICY "Only admins can update fuel purchases"
ON public.fuel_purchases FOR UPDATE
TO authenticated
USING (
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only admins can delete fuel purchases"
ON public.fuel_purchases FOR DELETE
TO authenticated
USING (
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin')
);

-- FUEL ISSUES POLICIES
CREATE POLICY "Authenticated users can view fuel issues"
ON public.fuel_issues FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authorized users can create fuel issues"
ON public.fuel_issues FOR INSERT
TO authenticated
WITH CHECK (
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'maintenance') OR 
    has_role(auth.uid(), 'operator')
);

CREATE POLICY "Only admins can update fuel issues"
ON public.fuel_issues FOR UPDATE
TO authenticated
USING (
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only admins can delete fuel issues"
ON public.fuel_issues FOR DELETE
TO authenticated
USING (
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin')
);

-- FUEL STOCK POLICIES
CREATE POLICY "Authenticated users can view fuel stock"
ON public.fuel_stock FOR SELECT
TO authenticated
USING (true);

-- No direct insert/update/delete for fuel_stock (managed by triggers)

-- MONTHLY STOCK CHECKS POLICIES
CREATE POLICY "Authenticated users can view stock checks"
ON public.monthly_stock_checks FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and maintenance can create stock checks"
ON public.monthly_stock_checks FOR INSERT
TO authenticated
WITH CHECK (
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'maintenance')
);

CREATE POLICY "Only admins can update stock checks"
ON public.monthly_stock_checks FOR UPDATE
TO authenticated
USING (
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only admins can delete stock checks"
ON public.monthly_stock_checks FOR DELETE
TO authenticated
USING (
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin')
);

-- API KEYS POLICIES
CREATE POLICY "Only super admins can view API keys"
ON public.api_keys FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Only super admins can manage API keys"
ON public.api_keys FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));