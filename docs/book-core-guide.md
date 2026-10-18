# Guia do book-core

Documento em linguagem natural para qualquer pessoa — humana ou automação — que queira
entender a estrutura do projeto sem ler o código-fonte: quais entidades e Value Objects
existem, quais campos são obrigatórios ou opcionais, valores aceitos, limitações do núcleo
e como persistir livros.

Nomes de campos, valores e códigos de erro estão em inglês exatamente como aparecem
no código — não traduza ao montar payloads.

Leitura complementar:

- Uso rápido e API: [README](../README.md)
- Regras de contribuição: [AGENTS](../AGENTS.md)

## 1. O que é o book-core

O `book-core` é o núcleo de domínio de livros: um pacote TypeScript independente de
frameworks, organizado em DDD + Arquitetura Hexagonal.

- **Domínio (`core/domain`):** entidade `Book`, Value Objects (`Title`, `Author`,
  `ISBN`, `ReadingStatus`, `Rating`, `Language`, `Uuid`) e erros de domínio com `code`
  legível por máquina.
- **Aplicação (`core/application`):** a porta `BookRepository` — contrato de persistência
  que qualquer adapter pode implementar.
- **Adapters (`adapters/outbound`):** `BookRepositoryMemory` (Map em memória, ideal para
  Node e testes) e `BookRepositoryLocalStorage` (persiste em `localStorage`).

### Filosofia do núcleo

- **Convenções úteis como padrão:** o núcleo oferece comportamentos com defaults sensatos,
  mas não impõe nada que não seja universal.
- **Composição em vez de imposição:** o consumidor usa só o que precisa e pode substituir
  convenções (ex.: ordenação de títulos) sem quebrar o modelo.
- **Sem dependência de runtime:** o domínio não importa `node:crypto` nem nenhum módulo de
  plataforma. Quem chama gera o UUID e injeta — funciona em Node, navegador, edge/workers
  sem polyfill.

## 2. Estrutura de pastas e exports principais

```text
book-core/
├── core/
│   ├── domain/          # Entidade Book, Value Objects e erros de domínio (sem dependências externas)
│   └── application/     # Porta BookRepository (interface de persistência)
├── adapters/
│   └── outbound/        # BookRepositoryMemory e BookRepositoryLocalStorage
├── docs/                # Guias em linguagem natural (este arquivo)
├── dist/                # Saída compilada (gerada pelo build, não versionada)
└── tests/               # Testes unitários
```

O que o pacote exporta (`import { ... } from "book-core"`):

| Categoria        | Exports                                                                                                                                                                                                                                                                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entidade         | `Book`                                                                                                                                                                                                                                                                                                                              |
| Value Objects    | `ISBN`, `Title`, `Author`, `Language`, `ReadingStatus`, `Rating`, `Uuid`, `GenreId`                                                                                                                                                                                                                                                 |
| Ordenação        | `defaultTitleSortKey`, `removeLeadingArticles`, `TitleSortKeyStrategy` (tipo)                                                                                                                                                                                                                                                       |
| Constantes       | `ISBN_10_LENGTH`, `ISBN_13_LENGTH`, `SUPPORTED_LANGUAGE_CODES`, `MINIMUM_RATING`, `MAXIMUM_RATING`, `SUPPORTED_READING_STATUSES`, `DEFAULT_TITLE_ARTICLES`, `ENGLISH_TITLE_ARTICLES`, `PORTUGUESE_TITLE_ARTICLES`, `UUID_PATTERN`, entre outras                                                                                     |
| Porta            | `BookRepository` (tipo)                                                                                                                                                                                                                                                                                                             |
| Adapters         | `BookRepositoryMemory`, `BookRepositoryLocalStorage`, `StorageLike` (tipo), `DEFAULT_STORAGE_KEY`                                                                                                                                                                                                                                   |
| Erros de domínio | `DomainError` (base), `BookNotFoundError`, `EmptyISBNError`, `InvalidISBNLengthError`, `InvalidISBNCharactersError`, `InvalidISBNChecksumError`, `EmptyTitleError`, `EmptyAuthorError`, `EmptyGenreIdError`, `DuplicateGenreIdError`, `InvalidLanguageError`, `InvalidUuidError`, `InvalidReadingStatusError`, `InvalidRatingError` |
| Erro de adapter  | `StorageCorruptedError`                                                                                                                                                                                                                                                                                                             |

