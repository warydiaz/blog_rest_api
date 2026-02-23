import { BaseError } from '../../error';

export class UserError extends BaseError {
  private constructor(message: string) {
    super('user-error', message);
  }

  static EmailAlreadyTaken() {
    return new UserError(`Email is already taken`);
  }

  static InvalidCredentials() {
    return new UserError(`Invalid credentials`);
  }

  static UserNotFound() {
    return new UserError(`User not found`);
  }
}
