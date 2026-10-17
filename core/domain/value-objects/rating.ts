import { InvalidRatingError } from "../errors/invalid-rating.error";
import { MAXIMUM_RATING, MINIMUM_RATING } from "./rating.constants";

export class Rating {
  private constructor(public readonly value: number) {}

  static create(receivedValue: number): Rating {
    // A book rating is an integer on a scale from 1 (worst) to 5 (best);
    // half points are not supported so that consumers compare scores reliably.
    if (
      !Number.isInteger(receivedValue) ||
      receivedValue < MINIMUM_RATING ||
      receivedValue > MAXIMUM_RATING
    ) {
      throw new InvalidRatingError(receivedValue);
    }

    return new Rating(receivedValue);
  }

  equals(other: Rating): boolean {
    return this.value === other.value;
  }
}
