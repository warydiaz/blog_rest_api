import { BaseError } from '../../error';

export class UserError extends BaseError {
  private constructor(status: number, message: string) {
    super('user-error', status, message);
  }

  static EmailAlreadyTaken() {
    return new UserError(409, `Email is already taken`);
  }

  static UserNotFound() {
    return new UserError(404, `User not found`);
  }
}
