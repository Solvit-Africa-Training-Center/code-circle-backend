import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PaginationParams } from '../../common/decorators/api-properties';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
  ) { }

  private readonly logger = new Logger(CategoryService.name);

  async create(dto: CreateCategoryDto): Promise<Category> {
    try {
      const existing = await this.repo.findOne({ where: { name: dto.name } });
      if (existing)
        throw new ConflictException('Category with this name already exists');

      const entity = this.repo.create(dto);
      return await this.repo.save(entity);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to create category', (error as Error).stack);
      throw new InternalServerErrorException('Failed to create category');
    }
  }

  async findAll(
    params: PaginationParams = {},
  ): Promise<{ data: Category[]; meta: any }> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'name',
        sortOrder = 'ASC',
        search,
      } = params;
      const take = Math.min(limit, 100);
      const skip = (page - 1) * take;

      const where = search
        ? [
          { name: ILike(`%${search}%`) },
          { description: ILike(`%${search}%`) },
        ]
        : undefined;

      const allowedSort = new Set(['id', 'name']);
      const safeSortBy = allowedSort.has(sortBy) ? sortBy : 'name';

      const [data, total] = await this.repo.findAndCount({
        where,
        order: { [safeSortBy]: sortOrder },
        take,
        skip,
      });

      const totalPages = Math.ceil(total / take) || 1;

      return {
        data,
        meta: {
          page,
          limit: take,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to list categories', (error as Error).stack);
      throw new InternalServerErrorException('Failed to list categories');
    }
  }

  async findOne(id: string): Promise<Category> {
    try {
      const category = await this.repo.findOne({ where: { id } });
      if (!category) throw new NotFoundException(`Category #${id} not found`);
      return category;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `Failed to fetch category #${id}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException('Failed to fetch category');
    }
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    try {
      const category = await this.repo.preload({ id, ...(dto as any) });
      if (!category) throw new NotFoundException(`Category #${id} not found`);

      const newName = (dto as Partial<CreateCategoryDto>).name;
      if (typeof newName === 'string' && newName.trim().length > 0) {
        const existing = await this.repo.findOne({ where: { name: newName } });
        if (existing && existing.id !== id)
          throw new ConflictException(
            'Category with this name already exists',
          );
      }

      return await this.repo.save(category);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `Failed to update category #${id}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException('Failed to update category');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const res = await this.repo.delete(id);
      if (!res.affected) throw new NotFoundException(`Category #${id} not found`);
      return;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `Failed to remove category #${id}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException('Failed to remove category');
    }
  }
}