## 3. A entidade Book

Um **Livro** é um registro de catálogo identificado por um `id` único (UUID).

- Dois livros são iguais **se e somente se** têm o mesmo `id` — mesmo com título,
  autores e ISBN idênticos, são registros diferentes.
- Um objeto inválido nunca existe: se qualquer campo obrigatório for inválido, a criação
  lança um erro de domínio em vez de devolver um livro quebrado.

### Dois ciclos de vida

| Ciclo                    | Quando usar                                | O que recebe                                                                                                | Valida?                |
| ------------------------ | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ---------------------- |
| `Book.create(props, id)` | Cadastrar um livro novo                    | Tipos primitivos (`string`, `string[]`, `number`) mais o `id` (UUID gerado pelo chamador) como 2º parâmetro | Sim — valida tudo      |
| `Book.restore(props)`    | Reidratar um livro já salvo (repositórios) | Value Objects já construídos (`Uuid`, `Title`, `Author[]`, `ISBN`, ...)                                     | Não — confia nos dados |

### Ler os campos após criar

Cada campo vira um Value Object tipado:

- `book.id.value` — `string` (UUID)
- `book.title.value` — `string`
- `book.authors[i].value` — `string` (cada autor)
- `book.isbn.value` — `string` (ISBN normalizado); `book.isbn.format` — `"isbn10"` ou `"isbn13"`
- `book.status.value` — `string`
- `book.rating?.value` — `number` (ausente se não avaliado)
- `book.observation` — `string` (ausente se não informado)
- `book.language?.value` — `string` (ausente se desconhecido)
- `book.genres[i].value` — `string` (cada gênero associado)

## 4. Campos do Book — referência rápida

| Campo         | Obrigatório?       | Tipo na criação | Default     | Exemplo                                  |
| ------------- | ------------------ | --------------- | ----------- | ---------------------------------------- |
| `id`          | Sim (2º parâmetro) | `string` (UUID) | —           | `"550e8400-e29b-41d4-a716-446655440000"` |
| `title`       | Sim                | `string`        | —           | `"The Hobbit"`                           |
| `authors`     | Sim (lista)        | `string[]`      | —           | `["J.R.R. Tolkien"]` ou `[]`             |
| `isbn`        | Sim                | `string`        | —           | `"978-0-261-10221-7"`                    |
| `status`      | Não                | `string`        | `"TO_READ"` | `"READING"`                              |
| `rating`      | Não                | `number`        | ausente     | `4`                                      |
| `observation` | Não                | `string`        | ausente     | `"Buy second copy"`                      |
| `language`    | Não                | `string`        | ausente     | `"en"`                                   |
| `favorited`   | Não                | `boolean`       | ausente     | `true`                                   |
| `cover`       | Não                | `string`        | ausente     | `"https://example.com/capa.jpg"`         |
| `genres`      | Não                | `string[]`      | `[]`        | `["Fantasy", "Sci-Fi"]`                  |

Regra de bolso: **para cadastrar, gere um UUID, informe `title`, `authors` (pode ser
`[]`) e `isbn`.** Todo o resto é opcional.

## 5. Regras por campo

### 5.1 `id` — identidade injetada (obrigatória)

- O chamador gera e injeta como 2º parâmetro: `Book.create(props, id)`.
- Deve ser um UUID válido: forma `8-4-4-4-12` hexadecimal, qualquer versão, maiúsculas
  aceitas. Guardado como está, sem normalização. Inválido → erro `UUID.INVALID`
  (contexto: `receivedValue`).
- Igualdade (`Book.equals`) compara via `Uuid.equals` — dois livros com o mesmo `id`
  são iguais.
- Onde gerar: Node 18+/navegador/edge → `crypto.randomUUID()` (WebCrypto global);
  React Native → polyfill; testes → string UUID fixa.
- Um `id` inexistente em buscas resulta em `undefined` (`findById`) ou erro
  `BOOK.NOT_FOUND` (`getById`, `delete`).

### 5.2 `title` — título (obrigatório)

- Deve conter ao menos um caractere não-espaço. Espaços nas bordas são removidos
  (`"  The Hobbit  "` vira `"The Hobbit"`).
