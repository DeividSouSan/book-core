import { DomainError } from "../../core/domain/errors/domain.error.js";

// Thrown when the storage content cannot be read: invalid JSON or values that
// fail domain validation. Fails loudly instead of silently dropping the user's
// data — the consuming app can catch it and decide whether to clear, migrate
// or surface the problem.
export class StorageCorruptedError extends DomainError {
  constructor(
    public readonly key: string,
    public readonly cause?: unknown,
  ) {
    super(
      `Corrupted data found in storage key "${key}". The stored value is not readable.`,
      "STORAGE.CORRUPTED",
    );
  }
}
