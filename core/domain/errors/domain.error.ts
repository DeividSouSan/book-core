export abstract class DomainError extends Error {
  protected constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    // Keep the subclass name as the error name (e.g. "EmptyISBNError") so logs stay readable.
    this.name = new.target.name;
  }
}
