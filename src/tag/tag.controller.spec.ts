import { Test, TestingModule } from '@nestjs/testing';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto';
import { TagError } from './error';
import { JwtGuard } from '../auth/guard';

describe('TagController', () => {
  let controller: TagController;
  let tagService: jest.Mocked<TagService>;

  const mockTagService: jest.Mocked<Partial<TagService>> = {
    getAllTags: jest.fn(),
    getTagBySlug: jest.fn(),
    createTag: jest.fn(),
    deleteTag: jest.fn(),
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
      controllers: [TagController],
      providers: [{ provide: TagService, useValue: mockTagService }],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TagController>(TagController);
    tagService = module.get(TagService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── getAllTags ────────────────────────────────────────────────────────────

  describe('getAllTags', () => {
    it('should call tagService.getAllTags and return results', async () => {
      tagService.getAllTags.mockResolvedValue([mockTag]);

      const result = await controller.getAllTags();

      expect(tagService.getAllTags).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockTag]);
    });
  });

  // ─── getTagBySlug ─────────────────────────────────────────────────────────

  describe('getTagBySlug', () => {
    it('should call tagService.getTagBySlug with the slug and return the tag with posts', async () => {
      const tagWithPosts = { ...mockTag, posts: [mockPost] };
      tagService.getTagBySlug.mockResolvedValue(tagWithPosts);

      const result = await controller.getTagBySlug('nestjs');

      expect(tagService.getTagBySlug).toHaveBeenCalledWith('nestjs');
      expect(result).toEqual(tagWithPosts);
    });

    it('should propagate TagError.TagNotFound when tag does not exist', async () => {
      tagService.getTagBySlug.mockRejectedValue(TagError.TagNotFound());

      await expect(controller.getTagBySlug('non-existent')).rejects.toThrow(
        TagError.TagNotFound().message,
      );
    });
  });

  // ─── createTag ────────────────────────────────────────────────────────────

  describe('createTag', () => {
    const dto: CreateTagDto = { name: 'nestjs', slug: 'nestjs' };

    it('should call tagService.createTag with dto and return the tag', async () => {
      tagService.createTag.mockResolvedValue(mockTag);

      const result = await controller.createTag(dto);

      expect(tagService.createTag).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockTag);
    });

    it('should propagate TagError.TagNameTaken when name is already taken', async () => {
      tagService.createTag.mockRejectedValue(TagError.TagNameTaken(dto.name));

      await expect(controller.createTag(dto)).rejects.toThrow(
        TagError.TagNameTaken(dto.name).message,
      );
    });

    it('should propagate TagError.TagSlugTaken when slug is already taken', async () => {
      tagService.createTag.mockRejectedValue(TagError.TagSlugTaken(dto.slug));

      await expect(controller.createTag(dto)).rejects.toThrow(
        TagError.TagSlugTaken(dto.slug).message,
      );
    });
  });

  // ─── deleteTag ────────────────────────────────────────────────────────────

  describe('deleteTag', () => {
    it('should call tagService.deleteTag with the slug', async () => {
      tagService.deleteTag.mockResolvedValue(undefined);

      await controller.deleteTag('nestjs');

      expect(tagService.deleteTag).toHaveBeenCalledWith('nestjs');
      expect(tagService.deleteTag).toHaveBeenCalledTimes(1);
    });

    it('should resolve without error when tag is deleted', async () => {
      tagService.deleteTag.mockResolvedValue(undefined);

      await expect(controller.deleteTag('nestjs')).resolves.toBeUndefined();
    });

    it('should propagate TagError.TagNotFound when tag does not exist', async () => {
      tagService.deleteTag.mockRejectedValue(TagError.TagNotFound());

      await expect(controller.deleteTag('non-existent')).rejects.toThrow(
        TagError.TagNotFound().message,
      );
    });
  });
});
