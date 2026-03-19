import { Inject, Injectable } from '@nestjs/common';
import { Post, Role } from '@prisma/client';
import { CreatePostDto, EditPostDto, EditCoverDto } from './dto';
import { PostError } from './error/post.error';
import { CategoryService } from '../category/category.service';
import type { IPostRepository } from './repository/post.repository.interface';
import { POST_REPOSITORY } from './repository/post.repository.interface';
import { FilterPostDto } from './dto/filter-post.dto';

@Injectable()
export class PostService {
  constructor(
    @Inject(POST_REPOSITORY) private postRepository: IPostRepository,
    private categoryService: CategoryService,
  ) {}

  async getAllPosts(filterDto: FilterPostDto): Promise<Post[]> {
    return this.postRepository.findPublished(filterDto);
  }

  async getPostBySlug(slug: string): Promise<Post> {
    return this.findPostOrFail(slug);
  }

  async createPost(userId: number, dto: CreatePostDto): Promise<Post> {
    await this.validateCreateConstraints(dto);

    const { tagIds, ...postData } = dto;

    return this.postRepository.create({ ...postData, authorId: userId, tagIds });
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

    return this.postRepository.update(slug, dto);
  }

  async deletePost(userId: number, slug: string, role: Role): Promise<void> {
    const post = await this.findPostOrFail(slug);
    this.validateOwnership(post, userId, role);

    await this.postRepository.delete(slug);
  }

  async publishPost(userId: number, slug: string, role: Role): Promise<Post> {
    const post = await this.findPostOrFail(slug);
    this.validateOwnership(post, userId, role);

    return this.postRepository.update(slug, { published: true });
  }

  async unpublishPost(userId: number, slug: string, role: Role): Promise<Post> {
    const post = await this.findPostOrFail(slug);
    this.validateOwnership(post, userId, role);

    return this.postRepository.update(slug, { published: false });
  }

  async updateCover(
    userId: number,
    slug: string,
    role: Role,
    dto: EditCoverDto,
  ): Promise<Post> {
    const post = await this.findPostOrFail(slug);
    this.validateOwnership(post, userId, role);

    return this.postRepository.update(slug, { coverImageUrl: dto.coverImageUrl });
  }

  async getPublishedPostsByTagId(tagId: number): Promise<Post[]> {
    return this.postRepository.findByTagId(tagId);
  }

  private async findPostOrFail(slug: string): Promise<Post> {
    const post = await this.postRepository.findBySlug(slug);
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

    const existSlug = await this.postRepository.findBySlug(dto.slug);
    if (existSlug) throw PostError.SlugAlreadyExists();
  }

  private async validateUpdateConstraints(dto: EditPostDto): Promise<void> {
    if (dto.slug) {
      const existSlug = await this.postRepository.findBySlug(dto.slug);
      if (existSlug) throw PostError.SlugAlreadyExists();
    }

    if (dto.categoryId) {
      await this.categoryService.getCategoryByIdOrFail(dto.categoryId);
    }
  }
}
