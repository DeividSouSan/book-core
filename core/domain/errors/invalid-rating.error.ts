import { DomainError } from "./domain.error.js";
import { MAXIMUM_RATING, MINIMUM_RATING } from "../value-objects/rating.constants.js";

export class InvalidRatingError extends DomainError {
  constructor(
    public readonly receivedValue: number,
    public readonly minimum: number = MINIMUM_RATING,
    public readonly maximum: number = MAXIMUM_RATING,
  ) {
    super(
      `Invalid rating: ${receivedValue}. Expected an integer between ${minimum} and ${maximum}.`,
      "RATING.INVALID",
    );
  }
}
