import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ClubsService } from './clubs.service';
import { UpdateClubDto } from './dto/update-club.dto';
import { ClubResponseDto } from './dto/club-response.dto';
import { PaginationParams } from '../../common/decorators/api-properties';
// import { RequirePermissions } from '@circle-backend/common/decorators/require-permissions.decorator';
// import { PERMISSIONS } from '../auth/constants/permissions';
import { Roles } from '@circle-backend/common/decorators/roles.decorator';
//import { PermissionGuard } from '@circle-backend/common/guards/permissions.guard';
import { RolesGuard } from '@circle-backend/common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '@circle-backend/common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/strategies/jwt.strategy';
import { CreateClubInputDto } from './dto/creatorId.dto';
import { Membership } from '../users/entities/membership.entity';
import { Course } from '../course/entities/course.entity';

@ApiTags('Clubs')
@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'ADMIN')
  @ApiOperation({ summary: 'Create a new club' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Club created successfully',
    type: ClubResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Club with this name already exists in this category',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or inactive category',
  })
  async create(
    @Body() createClubDto: CreateClubInputDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    const clubData = {
      ...createClubDto,
      creatorId: currentUser.userId,
    };

    const club = await this.clubsService.create(clubData);
    return {
      message: 'Club created successfully',
      data: club,
    };
  }

  @Post(':id/join')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEMBER', 'CREATOR', 'ADMIN')
  @ApiOperation({ summary: 'Join a club as member' })
  @ApiParam({
    name: 'id',
    description: 'Club UUID',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Joined club successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User is already an active member',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Inactive club or invalid membership state',
  })
  async joinClub(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    const result = await this.clubsService.joinClub(id, currentUser.userId);
    return {
      message: result.message,
      data: result.membership,
    };
  }

  @Post(':id/leave')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEMBER', 'CREATOR', 'ADMIN')
  @ApiOperation({ summary: 'Leave a club' })
  @ApiParam({
    name: 'id',
    description: 'Club UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Left club successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Not an active member or creator cannot leave',
  })
  async leaveClub(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return await this.clubsService.leaveClub(id, currentUser.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all clubs with pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Clubs retrieved successfully',
  })
  async findAll(@Query() paginationParams: PaginationParams) {
    const result = await this.clubsService.findAll(paginationParams);
    return {
      message: 'Clubs retrieved successfully',
      ...result,
    };
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active clubs (no pagination)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active clubs retrieved successfully',
    type: [ClubResponseDto],
  })
  async findAllActive() {
    const clubs = await this.clubsService.findAllActive();
    return {
      message: 'Active clubs retrieved successfully',
      data: clubs,
    };
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get all clubs in a specific category' })
  @ApiParam({
    name: 'categoryId',
    description: 'Category UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Clubs retrieved successfully',
    type: [ClubResponseDto],
  })
  async findByCategory(@Param('categoryId', ParseUUIDPipe) categoryId: string) {
    const clubs = await this.clubsService.findByCategory(categoryId);
    return {
      message: 'Clubs retrieved successfully',
      data: clubs,
    };
  }

  @Get('creator/:creatorId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all clubs created by a specific user' })
  @ApiParam({
    name: 'creatorId',
    description: 'Creator User UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Clubs retrieved successfully',
    type: [ClubResponseDto],
  })
  async findByCreator(@Param('creatorId', ParseUUIDPipe) creatorId: string) {
    const clubs = await this.clubsService.findByCreator(creatorId);
    return {
      message: 'Clubs retrieved successfully',
      data: clubs,
    };
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get all active members in a club' })
  @ApiParam({
    name: 'id',
    description: 'Club UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Club members retrieved successfully',
    type: [Membership],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Club not found',
  })
  async getClubMembers(@Param('id', ParseUUIDPipe) id: string) {
    const members = await this.clubsService.getClubMembers(id);
    return {
      message: 'Club members retrieved successfully',
      data: members,
      count: members.length,
    };
  }

  @Get(':id/courses')
  @ApiOperation({ summary: 'Get all courses in a club' })
  @ApiParam({
    name: 'id',
    description: 'Club UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Club courses retrieved successfully',
    type: [Course],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Club not found',
  })
  async getClubCourses(@Param('id', ParseUUIDPipe) id: string) {
    const courses = await this.clubsService.getClubCourses(id);
    return {
      message: 'Club courses retrieved successfully',
      data: courses,
      count: courses.length,
    };
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get member and course counts for a club' })
  @ApiParam({
    name: 'id',
    description: 'Club UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Club statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Club statistics retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            clubId: { type: 'string', format: 'uuid' },
            memberCount: { type: 'number', example: 24 },
            courseCount: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Club not found',
  })
  async getClubStats(@Param('id', ParseUUIDPipe) id: string) {
    const stats = await this.clubsService.getClubStats(id);
    return {
      message: 'Club statistics retrieved successfully',
      data: stats,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a club by ID' })
  @ApiParam({
    name: 'id',
    description: 'Club UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Club found',
    type: ClubResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Club not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const club = await this.clubsService.findOne(id);
    return {
      message: 'Club retrieved successfully',
      data: club,
    };
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a club (Creator/Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Club UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Club updated successfully',
    type: ClubResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Club not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Club with this name already exists in this category',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClubDto: UpdateClubDto,
  ) {
    const club = await this.clubsService.update(id, updateClubDto);
    return {
      message: 'Club updated successfully',
      data: club,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a club (Creator/Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Club UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Club deactivated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Club not found',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.clubsService.remove(id);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Permanently delete a club (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Club UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Club permanently deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Club not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete club with active members',
  })
  async hardDelete(@Param('id', ParseUUIDPipe) id: string) {
    return await this.clubsService.hardDelete(id);
  }
}
