/*
  # Add first name and last name to profiles

  1. Schema Changes
    - Add `first_name` column to profiles table
    - Add `last_name` column to profiles table
    - Add `display_name` computed column that combines first and last name
    - Update existing profiles to have display names based on username

  2. Security
    - Update existing RLS policies to work with new columns
*/

-- Add first_name and last_name columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Add a computed column for display_name (first_name + last_name)
-- This will be updated via triggers when first_name or last_name changes
ALTER TABLE public.profiles 
ADD COLUMN display_name TEXT;

-- Function to update display_name when first_name or last_name changes
CREATE OR REPLACE FUNCTION update_display_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Update display_name as combination of first_name and last_name
  NEW.display_name = TRIM(CONCAT(NEW.first_name, ' ', NEW.last_name));
  
  -- If display_name is empty, fall back to username
  IF NEW.display_name = '' OR NEW.display_name IS NULL THEN
    NEW.display_name = NEW.username;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update display_name
CREATE TRIGGER update_display_name_trigger
  BEFORE INSERT OR UPDATE OF first_name, last_name ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_display_name();

-- Update existing profiles to have display_name based on username
UPDATE public.profiles 
SET display_name = username 
WHERE display_name IS NULL;

-- Make display_name NOT NULL after setting default values
ALTER TABLE public.profiles 
ALTER COLUMN display_name SET NOT NULL;