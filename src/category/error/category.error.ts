import { BaseError } from '../../error';

export class CategoryError extends BaseError {
  private constructor(status: number, message: string) {
    super('category-error', status, message);
  }

  static CategoryNotFound() {
    return new CategoryError(404, `Category not found`);
  }
}
