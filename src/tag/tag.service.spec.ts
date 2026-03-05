import { Test, TestingModule } from '@nestjs/testing';
import { TagService } from './tag.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PostService } from 'src/post/post.service';
import { CreateTagDto } from './dto';
import { TagError } from './error';

describe('TagService', () => {
  let service: TagService;

  const mockPrismaService = {
    tag: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockPostService = {
    getPublishedPostsByTagId: jest.fn(),
  };

  const mockTag = {
    id: 1,
    name: 'nestjs',
    slug: 'nestjs',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPost = {
    id: 1,
    title: 'Test Post',
    slug: 'test-post',
    content: 'Some content',
    excerpt: null,
    coverImageUrl: null,
    published: true,
    categoryId: 1,
    authorId: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PostService, useValue: mockPostService },
      ],
    }).compile();

    service = module.get<TagService>(TagService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getAllTags ────────────────────────────────────────────────────────────

  describe('getAllTags', () => {
    it('should return all tags', async () => {
      mockPrismaService.tag.findMany.mockResolvedValue([mockTag]);

      const result = await service.getAllTags();

      expect(mockPrismaService.tag.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockTag]);
    });
  });

  // ─── getTagBySlug ─────────────────────────────────────────────────────────

  describe('getTagBySlug', () => {
    it('should return the tag with its published posts', async () => {
      mockPrismaService.tag.findUnique.mockResolvedValue(mockTag);
      mockPostService.getPublishedPostsByTagId.mockResolvedValue([mockPost]);

      const result = await service.getTagBySlug('nestjs');

      expect(mockPrismaService.tag.findUnique).toHaveBeenCalledWith({
        where: { slug: 'nestjs' },
      });
      expect(mockPostService.getPublishedPostsByTagId).toHaveBeenCalledWith(
        mockTag.id,
      );
      expect(result).toEqual({ ...mockTag, posts: [mockPost] });
    });

    it('should return the tag with an empty posts array when no published posts exist', async () => {
      mockPrismaService.tag.findUnique.mockResolvedValue(mockTag);
      mockPostService.getPublishedPostsByTagId.mockResolvedValue([]);

      const result = await service.getTagBySlug('nestjs');

      expect(result).toEqual({ ...mockTag, posts: [] });
    });

    it('should throw TagError.TagNotFound when tag does not exist', async () => {
      mockPrismaService.tag.findUnique.mockResolvedValue(null);

      await expect(service.getTagBySlug('non-existent')).rejects.toThrow(
        TagError.TagNotFound().message,
      );
      expect(mockPostService.getPublishedPostsByTagId).not.toHaveBeenCalled();
    });
  });

  // ─── createTag ────────────────────────────────────────────────────────────

  describe('createTag', () => {
    const dto: CreateTagDto = { name: 'nestjs', slug: 'nestjs' };

    it('should create and return the tag', async () => {
      mockPrismaService.tag.findUnique.mockResolvedValue(null);
      mockPrismaService.tag.create.mockResolvedValue(mockTag);

      const result = await service.createTag(dto);

      expect(mockPrismaService.tag.create).toHaveBeenCalledWith({
        data: dto,
      });
      expect(result).toEqual(mockTag);
    });

    it('should throw TagError.TagNameTaken when name is already taken', async () => {
      mockPrismaService.tag.findUnique.mockResolvedValueOnce(mockTag);

      await expect(service.createTag(dto)).rejects.toThrow(
        TagError.TagNameTaken(dto.name).message,
      );
      expect(mockPrismaService.tag.create).not.toHaveBeenCalled();
    });

    it('should throw TagError.TagSlugTaken when slug is already taken', async () => {
      mockPrismaService.tag.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockTag);

      await expect(service.createTag(dto)).rejects.toThrow(
        TagError.TagSlugTaken(dto.slug).message,
      );
      expect(mockPrismaService.tag.create).not.toHaveBeenCalled();
    });
  });

  // ─── deleteTag ────────────────────────────────────────────────────────────

  describe('deleteTag', () => {
    it('should delete the tag', async () => {
      mockPrismaService.tag.findUnique.mockResolvedValue(mockTag);
      mockPrismaService.tag.delete.mockResolvedValue(mockTag);

      await service.deleteTag('nestjs');

      expect(mockPrismaService.tag.delete).toHaveBeenCalledWith({
        where: { id: mockTag.id },
      });
    });

    it('should throw TagError.TagNotFound when tag does not exist', async () => {
      mockPrismaService.tag.findUnique.mockResolvedValue(null);

      await expect(service.deleteTag('non-existent')).rejects.toThrow(
        TagError.TagNotFound().message,
      );
      expect(mockPrismaService.tag.delete).not.toHaveBeenCalled();
    });
  });
});
