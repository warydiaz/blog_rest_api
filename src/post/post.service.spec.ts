import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto, EditPostDto } from './dto';
import { PostError } from './error/post.error';
import { CategoryError } from 'src/category/error/category.error';
import { Role } from '@prisma/client';

describe('PostService', () => {
  let service: PostService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    post: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
  };

  const mockPost = {
    id: 1,
    title: 'Test Post',
    slug: 'test-post',
    content: 'Some content',
    excerpt: null,
    coverImageUrl: null,
    published: false,
    categoryId: 1,
    authorId: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCategory = { id: 1, name: 'Tech', slug: 'tech' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getAllPosts ───────────────────────────────────────────────────────────

  describe('getAllPosts', () => {
    it('should return all published posts', async () => {
      mockPrismaService.post.findMany.mockResolvedValue([mockPost]);

      const result = await service.getAllPosts();

      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith({
        where: { published: true },
      });
      expect(result).toEqual([mockPost]);
    });
  });

  // ─── getPostBySlug ────────────────────────────────────────────────────────

  describe('getPostBySlug', () => {
    it('should return the post when it exists', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      const result = await service.getPostBySlug('test-post');

      expect(mockPrismaService.post.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-post' },
      });
      expect(result).toEqual(mockPost);
    });

    it('should throw PostError.PostNotFound when post does not exist', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.getPostBySlug('non-existent')).rejects.toThrow(
        PostError.PostNotFound().message,
      );
    });
  });

  // ─── createPost ───────────────────────────────────────────────────────────

  describe('createPost', () => {
    const userId = 10;
    const dto: CreatePostDto = {
      title: 'Test Post',
      slug: 'test-post',
      content: 'Some content',
      categoryId: 1,
    };

    it('should create and return the post', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.post.findUnique.mockResolvedValue(null);
      mockPrismaService.post.create.mockResolvedValue(mockPost);

      const result = await service.createPost(userId, dto);

      expect(mockPrismaService.post.create).toHaveBeenCalledWith({
        data: { ...dto, authorId: userId },
      });
      expect(result).toEqual(mockPost);
    });

    it('should throw CategoryError.CategoryNotFound when category does not exist', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.createPost(userId, dto)).rejects.toThrow(
        CategoryError.CategoryNotFound().message,
      );
      expect(mockPrismaService.post.create).not.toHaveBeenCalled();
    });

    it('should throw PostError.SlugAlreadyExists when slug is taken', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      await expect(service.createPost(userId, dto)).rejects.toThrow(
        PostError.SlugAlreadyExists().message,
      );
      expect(mockPrismaService.post.create).not.toHaveBeenCalled();
    });
  });

  // ─── updatePost ───────────────────────────────────────────────────────────

  describe('updatePost', () => {
    const userId = 10;
    const dto: EditPostDto = { title: 'Updated Title' };

    it('should update and return the post when owner calls it', async () => {
      const updatedPost = { ...mockPost, title: 'Updated Title' };
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.post.update.mockResolvedValue(updatedPost);

      const result = await service.updatePost(userId, 'test-post', dto, Role.AUTHOR);

      expect(mockPrismaService.post.update).toHaveBeenCalledWith({
        where: { slug: 'test-post' },
        data: { ...dto, authorId: userId },
      });
      expect(result).toEqual(updatedPost);
    });

    it('should allow ADMIN to update any post', async () => {
      const adminId = 99;
      const updatedPost = { ...mockPost, title: 'Updated Title' };
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.post.update.mockResolvedValue(updatedPost);

      const result = await service.updatePost(adminId, 'test-post', dto, Role.ADMIN);

      expect(mockPrismaService.post.update).toHaveBeenCalled();
      expect(result).toEqual(updatedPost);
    });

    it('should throw PostError.PostNotFound when post does not exist', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePost(userId, 'non-existent', dto, Role.AUTHOR),
      ).rejects.toThrow(PostError.PostNotFound().message);
    });

    it('should throw PostError.Forbidden when non-owner AUTHOR tries to update', async () => {
      const otherUserId = 99;
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      await expect(
        service.updatePost(otherUserId, 'test-post', dto, Role.AUTHOR),
      ).rejects.toThrow(PostError.Forbidden().message);
    });

    it('should throw PostError.SlugAlreadyExists when new slug is taken', async () => {
      const dtoWithSlug: EditPostDto = { slug: 'existing-slug' };
      const existingPost = { ...mockPost, slug: 'existing-slug', id: 2 };
      mockPrismaService.post.findUnique
        .mockResolvedValueOnce(mockPost)
        .mockResolvedValueOnce(existingPost);

      await expect(
        service.updatePost(userId, 'test-post', dtoWithSlug, Role.AUTHOR),
      ).rejects.toThrow(PostError.SlugAlreadyExists().message);
    });

    it('should throw CategoryError.CategoryNotFound when new categoryId does not exist', async () => {
      const dtoWithCategory: EditPostDto = { categoryId: 99 };
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePost(userId, 'test-post', dtoWithCategory, Role.AUTHOR),
      ).rejects.toThrow(CategoryError.CategoryNotFound().message);
    });
  });

  // ─── deletePost ───────────────────────────────────────────────────────────

  describe('deletePost', () => {
    const userId = 10;

    it('should delete the post when owner calls it', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.post.delete.mockResolvedValue(mockPost);

      await service.deletePost(userId, 'test-post', Role.AUTHOR);

      expect(mockPrismaService.post.delete).toHaveBeenCalledWith({
        where: { slug: 'test-post' },
      });
    });

    it('should allow ADMIN to delete any post', async () => {
      const adminId = 99;
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.post.delete.mockResolvedValue(mockPost);

      await service.deletePost(adminId, 'test-post', Role.ADMIN);

      expect(mockPrismaService.post.delete).toHaveBeenCalled();
    });

    it('should throw PostError.PostNotFound when post does not exist', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(
        service.deletePost(userId, 'non-existent', Role.AUTHOR),
      ).rejects.toThrow(PostError.PostNotFound().message);
    });

    it('should throw PostError.Forbidden when non-owner AUTHOR tries to delete', async () => {
      const otherUserId = 99;
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      await expect(
        service.deletePost(otherUserId, 'test-post', Role.AUTHOR),
      ).rejects.toThrow(PostError.Forbidden().message);
    });
  });

  // ─── publishPost ──────────────────────────────────────────────────────────

  describe('publishPost', () => {
    const userId = 10;

    it('should publish the post when owner calls it', async () => {
      const publishedPost = { ...mockPost, published: true };
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.post.update.mockResolvedValue(publishedPost);

      const result = await service.publishPost(userId, 'test-post', Role.AUTHOR);

      expect(mockPrismaService.post.update).toHaveBeenCalledWith({
        where: { slug: 'test-post' },
        data: { published: true },
      });
      expect(result).toEqual(publishedPost);
    });

    it('should allow ADMIN to publish any post', async () => {
      const adminId = 99;
      const publishedPost = { ...mockPost, published: true };
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.post.update.mockResolvedValue(publishedPost);

      const result = await service.publishPost(adminId, 'test-post', Role.ADMIN);

      expect(result).toEqual(publishedPost);
    });

    it('should throw PostError.PostNotFound when post does not exist', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(
        service.publishPost(userId, 'non-existent', Role.AUTHOR),
      ).rejects.toThrow(PostError.PostNotFound().message);
    });

    it('should throw PostError.Forbidden when non-owner AUTHOR tries to publish', async () => {
      const otherUserId = 99;
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      await expect(
        service.publishPost(otherUserId, 'test-post', Role.AUTHOR),
      ).rejects.toThrow(PostError.Forbidden().message);
    });
  });

  // ─── unpublishPost ────────────────────────────────────────────────────────

  describe('unpublishPost', () => {
    const userId = 10;
    const publishedMockPost = { ...mockPost, published: true };

    it('should unpublish the post when owner calls it', async () => {
      const unpublishedPost = { ...publishedMockPost, published: false };
      mockPrismaService.post.findUnique.mockResolvedValue(publishedMockPost);
      mockPrismaService.post.update.mockResolvedValue(unpublishedPost);

      const result = await service.unpublishPost(userId, 'test-post', Role.AUTHOR);

      expect(mockPrismaService.post.update).toHaveBeenCalledWith({
        where: { slug: 'test-post' },
        data: { published: false },
      });
      expect(result).toEqual(unpublishedPost);
    });

    it('should allow ADMIN to unpublish any post', async () => {
      const adminId = 99;
      const unpublishedPost = { ...publishedMockPost, published: false };
      mockPrismaService.post.findUnique.mockResolvedValue(publishedMockPost);
      mockPrismaService.post.update.mockResolvedValue(unpublishedPost);

      const result = await service.unpublishPost(adminId, 'test-post', Role.ADMIN);

      expect(result).toEqual(unpublishedPost);
    });

    it('should throw PostError.PostNotFound when post does not exist', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(
        service.unpublishPost(userId, 'non-existent', Role.AUTHOR),
      ).rejects.toThrow(PostError.PostNotFound().message);
    });

    it('should throw PostError.Forbidden when non-owner AUTHOR tries to unpublish', async () => {
      const otherUserId = 99;
      mockPrismaService.post.findUnique.mockResolvedValue(publishedMockPost);

      await expect(
        service.unpublishPost(otherUserId, 'test-post', Role.AUTHOR),
      ).rejects.toThrow(PostError.Forbidden().message);
    });
  });
});
