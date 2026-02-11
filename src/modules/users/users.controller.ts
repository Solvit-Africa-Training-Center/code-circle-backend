import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RegisterForTestDto } from './dto/register-for-test.dto';

import { ApproveCreatorDto } from './dto/approve-creator.dto';
import { RejectCreatorDto } from './dto/reject-creator.dto';
import { ActivateUserDto } from './dto/activate-user.dto';
import { JwtAuthGuard } from '@circle-backend/modules/auth/guards/jwt-auth.guard';
import { Roles } from '@circle-backend/common/decorators/roles.decorator';
import { PermissionGuard } from '@circle-backend/common/guards/permissions.guard';
import { RequirePermissions } from '@circle-backend/common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '@circle-backend/modules/auth/constants/permissions';
import { RolesGuard } from '@circle-backend/common/guards/roles.guard';
import { CurrentUser } from '@circle-backend/common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '@circle-backend/modules/auth/strategies/jwt.strategy';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register-for-test')
  @ApiOperation({ 
    summary: 'Register for test (pre-test registration)',
    description: 'Register a user account before taking a test. Uploads CV and degree to Cloudinary. User will receive credentials after passing the test.'
  })
  @ApiBody({ type: RegisterForTestDto })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully. You can now take the test.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Registration successful. You can now take the test.' },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
            email: { type: 'string', example: 'user@example.com' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input or email already in use.' })
  async registerForTest(@Body() registerDto: RegisterForTestDto) {
    const user = await this.usersService.registerForTest(registerDto);
    return {
      message: 'Registration successful. You can now take the test.',
      data: {
        userId: user.id,
        email: user.email,
      },
    };
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  @UseGuards(JwtAuthGuard, PermissionGuard, RolesGuard)
  @Roles('ADMIN')
  @RequirePermissions(PERMISSIONS.USER_CREATE)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required.' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query('order') order: 'ASC' | 'DESC' = 'DESC',
  ) {
    return this.usersService.findAll(page, limit, order);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Get(':id/memberships')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all memberships for a user' })
  @ApiResponse({ status: 200, description: 'List of user memberships.' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format.' })
  getUserMemberships(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getUserMemberships(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }

  // Admin: Approve Creator
  @Post('approve-creator')
  @UseGuards(JwtAuthGuard, PermissionGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Approve a creator account' })
  @ApiResponse({ status: 200, description: 'Creator approved.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required.' })
  approveCreator(
    @Body() dto: ApproveCreatorDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.usersService.approveCreator({ ...dto, adminId: currentUser.id });
  }

  // Admin: Reject Creator
  @Post('reject-creator')
  @UseGuards(JwtAuthGuard, PermissionGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reject a creator account' })
  @ApiResponse({ status: 200, description: 'Creator rejected.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required.' })
  rejectCreator(@Body() dto: RejectCreatorDto) {
    return this.usersService.rejectCreator(dto);
  }

  // Admin: Activate/Deactivate User
  @Post('activate-user')
  @UseGuards(JwtAuthGuard, PermissionGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Activate or deactivate a user' })
  @ApiResponse({ status: 200, description: 'User activation status updated.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required.' })
  activateUser(@Body() dto: ActivateUserDto) {
    return this.usersService.activateUser(dto);
  }
}
