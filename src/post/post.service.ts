import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Post } from '@prisma/client';
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

  async getPostBySlug(slug: string): Promise<Post | null> {
    const post = await this.prismaService.post.findUnique({
      where: { slug },
    });

    return post;
  }

  async createPost(userId: number, dto: CreatePostDto): Promise<Post> {
    const existCategory = await this.prismaService.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!existCategory) {
      throw CategoryError.CategoryNotFound();
    }

    const existSlug = await this.prismaService.post.findUnique({
      where: { slug: dto.slug },
    });

    if (existSlug) {
      throw PostError.SlugAlreadyExists();
    }

    const post = await this.prismaService.post.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        content: dto.content,
        excerpt: dto.excerpt,
        coverImageUrl: dto.coverImageUrl,
        published: dto.published,
        categoryId: dto.categoryId,
        authorId: userId,
      },
    });
    return post;
  }

  async updatePost(
    userId: number,
    slug: string,
    dto: EditPostDto,
  ): Promise<Post> {
    if (dto.categoryId) {
      const existCategory = await this.prismaService.category.findUnique({
        where: { id: dto.categoryId },
      });

      if (!existCategory) {
        throw CategoryError.CategoryNotFound();
      }
    }

    const existPost = await this.prismaService.post.findUnique({
      where: { slug },
    });

    if (!existPost) {
      throw PostError.PostNotFound();
    }

    if (existPost.authorId !== userId) {
      throw PostError.Forbidden();
    }

    if (dto.slug) {
      const existSlug = await this.prismaService.post.findUnique({
        where: { slug: dto.slug },
      });

      if (existSlug) {
        throw PostError.SlugAlreadyExists();
      }
    }

    const post = await this.prismaService.post.update({
      where: { slug },
      data: {
        ...dto,
        authorId: userId,
      },
    });
    return post;
  }
}
