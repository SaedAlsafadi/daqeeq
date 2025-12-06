-- Create supply_feedback table for collecting user feedback on predictions
CREATE TABLE IF NOT EXISTS supply_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prediction_id UUID,
  supply_type VARCHAR(255) NOT NULL,
  predicted_quantity NUMERIC(10, 2) NOT NULL,
  actual_quantity NUMERIC(10, 2) NOT NULL,
  feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('accurate', 'underestimated', 'overestimated')),
  notes TEXT,
  days_until_reorder INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_supply_feedback_company_id ON supply_feedback(company_id);
CREATE INDEX IF NOT EXISTS idx_supply_feedback_user_id ON supply_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_supply_feedback_prediction_id ON supply_feedback(prediction_id);
CREATE INDEX IF NOT EXISTS idx_supply_feedback_submitted_at ON supply_feedback(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_supply_feedback_supply_type ON supply_feedback(supply_type);

-- Add comments for documentation
COMMENT ON TABLE supply_feedback IS 'Stores user feedback on supply predictions to improve model accuracy';
COMMENT ON COLUMN supply_feedback.feedback_type IS 'Type of feedback: accurate (±20%), underestimated (ordered less than needed), overestimated (ordered more than needed)';
COMMENT ON COLUMN supply_feedback.days_until_reorder IS 'Number of days until this supply item runs out - helps predict consumption rate';

-- Grant permissions
ALTER TABLE supply_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for companies isolation
CREATE POLICY "Users can view feedback from their company" 
  ON supply_feedback FOR SELECT 
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert feedback for their company" 
  ON supply_feedback FOR INSERT 
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own feedback" 
  ON supply_feedback FOR UPDATE 
  USING (user_id = auth.uid() AND company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete their own feedback" 
  ON supply_feedback FOR DELETE 
  USING (user_id = auth.uid() AND company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));