import { Inject, Injectable } from '@nestjs/common';
import { PostService } from '../post/post.service';
import { CommentError } from './error';
import { EditCommentDto, CreateCommentDto } from './dto';
import { Comment } from '@prisma/client';
import type { ICommentRepository } from './repository/comment.repository.interface';
import { COMMENT_REPOSITORY } from './repository/comment.repository.interface';

@Injectable()
export class CommentService {
  constructor(
    @Inject(COMMENT_REPOSITORY) private commentRepository: ICommentRepository,
    private postService: PostService,
  ) {}

  async getAllCommentsByPostSlug(slug: string): Promise<Comment[]> {
    return this.commentRepository.findByPostSlug(slug);
  }

  async createComment(
    slug: string,
    dto: CreateCommentDto,
    userId: number,
  ): Promise<Comment> {
    const post = await this.postService.getPostBySlug(slug);

    return this.commentRepository.create({
      content: dto.content,
      authorId: userId,
      postId: post.id,
      parentId: dto.parentId,
    });
  }

  async updateComment(
    id: number,
    userId: number,
    dto: EditCommentDto,
  ): Promise<Comment> {
    const comment = await this.findCommentOrFail(id);
    if (comment.authorId !== userId) throw CommentError.Forbidden();

    return this.commentRepository.update(id, dto.content);
  }

  private async findCommentOrFail(id: number): Promise<Comment> {
    const comment = await this.commentRepository.findById(id);
    if (!comment) throw CommentError.CommentNotFound();
    return comment;
  }

  async deleteComment(id: number, userId: number): Promise<void> {
    const comment = await this.findCommentOrFail(id);
    if (comment.authorId !== userId) throw CommentError.Forbidden();

    await this.commentRepository.delete(id);
  }

  async likeComment(slug: string, id: number, userId: number): Promise<void> {
    await this.postService.getPostBySlug(slug);

    const comment = await this.findCommentOrFail(id);
    await this.commentRepository.like(comment.id, userId);
  }

  async unlikeComment(slug: string, id: number, userId: number): Promise<void> {
    await this.postService.getPostBySlug(slug);

    const comment = await this.findCommentOrFail(id);
    await this.commentRepository.unlike(comment.id, userId);
  }
}
