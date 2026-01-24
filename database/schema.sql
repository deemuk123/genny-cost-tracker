-- ============================================
-- Generator Hours & Cost Tracker - Database Schema
-- Compatible with PostgreSQL / MySQL
-- ============================================

-- ============================================
-- 1. ENUM TYPES (PostgreSQL only)
-- ============================================

-- For MySQL, use ENUM directly in column definitions
CREATE TYPE fuel_type AS ENUM ('diesel', 'petrol');
CREATE TYPE app_role AS ENUM ('super_admin', 'admin', 'maintenance', 'operator', 'viewer');

-- ============================================
-- 2. USERS TABLE
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(200),
    password_hash VARCHAR(255), -- Stores bcrypt hash of password
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);

-- ============================================
-- 3. USER ROLES TABLE
-- ============================================

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- ============================================
-- 4. API KEYS TABLE (For External System Access)
-- ============================================

CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of the key
    key_prefix VARCHAR(10) NOT NULL, -- First 8 chars for display
    name VARCHAR(100) NOT NULL, -- Description like "ERP System"
    permissions TEXT[] DEFAULT ARRAY['reports:read'],
    created_by UUID REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);

-- ============================================
-- 5. INSERT SUPER ADMIN USER
-- ============================================

-- Insert super user (deepesh.k.sharma@gmail.com)
INSERT INTO users (email, name, is_active) 
VALUES ('deepesh.k.sharma@gmail.com', 'Deepesh K. Sharma', true)
ON CONFLICT (email) DO NOTHING;

-- Assign super_admin role
INSERT INTO user_roles (user_id, role)
SELECT id, 'super_admin' FROM users WHERE email = 'deepesh.k.sharma@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================
-- 3. GENERATORS TABLE
-- ============================================

CREATE TABLE generators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    generator_id VARCHAR(50) UNIQUE, -- Optional custom ID like "DG-001"
    location VARCHAR(200),
    capacity_kva DECIMAL(10,2),
    fuel_type fuel_type NOT NULL DEFAULT 'diesel',
    start_date DATE,
    initial_hour_reading DECIMAL(10,2) DEFAULT 0,
    initial_fuel_stock DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_generators_active ON generators(is_active);
CREATE INDEX idx_generators_fuel_type ON generators(fuel_type);

-- ============================================
-- 4. HOUR METER READINGS TABLE
-- ============================================

CREATE TABLE hour_meter_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generator_id UUID NOT NULL REFERENCES generators(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    opening_hour DECIMAL(10,2) NOT NULL,
    closing_hour DECIMAL(10,2) NOT NULL,
    hours_run DECIMAL(10,2) GENERATED ALWAYS AS (closing_hour - opening_hour) STORED,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_hours CHECK (closing_hour >= opening_hour),
    UNIQUE(generator_id, date)
);

CREATE INDEX idx_hour_readings_generator ON hour_meter_readings(generator_id);
CREATE INDEX idx_hour_readings_date ON hour_meter_readings(date);
CREATE INDEX idx_hour_readings_generator_date ON hour_meter_readings(generator_id, date DESC);

-- ============================================
-- 5. FUEL PURCHASES TABLE
-- ============================================

CREATE TABLE fuel_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    fuel_type fuel_type NOT NULL,
    quantity_litres DECIMAL(10,2) NOT NULL,
    rate_per_litre DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(12,2) GENERATED ALWAYS AS (quantity_litres * rate_per_litre) STORED,
    vendor VARCHAR(200),
    invoice_number VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT positive_quantity CHECK (quantity_litres > 0),
    CONSTRAINT positive_rate CHECK (rate_per_litre > 0)
);

CREATE INDEX idx_fuel_purchases_date ON fuel_purchases(date);
CREATE INDEX idx_fuel_purchases_fuel_type ON fuel_purchases(fuel_type);
CREATE INDEX idx_fuel_purchases_date_type ON fuel_purchases(date, fuel_type);

-- ============================================
-- 6. FUEL ISSUES TABLE
-- ============================================

CREATE TABLE fuel_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    generator_id UUID NOT NULL REFERENCES generators(id) ON DELETE CASCADE,
    fuel_type fuel_type NOT NULL,
    quantity_litres DECIMAL(10,2) NOT NULL,
    stock_after_issue DECIMAL(10,2),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT positive_issue_quantity CHECK (quantity_litres > 0)
);

