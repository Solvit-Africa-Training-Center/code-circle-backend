import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentController } from './assignment.controller';
import { AssignmentService } from './assignment.service';
import { Assignment } from './entities/assignment.entity';
import { Submission } from './entities/submission.entity';
import { Course } from '../course/entities/course.entity';
import { Module as MyModule } from '../course/entities/module.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Assignment, Submission, Course, MyModule]),
  ],
  controllers: [AssignmentController],
  providers: [AssignmentService],
  exports: [AssignmentService],
})
export class AssignmentsModule {}
