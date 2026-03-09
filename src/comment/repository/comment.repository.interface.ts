import { Comment } from '@prisma/client';

export const COMMENT_REPOSITORY = 'ICommentRepository';

export interface CreateCommentData {
  content: string;
  authorId: number;
  postId: number;
  parentId?: number;
}

export interface ICommentRepository {
  findByPostSlug(slug: string): Promise<Comment[]>;
  findById(id: number): Promise<Comment | null>;
  create(data: CreateCommentData): Promise<Comment>;
  update(id: number, content: string): Promise<Comment>;
  delete(id: number): Promise<void>;
  like(id: number, userId: number): Promise<void>;
  unlike(id: number, userId: number): Promise<void>;
}
