import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard, RolesGuard } from '../auth/guard';
import { Roles } from '../auth/decorator';
import { CategoryService } from './category.service';
import { Role } from '@prisma/client';
import { CategoryDto } from './dto';
import { EditCategoryDto } from './dto/edit-category.dto';

@UseGuards(JwtGuard, RolesGuard)
@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get()
  async getAllCategories() {
    return await this.categoryService.getAllCategories();
  }

  @Get(':slug')
  async getCategoryBySlug(@Param('slug') slug: string) {
    return await this.categoryService.getCategoryBySlug(slug);
  }

  @Post()
  @Roles(Role.ADMIN)
  async createCategory(@Body() dto: CategoryDto) {
    return await this.categoryService.createCategory(dto);
  }

  @Patch(':slug')
  @Roles(Role.ADMIN)
  async updateCategory(
    @Param('slug') slug: string,
    @Body() dto: EditCategoryDto,
  ) {
    return await this.categoryService.updateCategory(slug, dto);
  }

  @Delete(':slug')
  @Roles(Role.ADMIN)
  async deleteCategory(@Param('slug') slug: string) {
    return await this.categoryService.deleteCategory(slug);
  }
}
