import { BaseError } from '../../error';

export class TagError extends BaseError {
  private constructor(status: number, message: string) {
    super('tag-error', status, message);
  }

  static TagNotFound() {
    return new TagError(404, `Tag not found`);
  }

  static TagNameTaken(name: string) {
    return new TagError(400, `Tag name '${name}' is already taken`);
  }

  static TagSlugTaken(slug: string) {
    return new TagError(400, `Tag slug '${slug}' is already taken`);
  }
}
