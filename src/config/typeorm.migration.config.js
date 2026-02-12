const { DataSource } = require('typeorm');
require('dotenv').config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'codecircle_db',
  entities: [__dirname + '/../**/*.entity.js'],
  migrations: [__dirname + '/../database/migrations/*.js'],
  migrationsTableName: 'migrations',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.NODE_ENV === 'development',
  retryAttempts: 3,
  retryDelay: 3000,
});

module.exports = dataSource;
module.exports.dataSource = dataSource;
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'codecircle_db',
  entities: [path.join(__dirname, '../../dist/**/*.entity.js')],
  migrations: [path.join(__dirname, '../../dist/database/migrations/*.js')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
