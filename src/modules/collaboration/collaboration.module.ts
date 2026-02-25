import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollaborationController } from './collaboration.controller';
import { CollaborationService } from './collaboration.service';
import { CollaborationMessage } from './entities/collaboration-message.entity';
import { CollaborationTask } from './entities/collaboration-task.entity';
import { CollaborationCodeSubmission } from './entities/collaboration-code-submission.entity';
import { Club } from '../clubs/entities/club.entity';
import { Membership } from '../users/entities/membership.entity';
import { User } from '../users/entities/user.entity';
import { Enrollment } from '../course/entities/enrollment.entity';
import { Course } from '../course/entities/course.entity';
import { TestAttempt } from '../tests/entities/test-attempt.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CollaborationMessage,
      CollaborationTask,
      CollaborationCodeSubmission,
      Club,
      Membership,
      User,
      Enrollment,
      Course,
      TestAttempt,
    ]),
  ],
  controllers: [CollaborationController],
  providers: [CollaborationService],
  exports: [CollaborationService],
})
export class CollaborationModule {}
