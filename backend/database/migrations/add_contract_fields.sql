-- Add contract fields to quotation_requests table

ALTER TABLE quotation_requests 
ADD COLUMN IF NOT EXISTS contract_status text DEFAULT 'pending_signature',
ADD COLUMN IF NOT EXISTS contract_hash text,
ADD COLUMN IF NOT EXISTS contract_pdf_url text,
ADD COLUMN IF NOT EXISTS signed_at timestamptz;

-- Add check constraint for contract_status
ALTER TABLE quotation_requests 
ADD CONSTRAINT check_contract_status 
CHECK (contract_status IN ('pending_signature', 'signed', 'rejected'));
