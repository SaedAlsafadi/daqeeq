-- Create provider ratings/feedback table
CREATE TABLE IF NOT EXISTS provider_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  quotation_request_id UUID REFERENCES quotation_requests(id) ON DELETE SET NULL,
  
  -- Multi-aspect ratings
  quality_rating INTEGER NOT NULL CHECK (quality_rating >= 1 AND quality_rating <= 5),
  delivery_rating INTEGER NOT NULL CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
  price_rating INTEGER NOT NULL CHECK (price_rating >= 1 AND price_rating <= 5),
  
  -- Feedback notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_provider_ratings_provider_id ON provider_ratings(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_ratings_company_id ON provider_ratings(company_id);
CREATE INDEX IF NOT EXISTS idx_provider_ratings_created_at ON provider_ratings(created_at DESC);

-- Add average ratings columns to service_providers table
ALTER TABLE service_providers 
ADD COLUMN IF NOT EXISTS quality_rating_avg DECIMAL(3,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS delivery_rating_avg DECIMAL(3,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS price_rating_avg DECIMAL(3,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS total_ratings_count INTEGER DEFAULT 0;