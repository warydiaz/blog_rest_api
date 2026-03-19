import {
  Controller,
  Get,
  Param,
  Body,
  Post,
  UseGuards,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { PostService } from './post.service';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { GetUserId, GetUserRole, Roles } from 'src/auth/decorator';
import { Role } from '@prisma/client';
import { CreatePostDto, EditPostDto, EditCoverDto } from './dto';
import { FilterPostDto } from './dto/filter-post.dto';

@Controller('posts')
export class PostController {
  constructor(private postService: PostService) {}

  @Get()
  async getAllPosts(@Query() filterDto: FilterPostDto) {
    return await this.postService.getAllPosts(filterDto);
  }

  @Get(':slug')
  async getPostBySlug(@Param('slug') slug: string) {
    return await this.postService.getPostBySlug(slug);
  }

  @UseGuards(JwtGuard)
  @Roles(Role.ADMIN, Role.AUTHOR)
  @Post()
  async createPost(@GetUserId() userId: number, @Body() dto: CreatePostDto) {
    return await this.postService.createPost(userId, dto);
  }

  @UseGuards(JwtGuard)
  @Roles(Role.ADMIN, Role.AUTHOR)
  @Patch(':slug')
  async updatePost(
    @GetUserId() userId: number,
    @Param('slug') slug: string,
    @Body() dto: EditPostDto,
    @GetUserRole() role: Role,
  ) {
    return await this.postService.updatePost(userId, slug, dto, role);
  }

  @UseGuards(JwtGuard)
  @Roles(Role.ADMIN, Role.AUTHOR)
  @Delete(':slug')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(
    @GetUserId() userId: number,
    @Param('slug') slug: string,
    @GetUserRole() role: Role,
  ) {
    return await this.postService.deletePost(userId, slug, role);
  }

  @UseGuards(JwtGuard)
  @Roles(Role.ADMIN, Role.AUTHOR)
  @Post(':slug/publish')
  @HttpCode(HttpStatus.OK)
  async publishPost(
    @GetUserId() userId: number,
    @Param('slug') slug: string,
    @GetUserRole() role: Role,
  ) {
    return await this.postService.publishPost(userId, slug, role);
  }

  @UseGuards(JwtGuard)
  @Roles(Role.ADMIN, Role.AUTHOR)
  @Post(':slug/unpublish')
  @HttpCode(HttpStatus.OK)
  async unpublishPost(
    @GetUserId() userId: number,
    @Param('slug') slug: string,
    @GetUserRole() role: Role,
  ) {
    return await this.postService.unpublishPost(userId, slug, role);
  }

  @UseGuards(JwtGuard)
  @Roles(Role.ADMIN, Role.AUTHOR)
  @Post(':slug/cover')
  @HttpCode(HttpStatus.OK)
  async updateCover(
    @GetUserId() userId: number,
    @Param('slug') slug: string,
    @GetUserRole() role: Role,
    @Body() dto: EditCoverDto,
  ) {
    return await this.postService.updateCover(userId, slug, role, dto);
  }
}
