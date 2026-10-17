import { describe, expect, it } from "vitest";
import { InvalidReadingStatusError } from "../../../core/domain/errors/invalid-reading-status.error";
import { ReadingStatus } from "../../../core/domain/value-objects/reading-status";

function catchError(action: () => unknown): unknown {
  try {
    action();
    return undefined;
  } catch (error) {
    return error;
  }
}

describe("ReadingStatus", () => {
  describe("create", () => {
    it("creates TO_READ status", () => {
      expect(ReadingStatus.create("TO_READ").value).toBe("TO_READ");
    });

    it("creates READING status", () => {
      expect(ReadingStatus.create("READING").value).toBe("READING");
    });

    it("creates READ status", () => {
      expect(ReadingStatus.create("READ").value).toBe("READ");
    });

    it("creates DROPPED status", () => {
      expect(ReadingStatus.create("DROPPED").value).toBe("DROPPED");
    });

    it("throws InvalidReadingStatusError for an unknown status", () => {
      const error = catchError(() => ReadingStatus.create("PAUSED"));

      expect(error).toBeInstanceOf(InvalidReadingStatusError);
      expect((error as InvalidReadingStatusError).receivedValue).toBe("PAUSED");
      expect((error as InvalidReadingStatusError).code).toBe("READING_STATUS.INVALID");
    });

    it("throws InvalidReadingStatusError for an empty string", () => {
      const error = catchError(() => ReadingStatus.create(""));

      expect(error).toBeInstanceOf(InvalidReadingStatusError);
      expect((error as InvalidReadingStatusError).receivedValue).toBe("");
    });
  });

  describe("equals", () => {
    it("returns true for the same value", () => {
      expect(ReadingStatus.create("READ").equals(ReadingStatus.create("READ"))).toBe(true);
    });

    it("returns false for different values", () => {
      expect(ReadingStatus.create("READ").equals(ReadingStatus.create("DROPPED"))).toBe(false);
    });
  });
});
