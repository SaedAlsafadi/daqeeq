-- Create model_training_jobs table for tracking model retraining
-- This table stores records of model fine-tuning jobs triggered by user feedback

CREATE TABLE IF NOT EXISTS model_training_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  initiated_by UUID,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  feedback_count INTEGER DEFAULT 0,
  auto_triggered BOOLEAN DEFAULT FALSE,
  metrics JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY (initiated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_training_jobs_company_id ON model_training_jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_training_jobs_status ON model_training_jobs(status);
CREATE INDEX IF NOT EXISTS idx_training_jobs_created_at ON model_training_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_training_jobs_company_status ON model_training_jobs(company_id, status);

-- Add column comments for documentation
COMMENT ON TABLE model_training_jobs IS 'Tracks model fine-tuning jobs triggered by feedback data accumulation';
COMMENT ON COLUMN model_training_jobs.id IS 'Unique training job identifier';
COMMENT ON COLUMN model_training_jobs.company_id IS 'Company for which model was trained';
COMMENT ON COLUMN model_training_jobs.initiated_by IS 'User who initiated the training (NULL for auto-triggered)';
COMMENT ON COLUMN model_training_jobs.status IS 'Training job status: pending, processing, completed, failed';
COMMENT ON COLUMN model_training_jobs.feedback_count IS 'Number of feedback entries used for training';
COMMENT ON COLUMN model_training_jobs.auto_triggered IS 'Whether training was automatically triggered';
COMMENT ON COLUMN model_training_jobs.metrics IS 'Training metrics (R², MAPE, RMSE) per supply type';
COMMENT ON COLUMN model_training_jobs.error IS 'Error message if training failed';
COMMENT ON COLUMN model_training_jobs.created_at IS 'Training job creation timestamp';
COMMENT ON COLUMN model_training_jobs.started_at IS 'Training start timestamp';
COMMENT ON COLUMN model_training_jobs.completed_at IS 'Training completion timestamp';

-- Enable Row Level Security for company isolation
ALTER TABLE model_training_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only see training jobs for their company
CREATE POLICY model_training_jobs_company_isolation ON model_training_jobs
  USING (company_id = (SELECT company_id FROM users WHERE id = current_user_id()));

-- Create RLS policy: Users can only insert for their company
CREATE POLICY model_training_jobs_company_insert ON model_training_jobs
  FOR INSERT WITH CHECK (company_id = (SELECT company_id FROM users WHERE id = current_user_id()));