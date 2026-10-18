import { EmptyGenreIdError } from "../errors/empty-genre-id.error.js";

// Opaque genre identifier. The core does not normalize, deduplicate or keep a
// genre catalog: "Fantasy" and "fantasy" are distinct ids and both are accepted.
// Any normalization rule belongs to the consumer.
export class GenreId {
  private constructor(public readonly value: string) {}

  static create(receivedValue: string): GenreId {
    // Only empty or whitespace-only input is rejected. The received value is
    // kept intact (no trim, no case change) so any desired normalization
    // stays under the consumer's control.
    if (receivedValue.trim().length === 0) {
      throw new EmptyGenreIdError(receivedValue);
    }

    return new GenreId(receivedValue);
  }

  equals(other: GenreId): boolean {
    return this.value === other.value;
  }
}
