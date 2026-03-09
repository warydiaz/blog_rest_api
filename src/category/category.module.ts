import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { PrismaCategoryRepository } from '../infrastructure/category/prisma-category.repository';
import { CATEGORY_REPOSITORY } from './repository/category.repository.interface';

@Module({
  controllers: [CategoryController],
  providers: [
    CategoryService,
    { provide: CATEGORY_REPOSITORY, useClass: PrismaCategoryRepository },
  ],
  exports: [CategoryService],
})
export class CategoryModule {}
