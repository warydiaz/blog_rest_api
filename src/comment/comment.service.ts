import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PostService } from '../post/post.service';
import { CommentError } from './error';
import { EditCommentDto, CreateCommentDto } from './dto';
import { Comment } from '@prisma/client';
import { PostError } from '../post/error';

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

  async likeComment(slug: string, id: number, userId: number): Promise<void> {
    const post = await this.prismaService.post.findUnique({ where: { slug } });
    if (!post) throw PostError.PostNotFound();

    const comment = await this.findCommentOrFail(id);
    await this.prismaService.comment.update({
      where: { id: comment.id },
      data: { likedBy: { connect: { id: userId } } },
    });
  }

  async unlikeComment(slug: string, id: number, userId: number): Promise<void> {
    const comment = await this.findCommentOrFail(id);
    await this.prismaService.comment.update({
      where: { id: comment.id },
      data: { likedBy: { disconnect: { id: userId } } },
    });
  }
}
