import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { CategoryModule } from '../category/category.module';
import { PrismaPostRepository } from '../infrastructure/post/prisma-post.repository';
import { POST_REPOSITORY } from './repository/post.repository.interface';

@Module({
  imports: [CategoryModule],
  controllers: [PostController],
  providers: [
    PostService,
    { provide: POST_REPOSITORY, useClass: PrismaPostRepository },
  ],
  exports: [PostService],
})
export class PostModule {}
