import { BaseError } from '../../error';

export class CommentError extends BaseError {
  private constructor(status: number, message: string) {
    super('comment-error', status, message);
  }

  static CommentNotFound() {
    return new CommentError(404, `Comment not found`);
  }

  static Forbidden() {
    return new CommentError(
      403,
      `You are not authorized to perform this action`,
    );
  }
}
