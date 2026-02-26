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
} from '@nestjs/common';
import { PostService } from './post.service';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { GetUserId, GetUserRole, Roles } from 'src/auth/decorator';
import { Role } from '@prisma/client';
import { CreatePostDto, EditPostDto } from './dto';

@Controller('posts')
export class PostController {
  constructor(private postService: PostService) {}

  @Get()
  async getAllPosts() {
    return await this.postService.getAllPosts();
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
}
