export abstract class BaseError extends Error {
  protected constructor(
    readonly code: string,
    readonly message: string,
  ) {
    super(message);
  }
}
