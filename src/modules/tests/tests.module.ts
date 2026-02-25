import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestsController } from './tests.controller';
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
import { QuestionPool } from './entities/question-pool.entity';
import { QuestionPoolService } from './services/questions-pool.service';
import { QuestionPoolController } from './question-pool.controller';
import { Membership } from '../users/entities/membership.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Test,
      TestQuestion,
      TestAttempt,
      Role,
      UserRole,
      Membership,
      QuestionPool,
    ]),
    CategoriesModule,
    ClubsModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [TestsController, QuestionPoolController],
  providers: [TestsService, TestResultService, QuestionPoolService],
  exports: [TestsService, TestResultService],
})
export class TestsModule {}
