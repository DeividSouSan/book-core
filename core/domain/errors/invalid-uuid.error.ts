import { DomainError } from "./domain.error.js";

export class InvalidUuidError extends DomainError {
  constructor(public readonly receivedValue: string) {
    super(
      `Invalid UUID: "${receivedValue}". Expected 8-4-4-4-12 hexadecimal characters.`,
      "UUID.INVALID",
    );
  }
}
