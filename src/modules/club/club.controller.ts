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
} from '@nestjs/common';
import { ClubService } from './club.service';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { PaginationParams } from '../../common/decorators/api-properties';

@ApiTags('club')
@Controller('club')
export class ClubController {
  constructor(private readonly clubService: ClubService) { }

  @Get('categories')
  getCategories() {
    return this.clubService.getCategoriesWithTechStack();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        categoryId: { type: 'string', format: 'uuid' },
        creatorId: { type: 'string', format: 'uuid' },
        isActive: { type: 'boolean' },
      },
    },
  })
  create(
    @Body() createClubDto: CreateClubDto,
  ) {
    return this.clubService.create(createClubDto);
  }

  @Get()
  findAll(@Query() params: PaginationParams) {
    return this.clubService.findAll(params);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clubService.findOne(id);
  }

  @Patch(':id')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        categoryId: { type: 'string', format: 'uuid' },
        creatorId: { type: 'string', format: 'uuid' },
        isActive: { type: 'boolean' },
      },
    },
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClubDto: UpdateClubDto,
  ) {
    return this.clubService.update(id, updateClubDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.clubService.remove(id);
  }
}
