-- Add status column to predictions table
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'completed';

-- Create index for efficient draft queries
CREATE INDEX IF NOT EXISTS idx_predictions_status ON predictions(company_id, status, created_at DESC);

-- Update existing predictions to have 'completed' status
UPDATE predictions SET status = 'completed' WHERE status IS NULL;