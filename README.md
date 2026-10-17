# book-core

Núcleo de domínio de livros independente de frameworks, seguindo Arquitetura Hexagonal + DDD, pronto para ser consumido por adaptadores (API REST, CLI, repositório PostgreSQL, memória, etc.).

> Guia em linguagem natural para agentes: [docs/book-core-guide.md](./docs/book-core-guide.md) — o que é a entidade Livro, campos obrigatórios/opcionais, regras de validação, repositório, erros e exemplos.

## Instalação (projeto local)

Enquanto o pacote não está publicado no npm, consuma apontando para a pasta local:

```bash
npm install ../book-core
```

Isso cria um symlink. O script `prepare` do pacote roda `npm run build` automaticamente e gera a pasta `dist/`, que é o ponto de entrada (`main`).

> Requer Node 18+ (usa `crypto.randomUUID()`).

## Uso rápido

```ts
import { Book, BookRepositoryMemory, BookRepositoryLocalStorage, DomainError } from "book-core";

// Criar um livro (valida título, autores, ISBN, status, rating e idioma)
const book = Book.create({
  title: "The Hobbit",
  authors: ["J.R.R. Tolkien"],
  isbn: "978-0-261-10221-7",
  status: "READING",
  rating: 4,
  language: "en",
});

// Persistir (memória — ideal para Node/testes)
const repository = new BookRepositoryMemory();
await repository.save(book);

const found = await repository.getById(book.id);
console.log(found.title.sortKey()); // "Hobbit" — ignora o artigo para ordenação

// No navegador, troque o adaptador (persiste em localStorage):
// const repository = new BookRepositoryLocalStorage();
```

### Ordenação de títulos (sugestão substituível)

O núcleo sugere ignorar artigos iniciais em português e inglês (`The`, `A`, `An`, `O`, `A`, `Os`, `As`) ao ordenar. Use o padrão ou injete sua própria estratégia:

```ts
books.sort((a, b) => a.title.sortKey().localeCompare(b.title.sortKey()));

// Estratégia própria:
const onlyThe = (title: string) => title.replace(/^The\s+/i, "");
books.sort((a, b) => a.title.sortKey(onlyThe).localeCompare(b.title.sortKey(onlyThe)));
```

## O que o pacote exporta

| Categoria            | Exports                                                                                                                                                                                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entidade             | `Book`                                                                                                                                                                                                                                                            |
| Value Objects        | `ISBN`, `Title`, `Author`, `Language`, `ReadingStatus`, `Rating`                                                                                                                                                                                                  |
| Ordenação            | `defaultTitleSortKey`, `removeLeadingArticles`, `TitleSortKeyStrategy` (tipo)                                                                                                                                                                                     |
| Constantes           | `ISBN_10_LENGTH`, `ISBN_13_LENGTH`, `SUPPORTED_LANGUAGES`, `MINIMUM_RATING`, `MAXIMUM_RATING`, `READING_STATUSES`, `DEFAULT_TITLE_ARTICLES`, `ENGLISH_TITLE_ARTICLES`, `PORTUGUESE_TITLE_ARTICLES`, entre outras                                                  |
| Portas (interfaces)  | `BookRepository` (tipo)                                                                                                                                                                                                                                           |
| Adaptadores          | `BookRepositoryMemory`, `BookRepositoryLocalStorage`, `StorageLike` (tipo), `DEFAULT_STORAGE_KEY`                                                                                                                                                                 |
| Erros de domínio     | `DomainError` (base), `BookNotFoundError`, `EmptyISBNError`, `InvalidISBNLengthError`, `InvalidISBNCharactersError`, `InvalidISBNChecksumError`, `EmptyTitleError`, `EmptyAuthorError`, `InvalidLanguageError`, `InvalidReadingStatusError`, `InvalidRatingError` |
| Erros de adaptadores | `StorageCorruptedError`                                                                                                                                                                                                                                           |

## Tratando erros

Todos os erros estendem `DomainError` e carregam um `code` legível por máquina mais campos de contexto:

```ts
import { Book, DomainError, EmptyTitleError } from "book-core";

try {
  Book.create({ title: "  ", authors: [], isbn: "978-0-261-10221-7" });
} catch (error) {
  if (error instanceof EmptyTitleError) {
    console.log(error.code); // "TITLE.EMPTY"
    console.log(error.receivedValue); // "  "
  }
  if (error instanceof DomainError) {
    // captura genérica de qualquer falha do núcleo
    console.error(error.code, error.message);
  }
}
```

Principais códigos: `BOOK.NOT_FOUND`, `ISBN.EMPTY`, `ISBN.INVALID_LENGTH`, `ISBN.INVALID_CHARACTERS`, `ISBN.INVALID_CHECKSUM`, `TITLE.EMPTY`, `AUTHOR.EMPTY`, `LANGUAGE.INVALID`, `READING_STATUS.INVALID`, `RATING.INVALID`, `STORAGE.CORRUPTED`.

## Estrutura de pastas

```text
book-core/
├── core/
│   ├── domain/          # Entidades, Value Objects e exceções de domínio (sem dependências externas)
│   └── application/     # Casos de uso e portas (interfaces)
├── adapters/
│   ├── inbound/         # Controladores REST, CLI, etc.
│   └── outbound/        # Repositórios (PostgreSQL, memória), presenters
├── docs/                # Guias em linguagem natural ([book-core-guide.md](./docs/book-core-guide.md))
├── dist/                # Saída compilada (gerada pelo build, não versionada)
└── tests/               # Testes unitários e de integração
```

## Regras de trabalho

As regras de contribuição estão centralizadas em [AGENTS.md](./AGENTS.md).
