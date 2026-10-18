import { describe, expect, it } from "vitest";
import { catchError } from "../../../helpers/catch-error";
import { InvalidRatingError } from "../../../../core/domain/errors/invalid-rating.error";
import { Rating } from "../../../../core/domain/value-objects/rating";

describe("Rating", () => {
  describe("create", () => {
    it("creates a minimum rating", () => {
      expect(Rating.create(1).value).toBe(1);
    });

    it("creates a maximum rating", () => {
      expect(Rating.create(5).value).toBe(5);
    });

    it("throws InvalidRatingError for a rating below the minimum", () => {
      const error = catchError(() => Rating.create(0));

      expect(error).toBeInstanceOf(InvalidRatingError);
      expect((error as InvalidRatingError).receivedValue).toBe(0);
      expect((error as InvalidRatingError).code).toBe("RATING.INVALID");
    });

    it("throws InvalidRatingError for a rating above the maximum", () => {
      const error = catchError(() => Rating.create(6));

      expect(error).toBeInstanceOf(InvalidRatingError);
      expect((error as InvalidRatingError).receivedValue).toBe(6);
    });

    it("throws InvalidRatingError for a non-integer rating", () => {
      const error = catchError(() => Rating.create(3.5));

      expect(error).toBeInstanceOf(InvalidRatingError);
      expect((error as InvalidRatingError).receivedValue).toBe(3.5);
    });
  });

  describe("equals", () => {
    it("returns true for the same value", () => {
      expect(Rating.create(4).equals(Rating.create(4))).toBe(true);
    });

    it("returns false for different values", () => {
      expect(Rating.create(4).equals(Rating.create(5))).toBe(false);
    });
  });
});
