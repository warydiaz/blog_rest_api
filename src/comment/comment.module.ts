import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { PostModule } from '../post/post.module';
import { PrismaCommentRepository } from '../infrastructure/comment/prisma-comment.repository';
import { COMMENT_REPOSITORY } from './repository/comment.repository.interface';

@Module({
  imports: [PostModule],
  controllers: [CommentController],
  providers: [
    CommentService,
    { provide: COMMENT_REPOSITORY, useClass: PrismaCommentRepository },
  ],
})
export class CommentModule {}
