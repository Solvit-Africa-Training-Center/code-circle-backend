-- Immediate fix for NULL values in categories table
-- Run this directly in your PostgreSQL database using psql or pgAdmin

-- Step 1: Delete rows with NULL or empty name or slug values
DELETE FROM "categories" 
WHERE "name" IS NULL OR "name" = '' OR "slug" IS NULL OR "slug" = '';

-- Step 2: Make name column NOT NULL (if it exists and is nullable)
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

-- Step 3: Make slug column NOT NULL (if it exists and is nullable)
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

-- Step 4: Ensure name column has VARCHAR(100) type
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'categories' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE "categories" ALTER COLUMN "name" TYPE VARCHAR(100);
    END IF;
END $$;

-- Step 5: Ensure slug column has VARCHAR(100) type
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'categories' 
        AND column_name = 'slug'
    ) THEN
        ALTER TABLE "categories" ALTER COLUMN "slug" TYPE VARCHAR(100);
    END IF;
END $$;

