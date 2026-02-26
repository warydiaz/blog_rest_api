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
    return this.findCategoryOrFail(slug);
  }

  async createCategory(dto: CategoryDto): Promise<Category> {
    return this.prismaService.category.create({ data: { ...dto } });
  }

  async updateCategory(slug: string, dto: EditCategoryDto): Promise<Category> {
    await this.findCategoryOrFail(slug);

    return this.prismaService.category.update({
      where: { slug },
      data: { ...dto },
    });
  }

  async deleteCategory(slug: string): Promise<void> {
    await this.findCategoryOrFail(slug);

    await this.prismaService.category.delete({
      where: { slug },
    });
  }

  private async findCategoryOrFail(slug: string): Promise<Category> {
    const category = await this.prismaService.category.findUnique({
      where: { slug },
    });
    if (!category) throw CategoryError.CategoryNotFound();
    return category;
  }
}
