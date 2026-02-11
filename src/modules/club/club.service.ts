import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, QueryFailedError } from 'typeorm';
import { Club } from './entities/club.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { PaginationParams } from '../../common/decorators/api-properties';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ClubService {
  constructor(
    @InjectRepository(Club)
    private readonly repo: Repository<Club>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private readonly logger = new Logger(ClubService.name);
  private usersTablePresenceChecked = false;
  private usersTableExists = false;

  // Tech-stack hints keyed by category slug.
  private readonly techStackByCategorySlug: Record<string, string[]> = {
    uiux: ['figma', 'adobe-xd', 'sketch', 'framer'],
    frontend: [
      'javascript',
      'typescript',
      'reactjs',
      'nextjs',
      'vuejs',
      'angular',
      'svelte',
    ],
    backend: ['nodejs', 'nestjs', 'django', 'flask', 'springboot', 'laravel'],
    datascience: ['python', 'pandas', 'numpy', 'pytorch', 'tensorflow'],
    ai: ['python', 'pytorch', 'tensorflow', 'langchain'],
    cybersecurity: ['kali-linux', 'burp-suite', 'wireshark', 'metasploit'],
  };

  async getCategoriesWithTechStack() {
    const categories = await this.categoryRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    return categories.map((category) => ({
      ...category,
      techStack:
        this.techStackByCategorySlug[category.slug?.toLowerCase()] || [],
    }));
  }

  async create(dto: CreateClubDto): Promise<Club> {
    try {
      const name = dto.name.trim();
      const exists = await this.repo.findOne({
        where: { name: ILike(name) },
      });
      if (exists)
        throw new ConflictException('Club with this name already exists');

      const category = await this.categoryRepo.findOne({
        where: { id: dto.categoryId, isActive: true },
      });
      if (!category)
        throw new BadRequestException('Category not found or inactive');

      await this.ensureCreatorIfUsersTableExists(dto.creatorId);

      const entity = this.repo.create({
        ...dto,
        name,
      } as Partial<Club>);

      return await this.repo.save(entity);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to create club', (error as Error).stack);
      throw new InternalServerErrorException('Failed to create club');
    }
  }

  async findAll(
    params: PaginationParams = {},
  ): Promise<{ data: Club[]; meta: any }> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        search,
      } = params;
      const take = Math.min(limit, 100);
      const skip = (page - 1) * take;

      const filters = params.filters || {};
      const where = search
        ? [
            { name: ILike(`%${search}%`) },
            { description: ILike(`%${search}%`) },
          ]
        : undefined;

      const [data, total] = await this.repo.findAndCount({
        where: where
          ? where.map((entry) => ({
              ...entry,
              ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
              ...(filters.creatorId ? { creatorId: filters.creatorId } : {}),
              ...(filters.isActive !== undefined
                ? { isActive: filters.isActive }
                : {}),
            }))
          : {
              ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
              ...(filters.creatorId ? { creatorId: filters.creatorId } : {}),
              ...(filters.isActive !== undefined
                ? { isActive: filters.isActive }
                : {}),
            },
        order: { [sortBy]: sortOrder },
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
      this.logger.error('Failed to list clubs', (error as Error).stack);
      throw new InternalServerErrorException('Failed to list clubs');
    }
  }

  async findOne(id: string): Promise<Club> {
    try {
      const club = await this.repo.findOne({ where: { id } });
      if (!club) throw new NotFoundException(`Club #${id} not found`);
      return club;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to fetch club #${id}`, (error as Error).stack);
      throw new InternalServerErrorException('Failed to fetch club');
    }
  }

  async update(id: string, dto: UpdateClubDto): Promise<Club> {
    try {
      const club = await this.repo.preload({
        id,
        ...(dto as any),
      });
      if (!club) throw new NotFoundException(`Club #${id} not found`);

      // handle unique name conflict (use a typed local to satisfy TS)
      const newName = (dto as Partial<CreateClubDto>).name;
      if (typeof newName === 'string' && newName.trim().length > 0) {
        const existing = await this.repo.findOne({
          where: { name: ILike(newName.trim()) },
        });
        if (existing && existing.id !== id)
          throw new ConflictException('Club with this name already exists');
        club.name = newName.trim();
      }

      if (dto.categoryId) {
        const category = await this.categoryRepo.findOne({
          where: { id: dto.categoryId, isActive: true },
        });
        if (!category)
          throw new BadRequestException('Category not found or inactive');
      }

      if (dto.creatorId) {
        await this.ensureCreatorIfUsersTableExists(dto.creatorId);
      }

      return await this.repo.save(club);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to update club #${id}`, (error as Error).stack);
      throw new InternalServerErrorException('Failed to update club');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const club = await this.repo.findOne({ where: { id } });
      if (!club) throw new NotFoundException(`Club #${id} not found`);

      if (club.isActive) {
        club.isActive = false;
        await this.repo.save(club);
      }
      return;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to remove club #${id}`, (error as Error).stack);
      throw new InternalServerErrorException('Failed to remove club');
    }
  }

  private async ensureCreatorIfUsersTableExists(
    creatorId: string,
  ): Promise<void> {
    const hasUsersTable = await this.checkUsersTableExists();
    if (!hasUsersTable) {
      this.logger.warn(
        'Skipping creator validation because "users" table does not exist',
      );
      return;
    }

    try {
      const creator = await this.userRepo.findOne({
        where: { id: creatorId, isActive: true },
      });
      if (!creator)
        throw new BadRequestException('Creator not found or inactive');
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        String((error as any)?.message || '')
          .toLowerCase()
          .includes('relation "users" does not exist')
      ) {
        this.logger.warn(
          'Skipping creator validation because "users" table does not exist',
        );
        this.usersTablePresenceChecked = true;
        this.usersTableExists = false;
        return;
      }
      throw error;
    }
  }

  private async checkUsersTableExists(): Promise<boolean> {
    if (this.usersTablePresenceChecked) {
      return this.usersTableExists;
    }

    const result = (await this.repo.query(
      `SELECT to_regclass('public.users') AS "tableName"`,
    )) as Array<{ tableName: string | null }>;
    this.usersTableExists = Boolean(result?.[0]?.tableName);
    this.usersTablePresenceChecked = true;
    return this.usersTableExists;
  }
}
