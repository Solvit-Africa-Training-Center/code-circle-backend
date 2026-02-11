import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

config();

const configService = new ConfigService();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.get<string>('DB_HOST') || 'localhost',
  port: configService.get<number>('DB_PORT') || 5432,
  username: configService.get<string>('DB_USERNAME') || 'postgres',
  password: configService.get<string>('DB_PASSWORD') || '',
  database: configService.get<string>('DB_NAME') || 'codecircle_db',
  entities: [
    join(__dirname, '..', '**', '*.entity{.ts,.js}'),
    join(__dirname, '..', '**', 'entities', '*{.ts,.js}'),
  ],
  migrations: [join(__dirname, '..', 'database', 'migrations', '*{.ts,.js}')],
  synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
  logging: configService.get<string>('NODE_ENV') === 'development',
  migrationsRun: false,
};

// Instance DataSource pour les migrations CLI
const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
