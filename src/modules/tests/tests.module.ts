import { Module } from '@nestjs/common';
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
})
export class TestsModule {}
