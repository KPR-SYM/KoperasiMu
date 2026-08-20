-- Add is_locked, locked_at, locked_by, notes columns to classes table
-- These are used by ClassDetailPanel for lock/unlock and notes features

ALTER TABLE classes ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS locked_at timestamptz;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS locked_by uuid;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS notes text DEFAULT '';
