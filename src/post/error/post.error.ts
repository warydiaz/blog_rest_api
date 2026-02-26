import { BaseError } from '../../error';

export class PostError extends BaseError {
  private constructor(status: number, message: string) {
    super('post-error', status, message);
  }

  static SlugAlreadyExists() {
    return new PostError(409, `Post with this slug already exists`);
  }

  static PostNotFound() {
    return new PostError(404, `Post not found`);
  }

  static Forbidden() {
    return new PostError(403, `You are not authorized to perform this action`);
  }
}
