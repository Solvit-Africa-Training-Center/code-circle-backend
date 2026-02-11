import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryController, TestController } from './controllers/category.controller';
import { TestService } from './services/test.service';
import { Category } from './entities/category.entity';
import { Test } from './entities/test.entity';
import { TestQuestion } from './entities/test-question.entity';
import { TestAttempt } from './entities/test-attempt.entity';
import { User } from '../users/entities/user.entity';
import { EmailService } from '../../common/services/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, Test, TestQuestion, TestAttempt, User]),
  ],
  controllers: [CategoryController, TestController],
  providers: [TestService, EmailService],
=======
import { TestsService } from './tests.service';
import { TestsController } from './tests.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Test } from './entities/test.entity';
import { TestQuestion } from './entities/test-question.entity';
import { TestAttempt } from './entities/test-attempt.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Test, TestQuestion, TestAttempt])],
  controllers: [TestsController],
  providers: [TestsService],
  exports: [TestsService],
>>>>>>> 6640aae71400cad143c77b2f07e7becea766fdba
})
export class TestsModule {}
