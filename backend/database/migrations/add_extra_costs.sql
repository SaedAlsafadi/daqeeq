-- Migration: Add extra costs support to quotations
-- This allows service providers to specify additional costs when sending quotations

-- Add extra_costs column to quotation_requests
ALTER TABLE IF EXISTS quotation_requests
ADD COLUMN IF NOT EXISTS extra_costs JSONB DEFAULT '[]'::jsonb;

-- extra_costs structure:
-- [
--   {
--     "id": "uuid",
--     "description": "Delivery charge",
--     "amount": 50.00,
--     "is_percentage": false
--   },
--   {
--     "id": "uuid",
--     "description": "Rush fee (10% surcharge)",
--     "amount": 10,
--     "is_percentage": true
--   }
-- ]

-- Create index on quotation_requests for better performance
CREATE INDEX IF NOT EXISTS idx_quotation_requests_quoted_amount 
ON quotation_requests(quoted_amount) 
WHERE status IN ('quoted', 'accepted');
