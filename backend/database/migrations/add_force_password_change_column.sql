-- Migration: Add force_password_change column to users table
-- Purpose: Track which users must change their password on first login
-- Created: 2024

-- Update users table to include force_password_change column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT false;

-- Update role CHECK constraint to include 'service_provider'
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
ADD CONSTRAINT users_role_check CHECK (role IN ('client', 'supplier', 'admin', 'service_provider'));

-- Add index for faster lookup of users needing password change
CREATE INDEX IF NOT EXISTS idx_users_force_password_change ON users(force_password_change) WHERE force_password_change = true;

-- Log the migration
SELECT 'Migration completed: force_password_change column added to users table' AS status;