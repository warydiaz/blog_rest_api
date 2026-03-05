import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CategoryDto, EditCategoryDto } from './dto';
import { CategoryError } from './error/category.error';

describe('CategoryService', () => {
  let service: CategoryService;

  const mockPrismaService = {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
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
        { provide: PrismaService, useValue: mockPrismaService },
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
      mockPrismaService.category.findMany.mockResolvedValue([mockCategory]);

      const result = await service.getAllCategories();

      expect(mockPrismaService.category.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockCategory]);
    });
  });

  // ─── getCategoryBySlug ────────────────────────────────────────────────────

  describe('getCategoryBySlug', () => {
    it('should return the category when it exists', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);

      const result = await service.getCategoryBySlug('tech');

      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { slug: 'tech' },
      });
      expect(result).toEqual(mockCategory);
    });

    it('should throw CategoryError.CategoryNotFound when category does not exist', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.getCategoryBySlug('non-existent')).rejects.toThrow(
        CategoryError.CategoryNotFound().message,
      );
    });
  });

  // ─── createCategory ───────────────────────────────────────────────────────

  describe('createCategory', () => {
    const dto: CategoryDto = { name: 'Tech', slug: 'tech' };

    it('should create and return the category', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);
      mockPrismaService.category.create.mockResolvedValue(mockCategory);

      const result = await service.createCategory(dto);

      expect(mockPrismaService.category.create).toHaveBeenCalledWith({
        data: { ...dto },
      });
      expect(result).toEqual(mockCategory);
    });

    it('should throw CategoryError.SlugAlreadyExists when slug is taken', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);

      await expect(service.createCategory(dto)).rejects.toThrow(
        CategoryError.SlugAlreadyExists().message,
      );
      expect(mockPrismaService.category.create).not.toHaveBeenCalled();
    });
  });

  // ─── updateCategory ───────────────────────────────────────────────────────

  describe('updateCategory', () => {
    const dto: EditCategoryDto = { name: 'Technology' };

    it('should update and return the category', async () => {
      const updatedCategory = { ...mockCategory, name: 'Technology' };
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.category.update.mockResolvedValue(updatedCategory);

      const result = await service.updateCategory('tech', dto);

      expect(mockPrismaService.category.update).toHaveBeenCalledWith({
        where: { slug: 'tech' },
        data: { ...dto },
      });
      expect(result).toEqual(updatedCategory);
    });

    it('should throw CategoryError.CategoryNotFound when category does not exist', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.updateCategory('non-existent', dto)).rejects.toThrow(
        CategoryError.CategoryNotFound().message,
      );
      expect(mockPrismaService.category.update).not.toHaveBeenCalled();
    });
  });

  // ─── deleteCategory ───────────────────────────────────────────────────────

  describe('deleteCategory', () => {
    it('should delete the category', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.category.delete.mockResolvedValue(mockCategory);

      await service.deleteCategory('tech');

      expect(mockPrismaService.category.delete).toHaveBeenCalledWith({
        where: { slug: 'tech' },
      });
    });

    it('should throw CategoryError.CategoryNotFound when category does not exist', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.deleteCategory('non-existent')).rejects.toThrow(
        CategoryError.CategoryNotFound().message,
      );
      expect(mockPrismaService.category.delete).not.toHaveBeenCalled();
    });
  });

  // ─── getCategoryByIdOrFail ────────────────────────────────────────────────

  describe('getCategoryByIdOrFail', () => {
    it('should return the category when it exists', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);

      const result = await service.getCategoryByIdOrFail(1);

      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockCategory);
    });

    it('should throw CategoryError.CategoryNotFound when category does not exist', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.getCategoryByIdOrFail(99)).rejects.toThrow(
        CategoryError.CategoryNotFound().message,
      );
    });
  });
});
