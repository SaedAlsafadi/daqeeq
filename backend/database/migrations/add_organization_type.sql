-- Migration: Add organization_type column to users table
-- Date: 2024
-- Description: Adds organization_type field to support ML prediction features

-- Add organization_type column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS organization_type VARCHAR(100);

-- Add comment to the column
COMMENT ON COLUMN users.organization_type IS 'Organization type for ML predictions (Hotels, Hospitals, Schools, etc.)';

-- Optional: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_organization_type ON users(organization_type);

-- Verify the migration
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'organization_type';