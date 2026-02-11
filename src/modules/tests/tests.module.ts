import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CategoryController } from './controllers/category.controller';
import { TestsController } from './tests.controller';

import { TestService } from './services/test.service';
import { TestsService } from './tests.service';

import { Category } from '../categories/entities/category.entity';
import { Test } from './entities/test.entity';
import { TestQuestion } from './entities/test-question.entity';
import { TestAttempt } from './entities/test-attempt.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../auth/entities/user-role.entity';
import { Role } from '../auth/entities/role.entity';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category,
      Test,
      TestQuestion,
      TestAttempt,
      User,
      UserRole,
      Role,
    ]),
    AuthModule,
  ],
  controllers: [CategoryController, TestsController],
  providers: [TestService, TestsService],
  exports: [TestsService],
})
export class TestsModule {}
