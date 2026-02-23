import { BaseError } from '../../error';

export class AuthError extends BaseError {
  private constructor(message: string) {
    super('auth-error', message);
  }

  static AlreadyTaken() {
    return new AuthError(`User already exists`);
  }

  static InvalidCredentials() {
    return new AuthError(`Invalid credentials`);
  }
}
