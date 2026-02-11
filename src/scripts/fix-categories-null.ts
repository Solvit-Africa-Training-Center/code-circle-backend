import { DataSource } from 'typeorm';
import dataSource from '../config/typeorm-cli.config.js';

async function fixCategoriesNullValues() {
  try {
    await (dataSource as DataSource).initialize();
    console.log('Database connected');

    const queryRunner = (dataSource as DataSource).createQueryRunner();

    // Step 1: Check if the categories table exists
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'categories'
      );
    `);

    if (!tableExists[0].exists) {
      console.log('Categories table does not exist. Nothing to fix.');
      await queryRunner.release();
      await (dataSource as DataSource).destroy();
      process.exit(0);
    }

    console.log('Fixing NULL values in categories table...');

    // Check current schema
    const columns = await queryRunner.query(`
      SELECT column_name, data_type, is_nullable, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'categories'
      ORDER BY ordinal_position;
    `);
    console.log('Current columns:', JSON.stringify(columns, null, 2));

    // Step 2: Delete rows with NULL or empty name or slug values
    const deleteResult = await queryRunner.query(`
      DELETE FROM "categories" 
      WHERE "name" IS NULL OR "name" = '' OR "slug" IS NULL OR "slug" = ''
    `);
    console.log(`Deleted ${deleteResult[1] || 0} rows with NULL values`);

    // Check if columns exist, if not create them first
    const nameColumnExists = columns.some((col: any) => col.column_name === 'name');
    const slugColumnExists = columns.some((col: any) => col.column_name === 'slug');

    if (!nameColumnExists) {
      console.log('Creating name column...');
      await queryRunner.query(`
        ALTER TABLE "categories" ADD COLUMN "name" VARCHAR(100);
      `);
    }

    if (!slugColumnExists) {
      console.log('Creating slug column...');
      await queryRunner.query(`
        ALTER TABLE "categories" ADD COLUMN "slug" VARCHAR(100);
      `);
    }

    // Step 3: Make name column NOT NULL (if it exists and is nullable)
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
          RAISE NOTICE 'Set name column to NOT NULL';
        END IF;
      END $$;
    `);
    console.log('✓ Fixed name column');

    // Step 4: Make slug column NOT NULL (if it exists and is nullable)
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
          RAISE NOTICE 'Set slug column to NOT NULL';
        END IF;
      END $$;
    `);
    console.log('✓ Fixed slug column');

    // Step 5: Ensure name column has VARCHAR(100) type
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
          RAISE NOTICE 'Set name column type to VARCHAR(100)';
        END IF;
      END $$;
    `);
    console.log('✓ Set name column type to VARCHAR(100)');

    // Step 6: Ensure slug column has VARCHAR(100) type
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
          RAISE NOTICE 'Set slug column type to VARCHAR(100)';
        END IF;
      END $$;
    `);
    console.log('✓ Set slug column type to VARCHAR(100)');

    await queryRunner.release();
    await (dataSource as DataSource).destroy();

    console.log('\n✅ Successfully fixed NULL values in categories table!');
    console.log('You can now restart your application.');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing categories:', error);
    await (dataSource as DataSource).destroy();
    process.exit(1);
  }
}

void fixCategoriesNullValues();

