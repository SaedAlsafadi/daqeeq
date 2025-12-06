-- Cleanity AI-Powered Cleaning Supply Forecasting Platform
-- Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    size VARCHAR(50), -- 'small', 'medium', 'large', 'enterprise'
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'user', -- 'admin', 'manager', 'user'
    company_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(100) NOT NULL,
    organization_type VARCHAR(100), -- 'Hotels', 'Hospitals', 'Schools', etc.
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Product categories
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES product_categories(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Products/Supplies table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES product_categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    brand VARCHAR(100),
    sku VARCHAR(100) UNIQUE,
    unit_of_measure VARCHAR(50), -- 'pieces', 'liters', 'kg', etc.
    unit_cost DECIMAL(10,2),
    supplier_info JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Company inventory
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    current_stock INTEGER NOT NULL DEFAULT 0,
    minimum_stock INTEGER DEFAULT 0,
    maximum_stock INTEGER,
    reorder_point INTEGER,
    location VARCHAR(255),
    last_restocked TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(company_id, product_id, location)
);

-- Usage patterns and consumption data
CREATE TABLE usage_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    usage_date DATE NOT NULL,
    quantity_used DECIMAL(10,2) NOT NULL,
    department VARCHAR(100),
    shift VARCHAR(50), -- 'morning', 'afternoon', 'night'
    weather_condition VARCHAR(50),
    special_events TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI Forecasting models and predictions
CREATE TABLE forecasting_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    model_name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50), -- 'linear_regression', 'arima', 'neural_network', etc.
    parameters JSONB,
    accuracy_score DECIMAL(5,4),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Demand forecasts
CREATE TABLE demand_forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    model_id UUID REFERENCES forecasting_models(id),
    forecast_date DATE NOT NULL,
    predicted_demand DECIMAL(10,2) NOT NULL,
    confidence_interval_lower DECIMAL(10,2),
    confidence_interval_upper DECIMAL(10,2),
    actual_demand DECIMAL(10,2), -- filled in after the fact
    created_at TIMESTAMP DEFAULT NOW()
);

-- Purchase orders
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_name VARCHAR(255),
    supplier_contact JSONB,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'ordered', 'received', 'cancelled'
    order_date DATE NOT NULL,
    expected_delivery DATE,
    actual_delivery DATE,
    total_amount DECIMAL(12,2),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Purchase order items
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(12,2),
    received_quantity INTEGER DEFAULT 0
);

-- Alerts and notifications
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    alert_type VARCHAR(50) NOT NULL, -- 'low_stock', 'reorder_point', 'forecast_anomaly', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    is_read BOOLEAN DEFAULT false,
    related_entity_type VARCHAR(50), -- 'product', 'inventory', 'forecast', etc.
    related_entity_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- System settings per company
CREATE TABLE company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(company_id, setting_key)
);

-- Audit log for tracking changes
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete'
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_inventory_company_product ON inventory(company_id, product_id);
CREATE INDEX idx_usage_patterns_company_date ON usage_patterns(company_id, usage_date);
CREATE INDEX idx_usage_patterns_product_date ON usage_patterns(product_id, usage_date);
CREATE INDEX idx_demand_forecasts_company_date ON demand_forecasts(company_id, forecast_date);
CREATE INDEX idx_demand_forecasts_product_date ON demand_forecasts(product_id, forecast_date);
CREATE INDEX idx_alerts_company_unread ON alerts(company_id, is_read);
CREATE INDEX idx_audit_log_company_date ON audit_log(company_id, created_at);

-- Insert default product categories
INSERT INTO product_categories (name, description) VALUES
('Cleaning Chemicals', 'All-purpose cleaners, disinfectants, degreasers'),
('Paper Products', 'Toilet paper, paper towels, tissues'),
('Janitorial Equipment', 'Mops, brooms, vacuum cleaners, cleaning carts'),
('Personal Protective Equipment', 'Gloves, masks, safety goggles'),
('Restroom Supplies', 'Soap dispensers, air fresheners, toilet seat covers'),
('Floor Care', 'Floor cleaners, wax, polish, floor mats'),
('Waste Management', 'Trash bags, recycling bins, waste containers'),
('Laundry Supplies', 'Detergents, fabric softeners, stain removers');

-- Insert some common cleaning products
INSERT INTO products (category_id, name, description, unit_of_measure, sku) VALUES
((SELECT id FROM product_categories WHERE name = 'Cleaning Chemicals'), 'All-Purpose Cleaner', 'Multi-surface cleaning solution', 'liters', 'APC-001'),
((SELECT id FROM product_categories WHERE name = 'Cleaning Chemicals'), 'Disinfectant Spray', 'Hospital-grade disinfectant', 'liters', 'DIS-001'),
((SELECT id FROM product_categories WHERE name = 'Paper Products'), 'Paper Towels', 'Absorbent paper towels', 'rolls', 'PT-001'),
((SELECT id FROM product_categories WHERE name = 'Paper Products'), 'Toilet Paper', '2-ply toilet tissue', 'rolls', 'TP-001'),
((SELECT id FROM product_categories WHERE name = 'Janitorial Equipment'), 'Microfiber Mop', 'Professional microfiber mop', 'pieces', 'MOP-001'),
((SELECT id FROM product_categories WHERE name = 'Personal Protective Equipment'), 'Nitrile Gloves', 'Disposable nitrile gloves', 'boxes', 'GLV-001');

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forecasting_models_updated_at BEFORE UPDATE ON forecasting_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON company_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();