import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { ApproveCreatorDto } from './dto/approve-creator.dto';
import { RejectCreatorDto } from './dto/reject-creator.dto';
import { ActivateUserDto } from './dto/activate-user.dto';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users.' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  // Admin: Approve Creator
  @Post('approve-creator')
  @ApiOperation({ summary: 'Approve a creator account' })
  @ApiResponse({ status: 200, description: 'Creator approved.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  approveCreator(@Body() dto: ApproveCreatorDto) {
    return this.usersService.approveCreator(dto);
  }

  // Admin: Reject Creator
  @Post('reject-creator')
  @ApiOperation({ summary: 'Reject a creator account' })
  @ApiResponse({ status: 200, description: 'Creator rejected.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  rejectCreator(@Body() dto: RejectCreatorDto) {
    return this.usersService.rejectCreator(dto);
  }

  // Admin: Activate/Deactivate User
  @Post('activate-user')
  @ApiOperation({ summary: 'Activate or deactivate a user' })
  @ApiResponse({ status: 200, description: 'User activation status updated.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  activateUser(@Body() dto: ActivateUserDto) {
    return this.usersService.activateUser(dto);
  }
}
