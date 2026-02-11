import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig from './config/database.config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AuthController } from './modules/auth/auth.controller';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TestsModule } from './modules/tests/tests.module';
import { ClubModule } from './modules/club/club.module';

@Module({
  imports: [
    // Configuration Module
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: '.env',
    }),

    // Database Module
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const config = configService.get('database');
        if (!config) {
          throw new Error('Database configuration not found');
        }
        return config as TypeOrmModuleOptions;
      },
      inject: [ConfigService],
    }),
    AuthModule,
    CategoriesModule,
    TestsModule,
    ClubModule,
  ],
  controllers: [AuthController],
})
export class AppModule {}
