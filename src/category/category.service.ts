import { Inject, Injectable } from '@nestjs/common';
import { Category } from '@prisma/client';
import { CategoryError } from './error/category.error';
import { CategoryDto, EditCategoryDto } from './dto';
import type { ICategoryRepository } from './repository/category.repository.interface';
import { CATEGORY_REPOSITORY } from './repository/category.repository.interface';

@Injectable()
export class CategoryService {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private categoryRepository: ICategoryRepository,
  ) {}

  async getAllCategories(): Promise<Category[]> {
    return this.categoryRepository.findMany();
  }

  async getCategoryBySlug(slug: string): Promise<Category> {
    return this.findCategoryOrFail(slug);
  }

  async createCategory(dto: CategoryDto): Promise<Category> {
    await this.validateUniqueSlug(dto.slug);
    return this.categoryRepository.create(dto);
  }

  async updateCategory(slug: string, dto: EditCategoryDto): Promise<Category> {
    await this.findCategoryOrFail(slug);
    return this.categoryRepository.update(slug, dto);
  }

  async deleteCategory(slug: string): Promise<void> {
    await this.findCategoryOrFail(slug);
    await this.categoryRepository.delete(slug);
  }

  async getCategoryByIdOrFail(id: number): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw CategoryError.CategoryNotFound();
    return category;
  }

  private async findCategoryOrFail(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findBySlug(slug);
    if (!category) throw CategoryError.CategoryNotFound();
    return category;
  }

  private async validateUniqueSlug(slug: string): Promise<void> {
    const category = await this.categoryRepository.findBySlug(slug);
    if (category) throw CategoryError.SlugAlreadyExists();
  }
}
