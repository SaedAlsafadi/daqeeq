-- ============================================
-- SUPPLIER REQUESTS SYSTEM MIGRATION
-- ============================================
-- This migration adds the supplier_requests table and related functions
-- for linking service providers with client requests

CREATE TABLE IF NOT EXISTS supplier_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_phone VARCHAR(20),
    service_type VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    total_value DECIMAL(12,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    submitted_date TIMESTAMP DEFAULT NOW(),
    accepted_date TIMESTAMP,
    completed_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add service_provider_id to quotations if not exists
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS service_provider_id UUID REFERENCES service_providers(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_supplier_requests_provider ON supplier_requests(service_provider_id);
CREATE INDEX IF NOT EXISTS idx_supplier_requests_status ON supplier_requests(status);
CREATE INDEX IF NOT EXISTS idx_supplier_requests_created ON supplier_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_quotations_provider ON quotations(service_provider_id);

-- Create trigger for updated_at
CREATE TRIGGER IF NOT EXISTS update_supplier_requests_updated_at 
BEFORE UPDATE ON supplier_requests 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to get provider statistics
CREATE OR REPLACE FUNCTION get_provider_stats(provider_id UUID)
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'activeRequests', (SELECT COUNT(*) FROM supplier_requests WHERE service_provider_id = provider_id AND status IN ('pending', 'accepted')),
    'completedRequests', (SELECT COUNT(*) FROM supplier_requests WHERE service_provider_id = provider_id AND status = 'completed'),
    'pendingRequests', (SELECT COUNT(*) FROM supplier_requests WHERE service_provider_id = provider_id AND status = 'pending'),
    'acceptedRequests', (SELECT COUNT(*) FROM supplier_requests WHERE service_provider_id = provider_id AND status = 'accepted'),
    'totalRevenue', COALESCE((SELECT SUM(total_value)::DECIMAL FROM supplier_requests WHERE service_provider_id = provider_id AND status = 'completed'), 0)
  );
END;
$$ LANGUAGE plpgsql;