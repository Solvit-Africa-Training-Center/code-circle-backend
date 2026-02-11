process.env.TS_NODE_TRANSPILE_ONLY = 'true';
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'NodeNext',
  moduleResolution: 'NodeNext',
  resolvePackageJsonExports: true,
  esModuleInterop: true,
});

require('dotenv').config();
require('reflect-metadata');
require('ts-node/register');
require('tsconfig-paths/register');

const path = require('path');
const { DataSource } = require('typeorm');

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'codecircle_db',
  entities: [
    path.join(__dirname, '..', '**', '*.entity{.ts,.js}'),
    path.join(__dirname, '..', '**', 'entities', '*{.ts,.js}'),
  ],
  migrations: [path.join(__dirname, '..', 'database', 'migrations', '*{.ts,.js}')],
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.NODE_ENV === 'development',
  migrationsRun: false,
});

dataSource
  .initialize()
  .then(() => dataSource.runMigrations())
  .then(() => dataSource.destroy())
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
