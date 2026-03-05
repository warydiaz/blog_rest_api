import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CategoryDto, EditCategoryDto } from './dto';
import { CategoryError } from './error/category.error';
import { JwtGuard, RolesGuard } from '../auth/guard';

describe('CategoryController', () => {
  let controller: CategoryController;
  let categoryService: jest.Mocked<CategoryService>;

  const mockCategoryService: jest.Mocked<Partial<CategoryService>> = {
    getAllCategories: jest.fn(),
    getCategoryBySlug: jest.fn(),
    createCategory: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
  };

  const mockCategory = {
    id: 1,
    name: 'Tech',
    slug: 'tech',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [{ provide: CategoryService, useValue: mockCategoryService }],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CategoryController>(CategoryController);
    categoryService = module.get(CategoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── getAllCategories ──────────────────────────────────────────────────────

  describe('getAllCategories', () => {
    it('should call categoryService.getAllCategories and return results', async () => {
      categoryService.getAllCategories.mockResolvedValue([mockCategory]);

      const result = await controller.getAllCategories();

      expect(categoryService.getAllCategories).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockCategory]);
    });
  });

  // ─── getCategoryBySlug ────────────────────────────────────────────────────

  describe('getCategoryBySlug', () => {
    it('should call categoryService.getCategoryBySlug with the slug and return the category', async () => {
      categoryService.getCategoryBySlug.mockResolvedValue(mockCategory);

      const result = await controller.getCategoryBySlug('tech');

      expect(categoryService.getCategoryBySlug).toHaveBeenCalledWith('tech');
      expect(result).toEqual(mockCategory);
    });

    it('should propagate CategoryError.CategoryNotFound when category does not exist', async () => {
      categoryService.getCategoryBySlug.mockRejectedValue(
        CategoryError.CategoryNotFound(),
      );

      await expect(controller.getCategoryBySlug('non-existent')).rejects.toThrow(
        CategoryError.CategoryNotFound().message,
      );
    });
  });

  // ─── createCategory ───────────────────────────────────────────────────────

  describe('createCategory', () => {
    const dto: CategoryDto = { name: 'Tech', slug: 'tech' };

    it('should call categoryService.createCategory with dto and return the category', async () => {
      categoryService.createCategory.mockResolvedValue(mockCategory);

      const result = await controller.createCategory(dto);

      expect(categoryService.createCategory).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockCategory);
    });

    it('should propagate CategoryError.SlugAlreadyExists when slug is taken', async () => {
      categoryService.createCategory.mockRejectedValue(
        CategoryError.SlugAlreadyExists(),
      );

      await expect(controller.createCategory(dto)).rejects.toThrow(
        CategoryError.SlugAlreadyExists().message,
      );
    });
  });

  // ─── updateCategory ───────────────────────────────────────────────────────

  describe('updateCategory', () => {
    const dto: EditCategoryDto = { name: 'Technology' };

    it('should call categoryService.updateCategory with slug and dto and return the updated category', async () => {
      const updatedCategory = { ...mockCategory, name: 'Technology' };
      categoryService.updateCategory.mockResolvedValue(updatedCategory);

      const result = await controller.updateCategory('tech', dto);

      expect(categoryService.updateCategory).toHaveBeenCalledWith('tech', dto);
      expect(result).toEqual(updatedCategory);
    });

    it('should propagate CategoryError.CategoryNotFound when category does not exist', async () => {
      categoryService.updateCategory.mockRejectedValue(
        CategoryError.CategoryNotFound(),
      );

      await expect(
        controller.updateCategory('non-existent', dto),
      ).rejects.toThrow(CategoryError.CategoryNotFound().message);
    });
  });

  // ─── deleteCategory ───────────────────────────────────────────────────────

  describe('deleteCategory', () => {
    it('should call categoryService.deleteCategory with the slug', async () => {
      categoryService.deleteCategory.mockResolvedValue(undefined);

      await controller.deleteCategory('tech');

      expect(categoryService.deleteCategory).toHaveBeenCalledWith('tech');
      expect(categoryService.deleteCategory).toHaveBeenCalledTimes(1);
    });

    it('should resolve without error when category is deleted', async () => {
      categoryService.deleteCategory.mockResolvedValue(undefined);

      await expect(controller.deleteCategory('tech')).resolves.toBeUndefined();
    });

    it('should propagate CategoryError.CategoryNotFound when category does not exist', async () => {
      categoryService.deleteCategory.mockRejectedValue(
        CategoryError.CategoryNotFound(),
      );

      await expect(controller.deleteCategory('non-existent')).rejects.toThrow(
        CategoryError.CategoryNotFound().message,
      );
    });
  });
});
