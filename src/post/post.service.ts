import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Post, Role } from '@prisma/client';
import { CreatePostDto, EditPostDto, EditCoverDto } from './dto';
import { PostError } from './error/post.error';
import { CategoryService } from '../category/category.service';

@Injectable()
export class PostService {
  constructor(
    private prismaService: PrismaService,
    private categoryService: CategoryService,
  ) {}

  async getAllPosts(): Promise<Post[]> {
    const posts = await this.prismaService.post.findMany({
      where: { published: true },
    });

    return posts;
  }

  async getPostBySlug(slug: string): Promise<Post> {
    return this.findPostOrFail(slug);
  }

  async createPost(userId: number, dto: CreatePostDto): Promise<Post> {
    await this.validateCreateConstraints(dto);

    const { tagIds, ...postData } = dto;

    return this.prismaService.post.create({
      data: {
        ...postData,
        authorId: userId,
        tags: tagIds?.length
          ? { connect: tagIds.map((id) => ({ id })) }
          : undefined,
      },
    });
  }

  async updatePost(
    userId: number,
    slug: string,
    dto: EditPostDto,
    role: Role,
  ): Promise<Post> {
    const post = await this.findPostOrFail(slug);
    this.validateOwnership(post, userId, role);
    await this.validateUpdateConstraints(dto);

    const { tagIds, ...postData } = dto;

    return this.prismaService.post.update({
      where: { slug },
      data: {
        ...postData,
        tags:
          tagIds !== undefined
            ? { set: tagIds.map((id) => ({ id })) }
            : undefined,
      },
    });
  }

  async deletePost(userId: number, slug: string, role: Role): Promise<void> {
    const post = await this.findPostOrFail(slug);
    this.validateOwnership(post, userId, role);

    await this.prismaService.post.delete({ where: { slug } });
  }

  async publishPost(userId: number, slug: string, role: Role): Promise<Post> {
    const post = await this.findPostOrFail(slug);
    this.validateOwnership(post, userId, role);

    return this.prismaService.post.update({
      where: { slug },
      data: { published: true },
    });
  }

  async unpublishPost(userId: number, slug: string, role: Role): Promise<Post> {
    const post = await this.findPostOrFail(slug);
    this.validateOwnership(post, userId, role);

    return this.prismaService.post.update({
      where: { slug },
      data: { published: false },
    });
  }

  async updateCover(
    userId: number,
    slug: string,
    role: Role,
    dto: EditCoverDto,
  ): Promise<Post> {
    const post = await this.findPostOrFail(slug);
    this.validateOwnership(post, userId, role);

    return this.prismaService.post.update({
      where: { slug },
      data: { coverImageUrl: dto.coverImageUrl },
    });
  }

  async getPublishedPostsByTagId(tagId: number): Promise<Post[]> {
    return this.prismaService.post.findMany({
      where: {
        tags: { some: { id: tagId } },
        published: true,
      },
    });
  }

  private async findPostOrFail(slug: string): Promise<Post> {
    const post = await this.prismaService.post.findUnique({ where: { slug } });
    if (!post) throw PostError.PostNotFound();
    return post;
  }

  private validateOwnership(post: Post, userId: number, role: Role): void {
    if (post.authorId !== userId && role !== Role.ADMIN) {
      throw PostError.Forbidden();
    }
  }

  private async validateCreateConstraints(dto: CreatePostDto): Promise<void> {
    await this.categoryService.getCategoryByIdOrFail(dto.categoryId);

    const existSlug = await this.prismaService.post.findUnique({
      where: { slug: dto.slug },
    });
    if (existSlug) throw PostError.SlugAlreadyExists();
  }

  private async validateUpdateConstraints(dto: EditPostDto): Promise<void> {
    if (dto.slug) {
      const existSlug = await this.prismaService.post.findUnique({
        where: { slug: dto.slug },
      });
      if (existSlug) throw PostError.SlugAlreadyExists();
    }

    if (dto.categoryId) {
      await this.categoryService.getCategoryByIdOrFail(dto.categoryId);
    }
  }
}
