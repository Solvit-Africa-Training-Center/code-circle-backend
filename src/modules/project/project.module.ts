import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { Project } from './entities/project.entity';
import { ProjectTeam } from './entities/project-team.entity';
import { Course } from '../course/entities/course.entity';
import { Module as MyModule } from '../course/entities/module.entity';
import { Enrollment } from '../course/entities/enrollment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectTeam, Course, MyModule, Enrollment])],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectsModule {}