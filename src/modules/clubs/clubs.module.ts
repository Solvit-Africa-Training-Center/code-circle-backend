import { Module } from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { ClubsController } from './clubs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Club } from './entities/club.entity';
import { CategoriesModule } from '../categories/categories.module';
import { AuthModule } from '../auth/auth.module';
import { TestAttempt } from '../tests/entities/test-attempt.entity';
import { Membership } from '../users/entities/membership.entity';
import { Course } from '../course/entities/course.entity';
import { Project } from '../project/entities/project.entity';
import { User } from '../users/entities/user.entity';
import { ClubsInsightsService } from './clubs-insights.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Club,
      TestAttempt,
      Membership,
      Course,
      Project,
      User,
    ]),
    CategoriesModule,
    AuthModule,
  ],
  controllers: [ClubsController],
  providers: [ClubsService, ClubsInsightsService],
  exports: [ClubsService],
})
export class ClubsModule {}