- Vazio ou só espaços → erro `TITLE.EMPTY` (contexto: `receivedValue`).
- Sem limite de tamanho nem restrição de caracteres.
- `book.title.sortKey()` devolve o título normalizado para ordenação, sem alterar
  o valor original. Estratégia substituível (seção 9).

### 5.3 `authors` — lista de autores (obrigatória, pode ser vazia)

- O parâmetro é sempre uma lista. Lista vazia (`[]`) é válida e significa
  "autor ainda desconhecido" — um estado legítimo de catálogo.
- Cada nome informado deve ser não-vazio após remover espaços das bordas. Um item
  vazio (`""`, `"   "`) → erro `AUTHOR.EMPTY` (contexto: `receivedValue`).
- Nomes são armazenados com trim. Sem exigência de sobrenome, ordem, unicidade
  ou quantidade. Se o seu app exige ao menos um autor, essa é regra do app, não
  do núcleo.

### 5.4 `isbn` — ISBN-10 ou ISBN-13 (obrigatório)

Aceita os dois formatos oficiais:

- **ISBN-13:** 13 dígitos (ex.: `"9780261102217"`).
- **ISBN-10:** 10 caracteres; os 9 primeiros são dígitos e o último pode ser dígito
  ou `X` (normalizado para maiúsculo). Ex.: `"0306406152"`, `"048665088X"`.

Validação, nesta ordem:

1. Hífens e espaços são só apresentação — removidos antes de validar.
   `"978-0-261-10221-7"` e `"9780261102217"` são o mesmo ISBN.
2. Vazio após remoção → erro `ISBN.EMPTY` (contexto: `receivedValue`).
3. Tamanho diferente de 10 ou 13 → erro `ISBN.INVALID_LENGTH`
   (contexto: `actualLength`).
4. Caracteres fora do permitido → erro `ISBN.INVALID_CHARACTERS` (contextos:
   `invalidCharacters`, `format`). No ISBN-10, `X` só vale na última posição.
5. Dígito verificador errado → erro `ISBN.INVALID_CHECKSUM` (contextos: `format`,
   `expectedCheckDigit`, `actualCheckDigit`).

O valor armazenado é o normalizado e `book.isbn.format` indica `"isbn10"` ou
`"isbn13"`. Comparações (`equals`, `findByIsbn`) usam o valor normalizado.

### 5.5 `status` — situação de leitura (opcional, default `TO_READ`)

Valores aceitos, exatos após remover espaços (sensível a maiúsculas):

| Valor     | Significado         |
| --------- | ------------------- |
| `TO_READ` | Quero ler (default) |
| `READING` | Estou lendo         |
| `READ`    | Já li               |
| `DROPPED` | Abandonei           |

- Omitido na criação → `TO_READ`.
- Qualquer outra string (ex.: `"PAUSED"`, `"to_read"`) → erro
  `READING_STATUS.INVALID` (contextos: `receivedValue`, `supportedStatuses`).
- No `restore`, ausência também restaura para `TO_READ` (dados salvos antes do
  campo existirem).

### 5.6 `rating` — nota de 1 a 5 (opcional)

- Inteiro de 1 (pior) a 5 (melhor). Constantes: `MINIMUM_RATING = 1`,
  `MAXIMUM_RATING = 5`.
- Meio ponto (`4.5`), zero ou acima de 5 → erro `RATING.INVALID` (contextos:
  `receivedValue`, `minimum`, `maximum`).
- Ausente significa "ainda não avaliado". O núcleo não exige que só livro `READ`
  tenha nota — isso é regra do app.

### 5.7 `language` — idioma (opcional)

- Códigos aceitos: `"pt"` e `"en"`. Constante: `SUPPORTED_LANGUAGE_CODES =
["pt", "en"]`.
- Normalizado para minúsculo (`"EN"`, `" Pt "` valem).
- Outro código (ex.: `"fr"`) → erro `LANGUAGE.INVALID` (contextos:
  `receivedValue`, `supportedLanguages`).
- Ausente significa "idioma desconhecido".

### 5.8 `observation` — observação livre (opcional)

- Texto livre, sem validação nem normalização — guardado como informado.
- Ausente significa "sem observação". Uso típico: notas pessoais, "capa danificada".

### 5.9 `favorited` — marca de favorito (opcional)

