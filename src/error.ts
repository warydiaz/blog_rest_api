export abstract class BaseError extends Error {
  protected constructor(
    readonly code: string,
    readonly status: number,
    readonly message: string,
  ) {
    super(message);
  }
}
