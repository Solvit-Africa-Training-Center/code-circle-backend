import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus, ProjectType } from './entities/project.entity';
import { ProjectTeam, TeamStatus, MemberRole } from './entities/project-team.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { SubmitProjectDto } from './dto/submit-project.dto';
import { GradeProjectDto } from './dto/grad-project.dto';
import { Course } from '../course/entities/course.entity';
import { Module as MyModule } from '../course/entities/module.entity';
import { CourseStatus } from '../course/entities/course.entity';
import { Enrollment } from '../course/entities/enrollment.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectTeam)
    private readonly projectTeamRepository: Repository<ProjectTeam>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(MyModule)
    private readonly moduleRepository: Repository<MyModule>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
  ) {}

  // ============= PROJECT MANAGEMENT =============

  async createProject(
    createProjectDto: CreateProjectDto,
    userId: string,
  ): Promise<Project> {
    try {
      const course = await this.courseRepository.findOne({
        where: {
          id: createProjectDto.courseId,
          createdBy: userId,
          status: CourseStatus.PUBLISHED
        },
      });
      if (!course) {
        throw new NotFoundException('Course not found or access denied');
      }
      const module = createProjectDto.moduleId
        ? await this.moduleRepository.findOne({
            where: {
              id: createProjectDto.moduleId,
              course: { id: course.id },
            },
          })
        : undefined;

      const project = this.projectRepository.create({
        ...createProjectDto,  
        moduleId: module?.id ?? undefined, 
        course,                            
        module: module ?? undefined,       
        createdBy: userId,
      });

      return await this.projectRepository.save(project);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create project');
    }
  }

  async getProjectById(projectId: string): Promise<Project> {
  try {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['teams'],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    return project;
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException('Failed to fetch project');
  }
}

  async getCourseProjects(courseId: string): Promise<Project[]> {
    try {
      const course = await this.courseRepository.findOne({
        where: { id: courseId },
      });

      if (!course) {
        throw new NotFoundException(`Course with ID ${courseId} not found`);
      }
      return await this.projectRepository.find({
        where: { courseId },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch course projects');
    }
  }

  async getModuleProjects(moduleId: string): Promise<Project[]> {
    try {
      const module = await this.moduleRepository.findOne({
        where: { id: moduleId}
      })
      if (!module) {
        throw new NotFoundException(`Course with ID ${moduleId} not found`);
      }
      return await this.projectRepository.find({
        where: { moduleId },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch module projects');
    }
  }

  async updateProject(
    projectId: string,
    updateProjectDto: UpdateProjectDto,
    userId: string,
  ): Promise<Project> {
    try {
      const project = await this.getProjectById(projectId);

      if (project.createdBy !== userId) {
        throw new ForbiddenException(
          'Only the project creator can update this project',
        );
      }

      const { courseId, moduleId, ...updateData } = updateProjectDto;

      if (courseId && courseId !== project.courseId) {
        const course = await this.courseRepository.findOne({
          where: { id: courseId, createdBy: userId, status: CourseStatus.PUBLISHED },
        });
        if (!course) {
          throw new NotFoundException('Course not found or access denied');
        }
        updateData['course'] = course;
        updateData['courseId'] = courseId;
      }

      if (moduleId === null) {
        updateData['module'] = null;
        updateData['moduleId'] = null;
      } else if (moduleId && moduleId !== project.moduleId) {
        const module = await this.moduleRepository.findOne({
          where: {
            id: moduleId,
            course: { id: courseId ?? project.courseId },
          },
        });
        if (!module) {
          throw new NotFoundException('Module not found');
        }
        updateData['module'] = module;
        updateData['moduleId'] = moduleId;
      }
      // if moduleId is undefined — not provided in DTO, leave project.moduleId unchanged

      Object.assign(project, updateData);
      return await this.projectRepository.save(project);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update project');
    }
  }

  async deleteProject(projectId: string, userId: string): Promise<void> {
    try {
      const project = await this.getProjectById(projectId);

      if (project.createdBy !== userId) {
        throw new ForbiddenException(
          'Only the project creator can delete this project',
        );
      }

      await this.projectRepository.remove(project);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete project');
    }
  }

  async publishProject(projectId: string, userId: string): Promise<Project> {
    try {
      const project = await this.getProjectById(projectId);

      if (project.createdBy !== userId) {
        throw new ForbiddenException(
          'Only the project creator can publish this project',
        );
      }

      if (project.status === ProjectStatus.ACTIVE) {
        throw new BadRequestException('Project is already published');
      }

      if (project.status === ProjectStatus.ARCHIVED) {
        throw new BadRequestException('Archived projects cannot be published');
      }

      project.status = ProjectStatus.ACTIVE;
      return await this.projectRepository.save(project);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to publish project');
    }
  }
  // ============= TEAM MANAGEMENT ============= remember try and catch!!!!!!!!!!!!!

  async createTeam(
    createTeamDto: CreateTeamDto,
    userId: string,
  ): Promise<ProjectTeam> {
    try {
      const project = await this.getProjectById(createTeamDto.projectId);

      if (project.status !== ProjectStatus.ACTIVE) {
        throw new BadRequestException('Cannot create team for inactive project');
      }
      if (project.type === ProjectType.INDIVIDUAL) {
        throw new BadRequestException(
          'Cannot create a team for an individual project',
        );
      }

      const existingTeams = await this.projectTeamRepository.find({
        where: { projectId: createTeamDto.projectId },
      });

      const alreadyInTeam = existingTeams.some((team) =>
        team.members.some((m) => m.userId === userId),
      );

      if (alreadyInTeam) {
        throw new ConflictException('Already in a team for this project');
      }

      const team = this.projectTeamRepository.create({
        ...createTeamDto,
        projectId: createTeamDto.projectId,
        members: [
          {
            userId,
            role: MemberRole.LEADER,
            joinedAt: new Date(),
          },
        ],
      });

      return await this.projectTeamRepository.save(team);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create team');
    }
  }

  async getTeamById(teamId: string): Promise<ProjectTeam> {
    try {
      const team = await this.projectTeamRepository.findOne({
        where: { id: teamId },
        relations: ['project'],
      });

      if (!team) {
        throw new NotFoundException(`Team with ID ${teamId} not found`);
      }

      return team;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch team');
    }
  }

  async getProjectTeams(projectId: string): Promise<ProjectTeam[]> {
    try {
      const project = await this.projectRepository.findOne({
        where: { id: projectId },
      });

      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }

      return await this.projectTeamRepository.find({
        where: { projectId },
        relations: ['project'],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch project teams'); 
    }
  }

  async getUserTeams(userId: string): Promise<ProjectTeam[]> {
    try {
      return await this.projectTeamRepository
        .createQueryBuilder('team')
        .leftJoinAndSelect('team.project', 'project')
        .where(`team.members @> :member`, {
          member: JSON.stringify([{ userId }]),
        })
        .orderBy('team.createdAt', 'DESC')
        .getMany();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch user teams'); 
    }
  }

  async joinTeam(teamId: string, userId: string): Promise<ProjectTeam> {
    try {
      const team = await this.getTeamById(teamId);

      if (team.project.status !== ProjectStatus.ACTIVE) {
        throw new BadRequestException('Cannot join a team for an inactive project');
      }

      if (team.status !== TeamStatus.FORMING && team.status !== TeamStatus.ACTIVE) {
        throw new BadRequestException('Team is not accepting new members');
      }

      const enrollment = await this.enrollmentRepository.findOne({
        where: {
          courseId: team.project.courseId,
          userId,
        },
      });

    if (!enrollment) {
      throw new ForbiddenException('You must be enrolled in the course to join a team');
    }

      if (team.members.some((m) => m.userId === userId)) {
        throw new ConflictException('Already a member of this team');
      }

      const existingTeams = await this.projectTeamRepository.find({
        where: { projectId: team.project.id },
      });

      const alreadyInAnotherTeam = existingTeams
        .filter((t) => t.id !== teamId)
        .some((t) => t.members.some((m) => m.userId === userId));

      if (alreadyInAnotherTeam) {
        throw new ConflictException('Already a member of another team for this project');
      }

      if (team.members.length >= team.project.maxTeamSize) {
        throw new BadRequestException('Team is full');
      }

      team.members.push({
        userId,
        role: MemberRole.MEMBER,
        joinedAt: new Date(),
      });

      if (team.members.length >= team.project.minTeamSize) {
        team.status = TeamStatus.ACTIVE;
      }

      return await this.projectTeamRepository.save(team);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to join team');
    }
  }

  async leaveTeam(teamId: string, userId: string): Promise<ProjectTeam> {
    try {
      const team = await this.getTeamById(teamId);

      const memberIndex = team.members.findIndex((m) => m.userId === userId);
      if (memberIndex === -1) {
        throw new BadRequestException('Not a member of this team');
      }

      if (
        team.status === TeamStatus.SUBMITTED ||
        team.status === TeamStatus.GRADED
      ) {
        throw new BadRequestException('Cannot leave team after submission');
      }

      const leavingMember = team.members[memberIndex];

      team.members = team.members.filter((m) => m.userId !== userId);

      if (team.members.length === 0) {
        team.status = TeamStatus.DISBANDED;
      } else {
        if (leavingMember.role === MemberRole.LEADER) {
          team.members[0].role = MemberRole.LEADER;
        }

        if (team.members.length < team.project.minTeamSize) {
          team.status = TeamStatus.FORMING;
        }
      }

      return await this.projectTeamRepository.save(team);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to leave team');
    }
  }

  // ============= SUBMISSION & GRADING =============

  async submitProject(
    teamId: string,
    submitProjectDto: SubmitProjectDto,
    userId: string,
    ): Promise<ProjectTeam> {
    try {
      const team = await this.getTeamById(teamId);

      if (team.project.status !== ProjectStatus.ACTIVE) {
        throw new BadRequestException('Cannot submit for an inactive project');
      }

      if (
        team.status === TeamStatus.SUBMITTED ||
        team.status === TeamStatus.GRADED
      ) {
        throw new BadRequestException('Project has already been submitted');
      }

      const member = team.members.find((m) => m.userId === userId);
      if (!member || member.role !== MemberRole.LEADER) {
        throw new ForbiddenException('Only team leader can submit the project');
      }

      if (team.members.length < team.project.minTeamSize) {
        throw new BadRequestException(
          `Team must have at least ${team.project.minTeamSize} members to submit`,
        );
      }

      if (team.project.endDate && new Date() > team.project.endDate) {
        throw new BadRequestException('Project deadline has passed');
      }

      team.submissionAttachments = submitProjectDto.submissionAttachments  ?? null;
      team.submissionContent = submitProjectDto.submissionContent;
      team.status = TeamStatus.SUBMITTED;
      team.submittedAt = new Date();

      return await this.projectTeamRepository.save(team);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to submit project');
    }
  }

  async gradeProject(
    teamId: string,
    gradeProjectDto: GradeProjectDto,
    userId: string,
  ): Promise<ProjectTeam> {
    try {
      const team = await this.getTeamById(teamId);

      const project = await this.getProjectById(team.project.id);
      const course = await this.courseRepository.findOne({
        where: { id: project.courseId },
      });

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      if (course.createdBy !== userId) {
        throw new ForbiddenException('Only the course instructor can grade projects');
      }

      if (team.status !== TeamStatus.SUBMITTED) {
        throw new BadRequestException('Team has not submitted the project yet');
      }

      if (gradeProjectDto.score > team.project.maxPoints) {
        throw new BadRequestException(
          `Score cannot exceed maximum points (${team.project.maxPoints})`,
        );
      }

      if (gradeProjectDto.score < 0) {
        throw new BadRequestException('Score cannot be negative');
      }

      team.score = gradeProjectDto.score;
      team.feedback = gradeProjectDto.feedback ?? null;
      team.status = TeamStatus.GRADED;
      team.gradedAt = new Date();
      team.gradedBy = userId;

      return await this.projectTeamRepository.save(team);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to grade project');
    }
  }

  async updateTeam(
    teamId: string,
    updateData: Partial<CreateTeamDto>,
    userId: string,
  ): Promise<ProjectTeam> {
    try {
      const team = await this.getTeamById(teamId);

      const member = team.members.find((m) => m.userId === userId);
      if (!member || member.role !== MemberRole.LEADER) {
        throw new ForbiddenException('Only team leader can update team details');
      }

      if (
        team.status === TeamStatus.SUBMITTED ||
        team.status === TeamStatus.GRADED
      ) {
        throw new BadRequestException('Cannot update team after submission');
      }

      const { name, description } = updateData;
      if (name) team.name = name;
      if (description !== undefined) team.description = description;

      return await this.projectTeamRepository.save(team);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update team');
    }
  }
}