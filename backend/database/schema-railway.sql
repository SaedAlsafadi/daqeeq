-- Cleanity Database Schema for Railway PostgreSQL
-- Standard PostgreSQL compatible schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    size VARCHAR(50),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'supplier', 'admin')),
    company_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(100) NOT NULL,
    organization_type VARCHAR(100), -- 'Hotels', 'Hospitals', 'Schools', etc.
    phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers table (for supplier directory)
CREATE TABLE suppliers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    address TEXT,
    specialties TEXT[],
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product categories
CREATE TABLE product_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES product_categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products/Supplies table
CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES product_categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    brand VARCHAR(100),
    sku VARCHAR(100) UNIQUE,
    unit_of_measure VARCHAR(50),
    unit_cost DECIMAL(10,2),
    supplier_info JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory table
CREATE TABLE inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    current_stock INTEGER NOT NULL DEFAULT 0,
    minimum_stock INTEGER NOT NULL DEFAULT 0,
    maximum_stock INTEGER,
    reorder_point INTEGER,
    unit_price DECIMAL(10,2) DEFAULT 0.00,
    unit_of_measure VARCHAR(50) DEFAULT 'units',
    location VARCHAR(255),
    barcode VARCHAR(100),
    expiry_date DATE,
    last_restocked TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Providers table
CREATE TABLE service_providers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    website VARCHAR(255),
    specialization VARCHAR(100)[],
    service_types VARCHAR(100)[],
    capacity_level VARCHAR(50),
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    years_in_business INTEGER,
    service_regions TEXT[],
    minimum_order_value DECIMAL(12,2),
    delivery_time_days INTEGER,
    payment_terms TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictions table
