# Guia do adapter de local storage

Documento complementar para quem usa — ou pretende implementar algo parecido
com — o `BookRepositoryLocalStorage`: decisões de design que não são óbvias
lendo o código, o formato exato persistido e como se recuperar de dados
corrompidos.

Leitura complementar:

- Estrutura do núcleo e API: [Guia do book-core](book-core-guide.md)
- Regras de contribuição: [AGENTS](../AGENTS.md)

## 1. Papel do adapter

`BookRepositoryLocalStorage` implementa a porta `BookRepository` persistindo
os livros como **um único array JSON** gravado sob uma chave — não um item por
livro.

- Qualquer objeto com `getItem`/`setItem` serve: `localStorage` do navegador,
  `sessionStorage`, ou um fake em testes. A interface mínima se chama
  `StorageLike` e evita depender da lib DOM no `tsconfig`.
- Construtor: `new BookRepositoryLocalStorage(storage?, key?)`. Sem storage
  explícito usa `globalThis.localStorage`; sem disponível, lança erro pedindo
  um `StorageLike` explicitamente.
- Chave padrão: `DEFAULT_STORAGE_KEY` (`"book-core:books"`). Chaves diferentes
  guardam acervos independentes.

## 2. Formato armazenado

Cada livro é gravado como objeto plano (value objects "achatados" em
primitivos), com este contrato:

- **Sempre presentes:** `id`, `title`, `authors`, `status`, `genres`.
- **Presentes só quando definidos:** `isbn`, `rating`, `observation`,
  `language`, `favorited`, `cover` (campos `undefined` são omitidos pelo
  `JSON.stringify`).

O formato é "o que `serializeBook` escreve na versão atual do código". Não há
versionamento de payload nem migração — política vigente no `AGENTS.md`
enquanto o projeto não for lançado: payload fora do formato atual é dado
corrompido.

## 3. A leitura é tudo-ou-nada (decisão importante)

Uma única leitura (`readBooks`) valida o JSON e **todos** os registros antes
de devolver qualquer coisa:

- JSON inválido, forma que não seja array, ou **um único** registro inválido
  → `StorageCorruptedError` (`STORAGE.CORRUPTED`) e **nada** é retornado.
- Não existe "pular registro ruim e devolver os bons": descartar registro em
  silêncio seria perder dados do usuário às escuras.
- **Consequência prática:** `save()` e `delete()` também leem o array antes de
  escrever — um registro corrompido bloqueia leituras **e** escritas. O
  acervo fica "congelado" até o app resolver.

### Como recuperar (decisão do app)

O erro vem com contexto suficiente para reparar (seção 4). O fluxo típico:

1. `try/catch` em volta das chamadas do repositório; pegue o
   `StorageCorruptedError`.
2. Leia o `localStorage` diretamente, conserte ou remova **apenas** o registro
   apontado e regrave a chave; ou — se preferir começar do zero — limpe a
   chave inteira (perdendo também os registros bons).
3. Chame o repositório de novo.

O núcleo não faz isso por você: quem conhece o app decide entre reparar e
recriar.

## 4. Inspecionando o erro

`StorageCorruptedError` carrega `key` (chave afetada) e `cause`. A causa de um
campo inválido aponta exatamente onde está o problema:

```
Invalid book at index 2 (id "88888888-..."): field "status" with value "ABANDONED" is invalid (...)
```

- `index` — posição do registro no array;
- `id` — id como está no payload;
- `field` — campo (com índice de item, ex.: `genres[1]`);
- `value` — valor recebido;
- entre parênteses, a mensagem original (ex.: o erro de domínio
  `READING_STATUS.INVALID`), preservada na cadeia de `cause`.

## 5. Escrita: read-modify-write sem trava

`save()` e `delete()` leem o array inteiro, alteram em memória e reescrevem a
chave inteira:

- **Sem trava entre abas/janelas:** dois `save()` concorrentes em abas
  diferentes = última escrita vence (a outra perde os dados em silêncio). Se
  isso importar para o seu app, serialize as escritas no seu próprio nível.
- Erros da plataforma (quota estourada, storage bloqueada) propagam do
  `setItem` como estão — o adapter não os embrulha.
- `save()` upserta pelo `id`; gravar duas vezes o mesmo `id` sobrescreve.

## 6. Consultas

- `findById`/`getById`/`delete` comparam a string do `id` após normalizar para
  minúsculas — mesma normalização do `Uuid` (ids são persistidos em
  minúsculas). Consultar `"550E8400-..."` encontra o livro `"550e8400-..."`.
  Isso vale para **todos** os adapters da porta `BookRepository`.
- `findByIsbn` recebe um `ISBN` já validado e compara o valor normalizado
  (hífens/espaços não importam). Livro sem ISBN nunca casa.
- `findById` devolve `undefined` quando não acha; `getById`/`delete` lançam
  `BOOK.NOT_FOUND`.

## 7. Adapter de memória (contraste)

`BookRepositoryMemory` implementa a mesma porta com um `Map` em memória:
dados somem ao reiniciar o processo — ideal para Node e testes, não para
dados do usuário. Sem JSON, sem corrupção, sem trava entre abas: o que você
salvou ali existe só enquanto o processo vive. A regra de `id` é a mesma da
seção 6.

## 8. Testando com seu próprio StorageLike

Basta implementar os dois métodos:

```ts
class FakeStorage {
  private readonly store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}
```

É exatamente o fake usado nos testes do projeto
(`tests/unit/adapters/outbound/book-repository.local-storage.test.ts`).
