import { Category } from '@prisma/client';

export const CATEGORY_REPOSITORY = 'ICategoryRepository';

export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string;
}

export interface ICategoryRepository {
  findMany(): Promise<Category[]>;
  findBySlug(slug: string): Promise<Category | null>;
  findById(id: number): Promise<Category | null>;
  create(data: CreateCategoryData): Promise<Category>;
  update(slug: string, data: UpdateCategoryData): Promise<Category>;
  delete(slug: string): Promise<void>;
}
