import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '@circle-backend/common/decorators/require-permissions.decorator';
import { CurrentUser } from '@circle-backend/common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CollaborationService } from './collaboration.service';
import { CreateCollaborationMessageDto } from './dto/create-collaboration-message.dto';
import { CreateCollaborationTaskDto } from './dto/create-collaboration-task.dto';
import { UpdateCollaborationTaskDto } from './dto/update-collaboration-task.dto';
import { CreateCollaborationCodeSubmissionDto } from './dto/create-collaboration-code-submission.dto';

@ApiTags('collaboration')
@Controller('collaboration')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class CollaborationController {
  constructor(private readonly collaborationService: CollaborationService) {}

  @Get('clubs/:clubId/room')
  @RequirePermissions('member:member')
  @ApiOperation({ summary: 'Get collaboration room state for a club' })
  async getRoom(@Param('clubId') clubId: string, @CurrentUser() user: User) {
    const data = await this.collaborationService.getRoom(clubId, user.id);
    return {
      message: 'Collaboration room retrieved successfully',
      data,
    };
  }

  @Post('clubs/:clubId/messages')
  @RequirePermissions('member:member')
  @ApiOperation({ summary: 'Post a collaboration chat message' })
  async createMessage(
    @Param('clubId') clubId: string,
    @Body() dto: CreateCollaborationMessageDto,
    @CurrentUser() user: User,
  ) {
    const data = await this.collaborationService.createMessage(clubId, user.id, dto);
    return {
      message: 'Message created successfully',
      data,
    };
  }

  @Post('clubs/:clubId/tasks')
  @RequirePermissions('member:member')
  @ApiOperation({ summary: 'Create a collaboration sprint task' })
  async createTask(
    @Param('clubId') clubId: string,
    @Body() dto: CreateCollaborationTaskDto,
    @CurrentUser() user: User,
  ) {
    const data = await this.collaborationService.createTask(clubId, user.id, dto);
    return {
      message: 'Task created successfully',
      data,
    };
  }

  @Patch('tasks/:taskId')
  @RequirePermissions('member:member')
  @ApiOperation({ summary: 'Update a collaboration sprint task' })
  async updateTask(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateCollaborationTaskDto,
    @CurrentUser() user: User,
  ) {
    const data = await this.collaborationService.updateTask(taskId, user.id, dto);
    return {
      message: 'Task updated successfully',
      data,
    };
  }

  @Post('clubs/:clubId/code-submissions')
  @RequirePermissions('member:member')
  @ApiOperation({ summary: 'Submit a collaboration code snippet' })
  async createCodeSubmission(
    @Param('clubId') clubId: string,
    @Body() dto: CreateCollaborationCodeSubmissionDto,
    @CurrentUser() user: User,
  ) {
    const data = await this.collaborationService.createCodeSubmission(
      clubId,
      user.id,
      dto,
    );
    return {
      message: 'Code submission created successfully',
      data,
    };
  }
}

