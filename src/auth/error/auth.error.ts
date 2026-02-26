import { BaseError } from '../../error';

export class AuthError extends BaseError {
  private constructor(status: number, message: string) {
    super('auth-error', status, message);
  }

  static AlreadyTaken() {
    return new AuthError(409, `User already exists`);
  }

  static InvalidCredentials() {
    return new AuthError(409, `Invalid credentials`);
  }

  static InsufficientRole() {
    return new AuthError(
      403,
      `You don't have the required role to perform this action`,
    );
  }
}