CREATE TABLE predictions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    facility_size_sqm DECIMAL(10,2) NOT NULL,
    number_of_people INTEGER NOT NULL,
    number_of_bathrooms INTEGER NOT NULL,
    days_count INTEGER NOT NULL,
    cleaning_frequency VARCHAR(50),
    organization_type VARCHAR(100),
    predictions JSONB NOT NULL,
    model_version VARCHAR(50),
    confidence_score DECIMAL(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quotation Requests table
CREATE TABLE quotation_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_number VARCHAR(100) UNIQUE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    provider_id UUID REFERENCES service_providers(id),
    prediction_id UUID REFERENCES predictions(id),
    title VARCHAR(255),
    description TEXT,
    requirements JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    quoted_amount DECIMAL(12,2),
    quoted_delivery_date DATE,
    provider_notes TEXT,
    provider_responded_at TIMESTAMP WITH TIME ZONE,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    client_decision VARCHAR(50),
    client_decision_notes TEXT,
    client_decided_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quotation Request Items
CREATE TABLE quotation_request_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    quotation_request_id UUID REFERENCES quotation_requests(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    item_type VARCHAR(100),
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50),
    product_id UUID REFERENCES products(id),
    unit_price DECIMAL(10,2),
    total_price DECIMAL(12,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Provider Ratings and Reviews
CREATE TABLE provider_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    quotation_request_id UUID REFERENCES quotation_requests(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
    price_rating INTEGER CHECK (price_rating >= 1 AND price_rating <= 5),
    service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    shipping_amount DECIMAL(12,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    notes TEXT,
    shipping_address TEXT,
    expected_delivery DATE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Predictions table
CREATE TABLE ai_predictions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
    prediction_type VARCHAR(50) NOT NULL, -- 'demand_forecast', 'reorder_point', 'optimal_quantity'
    predicted_value DECIMAL(12,2) NOT NULL,
    confidence_score DECIMAL(5,4), -- 0.0000 to 1.0000
    prediction_date DATE NOT NULL,
    factors JSONB, -- Store factors that influenced the prediction
    model_version VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE analytics_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'info', 'warning', 'error', 'success'
    is_read BOOLEAN DEFAULT false,
    action_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_companies_id ON companies(id);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_inventory_company_id ON inventory(company_id);
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_inventory_client_id ON inventory(client_id);
CREATE INDEX idx_inventory_supplier_id ON inventory(supplier_id);
CREATE INDEX idx_inventory_category ON inventory(category);
CREATE INDEX idx_service_providers_active ON service_providers(is_active, is_verified);
CREATE INDEX idx_service_providers_specialization ON service_providers USING GIN(specialization);
CREATE INDEX idx_predictions_company_date ON predictions(company_id, created_at);
CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_quotation_requests_company ON quotation_requests(company_id);
CREATE INDEX idx_quotation_requests_provider ON quotation_requests(provider_id);
CREATE INDEX idx_quotation_requests_status ON quotation_requests(status);
CREATE INDEX idx_quotation_requests_user ON quotation_requests(user_id);
CREATE INDEX idx_provider_reviews_provider ON provider_reviews(provider_id);
CREATE INDEX idx_orders_client_id ON orders(client_id);
CREATE INDEX idx_orders_supplier_id ON orders(supplier_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_ai_predictions_client_id ON ai_predictions(client_id);
CREATE INDEX idx_ai_predictions_inventory_id ON ai_predictions(inventory_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_providers_updated_at BEFORE UPDATE ON service_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotation_requests_updated_at BEFORE UPDATE ON quotation_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_provider_reviews_updated_at BEFORE UPDATE ON provider_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default product categories
INSERT INTO product_categories (name, description) VALUES
('Cleaning Chemicals', 'All-purpose cleaners, disinfectants, degreasers'),
('Paper Products', 'Toilet paper, paper towels, tissues'),
('Janitorial Equipment', 'Mops, brooms, vacuum cleaners, cleaning carts'),
('Personal Protective Equipment', 'Gloves, masks, safety goggles'),
('Restroom Supplies', 'Soap dispensers, air fresheners, toilet seat covers'),
('Floor Care', 'Floor cleaners, wax, polish, floor mats'),
('Waste Management', 'Trash bags, recycling bins, waste containers'),
('Laundry Supplies', 'Detergents, fabric softeners, stain removers')
ON CONFLICT DO NOTHING;

-- Insert some common cleaning products
INSERT INTO products (category_id, name, description, unit_of_measure, sku) VALUES
((SELECT id FROM product_categories WHERE name = 'Cleaning Chemicals'), 'All-Purpose Cleaner', 'Multi-surface cleaning solution', 'liters', 'APC-001'),
((SELECT id FROM product_categories WHERE name = 'Cleaning Chemicals'), 'Disinfectant Spray', 'Hospital-grade disinfectant', 'liters', 'DIS-001'),
((SELECT id FROM product_categories WHERE name = 'Paper Products'), 'Paper Towels', 'Absorbent paper towels', 'rolls', 'PT-001'),
((SELECT id FROM product_categories WHERE name = 'Paper Products'), 'Toilet Paper', '2-ply toilet tissue', 'rolls', 'TP-001'),
((SELECT id FROM product_categories WHERE name = 'Janitorial Equipment'), 'Microfiber Mop', 'Professional microfiber mop', 'pieces', 'MOP-001'),
((SELECT id FROM product_categories WHERE name = 'Personal Protective Equipment'), 'Nitrile Gloves', 'Disposable nitrile gloves', 'boxes', 'GLV-001')
ON CONFLICT DO NOTHING;

-- Insert sample service providers
INSERT INTO service_providers (
    company_name, contact_person, email, phone, specialization, 
    capacity_level, rating, total_reviews, years_in_business, 
    minimum_order_value, delivery_time_days, is_verified
) VALUES
(
    'CleanSupply Pro', 
    'John Smith', 
    'contact@cleansupplypro.com', 
    '+1-555-0101',
    ARRAY['Hotels', 'Hospitals', 'Schools'],
    'large',
    4.8,
    156,
    12,
    500.00,
    3,
    true
),
(
    'EcoClean Solutions', 
    'Sarah Johnson', 
    'info@ecocleansolutions.com', 
    '+1-555-0102',
    ARRAY['Hotels', 'Offices', 'Retail'],
    'medium',
    4.6,
    89,
    8,
    300.00,
    5,
    true
),
(
    'MediCare Supplies', 
    'Dr. Michael Chen', 
    'orders@medicaresupplies.com', 
    '+1-555-0103',
    ARRAY['Hospitals', 'Clinics', 'Laboratories'],
    'large',
    4.9,
    203,
    15,
    1000.00,
    2,
    true
),
(
    'Budget Clean Express', 
    'Emily Rodriguez', 
    'service@budgetclean.com', 
    '+1-555-0104',
    ARRAY['Schools', 'Offices', 'Small Business'],
    'small',
    4.3,
    45,
    5,
    150.00,
    7,
    true
),
(
    'Premium Facility Services', 
    'Robert Williams', 
    'contact@premiumfacility.com', 
    '+1-555-0105',
    ARRAY['Hotels', 'Resorts', 'Luxury Residential'],
    'enterprise',
    4.9,
    312,
    20,
    2000.00,
    1,
    true
)
ON CONFLICT DO NOTHING;