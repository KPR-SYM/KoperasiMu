-- Add notes column to classes table
ALTER TABLE classes ADD COLUMN IF NOT EXISTS notes text DEFAULT '';
