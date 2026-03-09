import { Injectable } from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ICategoryRepository,
  CreateCategoryData,
  UpdateCategoryData,
} from '../../category/repository/category.repository.interface';

@Injectable()
export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private prisma: PrismaService) {}

  findMany(): Promise<Category[]> {
    return this.prisma.category.findMany();
  }

  findBySlug(slug: string): Promise<Category | null> {
    return this.prisma.category.findUnique({ where: { slug } });
  }

  findById(id: number): Promise<Category | null> {
    return this.prisma.category.findUnique({ where: { id } });
  }

  create(data: CreateCategoryData): Promise<Category> {
    return this.prisma.category.create({ data });
  }

  update(slug: string, data: UpdateCategoryData): Promise<Category> {
    return this.prisma.category.update({ where: { slug }, data });
  }

  async delete(slug: string): Promise<void> {
    await this.prisma.category.delete({ where: { slug } });
  }
}
