import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guard/';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto';

@Controller('tags')
export class TagController {
  constructor(private tagService: TagService) {}

  @Get()
  async getAllTags() {
    return await this.tagService.getAllTags();
  }

  @Get(':slug')
  async getTagBySlug(@Param('slug') slug: string) {
    return await this.tagService.getTagBySlug(slug);
  }

  @UseGuards(JwtGuard)
  @Post()
  async createTag(@Body() dto: CreateTagDto) {
    return await this.tagService.createTag(dto);
  }

  @UseGuards(JwtGuard)
  @Delete(':slug')
  async deleteTag(@Param('slug') slug: string) {
    return await this.tagService.deleteTag(slug);
  }
}
