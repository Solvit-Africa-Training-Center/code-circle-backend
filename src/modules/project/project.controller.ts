import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateTeamDto, UpdateTeamDto } from './dto/create-team.dto';
import { SubmitProjectDto } from './dto/submit-project.dto';
import { GradeProjectDto } from './dto/grad-project.dto';
import { Project } from './entities/project.entity';
import { ProjectTeam } from './entities/project-team.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '@circle-backend/common/decorators/require-permissions.decorator';
import { CurrentUser } from '@circle-backend/common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('projects')
@Controller('projects')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectsService: ProjectService) {}

  // ============= PROJECT ENDPOINTS =============

  @Post()
  @RequirePermissions('course:other')
  @ApiOperation({ summary: 'Create a new project (Club Owner only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Project created successfully',
    type: Project,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only club owners can create projects',
  })
  async createProject(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: User
  ) {
    try {
      const project = await this.projectsService.createProject(
        createProjectDto,
        user.id,
      );
      
      return {
        message: 'Project created successfully',
        ...project,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(':projectId')
  @RequirePermissions('member')
  @ApiOperation({ summary: 'Get project details by ID' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project details retrieved successfully',
    type: Project,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found',
  })
  async getProjectById(@Param('projectId') projectId: string) {
    try {
      const project = await this.projectsService.getProjectById(projectId);
      
      return {
        message: 'Project retrieved successfully',
        ...project,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('course/:courseId')
  @RequirePermissions('member')
  @ApiOperation({ summary: 'Get all projects for a course' })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course projects retrieved successfully',
    type: [Project],
  })
  async getCourseProjects(@Param('courseId') courseId: string) {
    try {
      const projects = await this.projectsService.getCourseProjects(courseId);
      
      return {
        message: 'Projects retrieved successfully',
        data: projects,
        count: projects.length,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('module/:moduleId')
  @RequirePermissions('member')
  @ApiOperation({ summary: 'Get all projects for a module' })
  @ApiParam({ name: 'moduleId', description: 'Module UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Module projects retrieved successfully',
    type: [Project],
  })
  async getModuleProjects(@Param('moduleId') moduleId: string) {
    try {
      const projects = await this.projectsService.getModuleProjects(moduleId);
      
      return {
        message: 'Projects retrieved successfully',
        data: projects,
        count: projects.length,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put(':projectId')
  @RequirePermissions('course:other')
  @ApiOperation({ summary: 'Update project details (Club Owner only)' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project updated successfully',
    type: Project,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only project creator can update',
  })
  async updateProject(
    @Param('projectId') projectId: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: User
  ) {
    try {
      const project = await this.projectsService.updateProject(
        projectId,
        updateProjectDto,
        user.id,
      );
      
      return {
        message: 'Project updated successfully',
        ...project,
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete(':projectId')
  @RequirePermissions('course:other')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a project (Club Owner only)' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only project creator can delete',
  })
  async deleteProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User
  ) {
    try {
      await this.projectsService.deleteProject(projectId, user.id);
      
      return {
        message: 'Project deleted successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  @Post(':projectId/publish')
  @RequirePermissions('course:other')
  @ApiOperation({ summary: 'Publish a project (Club Owner only)' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project published successfully',
    type: Project,
  })
  async publishProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User
  ) {
    try {
      const project = await this.projectsService.publishProject(projectId, user.id);
      
      return {
        message: 'Project published successfully',
        ...project,
      };
    } catch (error) {
      throw error;
    }
  }

  // ============= TEAM ENDPOINTS =============

  @Post('teams')
  @ApiOperation({ summary: 'Create a new team for a project' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Team created successfully',
    type: ProjectTeam,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Project is not active or user already in a team',
  })
  async createTeam(@Body() createTeamDto: CreateTeamDto, @CurrentUser() user: User) {
    try {
      const team = await this.projectsService.createTeam(createTeamDto, user.id);
      
      return {
        message: 'Team created successfully',
        ...team,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('teams/:teamId')
  @ApiOperation({ summary: 'Get team details' })
  @ApiParam({ name: 'teamId', description: 'Team UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Team retrieved successfully',
    type: ProjectTeam,
  })
  async getTeamById(@Param('teamId') teamId: string) {
    try {
      const team = await this.projectsService.getTeamById(teamId);
      
      return {
        message: 'Team retrieved successfully',
        ...team,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(':projectId/teams')
  @RequirePermissions('course:other')
  @ApiOperation({ summary: 'Get all teams for a project' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project teams retrieved successfully',
    type: [ProjectTeam],
  })
  async getProjectTeams(@Param('projectId') projectId: string) {
    try {
      const teams = await this.projectsService.getProjectTeams(projectId);
      
      return {
        message: 'Teams retrieved successfully',
        data: teams,
        count: teams.length,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('teams/user/my-teams')
  @ApiOperation({ summary: 'Get current user teams' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User teams retrieved successfully',
    type: [ProjectTeam],
  })
  async getUserTeams(@CurrentUser() user: User) {
    try {
      const teams = await this.projectsService.getUserTeams(user.id);
      
      return {
        message: 'Teams retrieved successfully',
        data: teams,
        count: teams.length,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('teams/:teamId/join')
  @ApiOperation({ summary: 'Join a team' })
  @ApiParam({ name: 'teamId', description: 'Team UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Joined team successfully',
    type: ProjectTeam,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Team is full or not accepting members',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Already a member of this team',
  })
  async joinTeam(@Param('teamId') teamId: string, @CurrentUser() user: User) {
    try {
      const team = await this.projectsService.joinTeam(teamId, user.id);
      
      return {
        message: 'Joined team successfully',
        ...team,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('teams/:teamId/leave')
  @ApiOperation({ summary: 'Leave a team' })
  @ApiParam({ name: 'teamId', description: 'Team UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Left team successfully',
    type: ProjectTeam,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot leave team after submission',
  })
  async leaveTeam(@Param('teamId') teamId: string, @CurrentUser() user: User) {
    try {
      const team = await this.projectsService.leaveTeam(teamId, user.id);
      
      return {
        message: 'Left team successfully',
        ...team,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put('teams/:teamId')
  @ApiOperation({ summary: 'Update team details (Team Leader only)' })
  @ApiParam({ name: 'teamId', description: 'Team UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Team updated successfully',
    type: ProjectTeam,
  })
  async updateTeam(
    @Param('teamId') teamId: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @CurrentUser() user: User
  ) {
    try {
      const team = await this.projectsService.updateTeam(
        teamId,
        updateTeamDto,
        user.id,
      );
      
      return {
        message: 'Team updated successfully',
        ...team,
      };
    } catch (error) {
      throw error;
    }
  }

  // ============= SUBMISSION & GRADING ENDPOINTS =============

  @Post('teams/:teamId/submit')
  @ApiOperation({ summary: 'Submit project (Team Leader only)' })
  @ApiParam({ name: 'teamId', description: 'Team UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project submitted successfully',
    type: ProjectTeam,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only team leader can submit',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Team does not meet minimum size or deadline passed',
  })
  async submitProject(
    @Param('teamId') teamId: string,
    @Body() submitProjectDto: SubmitProjectDto,
    @CurrentUser() user: User
  ) {
    try {
      const team = await this.projectsService.submitProject(
        teamId,
        submitProjectDto,
        user.id,
      );
      
      return {
        message: 'Project submitted successfully',
        ...team,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('teams/:teamId/grade')
  @ApiOperation({ summary: 'Grade project submission (Club Owner only)' })
  @ApiParam({ name: 'teamId', description: 'Team UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project graded successfully',
    type: ProjectTeam,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Team has not submitted yet',
  })
  async gradeProject(
    @Param('teamId') teamId: string,
    @Body() gradeProjectDto: GradeProjectDto,
    @CurrentUser() user: User
  ) {
    try {
      const team = await this.projectsService.gradeProject(
        teamId,
        gradeProjectDto,
        user.id,
      );
      
      return {
        message: 'Project graded successfully',
        ...team,
      };
    } catch (error) {
      throw error;
    }
  }
}