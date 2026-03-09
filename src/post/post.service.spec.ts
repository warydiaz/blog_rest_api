import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { POST_REPOSITORY } from './repository/post.repository.interface';
import { CategoryService } from 'src/category/category.service';
import { CreatePostDto, EditPostDto } from './dto';
import { PostError } from './error/post.error';
import { CategoryError } from 'src/category/error/category.error';
import { EditCoverDto } from './dto/edit-cover.dto';
import { Role } from '@prisma/client';

describe('PostService', () => {
  let service: PostService;

  const mockPostRepository = {
    findPublished: jest.fn(),
    findBySlug: jest.fn(),
    findByTagId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockCategoryService = {
    getCategoryByIdOrFail: jest.fn(),
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
        { provide: POST_REPOSITORY, useValue: mockPostRepository },
        { provide: CategoryService, useValue: mockCategoryService },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
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
      mockPostRepository.findPublished.mockResolvedValue([mockPost]);

      const result = await service.getAllPosts();

      expect(mockPostRepository.findPublished).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockPost]);
    });
  });

  // ─── getPostBySlug ────────────────────────────────────────────────────────

  describe('getPostBySlug', () => {
    it('should return the post when it exists', async () => {
      mockPostRepository.findBySlug.mockResolvedValue(mockPost);

      const result = await service.getPostBySlug('test-post');

      expect(mockPostRepository.findBySlug).toHaveBeenCalledWith('test-post');
      expect(result).toEqual(mockPost);
    });

    it('should throw PostError.PostNotFound when post does not exist', async () => {
      mockPostRepository.findBySlug.mockResolvedValue(null);

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
      mockCategoryService.getCategoryByIdOrFail.mockResolvedValue(mockCategory);
      mockPostRepository.findBySlug.mockResolvedValue(null);
      mockPostRepository.create.mockResolvedValue(mockPost);

      const result = await service.createPost(userId, dto);

      expect(mockPostRepository.create).toHaveBeenCalledWith({
        title: dto.title,
        slug: dto.slug,
        content: dto.content,
        categoryId: dto.categoryId,
        authorId: userId,
        tagIds: undefined,
      });
      expect(result).toEqual(mockPost);
    });

    it('should create the post with connected tags when tagIds are provided', async () => {
      const dtoWithTags: CreatePostDto = { ...dto, tagIds: [1, 2] };
      mockCategoryService.getCategoryByIdOrFail.mockResolvedValue(mockCategory);
      mockPostRepository.findBySlug.mockResolvedValue(null);
      mockPostRepository.create.mockResolvedValue(mockPost);

      await service.createPost(userId, dtoWithTags);

      expect(mockPostRepository.create).toHaveBeenCalledWith({
        title: dto.title,
        slug: dto.slug,
        content: dto.content,
        categoryId: dto.categoryId,
        authorId: userId,
        tagIds: [1, 2],
      });
    });

    it('should throw CategoryError.CategoryNotFound when category does not exist', async () => {
      mockCategoryService.getCategoryByIdOrFail.mockRejectedValue(
        CategoryError.CategoryNotFound(),
      );

      await expect(service.createPost(userId, dto)).rejects.toThrow(
        CategoryError.CategoryNotFound().message,
      );
      expect(mockPostRepository.create).not.toHaveBeenCalled();
    });

    it('should throw PostError.SlugAlreadyExists when slug is taken', async () => {
      mockCategoryService.getCategoryByIdOrFail.mockResolvedValue(mockCategory);
      mockPostRepository.findBySlug.mockResolvedValue(mockPost);

      await expect(service.createPost(userId, dto)).rejects.toThrow(
        PostError.SlugAlreadyExists().message,
      );
      expect(mockPostRepository.create).not.toHaveBeenCalled();
    });
  });

  // ─── updatePost ───────────────────────────────────────────────────────────

  describe('updatePost', () => {
    const userId = 10;
    const dto: EditPostDto = { title: 'Updated Title' };

    it('should update and return the post when owner calls it', async () => {
      const updatedPost = { ...mockPost, title: 'Updated Title' };
      mockPostRepository.findBySlug.mockResolvedValue(mockPost);
      mockPostRepository.update.mockResolvedValue(updatedPost);

      const result = await service.updatePost(
        userId,
        'test-post',
        dto,
        Role.AUTHOR,
      );

      expect(mockPostRepository.update).toHaveBeenCalledWith('test-post', dto);
      expect(result).toEqual(updatedPost);
    });

    it('should update the post with replaced tags when tagIds are provided', async () => {
      const dtoWithTags: EditPostDto = { tagIds: [3] };
      const updatedPost = { ...mockPost };
      mockPostRepository.findBySlug.mockResolvedValue(mockPost);
      mockPostRepository.update.mockResolvedValue(updatedPost);

      await service.updatePost(userId, 'test-post', dtoWithTags, Role.AUTHOR);

      expect(mockPostRepository.update).toHaveBeenCalledWith('test-post', dtoWithTags);
    });

    it('should allow ADMIN to update any post', async () => {
      const adminId = 99;
      const updatedPost = { ...mockPost, title: 'Updated Title' };
      mockPostRepository.findBySlug.mockResolvedValue(mockPost);
      mockPostRepository.update.mockResolvedValue(updatedPost);

      const result = await service.updatePost(
        adminId,
        'test-post',
        dto,
        Role.ADMIN,
      );

      expect(mockPostRepository.update).toHaveBeenCalled();
      expect(result).toEqual(updatedPost);
    });

    it('should throw PostError.PostNotFound when post does not exist', async () => {
      mockPostRepository.findBySlug.mockResolvedValue(null);

      await expect(
        service.updatePost(userId, 'non-existent', dto, Role.AUTHOR),
      ).rejects.toThrow(PostError.PostNotFound().message);
    });

    it('should throw PostError.Forbidden when non-owner AUTHOR tries to update', async () => {
      const otherUserId = 99;
      mockPostRepository.findBySlug.mockResolvedValue(mockPost);

      await expect(
        service.updatePost(otherUserId, 'test-post', dto, Role.AUTHOR),
      ).rejects.toThrow(PostError.Forbidden().message);
    });

    it('should throw PostError.SlugAlreadyExists when new slug is taken', async () => {
      const dtoWithSlug: EditPostDto = { slug: 'existing-slug' };
      const existingPost = { ...mockPost, slug: 'existing-slug', id: 2 };
      mockPostRepository.findBySlug
        .mockResolvedValueOnce(mockPost)
        .mockResolvedValueOnce(existingPost);

      await expect(
        service.updatePost(userId, 'test-post', dtoWithSlug, Role.AUTHOR),
      ).rejects.toThrow(PostError.SlugAlreadyExists().message);
    });

    it('should throw CategoryError.CategoryNotFound when new categoryId does not exist', async () => {
      const dtoWithCategory: EditPostDto = { categoryId: 99 };
      mockPostRepository.findBySlug.mockResolvedValue(mockPost);
      mockCategoryService.getCategoryByIdOrFail.mockRejectedValue(
        CategoryError.CategoryNotFound(),
      );

      await expect(
        service.updatePost(userId, 'test-post', dtoWithCategory, Role.AUTHOR),
      ).rejects.toThrow(CategoryError.CategoryNotFound().message);
    });
  });

  // ─── deletePost ───────────────────────────────────────────────────────────

  describe('deletePost', () => {
    const userId = 10;

    it('should delete the post when owner calls it', async () => {
      mockPostRepository.findBySlug.mockResolvedValue(mockPost);
      mockPostRepository.delete.mockResolvedValue(undefined);

      await service.deletePost(userId, 'test-post', Role.AUTHOR);

      expect(mockPostRepository.delete).toHaveBeenCalledWith('test-post');
    });

    it('should allow ADMIN to delete any post', async () => {
      const adminId = 99;
      mockPostRepository.findBySlug.mockResolvedValue(mockPost);
      mockPostRepository.delete.mockResolvedValue(undefined);

      await service.deletePost(adminId, 'test-post', Role.ADMIN);

      expect(mockPostRepository.delete).toHaveBeenCalled();
    });

    it('should throw PostError.PostNotFound when post does not exist', async () => {
      mockPostRepository.findBySlug.mockResolvedValue(null);

      await expect(
        service.deletePost(userId, 'non-existent', Role.AUTHOR),
      ).rejects.toThrow(PostError.PostNotFound().message);
    });

    it('should throw PostError.Forbidden when non-owner AUTHOR tries to delete', async () => {
      const otherUserId = 99;
      mockPostRepository.findBySlug.mockResolvedValue(mockPost);

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
      mockPostRepository.findBySlug.mockResolvedValue(mockPost);
      mockPostRepository.update.mockResolvedValue(publishedPost);

      const result = await service.publishPost(userId, 'test-post', Role.AUTHOR);

      expect(mockPostRepository.update).toHaveBeenCalledWith('test-post', {
        published: true,
      });
      expect(result).toEqual(publishedPost);
    });

    it('should allow ADMIN to publish any post', async () => {
      const adminId = 99;
      const publishedPost = { ...mockPost, published: true };
      mockPostRepository.findBySlug.mockResolvedValue(mockPost);
      mockPostRepository.update.mockResolvedValue(publishedPost);

      const result = await service.publishPost(adminId, 'test-post', Role.ADMIN);

      expect(result).toEqual(publishedPost);
    });

    it('should throw PostError.PostNotFound when post does not exist', async () => {
      mockPostRepository.findBySlug.mockResolvedValue(null);

      await expect(
        service.publishPost(userId, 'non-existent', Role.AUTHOR),
      ).rejects.toThrow(PostError.PostNotFound().message);
    });

    it('should throw PostError.Forbidden when non-owner AUTHOR tries to publish', async () => {
      const otherUserId = 99;
      mockPostRepository.findBySlug.mockResolvedValue(mockPost);

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
      mockPostRepository.findBySlug.mockResolvedValue(publishedMockPost);
      mockPostRepository.update.mockResolvedValue(unpublishedPost);

      const result = await service.unpublishPost(userId, 'test-post', Role.AUTHOR);

      expect(mockPostRepository.update).toHaveBeenCalledWith('test-post', {
        published: false,
      });
      expect(result).toEqual(unpublishedPost);
    });

    it('should allow ADMIN to unpublish any post', async () => {
      const adminId = 99;
      const unpublishedPost = { ...publishedMockPost, published: false };
      mockPostRepository.findBySlug.mockResolvedValue(publishedMockPost);
      mockPostRepository.update.mockResolvedValue(unpublishedPost);

      const result = await service.unpublishPost(adminId, 'test-post', Role.ADMIN);

      expect(result).toEqual(unpublishedPost);
    });

    it('should throw PostError.PostNotFound when post does not exist', async () => {
      mockPostRepository.findBySlug.mockResolvedValue(null);

      await expect(
        service.unpublishPost(userId, 'non-existent', Role.AUTHOR),
      ).rejects.toThrow(PostError.PostNotFound().message);
    });

    it('should throw PostError.Forbidden when non-owner AUTHOR tries to unpublish', async () => {
      const otherUserId = 99;
      mockPostRepository.findBySlug.mockResolvedValue(publishedMockPost);

      await expect(
        service.unpublishPost(otherUserId, 'test-post', Role.AUTHOR),
      ).rejects.toThrow(PostError.Forbidden().message);
    });
  });

  // ─── updateCover ──────────────────────────────────────────────────────────

  describe('updateCover', () => {
    const userId = 10;
    const dto: EditCoverDto = {
      coverImageUrl: 'https://example.com/cover.jpg',
    };

    it('should update and return the post with the new cover when owner calls it', async () => {
      const updatedPost = { ...mockPost, coverImageUrl: dto.coverImageUrl };
      mockPostRepository.findBySlug.mockResolvedValue(mockPost);
      mockPostRepository.update.mockResolvedValue(updatedPost);

      const result = await service.updateCover(userId, 'test-post', Role.AUTHOR, dto);

      expect(mockPostRepository.update).toHaveBeenCalledWith('test-post', {
        coverImageUrl: dto.coverImageUrl,
      });
      expect(result).toEqual(updatedPost);
    });

    it('should allow ADMIN to update the cover of any post', async () => {
      const adminId = 99;
      const updatedPost = { ...mockPost, coverImageUrl: dto.coverImageUrl };
      mockPostRepository.findBySlug.mockResolvedValue(mockPost);
      mockPostRepository.update.mockResolvedValue(updatedPost);

      const result = await service.updateCover(adminId, 'test-post', Role.ADMIN, dto);

      expect(mockPostRepository.update).toHaveBeenCalled();
      expect(result).toEqual(updatedPost);
    });

    it('should throw PostError.PostNotFound when post does not exist', async () => {
      mockPostRepository.findBySlug.mockResolvedValue(null);

      await expect(
        service.updateCover(userId, 'non-existent', Role.AUTHOR, dto),
      ).rejects.toThrow(PostError.PostNotFound().message);
    });

    it('should throw PostError.Forbidden when non-owner AUTHOR tries to update cover', async () => {
      const otherUserId = 99;
      mockPostRepository.findBySlug.mockResolvedValue(mockPost);

      await expect(
        service.updateCover(otherUserId, 'test-post', Role.AUTHOR, dto),
      ).rejects.toThrow(PostError.Forbidden().message);
    });
  });
});
