import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { CATEGORY_REPOSITORY } from './repository/category.repository.interface';
import { CategoryDto, EditCategoryDto } from './dto';
import { CategoryError } from './error/category.error';

describe('CategoryService', () => {
  let service: CategoryService;

  const mockCategoryRepository = {
    findMany: jest.fn(),
    findBySlug: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
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
      providers: [
        CategoryService,
        { provide: CATEGORY_REPOSITORY, useValue: mockCategoryRepository },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getAllCategories ──────────────────────────────────────────────────────

  describe('getAllCategories', () => {
    it('should return all categories', async () => {
      mockCategoryRepository.findMany.mockResolvedValue([mockCategory]);

      const result = await service.getAllCategories();

      expect(mockCategoryRepository.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockCategory]);
    });
  });

  // ─── getCategoryBySlug ────────────────────────────────────────────────────

  describe('getCategoryBySlug', () => {
    it('should return the category when it exists', async () => {
      mockCategoryRepository.findBySlug.mockResolvedValue(mockCategory);

      const result = await service.getCategoryBySlug('tech');

      expect(mockCategoryRepository.findBySlug).toHaveBeenCalledWith('tech');
      expect(result).toEqual(mockCategory);
    });

    it('should throw CategoryError.CategoryNotFound when category does not exist', async () => {
      mockCategoryRepository.findBySlug.mockResolvedValue(null);

      await expect(service.getCategoryBySlug('non-existent')).rejects.toThrow(
        CategoryError.CategoryNotFound().message,
      );
    });
  });

  // ─── createCategory ───────────────────────────────────────────────────────

  describe('createCategory', () => {
    const dto: CategoryDto = { name: 'Tech', slug: 'tech' };

    it('should create and return the category', async () => {
      mockCategoryRepository.findBySlug.mockResolvedValue(null);
      mockCategoryRepository.create.mockResolvedValue(mockCategory);

      const result = await service.createCategory(dto);

      expect(mockCategoryRepository.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockCategory);
    });

    it('should throw CategoryError.SlugAlreadyExists when slug is taken', async () => {
      mockCategoryRepository.findBySlug.mockResolvedValue(mockCategory);

      await expect(service.createCategory(dto)).rejects.toThrow(
        CategoryError.SlugAlreadyExists().message,
      );
      expect(mockCategoryRepository.create).not.toHaveBeenCalled();
    });
  });

  // ─── updateCategory ───────────────────────────────────────────────────────

  describe('updateCategory', () => {
    const dto: EditCategoryDto = { name: 'Technology' };

    it('should update and return the category', async () => {
      const updatedCategory = { ...mockCategory, name: 'Technology' };
      mockCategoryRepository.findBySlug.mockResolvedValue(mockCategory);
      mockCategoryRepository.update.mockResolvedValue(updatedCategory);

      const result = await service.updateCategory('tech', dto);

      expect(mockCategoryRepository.update).toHaveBeenCalledWith('tech', dto);
      expect(result).toEqual(updatedCategory);
    });

    it('should throw CategoryError.CategoryNotFound when category does not exist', async () => {
      mockCategoryRepository.findBySlug.mockResolvedValue(null);

      await expect(service.updateCategory('non-existent', dto)).rejects.toThrow(
        CategoryError.CategoryNotFound().message,
      );
      expect(mockCategoryRepository.update).not.toHaveBeenCalled();
    });
  });

  // ─── deleteCategory ───────────────────────────────────────────────────────

  describe('deleteCategory', () => {
    it('should delete the category', async () => {
      mockCategoryRepository.findBySlug.mockResolvedValue(mockCategory);
      mockCategoryRepository.delete.mockResolvedValue(undefined);

      await service.deleteCategory('tech');

      expect(mockCategoryRepository.delete).toHaveBeenCalledWith('tech');
    });

    it('should throw CategoryError.CategoryNotFound when category does not exist', async () => {
      mockCategoryRepository.findBySlug.mockResolvedValue(null);

      await expect(service.deleteCategory('non-existent')).rejects.toThrow(
        CategoryError.CategoryNotFound().message,
      );
      expect(mockCategoryRepository.delete).not.toHaveBeenCalled();
    });
  });

  // ─── getCategoryByIdOrFail ────────────────────────────────────────────────

  describe('getCategoryByIdOrFail', () => {
    it('should return the category when it exists', async () => {
      mockCategoryRepository.findById.mockResolvedValue(mockCategory);

      const result = await service.getCategoryByIdOrFail(1);

      expect(mockCategoryRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockCategory);
    });

    it('should throw CategoryError.CategoryNotFound when category does not exist', async () => {
      mockCategoryRepository.findById.mockResolvedValue(null);

      await expect(service.getCategoryByIdOrFail(99)).rejects.toThrow(
        CategoryError.CategoryNotFound().message,
      );
    });
  });
});
