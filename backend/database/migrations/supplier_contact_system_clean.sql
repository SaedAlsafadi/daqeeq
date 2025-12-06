CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TABLE IF NOT EXISTS service_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL UNIQUE,
    contact_phone VARCHAR(20) NOT NULL,
    contact_person_name VARCHAR(255) NOT NULL,
    contact_person_title VARCHAR(100),
    category VARCHAR(100) NOT NULL,
    description TEXT,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    website VARCHAR(255),
    services_offered JSONB,
    certifications JSONB,
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    approval_date TIMESTAMP,
    approved_by UUID,
    account_username VARCHAR(255),
    account_password_temp VARCHAR(255),
    account_created_date TIMESTAMP,
    rejection_reason TEXT,
    notes TEXT,
    submission_ip_address INET,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_contact_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    message TEXT,
    submission_data JSONB,
    status VARCHAR(50) DEFAULT 'new',
    assigned_to UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_communication_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES supplier_contact_submissions(id) ON DELETE SET NULL,
    communication_type VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    message TEXT,
    communication_date TIMESTAMP DEFAULT NOW(),
    conducted_by UUID,
    next_follow_up_date TIMESTAMP,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_onboarding_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
    step_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    completed_date TIMESTAMP,
    completed_by UUID,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_service_providers_status ON service_providers(status);
CREATE INDEX idx_service_providers_category ON service_providers(category);
CREATE INDEX idx_service_providers_email ON service_providers(contact_email);
CREATE INDEX idx_supplier_submissions_status ON supplier_contact_submissions(status);
CREATE INDEX idx_supplier_submissions_created ON supplier_contact_submissions(created_at);
CREATE INDEX idx_supplier_submissions_category ON supplier_contact_submissions(category);
CREATE INDEX idx_communication_log_provider ON supplier_communication_log(service_provider_id);
CREATE INDEX idx_onboarding_steps_provider ON supplier_onboarding_steps(service_provider_id);
CREATE INDEX idx_onboarding_steps_status ON supplier_onboarding_steps(status);

CREATE TRIGGER update_service_providers_updated_at 
BEFORE UPDATE ON service_providers 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_submissions_updated_at 
BEFORE UPDATE ON supplier_contact_submissions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_onboarding_updated_at 
BEFORE UPDATE ON supplier_onboarding_steps 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();