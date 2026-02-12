import { DataSource } from 'typeorm';
import dataSource from '../config/typeorm-cli.config.js';

const typedDataSource: DataSource = dataSource as DataSource;

async function revertMigration() {
  try {
    await typedDataSource.initialize();
    console.log('Database connected');

    await typedDataSource.undoLastMigration();
    console.log('Reverted last migration');

    await typedDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Migration revert error:', error);
    await typedDataSource.destroy();
    process.exit(1);
  }
}

void revertMigration();
