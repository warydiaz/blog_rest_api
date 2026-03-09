import { Inject, Injectable } from '@nestjs/common';
import { Post, Tag } from '@prisma/client';
import { TagError } from './error';
import { CreateTagDto } from './dto';
import { PostService } from '../post/post.service';
import type { ITagRepository } from './repository/tag.repository.interface';
import { TAG_REPOSITORY } from './repository/tag.repository.interface';

export interface TagWithPosts extends Tag {
  posts: Post[];
}

@Injectable()
export class TagService {
  constructor(
    @Inject(TAG_REPOSITORY) private tagRepository: ITagRepository,
    private postService: PostService,
  ) {}

  async getAllTags(): Promise<Tag[]> {
    return this.tagRepository.findMany();
  }

  async getTagBySlug(slug: string): Promise<TagWithPosts> {
    const tag = await this.findTagOrFail(slug);

    const posts = await this.postService.getPublishedPostsByTagId(tag.id);

    return { ...tag, posts };
  }

  async createTag(dto: CreateTagDto): Promise<Tag> {
    await this.validateCreateConstraints(dto);

    return this.tagRepository.create(dto);
  }

  async deleteTag(slug: string): Promise<void> {
    const tag = await this.findTagOrFail(slug);

    await this.tagRepository.delete(tag.id);
  }

  private async findTagOrFail(slug: string): Promise<Tag> {
    const tag = await this.tagRepository.findBySlug(slug);

    if (!tag) throw TagError.TagNotFound();

    return tag;
  }

  private async validateCreateConstraints(dto: CreateTagDto): Promise<void> {
    if (await this.isTagNameTaken(dto.name)) {
      throw TagError.TagNameTaken(dto.name);
    }

    if (await this.isTagSlugTaken(dto.slug)) {
      throw TagError.TagSlugTaken(dto.slug);
    }
  }

  private async isTagNameTaken(name: string): Promise<boolean> {
    return !!(await this.tagRepository.findByName(name));
  }

  private async isTagSlugTaken(slug: string): Promise<boolean> {
    return !!(await this.tagRepository.findBySlug(slug));
  }
}
