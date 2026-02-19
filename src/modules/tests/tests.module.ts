import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CategoryController } from './controllers/category.controller';
import { TestsController } from './tests.controller';

import { TestService } from './services/test.service';
import { TestsService } from './tests.service';

import { Test } from './entities/test.entity';
import { TestQuestion } from './entities/test-question.entity';
import { TestAttempt } from './entities/test-attempt.entity';
import { CategoriesModule } from '../categories/categories.module';
import { ClubsModule } from '../clubs/clubs.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { TestResultService } from './services/test-result.service';
import { UserRole } from '../auth/entities/user-role.entity';
import { Role } from '../auth/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Test, TestQuestion, TestAttempt, Role, UserRole]),
    CategoriesModule,
    ClubsModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [CategoryController, TestsController],
  providers: [TestService, TestsService, TestResultService],
  exports: [TestsService, TestService, TestResultService],
})
export class TestsModule {}
