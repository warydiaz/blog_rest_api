import { Tag } from '@prisma/client';

export const TAG_REPOSITORY = 'ITagRepository';

export interface CreateTagData {
  name: string;
  slug: string;
}

export interface ITagRepository {
  findMany(): Promise<Tag[]>;
  findBySlug(slug: string): Promise<Tag | null>;
  findByName(name: string): Promise<Tag | null>;
  create(data: CreateTagData): Promise<Tag>;
  delete(id: number): Promise<void>;
}
