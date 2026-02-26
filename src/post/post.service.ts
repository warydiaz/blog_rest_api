import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Post, Role } from '@prisma/client';
import { CreatePostDto, EditPostDto } from './dto';
import { PostError } from './error/post.error';
import { CategoryError } from 'src/category/error/category.error';

@Injectable()
export class PostService {
  constructor(private prismaService: PrismaService) {}

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

    return this.prismaService.post.create({
      data: { ...dto, authorId: userId },
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

    return this.prismaService.post.update({
      where: { slug },
      data: { ...dto, authorId: userId },
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
    const existCategory = await this.prismaService.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!existCategory) throw CategoryError.CategoryNotFound();

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
      const existCategory = await this.prismaService.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!existCategory) throw CategoryError.CategoryNotFound();
    }
  }
}
