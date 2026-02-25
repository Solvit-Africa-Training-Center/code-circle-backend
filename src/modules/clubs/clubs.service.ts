/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Club } from './entities/club.entity';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { PaginationParams } from '../../common/decorators/api-properties';
import { CategoriesService } from '../categories/categories.service';
import { TestAttempt } from '../tests/entities/test-attempt.entity';
import { TestPurpose, TestType } from '../tests/enums/test-type.enum';
import { Membership, MembershipStatus } from '../users/entities/membership.entity';
import { Course } from '../course/entities/course.entity';
import { Project } from '../project/entities/project.entity';

@Injectable()
export class ClubsService {
  private readonly logger = new Logger(ClubsService.name);

  constructor(
    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,
    @InjectRepository(TestAttempt)
    private readonly testAttemptRepository: Repository<TestAttempt>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly categoriesService: CategoriesService,
  ) {}

  /**
   * Créer un nouveau club
   */
  async create(
    createClubDto: CreateClubDto & { creatorId: string },
  ): Promise<Club> {
    try {
      // Vérifier que la catégorie existe et est active
      const category = await this.categoriesService.findOne(
        createClubDto.categoryId,
      );

      if (!category.isActive) {
        throw new BadRequestException(
          `Cannot create club in inactive category "${category.name}"`,
        );
      }

      const latestApprovedAttempt = await this.testAttemptRepository
        .createQueryBuilder('attempt')
        .leftJoinAndSelect('attempt.test', 'test')
        .where('attempt.userId = :creatorId', {
          creatorId: createClubDto.creatorId,
        })
        .andWhere('attempt.purpose = :purpose', {
          purpose: TestPurpose.CREATE_CLUB,
        })
        .andWhere('attempt.passed = :passed', { passed: true })
        .andWhere('attempt.intendedCategoryId = :categoryId', {
          categoryId: createClubDto.categoryId,
        })
        .andWhere('test.type = :testType', {
          testType: TestType.CREATOR_TEST,
        })
        .orderBy('attempt.attemptedAt', 'DESC')
        .getOne();

      if (!latestApprovedAttempt) {
        throw new ForbiddenException(
          'You must pass the leader application test for this category before creating a club',
        );
      }

      // Vérifier qu'un club avec ce nom n'existe pas déjà dans cette catégorie
      const existingClub = await this.clubRepository.findOne({
        where: {
          name: createClubDto.name,
          categoryId: createClubDto.categoryId,
        },
      });

      if (existingClub) {
        throw new ConflictException(
          `A club named "${createClubDto.name}" already exists in this category`,
        );
      }

      const club = this.clubRepository.create(createClubDto);
      const savedClub = await this.clubRepository.save(club);

      this.logger.log(
        `Club created: ${savedClub.id} - ${savedClub.name} by user ${savedClub.creatorId}`,
      );

      return await this.findOne(savedClub.id);
    } catch (error) {
      this.logger.error(`Error creating club: ${error.message}`, error.stack);

      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while creating the club',
      );
    }
  }

  /**
   * Récupérer tous les clubs avec pagination
   */
  async findAll(paginationParams: PaginationParams) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        search,
        filters,
      } = paginationParams;

      const queryBuilder = this.clubRepository
        .createQueryBuilder('club')
        .leftJoinAndSelect('club.category', 'category');

      // Filtres de recherche
      if (search) {
        queryBuilder.where(
          '(club.name ILIKE :search OR club.description ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      // Filtres personnalisés
      if (filters?.categoryId) {
        queryBuilder.andWhere('club.categoryId = :categoryId', {
          categoryId: filters.categoryId,
        });
      }

      if (filters?.creatorId) {
        queryBuilder.andWhere('club.creatorId = :creatorId', {
          creatorId: filters.creatorId,
        });
      }

      if (filters?.isActive !== undefined) {
        queryBuilder.andWhere('club.isActive = :isActive', {
          isActive: filters.isActive,
        });
      }

      // Compter le total
      const total = await queryBuilder.getCount();

      // Pagination et tri
      const clubs = await queryBuilder
        .orderBy(`club.${sortBy}`, sortOrder)
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      const totalPages = Math.ceil(total / limit);

      this.logger.log(
        `Retrieved ${clubs.length} clubs (page ${page}/${totalPages})`,
      );

      return {
        data: clubs,
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching clubs: ${error.message}`, error.stack);

      throw new InternalServerErrorException(
        'An error occurred while retrieving clubs',
      );
    }
  }

  /**
   * Récupérer tous les clubs actifs (sans pagination)
   */
  async findAllActive(): Promise<Club[]> {
    try {
      const clubs = await this.clubRepository.find({
        where: { isActive: true },
        relations: ['category'],
        order: { name: 'ASC' },
      });

      if (!clubs.length) {
        this.logger.log('Retrieved 0 active clubs');
        return clubs;
      }

      const clubIds = clubs.map((club) => club.id);

      const memberCounts = await this.membershipRepository
        .createQueryBuilder('membership')
        .select('membership.clubId', 'clubId')
        .addSelect('COUNT(DISTINCT membership.userId)', 'count')
        .where('membership.clubId IN (:...clubIds)', { clubIds })
        .andWhere('membership.status IN (:...memberStatuses)', {
          memberStatuses: [MembershipStatus.ACTIVE, MembershipStatus.PENDING],
        })
        .groupBy('membership.clubId')
        .getRawMany<{ clubId: string; count: string }>();

      const projectCounts = await this.projectRepository
        .createQueryBuilder('project')
        .innerJoin(Course, 'course', 'project.courseId = course.id')
        .select('course.clubId', 'clubId')
        .addSelect('COUNT(*)', 'count')
        .where('course.clubId IN (:...clubIds)', { clubIds })
        .groupBy('course.clubId')
        .getRawMany<{ clubId: string; count: string }>();

      const membersByClubId = new Map(
        memberCounts.map((row) => [row.clubId, Number(row.count)]),
      );
      const projectsByClubId = new Map(
        projectCounts.map((row) => [row.clubId, Number(row.count)]),
      );

      clubs.forEach((club) => {
        (club as Club & { membersCount?: number; projectsCount?: number }).membersCount =
          membersByClubId.get(club.id) ?? 0;
        (club as Club & { membersCount?: number; projectsCount?: number }).projectsCount =
          projectsByClubId.get(club.id) ?? 0;
      });

      this.logger.log(`Retrieved ${clubs.length} active clubs`);

      return clubs;
    } catch (error) {
      this.logger.error(
        `Error fetching active clubs: ${error.message}`,
        error.stack,
      );

      throw new InternalServerErrorException(
        'An error occurred while retrieving active clubs',
      );
    }
  }

  /**
   * Récupérer les clubs par catégorie
   */
  async findByCategory(categoryId: string): Promise<Club[]> {
    try {
      // Vérifier que la catégorie existe
      await this.categoriesService.findOne(categoryId);

      const clubs = await this.clubRepository.find({
        where: {
          categoryId,
          isActive: true,
        },
        relations: ['category'],
        order: { name: 'ASC' },
      });

      this.logger.log(
        `Retrieved ${clubs.length} clubs for category ${categoryId}`,
      );

      return clubs;
    } catch (error) {
      this.logger.error(
        `Error fetching clubs by category: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while retrieving clubs by category',
      );
    }
  }

  /**
   * Récupérer les clubs créés par un utilisateur
   */
  async findByCreator(creatorId: string): Promise<Club[]> {
    try {
      // TODO: Vérifier que l'utilisateur existe (quand le module User sera prêt)
      // await this.usersService.findOne(creatorId);

      const clubs = await this.clubRepository.find({
        where: { creatorId },
        relations: ['category'],
        order: { createdAt: 'DESC' },
      });

      this.logger.log(
        `Retrieved ${clubs.length} clubs created by user ${creatorId}`,
      );

      return clubs;
    } catch (error) {
      this.logger.error(
        `Error fetching clubs by creator: ${error.message}`,
        error.stack,
      );

      throw new InternalServerErrorException(
        'An error occurred while retrieving clubs by creator',
      );
    }
  }

  /**
   * Trouver un club par nom et catégorie
   */
  async findByNameAndCategory(
    name: string,
    categoryId: string,
  ): Promise<Club | null> {
    try {
      const club = await this.clubRepository.findOne({
        where: {
          name,
          categoryId,
        },
      });

      return club;
    } catch (error) {
      this.logger.error(
        `Error finding club by name and category: ${error.message}`,
        error.stack,
      );

      throw new InternalServerErrorException(
        'An error occurred while searching for the club',
      );
    }
  }

  /**
   * Récupérer un club par ID
   */
  async findOne(id: string): Promise<Club> {
    try {
      const club = await this.clubRepository.findOne({
        where: { id },
        relations: ['category'],
      });

      if (!club) {
        throw new NotFoundException(`Club with ID "${id}" not found`);
      }

      this.logger.log(`Club found: ${club.id} - ${club.name}`);

      return club;
    } catch (error) {
      this.logger.error(
        `Error fetching club with ID ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while retrieving the club',
      );
    }
  }

  /**
   * Mettre à jour un club
   */
  async update(id: string, updateClubDto: UpdateClubDto): Promise<Club> {
    try {
      const club = await this.findOne(id);

      // Si la catégorie change, vérifier qu'elle existe et est active
      if (
        updateClubDto.categoryId &&
        updateClubDto.categoryId !== club.categoryId
      ) {
        const category = await this.categoriesService.findOne(
          updateClubDto.categoryId,
        );

        if (!category.isActive) {
          throw new BadRequestException(
            `Cannot move club to inactive category "${category.name}"`,
          );
        }
      }

      // Si le nom change, vérifier qu'il n'existe pas déjà dans la catégorie
      if (updateClubDto.name && updateClubDto.name !== club.name) {
        const existingClub = await this.clubRepository.findOne({
          where: {
            name: updateClubDto.name,
            categoryId: updateClubDto.categoryId || club.categoryId,
          },
        });

        if (existingClub && existingClub.id !== id) {
          throw new ConflictException(
            `A club named "${updateClubDto.name}" already exists in this category`,
          );
        }
      }

      Object.assign(club, updateClubDto);

      const updatedClub = await this.clubRepository.save(club);

      this.logger.log(`Club updated: ${updatedClub.id} - ${updatedClub.name}`);

      return await this.findOne(updatedClub.id);
    } catch (error) {
      this.logger.error(
        `Error updating club with ID ${id}: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while updating the club',
      );
    }
  }

  /**
   * Soft delete (désactiver) un club
   */
  async remove(id: string): Promise<{ message: string }> {
    try {
      const club = await this.findOne(id);

      // TODO: Vérifier s'il y a des membres actifs
      // const activeMembersCount = await this.membershipsRepository.count({
      //   where: { clubId: id, status: 'active' },
      // });
      //
      // if (activeMembersCount > 0) {
      //   throw new BadRequestException(
      //     `Cannot deactivate club with ${activeMembersCount} active members`,
      //   );
      // }

      club.isActive = false;
      await this.clubRepository.save(club);

      this.logger.log(`Club deactivated: ${club.id} - ${club.name}`);

      return { message: `Club "${club.name}" has been deactivated` };
    } catch (error) {
      this.logger.error(
        `Error deactivating club with ID ${id}: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while deactivating the club',
      );
    }
  }

  /**
   * Hard delete (supprimer définitivement)
   */
  async hardDelete(id: string): Promise<{ message: string }> {
    try {
      const club = await this.findOne(id);

      // TODO: Vérifier s'il y a des membres ou des tests associés
      // const membersCount = await this.membershipsRepository.count({
      //   where: { clubId: id },
      // });
      //
      // if (membersCount > 0) {
      //   throw new BadRequestException(
      //     `Cannot delete club with ${membersCount} members. Please remove members first.`,
      //   );
      // }

      const clubName = club.name;
      await this.clubRepository.remove(club);

      this.logger.warn(`Club permanently deleted: ${id} - ${clubName}`);

      return {
        message: `Club "${clubName}" has been permanently deleted`,
      };
    } catch (error) {
      this.logger.error(
        `Error deleting club with ID ${id}: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while deleting the club',
      );
    }
  }
}