- Valor booleano simples, sem validação de domínio. `true` indica que o livro é
  favorito, `false` indica que não é.
- Ausente significa "não favoritado". Como não há validação, qualquer valor
  booleano é aceito — cabe ao app consumidor decidir como usar essa marca.
- `book.favorited` lê o valor (`true`, `false` ou `undefined`).

### 5.10 `cover` — URL da capa do livro (opcional)

- URL livre da imagem da capa do livro. Sem validação de formato de URL — cabe
  ao app consumidor garantir que seja um endereço válido.
- Espaços nas bordas são removidos (`trim`).
- Ausente significa "sem capa". Uso típico: link para a imagem da capa em um
  serviço de hospedagem de imagens.
- `book.cover` lê o valor (`string` ou `undefined`).

### 5.11 `genres` — gêneros associados (opcional)

- Lista opcional de identificadores de gênero. `create` aceita `genres?: string[]`; cada item vira um `GenreId` (identificador opaco, validado como não-vazio). `restore` aceita `genres?: GenreId[]`, com default `[]` quando ausente.
- A ordem de entrada é preservada.
- O núcleo **não normaliza nem muda caixa**: `"Fantasy"` e `"fantasy"` são identificadores distintos e ambos são aceitos. Qualquer normalização (ex.: minúsculo, alias) é regra do app consumidor.
- Duplicatas exatas (comparação case-sensitive) em `create` lançam `DuplicateGenreIdError` (`code: "GENRE_ID.DUPLICATED"`, contexto `duplicatedValue`).
- `book.genres` é `readonly GenreId[]`. O núcleo guarda uma cópia do array, então mutar o array de entrada depois de criar não afeta o livro.

## 6. Criar vs. restaurar

### `Book.create(props, id)`

```ts
Book.create(
  {
    title: string;
    authors: string[];
    isbn: string;
    status?: string;
    rating?: number;
    observation?: string;
    language?: string;
    genres?: string[];
  },
  id: string, // UUID gerado pelo chamador
): Book
```

- Entrada: tipos primitivos mais o `id` como 2º parâmetro (não vai dentro do objeto
  de dados).
- Valida o `id` via `Uuid` e cada campo, aplica default `TO_READ`.
- Lança erro de domínio na primeira validação que falhar.

### `Book.restore(props)`

```ts
Book.restore({
  id: Uuid;
  title: Title;
  authors: Author[];
  isbn: ISBN;
  status?: ReadingStatus;
  rating?: Rating;
  observation?: string;
  language?: Language;
  genres?: GenreId[];
}): Book
```

- Entrada: Value Objects já construídos.
- Não valida de novo. `status` ausente → `TO_READ`.
- Usado internamente pelos repositórios. Chamar diretamente só ao implementar um
  adapter próprio.

## 7. Persistência — porta `BookRepository`

Todo repositório implementa o mesmo contrato:

| Método             | O que faz                               | Se não achar           |
| ------------------ | --------------------------------------- | ---------------------- |
| `save(book)`       | Insere ou atualiza pelo `id` (upsert)   | —                      |
| `findById(id)`     | Busca por `id`                          | Retorna `undefined`    |
| `getById(id)`      | Busca por `id`                          | Lança `BOOK.NOT_FOUND` |
| `findByIsbn(isbn)` | Busca por ISBN (recebe `ISBN` validado) | Retorna `undefined`    |
| `findAll()`        | Lista todos                             | Retorna `[]`           |
| `delete(id)`       | Remove por `id`                         | Lança `BOOK.NOT_FOUND` |

Notas:

- `save` nunca valida — a validação já aconteceu no `create`. Salvar duas vezes o
  mesmo `id` sobrescreve.
- `findByIsbn` exige um `ISBN` criado com `ISBN.create(...)`. Hífens não importam
  na comparação porque o valor é normalizado.
- `BookRepositoryMemory`: `Map` em memória — dados somem ao reiniciar. Ideal para
  Node e testes.
- `BookRepositoryLocalStorage`: JSON achatado sob `DEFAULT_STORAGE_KEY`
  (`"book-core:books"`). Aceita qualquer `StorageLike` (`getItem`/`setItem`). JSON
  inválido ou dado inválido ao recarregar → erro `STORAGE.CORRUPTED` (o app decide
  se limpa, migra ou exibe o problema).

