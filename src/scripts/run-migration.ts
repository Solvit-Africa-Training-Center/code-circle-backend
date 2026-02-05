import { DataSource } from 'typeorm';
import dataSource from '../config/typeorm-cli.config.js';

async function runMigrations() {
  try {
    await (dataSource as DataSource).initialize();
    console.log('Database connected');

    const migrations = await (dataSource as DataSource).runMigrations();
    console.log(`Ran ${migrations.length} migration(s)`);
    migrations.forEach((migration) => {
      console.log(`  - ${migration.name}`);
    });

    await (dataSource as DataSource).destroy();
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    await (dataSource as DataSource).destroy();
    process.exit(1);
  }
}

void runMigrations();
