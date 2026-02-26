import { Injectable } from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CategoryError } from './error/category.error';
import { CategoryDto } from './dto';
import { EditCategoryDto } from './dto/edit-category.dto';

@Injectable()
export class CategoryService {
  constructor(private prismaService: PrismaService) {}
  async getAllCategories(): Promise<Category[]> {
    const categories = await this.prismaService.category.findMany();
    return categories;
  }

  async getCategoryBySlug(slug: string): Promise<Category> {
    const category = await this.prismaService.category.findUnique({
      where: {
        slug,
      },
    });

    if (!category) {
      throw CategoryError.CategoryNotFound();
    }

    return category;
  }

  async createCategory(dto: CategoryDto): Promise<Category> {
    const category = await this.prismaService.category.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
      },
    });

    return category;
  }

  async updateCategory(slug: string, dto: EditCategoryDto): Promise<Category> {
    const category = await this.prismaService.category.update({
      where: {
        slug,
      },
      data: {
        ...dto,
      },
    });

    return category;
  }

  async deleteCategory(slug: string): Promise<void> {
    const deletedCategory = await this.prismaService.category.delete({
      where: {
        slug,
      },
    });

    if (!deletedCategory) {
      throw CategoryError.CategoryNotFound();
    }
  }
}