## 8. Erros de domínio

Todos estendem `DomainError`, que expõe `code` (string legível por máquina) e
`message`. Capture pelo tipo ou por `code`.

Nem todo erro carrega `receivedValue`: `BookNotFoundError` traz `bookId`, e
`StorageCorruptedError` traz `key` e `cause`.

| `code`                    | Classe                       | Quando acontece                               | Contexto extra                                     |
| ------------------------- | ---------------------------- | --------------------------------------------- | -------------------------------------------------- |
| `TITLE.EMPTY`             | `EmptyTitleError`            | Título vazio ou só espaços                    | `receivedValue: string`                            |
| `AUTHOR.EMPTY`            | `EmptyAuthorError`           | Algum autor vazio ou só espaços               | `receivedValue: string`                            |
| `ISBN.EMPTY`              | `EmptyISBNError`             | ISBN vazio / só espaços / só hífens           | `receivedValue: string`                            |
| `ISBN.INVALID_LENGTH`     | `InvalidISBNLengthError`     | Tamanho diferente de 10 ou 13                 | `actualLength: number`                             |
| `ISBN.INVALID_CHARACTERS` | `InvalidISBNCharactersError` | Símbolos fora do permitido                    | `invalidCharacters: string[]`, `format`            |
| `ISBN.INVALID_CHECKSUM`   | `InvalidISBNChecksumError`   | Dígito verificador não confere                | `format`, `expectedCheckDigit`, `actualCheckDigit` |
| `READING_STATUS.INVALID`  | `InvalidReadingStatusError`  | Status fora dos quatro aceitos                | `supportedStatuses: string[]`                      |
| `RATING.INVALID`          | `InvalidRatingError`         | Nota não-inteira ou fora de 1–5               | `minimum`, `maximum`                               |
| `LANGUAGE.INVALID`        | `InvalidLanguageError`       | Código fora de `pt`, `en`                     | `supportedLanguages: string[]`                     |
| `UUID.INVALID`            | `InvalidUuidError`           | `id` fora da forma UUID `8-4-4-4-12`          | `receivedValue: string`                            |
| `GENRE_ID.EMPTY`          | `EmptyGenreIdError`          | Identificador de gênero vazio ou só espaços   | `receivedValue: string`                            |
| `GENRE_ID.DUPLICATED`     | `DuplicateGenreIdError`      | Identificador de gênero repetido em `create`  | `duplicatedValue: string`                          |
| `BOOK.NOT_FOUND`          | `BookNotFoundError`          | `getById`/`delete` com `id` inexistente       | `bookId: string`                                   |
| `STORAGE.CORRUPTED`       | `StorageCorruptedError`      | Storage ilegível (JSON ruim ou dado inválido) | `key: string`, `cause?: unknown`                   |

Exemplo de captura:

```ts
import { Book, DomainError, EmptyTitleError } from "book-core";

try {
  Book.create(
    { title: "  ", authors: [], isbn: "978-0-261-10221-7" },
    "550e8400-e29b-41d4-a716-446655440000",
  );
} catch (error) {
  if (error instanceof EmptyTitleError) {
    console.log(error.code); // "TITLE.EMPTY"
    console.log(error.receivedValue); // "  "
  }
  if (error instanceof DomainError) {
    console.error(error.code, error.message);
  }
}
```

## 9. Ordenação de títulos — convenção substituível

O núcleo **sugere** ignorar artigos iniciais em português e inglês ao ordenar, mas
não impõe: o consumidor pode injetar a própria estratégia.

- Padrão (`defaultTitleSortKey`): remove `The`, `A`, `An`, `O`, `A`, `Os`, `As`
  no início (case-insensitive). `"The Starless Sea"` ordena como `"Starless Sea"`.
- Uso: `books.sort((a, b) => a.title.sortKey().localeCompare(b.title.sortKey()))`.
- Estratégia própria: qualquer função `(title: string) => string` passada a
  `sortKey(strategy)`.
- Constantes exportadas: `ENGLISH_TITLE_ARTICLES`,
  `PORTUGUESE_TITLE_ARTICLES`, `DEFAULT_TITLE_ARTICLES`.

## 10. Exemplos de payloads

Assinatura: `Book.create(dados, id)` — o `id` (UUID gerado pelo chamador) é o 2º
parâmetro, não vai dentro do objeto de dados.

