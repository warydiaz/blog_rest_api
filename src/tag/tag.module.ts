import { Module } from '@nestjs/common';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { PostModule } from '../post/post.module';
import { PrismaTagRepository } from '../infrastructure/tag/prisma-tag.repository';
import { TAG_REPOSITORY } from './repository/tag.repository.interface';

@Module({
  imports: [PostModule],
  controllers: [TagController],
  providers: [
    TagService,
    { provide: TAG_REPOSITORY, useClass: PrismaTagRepository },
  ],
})
export class TagModule {}