CREATE INDEX idx_fuel_issues_date ON fuel_issues(date);
CREATE INDEX idx_fuel_issues_generator ON fuel_issues(generator_id);
CREATE INDEX idx_fuel_issues_date_generator ON fuel_issues(date, generator_id);

-- ============================================
-- 7. FUEL STOCK TABLE (Current Stock Levels)
-- ============================================

CREATE TABLE fuel_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fuel_type fuel_type NOT NULL UNIQUE,
    quantity_litres DECIMAL(10,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initialize stock records
INSERT INTO fuel_stock (fuel_type, quantity_litres) VALUES ('diesel', 0), ('petrol', 0);

-- ============================================
-- 8. MONTHLY STOCK CHECKS TABLE
-- ============================================

CREATE TABLE monthly_stock_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_date DATE NOT NULL,
    fuel_type fuel_type NOT NULL,
    fiscal_year VARCHAR(20), -- e.g., "2080/81" for Nepal FY
    fiscal_month VARCHAR(50), -- e.g., "Shrawan" for Nepali month
    opening_stock DECIMAL(10,2) NOT NULL,
    total_purchases DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_issues DECIMAL(10,2) NOT NULL DEFAULT 0,
    theoretical_closing DECIMAL(10,2) GENERATED ALWAYS AS (opening_stock + total_purchases - total_issues) STORED,
    physical_closing DECIMAL(10,2) NOT NULL,
    variance DECIMAL(10,2) GENERATED ALWAYS AS (physical_closing - (opening_stock + total_purchases - total_issues)) STORED,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(check_date, fuel_type)
);

CREATE INDEX idx_stock_checks_date ON monthly_stock_checks(check_date);
CREATE INDEX idx_stock_checks_fuel_type ON monthly_stock_checks(fuel_type);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check user role
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Function to get user's highest role (priority: super_admin > admin > maintenance > operator > viewer)
CREATE OR REPLACE FUNCTION get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM user_roles 
    WHERE user_id = _user_id 
    ORDER BY 
        CASE role 
            WHEN 'super_admin' THEN 1
            WHEN 'admin' THEN 2
            WHEN 'maintenance' THEN 3 
            WHEN 'operator' THEN 4 
            WHEN 'viewer' THEN 5 
        END
    LIMIT 1
$$;

-- Function to validate API key
CREATE OR REPLACE FUNCTION validate_api_key(_key_hash VARCHAR(64))
RETURNS TABLE(id UUID, permissions TEXT[])
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT ak.id, ak.permissions
    FROM api_keys ak
    WHERE ak.key_hash = _key_hash
      AND ak.is_active = true
      AND (ak.expires_at IS NULL OR ak.expires_at > NOW())
$$;

-- Function to update API key last used timestamp
CREATE OR REPLACE FUNCTION update_api_key_usage(_key_id UUID)
RETURNS VOID
LANGUAGE SQL
AS $$
    UPDATE api_keys SET last_used_at = NOW() WHERE id = _key_id
$$;

-- Function to get last hour reading for a generator
CREATE OR REPLACE FUNCTION get_last_hour_reading(_generator_id UUID)
RETURNS DECIMAL(10,2)
LANGUAGE SQL
STABLE
AS $$
    SELECT COALESCE(
        (SELECT closing_hour 
         FROM hour_meter_readings 
         WHERE generator_id = _generator_id 
         ORDER BY date DESC 
         LIMIT 1),
        (SELECT initial_hour_reading 
         FROM generators 
         WHERE id = _generator_id)
    )
$$;

-- Function to calculate total hours for a period
CREATE OR REPLACE FUNCTION get_total_hours(_generator_id UUID, _from DATE, _to DATE)
RETURNS DECIMAL(10,2)
LANGUAGE SQL
STABLE
AS $$
    SELECT COALESCE(SUM(hours_run), 0)
    FROM hour_meter_readings
    WHERE generator_id = _generator_id
      AND date BETWEEN _from AND _to
$$;

-- Function to calculate total fuel issued for a period
CREATE OR REPLACE FUNCTION get_total_fuel_issued(_generator_id UUID, _from DATE, _to DATE)
RETURNS DECIMAL(10,2)
LANGUAGE SQL
STABLE
AS $$
    SELECT COALESCE(SUM(quantity_litres), 0)
    FROM fuel_issues
    WHERE generator_id = _generator_id
      AND date BETWEEN _from AND _to
$$;

