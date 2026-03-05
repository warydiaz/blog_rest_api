import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Tag } from '@prisma/client';
import { TagError } from './error';
import { CreateTagDto } from './dto';
import { PostService } from '../post/post.service';

@Injectable()
export class TagService {
  constructor(
    private prismaService: PrismaService,
    private postService: PostService,
  ) {}

  async getAllTags(): Promise<Tag[]> {
    return await this.prismaService.tag.findMany();
  }

  async getTagBySlug(
    slug: string,
  ): Promise<Prisma.TagGetPayload<{ include: { posts: true } }>> {
    const tag = await this.findTagOrFail(slug);

    const posts = await this.postService.getPublishedPostsByTagId(tag.id);

    return { ...tag, posts };
  }

  async createTag(dto: CreateTagDto): Promise<Tag> {
    await this.validateCreateConstraints(dto);

    return await this.prismaService.tag.create({
      data: dto,
    });
  }

  async deleteTag(slug: string): Promise<void> {
    const tag = await this.findTagOrFail(slug);

    await this.prismaService.tag.delete({
      where: { id: tag.id },
    });
  }

  private async findTagOrFail(slug: string): Promise<Tag> {
    const tag = await this.prismaService.tag.findUnique({
      where: { slug },
    });

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
    const tag = await this.prismaService.tag.findUnique({
      where: { name },
    });

    return !!tag;
  }

  private async isTagSlugTaken(slug: string): Promise<boolean> {
    const tag = await this.prismaService.tag.findUnique({
      where: { slug },
    });

    return !!tag;
  }
}
