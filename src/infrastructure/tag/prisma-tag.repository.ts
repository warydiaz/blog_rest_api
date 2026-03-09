import { Injectable } from '@nestjs/common';
import { Tag } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ITagRepository,
  CreateTagData,
} from '../../tag/repository/tag.repository.interface';

@Injectable()
export class PrismaTagRepository implements ITagRepository {
  constructor(private prisma: PrismaService) {}

  findMany(): Promise<Tag[]> {
    return this.prisma.tag.findMany();
  }

  findBySlug(slug: string): Promise<Tag | null> {
    return this.prisma.tag.findUnique({ where: { slug } });
  }

  findByName(name: string): Promise<Tag | null> {
    return this.prisma.tag.findUnique({ where: { name } });
  }

  create(data: CreateTagData): Promise<Tag> {
    return this.prisma.tag.create({ data });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.tag.delete({ where: { id } });
  }
}
