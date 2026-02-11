module.exports = class FixCategoryNameNullValues1738500000000 {
    async up(queryRunner) {
        // First, check if the categories table exists
        const tableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'categories'
            );
        `);

        if (!tableExists[0].exists) {
            return; // Table doesn't exist, nothing to fix
        }

        // Fix NULL or empty name values - delete invalid rows
        await queryRunner.query(`
            DELETE FROM "categories" 
            WHERE "name" IS NULL OR "name" = ''
        `);

        // Fix NULL or empty slug values - delete invalid rows
        await queryRunner.query(`
            DELETE FROM "categories" 
            WHERE "slug" IS NULL OR "slug" = ''
        `);

        // Make name column NOT NULL (if it exists and is nullable)
        await queryRunner.query(`
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
        `);

        // Make slug column NOT NULL (if it exists and is nullable)
        await queryRunner.query(`
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
        `);

        // Ensure name column has VARCHAR(100) type
        await queryRunner.query(`
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
        `);

        // Ensure slug column has VARCHAR(100) type
        await queryRunner.query(`
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
        `);
    }

    async down(queryRunner) {
        // Revert: make the columns nullable again
        await queryRunner.query(`
            ALTER TABLE "categories" ALTER COLUMN "name" DROP NOT NULL;
        `);
        
        await queryRunner.query(`
            ALTER TABLE "categories" ALTER COLUMN "slug" DROP NOT NULL;
        `);
    }
}

