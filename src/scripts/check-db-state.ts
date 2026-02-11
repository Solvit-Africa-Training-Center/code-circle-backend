import { DataSource } from 'typeorm';
import dataSource from '../config/typeorm-cli.config.js';

async function checkDatabaseState() {
  try {
    await (dataSource as DataSource).initialize();
    console.log('Database connected');

    const queryRunner = (dataSource as DataSource).createQueryRunner();

    // Check categories table structure
    const columns = await queryRunner.query(`
      SELECT column_name, data_type, is_nullable, character_maximum_length, column_default
      FROM information_schema.columns 
      WHERE table_name = 'categories'
      ORDER BY ordinal_position;
    `);
    console.log('\n=== Categories Table Structure ===');
    console.log(JSON.stringify(columns, null, 2));

    // Check for NULL values
    const nullCount = await queryRunner.query(`
      SELECT 
        COUNT(*) FILTER (WHERE "name" IS NULL) as null_names,
        COUNT(*) FILTER (WHERE "slug" IS NULL) as null_slugs,
        COUNT(*) as total_rows
      FROM "categories";
    `);
    console.log('\n=== NULL Value Check ===');
    console.log(JSON.stringify(nullCount[0], null, 2));

    // Check all rows
    const allRows = await queryRunner.query(`SELECT id, name, slug FROM "categories" LIMIT 10;`);
    console.log('\n=== Sample Rows ===');
    console.log(JSON.stringify(allRows, null, 2));

    await queryRunner.release();
    await (dataSource as DataSource).destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await (dataSource as DataSource).destroy();
    process.exit(1);
  }
}

void checkDatabaseState();

