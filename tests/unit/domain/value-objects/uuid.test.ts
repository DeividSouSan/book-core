import { describe, expect, it } from "vitest";
import { catchError } from "../../../helpers/catch-error";
import { InvalidUuidError } from "../../../../core/domain/errors/invalid-uuid.error";
import { Uuid } from "../../../../core/domain/value-objects/uuid";

describe("Uuid", () => {
  describe("create", () => {
    it("creates a version 4 UUID", () => {
      const uuid = Uuid.create("550e8400-e29b-41d4-a716-446655440000");

      expect(uuid.value).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("accepts other UUID versions", () => {
      expect(Uuid.create("6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b").value).toBe(
        "6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b",
      );
    });

    it("normalizes uppercase UUIDs to lowercase", () => {
      const uuid = Uuid.create("550E8400-E29B-41D4-A716-446655440000");

      expect(uuid.value).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("throws InvalidUuidError for an empty string", () => {
      const error = catchError(() => Uuid.create(""));

      expect(error).toBeInstanceOf(InvalidUuidError);
      expect((error as InvalidUuidError).receivedValue).toBe("");
      expect((error as InvalidUuidError).code).toBe("UUID.INVALID");
    });

    it("throws InvalidUuidError for a non-UUID string", () => {
      const error = catchError(() => Uuid.create("fixed-id-1234"));

      expect(error).toBeInstanceOf(InvalidUuidError);
      expect((error as InvalidUuidError).receivedValue).toBe("fixed-id-1234");
      expect((error as InvalidUuidError).code).toBe("UUID.INVALID");
    });

    it("throws InvalidUuidError for a UUID without hyphens", () => {
      expect(catchError(() => Uuid.create("550e8400e29b41d4a716446655440000"))).toBeInstanceOf(
        InvalidUuidError,
      );
    });

    it("throws InvalidUuidError for a truncated UUID", () => {
      expect(catchError(() => Uuid.create("550e8400-e29b-41d4-a716"))).toBeInstanceOf(
        InvalidUuidError,
      );
    });
  });

  describe("equals", () => {
    it("returns true for the same value", () => {
      expect(
        Uuid.create("550e8400-e29b-41d4-a716-446655440000").equals(
          Uuid.create("550e8400-e29b-41d4-a716-446655440000"),
        ),
      ).toBe(true);
    });

    it("treats UUIDs differing only by case as equal", () => {
      expect(
        Uuid.create("550E8400-E29B-41D4-A716-446655440000").equals(
          Uuid.create("550e8400-e29b-41d4-a716-446655440000"),
        ),
      ).toBe(true);
    });

    it("returns false for different values", () => {
      expect(
        Uuid.create("550e8400-e29b-41d4-a716-446655440000").equals(
          Uuid.create("6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b"),
        ),
      ).toBe(false);
    });
  });
});
