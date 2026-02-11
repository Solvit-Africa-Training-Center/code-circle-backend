/* eslint-disable @typescript-eslint/no-floating-promises */
import { Client } from 'pg';

async function main() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '5432', 10);
  const user = process.env.DB_USERNAME || process.env.DB_USER || 'postgres';
  const password =
    process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || '';
  const db = process.env.DB_NAME || process.env.POSTGRES_DB || 'codecircle_db';

  // Connect to the default 'postgres' maintenance DB to create the target DB
  const adminDb = process.env.ADMIN_DB || 'postgres';

  const client = new Client({ host, port, user, password, database: adminDb });

  try {
    await client.connect();

    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [db],
    );
    if (res.rowCount > 0) {
      console.log(`Database '${db}' already exists — nothing to do.`);
      return;
    }

    // Create database
    await client.query(`CREATE DATABASE \"${db}\"`);
    console.log(`Created database '${db}'.`);
  } catch (err: any) {
    console.error('Failed to create database:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

void main();
