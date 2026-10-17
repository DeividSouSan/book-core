# Guia do book-core para agentes consumidores

> Documento em linguagem natural. Se você é um agente que precisa criar, validar,
> persistir ou exibir livros sem ler o código-fonte, este é o ponto de partida.
> Nomes de campos, valores e códigos de erro estão em inglês exatamente como aparecem
> no código — não traduza ao montar payloads.

Leitura complementar:

- Uso rápido e API: [README](../README.md)
- Regras de contribuição: [AGENTS](../AGENTS.md)

## 1. O que é o book-core

O `book-core` é o núcleo de domínio de livros: um pacote TypeScript independente de
frameworks, organizado em DDD + Arquitetura Hexagonal.

- **Domínio (`core/domain`):** entidade `Book`, Value Objects (`Title`, `Author`,
  `ISBN`, `ReadingStatus`, `Rating`, `Language`) e erros com `code` legível por máquina.
- **Aplicação (`core/application`):** a porta `BookRepository` — um contrato de
  persistência que qualquer adapter pode implementar.
- **Adapters (`adapters/outbound`):** `BookRepositoryMemory` (Map em memória, ideal
  para Node/testes) e `BookRepositoryLocalStorage` (persiste em `localStorage`).

Filosofia para agentes: **composição em vez de imposição**. O núcleo oferece
comportamentos úteis com defaults sensatos, mas o consumidor usa só o que precisa e pode
substituir convenções (ex.: ordenação de títulos) sem quebrar o modelo.

Requisito: Node 18+ (o `id` usa `crypto.randomUUID()`).

## 2. O que é a entidade Livro

Um **Livro** é um registro de catálogo identificado por um `id` único (UUID).
Dois livros são iguais **se e somente se** têm o mesmo `id` — mesmo com título,
autores e ISBN idênticos, são dois registros diferentes.

Um objeto inválido nunca existe: se qualquer campo obrigatório for inválido, a criação
lança um erro de domínio em vez de devolver um livro quebrado.

Dois ciclos de vida:

- **`create` — cadastrar um livro novo:** você informa strings/números simples,
  o núcleo valida tudo, gera um `id` novo e devolve um `Book`.
- **`restore` — reidratar um livro já salvo:** usado pelos repositórios ao carregar
  dados. Recebe objetos de domínio já validados e o `id` original. Não gera `id`
  novo e não revalida. Agentes quase nunca chamam `restore` diretamente.

## 3. Campos do Livro — visão rápida

| Campo         | Obrigatório?                | Tipo no `create` | Default     | Exemplo                      |
| ------------- | --------------------------- | ---------------- | ----------- | ---------------------------- |
| `title`       | Sim                         | `string`         | —           | `"The Hobbit"`               |
| `authors`     | Sim (lista, pode ser vazia) | `string[]`       | —           | `["J.R.R. Tolkien"]` ou `[]` |
| `isbn`        | Sim                         | `string`         | —           | `"978-0-261-10221-7"`        |
| `status`      | Não                         | `string`         | `"TO_READ"` | `"READING"`                  |
| `rating`      | Não                         | `number`         | ausente     | `4`                          |
| `observation` | Não                         | `string`         | ausente     | `"Buy second copy"`          |
| `language`    | Não                         | `string`         | ausente     | `"en"`                       |
| `id`          | Não informar (gerado)       | —                | UUID gerado | `"550e8400-..."`             |

Regra de bolso: **para cadastrar, informe no mínimo `title`, `authors` (pode ser `[]`)
e `isbn`.** Todo o resto é opcional. Nunca informe `id` no `create`.

Após criado, cada campo vira um Value Object tipado: `book.title.value`,
`book.authors[i].value`, `book.isbn.value`, `book.status.value`,
`book.rating?.value`, `book.observation`, `book.language?.value`, `book.id`.

## 4. Regras por campo

### 4.1 `id` — identidade gerada

- Gerado automaticamente com UUID v4 a cada `create`.
- Duas criações com dados idênticos geram `id`s diferentes.
- Igualdade (`equals`) compara só o `id`.
- Um `id` inexistente resulta em `undefined` (`findById`) ou erro `BOOK.NOT_FOUND`
  (`getById`, `delete`).

### 4.2 `title` — título (obrigatório)

- Deve conter ao menos um caractere não-espaço. Espaços nas bordas são removidos
  (`"  The Hobbit  "` vira `"The Hobbit"`).
- Vazio ou só espaços → erro `TITLE.EMPTY`.
- Sem limite de tamanho nem restrição de caracteres.
- `book.title.sortKey()` devolve o título normalizado para ordenação (seção 8),
  sem alterar o valor original.

### 4.3 `authors` — lista de autores (obrigatória, pode ser vazia)

- O parâmetro é sempre uma lista. **Lista vazia (`[]`) é válida** e significa
  "autor ainda desconhecido" — um estado legítimo de catálogo.
- Cada nome informado deve ser não-vazio após remover espaços das bordas.
  Um item vazio (`""`, `"   "`) → erro `AUTHOR.EMPTY`.
- Nomes são armazenados com trim. Sem exigência de sobrenome, ordem, unicidade
  ou quantidade. Se o seu app exige ao menos um autor, essa é regra do app.

