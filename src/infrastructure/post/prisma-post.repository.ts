import { Injectable } from '@nestjs/common';
import { Post } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  IPostRepository,
  CreatePostData,
  UpdatePostData,
} from '../../post/repository/post.repository.interface';

@Injectable()
export class PrismaPostRepository implements IPostRepository {
  constructor(private prisma: PrismaService) {}

  findPublished(): Promise<Post[]> {
    return this.prisma.post.findMany({ where: { published: true } });
  }

  findBySlug(slug: string): Promise<Post | null> {
    return this.prisma.post.findUnique({ where: { slug } });
  }

  findByTagId(tagId: number): Promise<Post[]> {
    return this.prisma.post.findMany({
      where: { tags: { some: { id: tagId } }, published: true },
    });
  }

  create({ tagIds, ...data }: CreatePostData): Promise<Post> {
    return this.prisma.post.create({
      data: {
        ...data,
        tags: tagIds?.length
          ? { connect: tagIds.map((id) => ({ id })) }
          : undefined,
      },
    });
  }

  update(slug: string, { tagIds, ...data }: UpdatePostData): Promise<Post> {
    return this.prisma.post.update({
      where: { slug },
      data: {
        ...data,
        tags:
          tagIds !== undefined
            ? { set: tagIds.map((id) => ({ id })) }
            : undefined,
      },
    });
  }

  async delete(slug: string): Promise<void> {
    await this.prisma.post.delete({ where: { slug } });
  }
}