### Cadastro mínimo válido (`status` vira `TO_READ`)

```ts
Book.create(
  {
    title: "The Hobbit",
    authors: [],
    isbn: "978-0-261-10221-7",
  },
  "550e8400-e29b-41d4-a716-446655440000",
);
```

### Cadastro completo válido

```ts
Book.create(
  {
    title: "The Hobbit",
    authors: ["J.R.R. Tolkien"],
    isbn: "978-0-261-10221-7",
    status: "READING",
    rating: 4,
    observation: "Buy second copy",
    language: "en",
    favorited: true,
    cover: "https://example.com/capa.jpg",
  },
  "550e8400-e29b-41d4-a716-446655440000",
);
```

### Exemplos inválidos e o erro esperado

| Payload                                                                            | Erro                     |
| ---------------------------------------------------------------------------------- | ------------------------ |
| `{ "title": "   ", "authors": [], "isbn": "978-0-261-10221-7" }`                   | `TITLE.EMPTY`            |
| `{ "title": "X", "authors": [""], "isbn": "978-0-261-10221-7" }`                   | `AUTHOR.EMPTY`           |
| `{ "title": "X", "authors": [], "isbn": "12345" }`                                 | `ISBN.INVALID_LENGTH`    |
| `{ "title": "X", "authors": [], "isbn": "9780306406156" }`                         | `ISBN.INVALID_CHECKSUM`  |
| `{ "title": "X", "authors": [], "isbn": "978-0-261-10221-7", "status": "PAUSED" }` | `READING_STATUS.INVALID` |
| `{ "title": "X", "authors": [], "isbn": "978-0-261-10221-7", "rating": 7 }`        | `RATING.INVALID`         |
| `{ "title": "X", "authors": [], "isbn": "978-0-261-10221-7", "language": "fr" }`   | `LANGUAGE.INVALID`       |

### Checklist para montar um cadastro válido

1. Gere um UUID válido (ex.: `crypto.randomUUID()`) e passe como 2º parâmetro.
   Inválido → `UUID.INVALID`.
2. Tenho `title` não-vazio? Se não, rejeite antes de chamar o núcleo.
3. Tenho `isbn` com 10 ou 13 dígitos (ignorando hífens/espaços) e dígito verificador
   correto? Se não souber, deixe o núcleo validar e repasse o `code`.
4. `authors` é uma lista? Pode ser `[]`. Item vazio → `AUTHOR.EMPTY`.
5. Opcionais só envie se souber: `status` exatamente um dos quatro, `rating` inteiro
   1–5, `language` `pt` ou `en`, `observation` texto livre, `favorited` booleano,
   `cover` URL da capa.
6. Guarde o `id` usado para buscas futuras (`findById`, `getById`, `delete` recebem
   a string; `book.id.value` lê o valor do livro).

## 11. Limitações e escopo do núcleo

O que o núcleo **não** faz (essas são regras do app consumidor):

- Não exige que só livro com status `READ` tenha `rating`.
- Não exige ao menos um autor (`[]` é válido).
- Não gera o `id` nem persiste dados por conta própria — cabe ao consumidor gerar
  o UUID e escolher um adapter.
- Não impõe idiomas além de `pt` e `en`, nem artigos de ordenação além dos defaults
  — tudo substituível.
- Não normaliza nomes de gênero, não deduplica conceitos e não mantém catálogo de
  gêneros — `"Fantasy"` e `"fantasy"` são identificadores distintos e ambos são
  aceitos. Normalização, catálogo de gêneros e ciclo de vida (criar/renomear/remover
  gêneros) são extensões do app consumidor.

## 12. Nota de migração (breaking change)

- `Book.create` agora exige o `id` como 2º parâmetro: `Book.create(props, id)`.
  Antes o núcleo gerava via `node:crypto`; agora o chamador gera e injeta.
- `book.id` é um `Uuid`, não mais `string`: leia com `book.id.value`.
- `Book.restore` recebe `id: Uuid` (use `Uuid.create(...)`).
- Repositórios: `findById`/`getById`/`delete` continuam recebendo `string`.
- Dados persistidos com id não-UUID falham ao carregar com `STORAGE.CORRUPTED`
  (antes passavam) — migre os ids ou trate a recuperação no app.
