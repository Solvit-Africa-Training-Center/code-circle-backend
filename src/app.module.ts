import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig from './config/database.config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TestsModule } from './modules/tests/tests.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ClubsModule } from './modules/clubs/clubs.module';
import { CoursesModule } from './modules/course/course.module';
import { AssignmentsModule } from './modules/assignment/assignment.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { ProjectsModule } from './modules/project/project.module';

import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: '.env',
    }),
    CommonModule,
    AuthModule,
    UsersModule,
    TestsModule,
    CategoriesModule,
    ClubsModule,
    CoursesModule,
    AssignmentsModule,
    QuizModule,
    ProjectsModule,

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const config =
          configService.get<TypeOrmModuleOptions>('database');
        if (!config) {
          throw new Error('Database configuration not found');
        }
        return config;
      },
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}