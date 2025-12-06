-- Migration: Quotation Request System
-- This adds support for predictions storage, service providers, and quotation requests

-- Service Providers table
CREATE TABLE IF NOT EXISTS service_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    website VARCHAR(255),
    
    -- Provider specialization
    specialization VARCHAR(100)[], -- Array of specializations: 'Hotels', 'Hospitals', 'Schools', etc.
    service_types VARCHAR(100)[], -- Types of supplies they provide
    
    -- Capacity and ratings
    capacity_level VARCHAR(50), -- 'small', 'medium', 'large', 'enterprise'
    rating DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 5.00
    total_reviews INTEGER DEFAULT 0,
    years_in_business INTEGER,
    
    -- Service areas
    service_regions TEXT[], -- Geographic areas they serve
    
    -- Pricing and terms
    minimum_order_value DECIMAL(12,2),
    delivery_time_days INTEGER, -- Average delivery time
    payment_terms TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Predictions table - Store AI prediction results
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    
    -- Input parameters
    facility_size_sqm DECIMAL(10,2) NOT NULL,
    number_of_people INTEGER NOT NULL,
    number_of_bathrooms INTEGER NOT NULL,
    days_count INTEGER NOT NULL,
    cleaning_frequency VARCHAR(50),
    organization_type VARCHAR(100),
    
    -- Prediction results (stored as JSONB for flexibility)
    predictions JSONB NOT NULL,
    
    -- Metadata
    model_version VARCHAR(50),
    confidence_score DECIMAL(5,4),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Quotation Requests table (replaces/extends purchase_orders for quotation flow)
CREATE TABLE IF NOT EXISTS quotation_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_number VARCHAR(100) UNIQUE NOT NULL,
    
    -- Client information
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    
    -- Provider information
    provider_id UUID REFERENCES service_providers(id),
    
    -- Related prediction
    prediction_id UUID REFERENCES predictions(id),
    
    -- Request details
    title VARCHAR(255),
    description TEXT,
    requirements JSONB, -- Detailed requirements from prediction
    
    -- Status workflow
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'viewed', 'quoted', 'accepted', 'rejected', 'cancelled'
    
    -- Quotation response (filled by provider)
    quoted_amount DECIMAL(12,2),
    quoted_delivery_date DATE,
    provider_notes TEXT,
    provider_responded_at TIMESTAMP,
    
    -- Important dates
    requested_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP, -- Optional expiry for the request
    
    -- Client decision
    client_decision VARCHAR(50), -- 'accepted', 'rejected', 'considering'
    client_decision_notes TEXT,
    client_decided_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Quotation Request Items - Details of what's needed
CREATE TABLE IF NOT EXISTS quotation_request_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_request_id UUID REFERENCES quotation_requests(id) ON DELETE CASCADE,
    
    item_name VARCHAR(255) NOT NULL,
    item_type VARCHAR(100), -- 'Toilet Paper', 'Hand Soap', etc.
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50), -- 'rolls', 'gallons', 'workers', etc.
    
    -- Optional product link if it exists in products table
    product_id UUID REFERENCES products(id),
    
    -- Provider's quote for this item
    unit_price DECIMAL(10,2),
    total_price DECIMAL(12,2),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Provider Ratings and Reviews
CREATE TABLE IF NOT EXISTS provider_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    quotation_request_id UUID REFERENCES quotation_requests(id),
    
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    
    -- Review categories
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
    price_rating INTEGER CHECK (price_rating >= 1 AND price_rating <= 5),
    service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
    
    is_verified BOOLEAN DEFAULT false, -- Verified purchase
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_providers_active ON service_providers(is_active, is_verified);
CREATE INDEX IF NOT EXISTS idx_service_providers_specialization ON service_providers USING GIN(specialization);
CREATE INDEX IF NOT EXISTS idx_service_providers_capacity ON service_providers(capacity_level);

CREATE INDEX IF NOT EXISTS idx_predictions_company_date ON predictions(company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);

CREATE INDEX IF NOT EXISTS idx_quotation_requests_company ON quotation_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_quotation_requests_provider ON quotation_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_quotation_requests_status ON quotation_requests(status);
CREATE INDEX IF NOT EXISTS idx_quotation_requests_user ON quotation_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_provider_reviews_provider ON provider_reviews(provider_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_service_providers_updated_at 
    BEFORE UPDATE ON service_providers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotation_requests_updated_at 
    BEFORE UPDATE ON quotation_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_reviews_updated_at 
    BEFORE UPDATE ON provider_reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
);