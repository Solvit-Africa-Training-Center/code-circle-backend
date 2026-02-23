/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Club } from './entities/club.entity';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { PaginationParams } from '../../common/decorators/api-properties';
import { CategoriesService } from '../categories/categories.service';
import {
  Membership,
  MembershipRole,
  MembershipStatus,
} from '../users/entities/membership.entity';
import { Course } from '../course/entities/course.entity';

@Injectable()
export class ClubsService {
  private readonly logger = new Logger(ClubsService.name);

  constructor(
    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    private readonly categoriesService: CategoriesService,
  ) {}

  /**
   * Créer un nouveau club
   */
  async create(createClubDto: CreateClubDto): Promise<Club> {
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

      // TODO: Vérifier que le creatorId existe (quand le module User sera prêt)
      // const user = await this.usersService.findOne(createClubDto.creatorId);

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

  /**
   * Get club member and course counts
   */
  async getClubStats(id: string): Promise<{
    clubId: string;
    memberCount: number;
    courseCount: number;
  }> {
    try {
      await this.findOne(id);
      await this.ensureMembershipsTable();

      const hasCoursesTable = await this.tableExists('courses');

      const memberCount = await this.membershipRepository.count({
        where: { clubId: id, status: MembershipStatus.ACTIVE },
      });

      const courseCount = hasCoursesTable
        ? await this.courseRepository.count({
            where: { clubId: id },
          })
        : 0;

      if (!hasCoursesTable) {
        this.logger.warn(
          'Table "courses" does not exist. Returning courseCount = 0.',
        );
      }

      return {
        clubId: id,
        memberCount,
        courseCount,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching club stats for ID ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while retrieving club stats',
      );
    }
  }

  /**
   * Get all active members for a club
   */
  async getClubMembers(id: string): Promise<Membership[]> {
    try {
      await this.findOne(id);
      await this.ensureMembershipsTable();

      return await this.membershipRepository.find({
        where: { clubId: id, status: MembershipStatus.ACTIVE },
        relations: ['user'],
        order: { joinedAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(
        `Error fetching club members for ID ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while retrieving club members',
      );
    }
  }

  /**
   * Get all courses in a club
   */
  async getClubCourses(id: string): Promise<Course[]> {
    try {
      await this.findOne(id);

      const hasCoursesTable = await this.tableExists('courses');
      if (!hasCoursesTable) {
        this.logger.warn(
          'Table "courses" does not exist. Returning empty courses list.',
        );
        return [];
      }

      return await this.courseRepository.find({
        where: { clubId: id },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(
        `Error fetching club courses for ID ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while retrieving club courses',
      );
    }
  }

  private async tableExists(tableName: string): Promise<boolean> {
    const result = await this.clubRepository.query(
      'SELECT to_regclass($1) AS table_name',
      [`public.${tableName}`],
    );

    return Boolean(result?.[0]?.table_name);
  }

  private async ensureMembershipsTable(): Promise<void> {
    const hasMembershipsTable = await this.tableExists('memberships');
    if (hasMembershipsTable) {
      return;
    }

    this.logger.warn(
      'Table "memberships" not found. Creating it automatically.',
    );

    await this.clubRepository.query(`
      CREATE TABLE IF NOT EXISTS memberships (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "clubId" uuid NOT NULL,
        role varchar(20) NOT NULL DEFAULT 'MEMBER',
        status varchar(20) NOT NULL DEFAULT 'pending',
        joined_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_memberships_user_club" UNIQUE ("userId", "clubId"),
        CONSTRAINT "FK_memberships_user" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT "FK_memberships_club" FOREIGN KEY ("clubId") REFERENCES clubs(id) ON DELETE CASCADE
      );
    `);

    await this.clubRepository.query(`
      CREATE INDEX IF NOT EXISTS "IDX_memberships_clubId_status"
      ON memberships ("clubId", status);
    `);
  }

  async joinClub(
    clubId: string,
    userId: string,
  ): Promise<{ message: string; membership: Membership }> {
    try {
      const club = await this.findOne(clubId);

      if (!club.isActive) {
        throw new BadRequestException('Cannot join an inactive club');
      }

      await this.ensureMembershipsTable();

      const existingMembership = await this.membershipRepository.findOne({
        where: { clubId, userId },
      });

      if (existingMembership?.status === MembershipStatus.ACTIVE) {
        throw new ConflictException('You are already an active member of this club');
      }

      const role =
        club.creatorId === userId ? MembershipRole.CREATOR : MembershipRole.MEMBER;

      if (existingMembership) {
        existingMembership.status = MembershipStatus.ACTIVE;
        existingMembership.role = role;
        const membership = await this.membershipRepository.save(existingMembership);

        return {
          message: `You have re-joined "${club.name}" successfully`,
          membership,
        };
      }

      const membership = this.membershipRepository.create({
        clubId,
        userId,
        role,
        status: MembershipStatus.ACTIVE,
      });

      const savedMembership = await this.membershipRepository.save(membership);

      return {
        message: `You joined "${club.name}" successfully`,
        membership: savedMembership,
      };
    } catch (error) {
      this.logger.error(
        `Error joining club with ID ${clubId}: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while joining the club',
      );
    }
  }

  async leaveClub(clubId: string, userId: string): Promise<{ message: string }> {
    try {
      const club = await this.findOne(clubId);

      await this.ensureMembershipsTable();

      const membership = await this.membershipRepository.findOne({
        where: { clubId, userId, status: MembershipStatus.ACTIVE },
      });

      if (!membership) {
        throw new BadRequestException('You are not an active member of this club');
      }

      if (club.creatorId === userId || membership.role === MembershipRole.CREATOR) {
        throw new BadRequestException(
          'Club creator cannot leave the club. Transfer ownership first.',
        );
      }

      await this.membershipRepository.remove(membership);

      return { message: `You left "${club.name}" successfully` };
    } catch (error) {
      this.logger.error(
        `Error leaving club with ID ${clubId}: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while leaving the club',
      );
    }
  }
}
