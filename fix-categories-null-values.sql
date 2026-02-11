-- Quick fix script for NULL values in categories table
-- Run this directly in your PostgreSQL database

-- Delete rows with NULL or empty name or slug values
DELETE FROM "categories" 
WHERE "name" IS NULL OR "name" = '' OR "slug" IS NULL OR "slug" = '';

-- Make name column NOT NULL (if it's currently nullable)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'categories' 
    AND column_name = 'name' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "categories" ALTER COLUMN "name" SET NOT NULL;
  END IF;
END $$;

-- Make slug column NOT NULL (if it's currently nullable)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'categories' 
    AND column_name = 'slug' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "categories" ALTER COLUMN "slug" SET NOT NULL;
  END IF;
END $$;

-- Ensure both columns have VARCHAR(100) type
ALTER TABLE "categories" ALTER COLUMN "name" TYPE VARCHAR(100);
ALTER TABLE "categories" ALTER COLUMN "slug" TYPE VARCHAR(100);

