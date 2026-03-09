import { Injectable } from '@nestjs/common';
import { Comment } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ICommentRepository,
  CreateCommentData,
} from '../../comment/repository/comment.repository.interface';

@Injectable()
export class PrismaCommentRepository implements ICommentRepository {
  constructor(private prisma: PrismaService) {}

  findByPostSlug(slug: string): Promise<Comment[]> {
    return this.prisma.comment.findMany({ where: { post: { slug } } });
  }

  findById(id: number): Promise<Comment | null> {
    return this.prisma.comment.findUnique({ where: { id } });
  }

  create(data: CreateCommentData): Promise<Comment> {
    return this.prisma.comment.create({ data });
  }

  update(id: number, content: string): Promise<Comment> {
    return this.prisma.comment.update({ where: { id }, data: { content } });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.comment.delete({ where: { id } });
  }

  async like(id: number, userId: number): Promise<void> {
    await this.prisma.comment.update({
      where: { id },
      data: { likedBy: { connect: { id: userId } } },
    });
  }

  async unlike(id: number, userId: number): Promise<void> {
    await this.prisma.comment.update({
      where: { id },
      data: { likedBy: { disconnect: { id: userId } } },
    });
  }
}
