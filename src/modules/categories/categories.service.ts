/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';
import { PaginationParams } from '@circle-backend/common/decorators/api-properties';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  // Create new categorie

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    try {
      const existingByName = await this.categoryRepository.findOne({
        where: { name: createCategoryDto.name },
      });
      if (existingByName) {
        throw new ConflictException(
          `Category with name "${createCategoryDto.name}" already exists`,
        );
      }

      const category = this.categoryRepository.create({
        ...createCategoryDto,
      });
      const savedCategory = await this.categoryRepository.save(category);
      this.logger.log(
        `Category created: ${savedCategory.id} - ${savedCategory.name}`,
      );
      return savedCategory;
    } catch (error) {
      this.logger.error(
        `Error creating category: ${error.message}`,

        error.stack,
      );
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      // Sinon, on lance une InternalServerErrorException
      throw new InternalServerErrorException(
        'An error occurred while creating the category',
      );
    }
  }

  /**
   * Récupérer toutes les catégories avec pagination
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

      const queryBuilder =
        this.categoryRepository.createQueryBuilder('category');

      // Appliquer les filtres de recherche
      if (search) {
        queryBuilder.where(
          '(category.name ILIKE :search OR category.description ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      // Appliquer les filtres personnalisés
      if (filters?.isActive !== undefined) {
        queryBuilder.andWhere('category.isActive = :isActive', {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          isActive: filters.isActive,
        });
      }

      // Compter le total avant pagination
      const total = await queryBuilder.getCount();

      // Appliquer la pagination et le tri
      const categories = await queryBuilder
        .orderBy(`category.${sortBy}`, sortOrder)
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      const totalPages = Math.ceil(total / limit);

      this.logger.log(
        `Retrieved ${categories.length} categories (page ${page}/${totalPages})`,
      );

      return {
        data: categories,
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
      this.logger.error(
        `Error fetching categories: ${error.message}`,
        error.stack,
      );

      throw new InternalServerErrorException(
        'An error occurred while retrieving categories',
      );
    }
  }

  /* Récupérer toutes les catégories actives (sans pagination)
   */
  async findAllActive(): Promise<Category[]> {
    try {
      const categories = await this.categoryRepository.find({
        where: { isActive: true },
        order: { name: 'ASC' },
      });

      this.logger.log(`Retrieved ${categories.length} active categories`);

      return categories;
    } catch (error) {
      this.logger.error(
        `Error fetching active categories: ${error.message}`,
        error.stack,
      );

      throw new InternalServerErrorException(
        'An error occurred while retrieving active categories',
      );
    }
  }

  /**
   * Récupérer une catégorie par ID
   */
  async findOne(id: string): Promise<Category> {
    try {
      const category = await this.categoryRepository.findOne({
        where: { id },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID "${id}" not found`);
      }

      this.logger.log(`Category found: ${category.id} - ${category.name}`);

      return category;
    } catch (error) {
      this.logger.error(
        `Error fetching category with ID ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while retrieving the category',
      );
    }
  }

  /**
   * Mettre à jour une catégorie
   */
  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    try {
      const category = await this.findOne(id);

      Object.assign(category, updateCategoryDto);

      const updatedCategory = await this.categoryRepository.save(category);

      this.logger.log(
        `Category updated: ${updatedCategory.id} - ${updatedCategory.name}`,
      );

      return updatedCategory;
    } catch (error) {
      this.logger.error(
        `Error updating category with ID ${id}: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while updating the category',
      );
    }
  }

  /**
   * Soft delete (désactiver) une catégorie
   */
  async remove(id: string): Promise<{ message: string }> {
    try {
      const category = await this.findOne(id);

      // TODO: Vérifier si des clubs utilisent cette catégorie
      // const clubsCount = await this.clubRepository.count({ where: { categoryId: id } });
      // if (clubsCount > 0) {
      //   throw new BadRequestException(
      //     `Cannot delete category with ${clubsCount} active clubs. Please reassign or delete clubs first.`,
      //   );
      // }

      category.isActive = false;
      await this.categoryRepository.save(category);

      this.logger.log(
        `Category deactivated: ${category.id} - ${category.name}`,
      );

      return { message: `Category "${category.name}" has been deactivated` };
    } catch (error) {
      this.logger.error(
        `Error deactivating category with ID ${id}: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while deactivating the category',
      );
    }
  }

  /**
   * Hard delete (supprimer définitivement)
   */
  async hardDelete(id: string): Promise<{ message: string }> {
    try {
      const category = await this.findOne(id);

      // TODO: Vérifier si des clubs utilisent cette catégorie
      // const clubsCount = await this.clubRepository.count({ where: { categoryId: id } });
      // if (clubsCount > 0) {
      //   throw new BadRequestException(
      //     `Cannot delete category with ${clubsCount} clubs`,
      //   );
      // }

      const categoryName = category.name;
      await this.categoryRepository.remove(category);

      this.logger.warn(`Category permanently deleted: ${id} - ${categoryName}`);

      return {
        message: `Category "${categoryName}" has been permanently deleted`,
      };
    } catch (error) {
      this.logger.error(
        `Error deleting category with ID ${id}: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while deleting the category',
      );
    }
  }

  /**
   * Générer un slug depuis un nom
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD') // Normaliser pour séparer les accents
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9]+/g, '-') // Remplacer espaces et caractères spéciaux par des tirets
      .replace(/^-+|-+$/g, ''); // Enlever les tirets au début et à la fin
  }
}
