import { DomainError } from "./domain.error.js";
import { SUPPORTED_READING_STATUSES } from "../value-objects/reading-status.constants.js";

export class InvalidReadingStatusError extends DomainError {
  constructor(
    public readonly receivedValue: string,
    public readonly supportedStatuses: readonly string[] = SUPPORTED_READING_STATUSES,
  ) {
    super(
      `Invalid reading status: "${receivedValue}". Supported statuses: ${supportedStatuses.join(", ")}.`,
      "READING_STATUS.INVALID",
    );
  }
}
