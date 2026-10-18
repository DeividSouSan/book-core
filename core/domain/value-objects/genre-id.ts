import { EmptyGenreIdError } from "../errors/empty-genre-id.error.js";

// Identificador opaco de gênero. O núcleo não normaliza, não deduplica e não
// mantém catálogo de gêneros: "Fantasy" e "fantasy" são ids distintos e ambos
// são aceitos. Qualquer regra de normalização cabe ao consumidor.
export class GenreId {
  private constructor(public readonly value: string) {}

  static create(receivedValue: string): GenreId {
    // Apenas vazio ou somente-whitespace é rejeitado. O valor recebido é
    // mantido intacto (sem trim nem change de case) para ficar a cargo do
    // consumidor qualquer normalização desejada.
    if (receivedValue.trim().length === 0) {
      throw new EmptyGenreIdError(receivedValue);
    }

    return new GenreId(receivedValue);
  }

  equals(other: GenreId): boolean {
    return this.value === other.value;
  }
}
