import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PostService } from '../post/post.service';
import { CommentError } from './error';
import { EditCommentDto, CreateCommentDto } from './dto';
import { Comment } from '@prisma/client';

@Injectable()
export class CommentService {
  constructor(
    private prismaService: PrismaService,
    private postService: PostService,
  ) {}

  async getAllCommentsByPostSlug(slug: string): Promise<Comment[]> {
    return await this.prismaService.comment.findMany({
      where: { post: { slug } },
    });
  }

  async createComment(
    slug: string,
    dto: CreateCommentDto,
    userId: number,
  ): Promise<Comment> {
    const post = await this.postService.getPostBySlug(slug);

    return await this.prismaService.comment.create({
      data: {
        content: dto.content,
        authorId: userId,
        postId: post.id,
        parentId: dto.parentId,
      },
    });
  }

  async updateComment(
    id: number,
    userId: number,
    dto: EditCommentDto,
  ): Promise<Comment> {
    const comment = await this.findCommentOrFail(id);
    if (comment.authorId !== userId) throw CommentError.Forbidden();

    return await this.prismaService.comment.update({
      where: { id: id },
      data: { content: dto.content },
    });
  }

  private async findCommentOrFail(id: number): Promise<Comment> {
    const comment = await this.prismaService.comment.findUnique({
      where: { id: id },
    });
    if (!comment) throw CommentError.CommentNotFound();
    return comment;
  }

  async deleteComment(id: number, userId: number): Promise<void> {
    const comment = await this.findCommentOrFail(id);
    if (comment.authorId !== userId) throw CommentError.Forbidden();

    await this.prismaService.comment.delete({ where: { id } });
  }
}
