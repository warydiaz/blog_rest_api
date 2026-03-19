import { Post } from '@prisma/client';
import { FilterPostDto } from '../dto/filter-post.dto';

export const POST_REPOSITORY = 'IPostRepository';

export interface CreatePostData {
  title: string;
  content: string;
  slug: string;
  categoryId: number;
  authorId: number;
  coverImageUrl?: string;
  published?: boolean;
  tagIds?: number[];
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  slug?: string;
  categoryId?: number;
  coverImageUrl?: string;
  published?: boolean;
  tagIds?: number[];
}

export interface IPostRepository {
  findPublished(filterDto: FilterPostDto): Promise<Post[]>;
  findBySlug(slug: string): Promise<Post | null>;
  findByTagId(tagId: number): Promise<Post[]>;
  create(data: CreatePostData): Promise<Post>;
  update(slug: string, data: UpdatePostData): Promise<Post>;
  delete(slug: string): Promise<void>;
}
