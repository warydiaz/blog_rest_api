import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { CreatePostDto, EditPostDto } from './dto';
import { PostError } from './error/post.error';
import { Role } from '@prisma/client';

describe('PostController', () => {
  let controller: PostController;
  let postService: jest.Mocked<PostService>;

  const mockPostService: jest.Mocked<Partial<PostService>> = {
    getAllPosts: jest.fn(),
    getPostBySlug: jest.fn(),
    createPost: jest.fn(),
    updatePost: jest.fn(),
    deletePost: jest.fn(),
    publishPost: jest.fn(),
    unpublishPost: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [{ provide: PostService, useValue: mockPostService }],
    }).compile();

    controller = module.get<PostController>(PostController);
    postService = module.get(PostService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── getAllPosts ───────────────────────────────────────────────────────────

  describe('getAllPosts', () => {
    it('should call postService.getAllPosts and return results', async () => {
      postService.getAllPosts.mockResolvedValue([mockPost]);

      const result = await controller.getAllPosts();

      expect(postService.getAllPosts).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockPost]);
    });
  });

  // ─── getPostBySlug ────────────────────────────────────────────────────────

  describe('getPostBySlug', () => {
    it('should call postService.getPostBySlug with the slug and return the post', async () => {
      postService.getPostBySlug.mockResolvedValue(mockPost);

      const result = await controller.getPostBySlug('test-post');

      expect(postService.getPostBySlug).toHaveBeenCalledWith('test-post');
      expect(result).toEqual(mockPost);
    });

    it('should propagate PostError.PostNotFound when post does not exist', async () => {
      postService.getPostBySlug.mockRejectedValue(PostError.PostNotFound());

      await expect(controller.getPostBySlug('non-existent')).rejects.toThrow(
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

    it('should call postService.createPost with userId and dto', async () => {
      postService.createPost.mockResolvedValue(mockPost);

      await controller.createPost(userId, dto);

      expect(postService.createPost).toHaveBeenCalledWith(userId, dto);
      expect(postService.createPost).toHaveBeenCalledTimes(1);
    });

    it('should return the created post', async () => {
      postService.createPost.mockResolvedValue(mockPost);

      const result = await controller.createPost(userId, dto);

      expect(result).toEqual(mockPost);
    });

    it('should propagate PostError.SlugAlreadyExists when slug is taken', async () => {
      postService.createPost.mockRejectedValue(PostError.SlugAlreadyExists());

      await expect(controller.createPost(userId, dto)).rejects.toThrow(
        PostError.SlugAlreadyExists().message,
      );
    });
  });

  // ─── updatePost ───────────────────────────────────────────────────────────

  describe('updatePost', () => {
    const userId = 10;
    const dto: EditPostDto = { title: 'Updated Title' };

    it('should call postService.updatePost with all args and return updated post', async () => {
      const updatedPost = { ...mockPost, title: 'Updated Title' };
      postService.updatePost.mockResolvedValue(updatedPost);

      const result = await controller.updatePost(userId, 'test-post', dto, Role.AUTHOR);

      expect(postService.updatePost).toHaveBeenCalledWith(userId, 'test-post', dto, Role.AUTHOR);
      expect(result).toEqual(updatedPost);
    });

    it('should propagate PostError.PostNotFound when post does not exist', async () => {
      postService.updatePost.mockRejectedValue(PostError.PostNotFound());

      await expect(
        controller.updatePost(userId, 'non-existent', dto, Role.AUTHOR),
      ).rejects.toThrow(PostError.PostNotFound().message);
    });

    it('should propagate PostError.Forbidden when user is not the owner', async () => {
      postService.updatePost.mockRejectedValue(PostError.Forbidden());

      await expect(
        controller.updatePost(userId, 'test-post', dto, Role.AUTHOR),
      ).rejects.toThrow(PostError.Forbidden().message);
    });
  });

  // ─── deletePost ───────────────────────────────────────────────────────────

  describe('deletePost', () => {
    const userId = 10;

    it('should call postService.deletePost with all args', async () => {
      postService.deletePost.mockResolvedValue(undefined);

      await controller.deletePost(userId, 'test-post', Role.AUTHOR);

      expect(postService.deletePost).toHaveBeenCalledWith(userId, 'test-post', Role.AUTHOR);
      expect(postService.deletePost).toHaveBeenCalledTimes(1);
    });

    it('should resolve without error when post is deleted', async () => {
      postService.deletePost.mockResolvedValue(undefined);

      await expect(
        controller.deletePost(userId, 'test-post', Role.AUTHOR),
      ).resolves.toBeUndefined();
    });

    it('should propagate PostError.PostNotFound when post does not exist', async () => {
      postService.deletePost.mockRejectedValue(PostError.PostNotFound());

      await expect(
        controller.deletePost(userId, 'non-existent', Role.AUTHOR),
      ).rejects.toThrow(PostError.PostNotFound().message);
    });

    it('should propagate PostError.Forbidden when user is not the owner', async () => {
      postService.deletePost.mockRejectedValue(PostError.Forbidden());

      await expect(
        controller.deletePost(userId, 'test-post', Role.AUTHOR),
      ).rejects.toThrow(PostError.Forbidden().message);
    });
  });

  // ─── publishPost ──────────────────────────────────────────────────────────

  describe('publishPost', () => {
    const userId = 10;

    it('should call postService.publishPost with all args and return published post', async () => {
      const publishedPost = { ...mockPost, published: true };
      postService.publishPost.mockResolvedValue(publishedPost);

      const result = await controller.publishPost(userId, 'test-post', Role.AUTHOR);

      expect(postService.publishPost).toHaveBeenCalledWith(userId, 'test-post', Role.AUTHOR);
      expect(result).toEqual(publishedPost);
    });

    it('should propagate PostError.PostNotFound when post does not exist', async () => {
      postService.publishPost.mockRejectedValue(PostError.PostNotFound());

      await expect(
        controller.publishPost(userId, 'non-existent', Role.AUTHOR),
      ).rejects.toThrow(PostError.PostNotFound().message);
    });

    it('should propagate PostError.Forbidden when user is not the owner', async () => {
      postService.publishPost.mockRejectedValue(PostError.Forbidden());

      await expect(
        controller.publishPost(userId, 'test-post', Role.AUTHOR),
      ).rejects.toThrow(PostError.Forbidden().message);
    });
  });

  // ─── unpublishPost ────────────────────────────────────────────────────────

  describe('unpublishPost', () => {
    const userId = 10;

    it('should call postService.unpublishPost with all args and return unpublished post', async () => {
      const unpublishedPost = { ...mockPost, published: false };
      postService.unpublishPost.mockResolvedValue(unpublishedPost);

      const result = await controller.unpublishPost(userId, 'test-post', Role.AUTHOR);

      expect(postService.unpublishPost).toHaveBeenCalledWith(userId, 'test-post', Role.AUTHOR);
      expect(result).toEqual(unpublishedPost);
    });

    it('should propagate PostError.PostNotFound when post does not exist', async () => {
      postService.unpublishPost.mockRejectedValue(PostError.PostNotFound());

      await expect(
        controller.unpublishPost(userId, 'non-existent', Role.AUTHOR),
      ).rejects.toThrow(PostError.PostNotFound().message);
    });

    it('should propagate PostError.Forbidden when user is not the owner', async () => {
      postService.unpublishPost.mockRejectedValue(PostError.Forbidden());

      await expect(
        controller.unpublishPost(userId, 'test-post', Role.AUTHOR),
      ).rejects.toThrow(PostError.Forbidden().message);
    });
  });
});