### 4.4 `isbn` — ISBN-10 ou ISBN-13 (obrigatório)

Aceita os dois formatos oficiais:

- **ISBN-13:** 13 dígitos (ex.: `"9780261102217"`).
- **ISBN-10:** 10 caracteres; os 9 primeiros são dígitos e o último pode ser dígito
  ou `X` (normalizado para maiúsculo). Ex.: `"0306406152"`, `"048665088X"`.

Validação, nesta ordem:

1. Hífens e espaços são só apresentação — removidos antes de validar.
   `"978-0-261-10221-7"` e `"9780261102217"` são o mesmo ISBN.
2. Vazio após remoção → erro `ISBN.EMPTY`.
3. Tamanho diferente de 10 ou 13 → erro `ISBN.INVALID_LENGTH` (com `actualLength`).
4. Caracteres fora do permitido → erro `ISBN.INVALID_CHARACTERS` (com
   `invalidCharacters` e `format`: `"isbn10"` ou `"isbn13"`). No ISBN-10, `X` só
   vale na última posição.
5. Dígito verificador errado → erro `ISBN.INVALID_CHECKSUM` (com `format`,
   `expectedCheckDigit` e `actualCheckDigit`).

O valor armazenado é o normalizado e `book.isbn.format` indica `"isbn10"` ou
`"isbn13"`. Comparações (`equals`, `findByIsbn`) usam o valor normalizado.

### 4.5 `status` — situação de leitura (opcional, default `TO_READ`)

Valores aceitos, exatos após remover espaços (sensível a maiúsculas):

| Valor     | Significado         |
| --------- | ------------------- |
| `TO_READ` | Quero ler (default) |
| `READING` | Estou lendo         |
| `READ`    | Já li               |
| `DROPPED` | Abandonei           |

- Omitido no `create` → `TO_READ`.
- Qualquer outra string (ex.: `"PAUSED"`, `"to_read"`) → erro `READING_STATUS.INVALID`.
- No `restore`, ausência também restaura para `TO_READ` (dados salvos antes do campo).

### 4.6 `rating` — nota de 1 a 5 (opcional)

- Inteiro de 1 (pior) a 5 (melhor). Constantes: `MINIMUM_RATING = 1`, `MAXIMUM_RATING = 5`.
- Meio ponto (`4.5`), zero ou acima de 5 → erro `RATING.INVALID`.
- Ausente significa "ainda não avaliado". O núcleo não exige que só livro `READ`
  tenha nota.

### 4.7 `language` — idioma (opcional)

- Códigos aceitos: `"pt"` e `"en"`. Constante: `SUPPORTED_LANGUAGE_CODES = ["pt", "en"]`.
- Normalizado para minúsculo (`"EN"`, `" Pt "` valem).
- Outro código (ex.: `"fr"`) → erro `LANGUAGE.INVALID`.
- Ausente significa "idioma desconhecido".

### 4.8 `observation` — observação livre (opcional)

- Texto livre, sem validação nem normalização — guardado como informado.
- Ausente significa "sem observação". Uso típico: notas pessoais, "capa danificada".

## 5. Criar vs. restaurar

**`Book.create({ title, authors, isbn, status?, rating?, observation?, language? })`**

- Entrada: tipos primitivos (`string`, `string[]`, `number`).
- Valida cada campo, gera `id` (UUID), aplica default `TO_READ`.
- Lança erro de domínio na primeira validação que falhar.
- É o que agentes usam para cadastrar.

**`Book.restore({ id, title, authors, isbn, status?, rating?, observation?, language? })`**

- Entrada: Value Objects já construídos (`Title`, `Author[]`, `ISBN`, ...), mais `id`.
- Não valida de novo, não gera `id`. `status` ausente → `TO_READ`.
- Usado internamente pelos repositórios. Agentes não chamam diretamente, exceto ao
  implementar um adapter próprio.

## 6. Como persistir — a porta `BookRepository`

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
- `findByIsbn` exige um `ISBN` criado com `ISBN.create(...)`. Hífens não importam.
- `BookRepositoryMemory`: `Map` em memória — some ao reiniciar. Ideal para Node/testes.
- `BookRepositoryLocalStorage`: JSON achatado sob `DEFAULT_STORAGE_KEY`. Aceita qualquer
  `StorageLike` (`getItem`/`setItem`). JSON inválido ou dado inválido ao recarregar
  → erro `STORAGE.CORRUPTED` (o app decide se limpa, migra ou exibe o problema).

## 7. Erros e códigos legíveis por máquina

Todos estendem `DomainError`. Capture pelo tipo ou por `DomainError` + `code`.
Cada erro carrega `receivedValue` e, quando faz sentido, contexto extra.

