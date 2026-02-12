import path from 'path';
import { config } from 'dotenv';
config();

import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'codecircle_db',
  entities: [path.join(__dirname, '/../**/*.entity.{ts,js}')],
  migrations: [path.join(__dirname, '/../database/migrations/*.{ts,js}')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});

export default dataSource;
module.exports = dataSource;
module.exports = dataSource;
(module.exports as { default: typeof dataSource }).default = dataSource;
