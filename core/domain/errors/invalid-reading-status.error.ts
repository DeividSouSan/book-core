import { DomainError } from "./domain.error";
import { SUPPORTED_READING_STATUSES } from "../value-objects/reading-status.constants";

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
