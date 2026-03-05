import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtGuard } from '../auth/guard/';
import { EditCommentDto } from './dto';
import { GetUserId } from '../auth/decorator/';

@Controller('/posts/:slug/comments')
export class CommentController {
  constructor(private commentService: CommentService) {}

  @Get()
  async getAllComments(@Param('slug') slug: string) {
    return await this.commentService.getAllCommentsByPostSlug(slug);
  }

  @UseGuards(JwtGuard)
  @Post()
  async createComment(
    @Param('slug') slug: string,
    @Body() dto: CreateCommentDto,
    @GetUserId() userId: number,
  ) {
    return await this.commentService.createComment(slug, dto, userId);
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
  async updateComment(
    @Param('id', ParseIntPipe) id: number,
    @GetUserId() userId: number,
    @Body() dto: EditCommentDto,
  ) {
    return await this.commentService.updateComment(id, userId, dto);
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  async deleteComment(
    @Param('id', ParseIntPipe) id: number,
    @GetUserId() userId: number,
  ) {
    return await this.commentService.deleteComment(id, userId);
  }

  @UseGuards(JwtGuard)
  @Post(':id/like')
  async likeComment(
    @Param('id', ParseIntPipe) id: number,
    @GetUserId() userId: number,
    @Param('slug') slug: string,
  ) {
    return await this.commentService.likeComment(slug, id, userId);
  }

  @UseGuards(JwtGuard)
  @Delete(':id/like')
  async unlikeComment(
    @Param('id', ParseIntPipe) id: number,
    @GetUserId() userId: number,
    @Param('slug') slug: string,
  ) {
    return await this.commentService.unlikeComment(slug, id, userId);
  }
}
