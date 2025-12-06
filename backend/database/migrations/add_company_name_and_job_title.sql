-- Migration: Add company_name and job_title fields to users table
-- Date: 2024
-- Description: Makes company_name mandatory and adds job_title field for all users

-- Add company_name column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'company_name'
    ) THEN
        ALTER TABLE users ADD COLUMN company_name VARCHAR(255);
    END IF;
END $$;

-- Add job_title column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'job_title'
    ) THEN
        ALTER TABLE users ADD COLUMN job_title VARCHAR(100);
    END IF;
END $$;

-- Update existing records with default values (if needed)
UPDATE users 
SET company_name = 'Not Specified' 
WHERE company_name IS NULL OR company_name = '';

UPDATE users 
SET job_title = 'Not Specified' 
WHERE job_title IS NULL OR job_title = '';

-- Make company_name and job_title NOT NULL
ALTER TABLE users ALTER COLUMN company_name SET NOT NULL;
ALTER TABLE users ALTER COLUMN job_title SET NOT NULL;

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_users_company_name ON users(company_name);
CREATE INDEX IF NOT EXISTS idx_users_job_title ON users(job_title);

-- Verify the migration
SELECT 'Migration completed successfully. company_name and job_title are now required fields.' as status;