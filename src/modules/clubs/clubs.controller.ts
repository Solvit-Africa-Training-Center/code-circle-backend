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
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { ClubResponseDto } from './dto/club-response.dto';
import { PaginationParams } from '../../common/decorators/api-properties';
import { RequirePermissions } from '@circle-backend/common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../auth/constants/permissions';
import { Roles } from '@circle-backend/common/decorators/roles.decorator';
import { PermissionGuard } from '@circle-backend/common/guards/permissions.guard';
import { RolesGuard } from '@circle-backend/common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Clubs')
@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionGuard, RolesGuard)
  @Roles('USER_CREATOR', 'ADMIN')
  @RequirePermissions(PERMISSIONS.USER_CREATE)
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
  async create(@Body() createClubDto: CreateClubDto) {
    const club = await this.clubsService.create(createClubDto);
    return {
      message: 'Club created successfully',
      data: club,
    };
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
