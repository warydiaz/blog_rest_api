import { BaseError } from '../../error';

export class UserError extends BaseError {
  private constructor(message: string) {
    super('user-error', message);
  }

  static AlreadyTaken() {
    return new UserError(`User already exists`);
  }

  static InvalidCredentials() {
    return new UserError(`Invalid credentials`);
  }
}
