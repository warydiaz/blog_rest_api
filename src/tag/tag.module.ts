import { Module } from '@nestjs/common';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { PostModule } from '../post/post.module';

@Module({
  imports: [PostModule],
  controllers: [TagController],
  providers: [TagService],
})
export class TagModule {}
