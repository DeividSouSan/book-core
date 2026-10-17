import { InvalidReadingStatusError } from "../errors/invalid-reading-status.error";
import { SUPPORTED_READING_STATUSES } from "./reading-status.constants";

export class ReadingStatus {
  private constructor(public readonly value: string) {}

  static create(receivedValue: string): ReadingStatus {
    const status = receivedValue.trim();

    if (!SUPPORTED_READING_STATUSES.includes(status)) {
      throw new InvalidReadingStatusError(receivedValue);
    }

    return new ReadingStatus(status);
  }

  equals(other: ReadingStatus): boolean {
    return this.value === other.value;
  }
}
