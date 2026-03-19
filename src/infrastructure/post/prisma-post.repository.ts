import { Injectable } from '@nestjs/common';
import { Post, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  IPostRepository,
  CreatePostData,
  UpdatePostData,
} from '../../post/repository/post.repository.interface';
import { FilterPostDto } from 'src/post/dto/filter-post.dto';

type FilterBuilder = (value: NonNullable<unknown>) => Prisma.PostWhereInput;

const POST_FILTER_BUILDERS: Partial<
  Record<keyof FilterPostDto, FilterBuilder>
> = {
  title: (value) => ({ title: { contains: value as string } }),
  slug: (value) => ({ slug: { contains: value as string } }),
  excerpt: (value) => ({ excerpt: { contains: value as string } }),
  categoryId: (value) => ({ categoryId: value as number }),
  tagIds: (value) => ({ tags: { some: { id: { in: value as number[] } } } }),
};

@Injectable()
export class PrismaPostRepository implements IPostRepository {
  constructor(private prisma: PrismaService) {}

  findPublished(filterDto: FilterPostDto): Promise<Post[]> {
    const whereClause = this.buildWhereClause(filterDto);

    return this.prisma.post.findMany({ where: whereClause });
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

  private buildWhereClause(filterDto: FilterPostDto): Prisma.PostWhereInput {
    return (
      Object.entries(filterDto) as [keyof FilterPostDto, unknown][]
    ).reduce(
      (where, [key, value]) => {
        if (value === undefined || value === null) return where;
        if (Array.isArray(value) && value.length === 0) return where;

        const builder = POST_FILTER_BUILDERS[key];
        return builder
          ? { ...where, ...builder(value as NonNullable<unknown>) }
          : where;
      },
      { published: true } as Prisma.PostWhereInput,
    );
  }
}