-- Function to get average fuel cost for a period
CREATE OR REPLACE FUNCTION get_avg_fuel_cost(_fuel_type fuel_type, _from DATE, _to DATE)
RETURNS DECIMAL(10,2)
LANGUAGE SQL
STABLE
AS $$
    SELECT COALESCE(
        SUM(total_amount) / NULLIF(SUM(quantity_litres), 0),
        0
    )
    FROM fuel_purchases
    WHERE fuel_type = _fuel_type
      AND date BETWEEN _from AND _to
$$;

-- ============================================
-- 10. TRIGGERS
-- ============================================

-- Update fuel_stock after purchase
CREATE OR REPLACE FUNCTION update_stock_after_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE fuel_stock 
    SET quantity_litres = quantity_litres + NEW.quantity_litres,
        updated_at = NOW()
    WHERE fuel_type = NEW.fuel_type;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_stock_after_purchase
    AFTER INSERT ON fuel_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_after_purchase();

-- Update fuel_stock after issue
CREATE OR REPLACE FUNCTION update_stock_after_issue()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE fuel_stock 
    SET quantity_litres = quantity_litres - NEW.quantity_litres,
        updated_at = NOW()
    WHERE fuel_type = NEW.fuel_type;
    
    -- Update the stock_after_issue in the new record
    NEW.stock_after_issue := (SELECT quantity_litres FROM fuel_stock WHERE fuel_type = NEW.fuel_type);
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_stock_after_issue
    BEFORE INSERT ON fuel_issues
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_after_issue();

-- Update timestamp on generators
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_generators_updated_at
    BEFORE UPDATE ON generators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 11. VIEWS FOR REPORTING
-- ============================================

-- Generator summary view
CREATE OR REPLACE VIEW generator_summary AS
SELECT 
    g.id,
    g.name,
    g.generator_id,
    g.location,
    g.capacity_kva,
    g.fuel_type,
    g.is_active,
    COALESCE(
        (SELECT closing_hour FROM hour_meter_readings 
         WHERE generator_id = g.id ORDER BY date DESC LIMIT 1),
        g.initial_hour_reading
    ) as current_hour_reading,
    COALESCE(
        (SELECT SUM(hours_run) FROM hour_meter_readings WHERE generator_id = g.id),
        0
    ) as total_hours_run,
    COALESCE(
        (SELECT SUM(quantity_litres) FROM fuel_issues WHERE generator_id = g.id),
        0
    ) as total_fuel_consumed
FROM generators g;

-- Monthly cost report view
CREATE OR REPLACE VIEW monthly_cost_report AS
SELECT 
    g.id as generator_id,
    g.name as generator_name,
    DATE_TRUNC('month', hr.date) as month,
    SUM(hr.hours_run) as total_hours,
    COALESCE(SUM(fi.quantity_litres), 0) as total_fuel_issued,
    CASE 
        WHEN SUM(hr.hours_run) > 0 
        THEN COALESCE(SUM(fi.quantity_litres), 0) / SUM(hr.hours_run)
        ELSE 0 
    END as avg_consumption_per_hour
FROM generators g
LEFT JOIN hour_meter_readings hr ON g.id = hr.generator_id
LEFT JOIN fuel_issues fi ON g.id = fi.generator_id 
    AND DATE_TRUNC('month', fi.date) = DATE_TRUNC('month', hr.date)
GROUP BY g.id, g.name, DATE_TRUNC('month', hr.date);

-- ============================================
-- 12. SAMPLE DATA (Optional - for testing)
-- ============================================

-- Uncomment to insert sample data for testing
/*
INSERT INTO generators (name, generator_id, location, capacity_kva, fuel_type, initial_hour_reading)
VALUES 
    ('Main Building DG', 'DG-001', 'Main Building', 125.00, 'diesel', 1500.00),
    ('Factory Floor DG', 'DG-002', 'Factory Area', 250.00, 'diesel', 3200.00),
    ('Office Backup', 'DG-003', 'Office Block', 62.50, 'petrol', 850.00);

-- Add some fuel purchases
INSERT INTO fuel_purchases (date, fuel_type, quantity_litres, rate_per_litre, vendor)
VALUES
    (CURRENT_DATE - INTERVAL '30 days', 'diesel', 500.00, 95.50, 'Nepal Oil Corp'),
    (CURRENT_DATE - INTERVAL '15 days', 'diesel', 300.00, 96.00, 'Nepal Oil Corp'),
    (CURRENT_DATE - INTERVAL '7 days', 'petrol', 100.00, 125.00, 'Local Vendor');
*/
