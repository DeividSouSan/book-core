import { InvalidUuidError } from "../errors/invalid-uuid.error.js";
import { UUID_PATTERN } from "./uuid.constants.js";

export class Uuid {
  private constructor(public readonly value: string) {}

  static create(receivedValue: string): Uuid {
    // Any UUID version is accepted (not just v4): the core only needs a
    // well-formed identity, the caller chooses which generator to use.
    if (!UUID_PATTERN.test(receivedValue)) {
      throw new InvalidUuidError(receivedValue);
    }

    return new Uuid(receivedValue);
  }

  equals(other: Uuid): boolean {
    return this.value === other.value;
  }
}