| `code`                    | Classe                       | Quando acontece                               | Contexto extra                                     |
| ------------------------- | ---------------------------- | --------------------------------------------- | -------------------------------------------------- |
| `TITLE.EMPTY`             | `EmptyTitleError`            | Título vazio ou só espaços                    | `receivedValue: string`                            |
| `AUTHOR.EMPTY`            | `EmptyAuthorError`           | Algum autor vazio ou só espaços               | `receivedValue: string`                            |
| `ISBN.EMPTY`              | `EmptyISBNError`             | ISBN vazio / só espaços / só hífens           | `receivedValue: string`                            |
| `ISBN.INVALID_LENGTH`     | `InvalidISBNLengthError`     | Tamanho diferente de 10 e de 13               | `actualLength: number`                             |
| `ISBN.INVALID_CHARACTERS` | `InvalidISBNCharactersError` | Símbolos fora do permitido                    | `invalidCharacters: string[]`, `format`            |
| `ISBN.INVALID_CHECKSUM`   | `InvalidISBNChecksumError`   | Dígito verificador não confere                | `format`, `expectedCheckDigit`, `actualCheckDigit` |
| `READING_STATUS.INVALID`  | `InvalidReadingStatusError`  | Status fora dos quatro aceitos                | `supportedStatuses: string[]`                      |
| `RATING.INVALID`          | `InvalidRatingError`         | Nota não-inteira ou fora de 1–5               | `minimum`, `maximum`                               |
| `LANGUAGE.INVALID`        | `InvalidLanguageError`       | Código fora de `pt`, `en`                     | `supportedLanguages: string[]`                     |
| `BOOK.NOT_FOUND`          | `BookNotFoundError`          | `getById`/`delete` com `id` inexistente       | `bookId: string`                                   |
| `STORAGE.CORRUPTED`       | `StorageCorruptedError`      | Storage ilegível (JSON ruim ou dado inválido) | `key: string`, `cause?: unknown`                   |

```ts
import { Book, DomainError, EmptyTitleError } from "book-core";

try {
  Book.create({ title: "  ", authors: [], isbn: "978-0-261-10221-7" });
} catch (error) {
  if (error instanceof EmptyTitleError) {
    console.log(error.code); // "TITLE.EMPTY"
  }
  if (error instanceof DomainError) {
    console.error(error.code, error.message);
  }
}
```

## 8. Ordenação de títulos — convenção substituível

O núcleo **sugere** ignorar artigos iniciais em português e inglês ao ordenar, mas
não impõe: o consumidor pode injetar a própria estratégia.

- Padrão (`defaultTitleSortKey`): remove `The`, `A`, `An`, `O`, `A`, `Os`, `As`
  no início (case-insensitive). `"The Starless Sea"` ordena como `"Starless Sea"`.
- Uso: `books.sort((a, b) => a.title.sortKey().localeCompare(b.title.sortKey()))`.
- Estratégia própria: qualquer função `(title: string) => string` passada a
  `sortKey(strategy)`. Constantes: `ENGLISH_TITLE_ARTICLES`,
  `PORTUGUESE_TITLE_ARTICLES`, `DEFAULT_TITLE_ARTICLES`.

## 9. Exemplos de payloads

Cadastro mínimo válido (`status` vira `TO_READ`):

```json
{
  "title": "The Hobbit",
  "authors": [],
  "isbn": "978-0-261-10221-7"
}
```

Cadastro completo válido:

```json
{
  "title": "The Hobbit",
  "authors": ["J.R.R. Tolkien"],
  "isbn": "978-0-261-10221-7",
  "status": "READING",
  "rating": 4,
  "observation": "Buy second copy",
  "language": "en"
}
```

Exemplos inválidos e o erro esperado:

| Payload                                                                            | Erro                     |
| ---------------------------------------------------------------------------------- | ------------------------ |
| `{ "title": "   ", "authors": [], "isbn": "978-0-261-10221-7" }`                   | `TITLE.EMPTY`            |
| `{ "title": "X", "authors": [""], "isbn": "978-0-261-10221-7" }`                   | `AUTHOR.EMPTY`           |
| `{ "title": "X", "authors": [], "isbn": "12345" }`                                 | `ISBN.INVALID_LENGTH`    |
| `{ "title": "X", "authors": [], "isbn": "9780306406156" }`                         | `ISBN.INVALID_CHECKSUM`  |
| `{ "title": "X", "authors": [], "isbn": "978-0-261-10221-7", "status": "PAUSED" }` | `READING_STATUS.INVALID` |
| `{ "title": "X", "authors": [], "isbn": "978-0-261-10221-7", "rating": 7 }`        | `RATING.INVALID`         |
| `{ "title": "X", "authors": [], "isbn": "978-0-261-10221-7", "language": "fr" }`   | `LANGUAGE.INVALID`       |

Checklist para montar um cadastro válido:

1. Tenho `title` não-vazio? Se não, rejeite antes de chamar o núcleo.
2. Tenho `isbn` com 10 ou 13 dígitos (ignorando hífens/espaços) e dígito verificador
   correto? Se não souber, deixe o núcleo validar e repasse o `code`.
3. `authors` é uma lista? Pode ser `[]`. Item vazio → `AUTHOR.EMPTY`.
4. Opcionais só envie se souber: `status` exatamente um dos quatro, `rating` inteiro
   1–5, `language` `pt` ou `en`, `observation` texto livre.
5. Nunca invente `id` no cadastro — leia o `book.id` retornado para buscas futuras.
