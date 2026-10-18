Não faça one-shot de nada: entregue trabalho em etapas pequenas, sempre sugerindo o menor escopo útil possível, com modificações pequenas e frequentes.

Não tome decisões sozinho: alinhe decisões e escopo com o usuário antes de executar.

Escreva código, comentários e descrições de teste em inglês.

## Código

- Evite números mágicos: dê nomes semânticos (constantes) a valores que carregam significado de domínio, mesmo que apareçam poucas vezes; números genéricos de programação (0, índices, laços) não precisam de nome.
- Fórmulas e cálculos devem ser extraídos para funções com nomes descritivos.
- Escreva código que seja LEGÍVEL para humanos e ENTENDÍVEL por um júnior, mesmo que o foco seja que agentes leiam. Procure soluções SIMPLES antes de sugerir SOFISTICADAS.
- Value Objects: construtor privado, `static create()` que valida, propriedades `readonly` e `equals()`. Um objeto inválido nunca deve existir.
- Erros de domínio: um tipo granular por tipo de falha, herdando de `DomainError`, com `code` legível por máquina e campos de contexto (valor recebido, esperado vs. obtido).
- `core/domain` não importa libs externas nem módulos de `adapters/` — o domínio é independente de frameworks. Evite imports circulares: compartilhe tipos com `import type` e constantes em arquivos próprios.
- Sufixos de arquivo indicam o papel: `.error.ts`, `.constants.ts`, `.test.ts`.

## Filosofia do núcleo

- O núcleo fornece comportamentos que encapsulam conhecimento especializado e reutilizável sobre livros, mas explicita convenções que não são universais e permite sua substituição quando apropriado.
- Convenções comuns como padrão: o núcleo oferece comportamentos úteis sem exigir que cada consumidor os implemente.
- Composição em vez de imposição: o consumidor pode utilizar apenas parte das funcionalidades sem precisar adotar todas as políticas do núcleo.
- Extensibilidade: convenções particulares podem ser substituídas ou complementadas sem comprometer o modelo central.

## Atualização do Book: onde validar

- A validação de atualizações fica nos métodos `with*`, não no `save()`.
- Por que não no `save()`: o erro apareceria na hora de gravar, longe da edição que
  o causou; `save` é uma porta implementada por cada adapter (memória, localStorage,
  futuros), e cada um teria que lembrar de validar — esquecer em um recria o buraco;
  o contrato se mantém simples ("save nunca valida"): o `Book` chega válido porque
  só nasce de `create` ou `with*`.
- `Book.restore` confia nos dados por design: ele reidrata o que o repositório
  devolveu (uso de adapters), sem re-validar. Para alterar um livro, use os `with*`.
- Limite: cada `with*` garante apenas que a mudança que ele faz não introduz dado
  inválido — não que o livro inteiro seja válido. Um livro vindo do banco com dado
  ruim continua ruim após um `with*` de outro campo.
- Para não divergir: regra compartilhada entre `create` e `with*` mora em helper
  único (ex.: `ensureNoDuplicateGenreIds`); paridade coberta por teste de tabela
  (mesma entrada inválida → mesmo `code` nos dois lados).

## Migração e compatibilidade com dados antigos

- O projeto ainda não foi lançado: não escreva migração nem tolerância a payloads
  legados (defaults para campos ausentes, normalização de formatos antigos, branches
  "retrocompatível").
- Payload fora do formato atual é dado corrompido: falhe de forma ruidosa
  (`STORAGE.CORRUPTED`), nunca migre em silêncio.
- Esta regra vale enquanto estiver escrita aqui. Quando o projeto for lançado, ela
  deve ser removida e substituída por uma política de versionamento de dados.

## Comentários

- Escreva comentários quando uma regra não for explícita, não for entendível pelo próprio código ou pelo contexto — e sempre quando for regra de nicho (ex.: só quem estudou o ISBN-13 sabe que posições ímpares pesam 1). O objetivo é que qualquer pessoa contribua sem ser especialista.
- Comente o _porquê_, não o _o quê_; não comente o óbvio.

## Testes

- Sempre escreva os testes primeiro (TDD): crie o teste, veja-o falhar, então implemente.
- Testes unitários ficam em `tests/unit/...`, espelhando a estrutura de `core/`.
- Ao testar erros, valide também os campos de contexto (`code`, esperado vs. obtido) — não só o tipo da exceção.

## Validação

- Antes de commitar ou entregar, deixe tudo verde: `npm test`, `npm run typecheck`, `npm run lint` e `npm run format:check`.

## Commits

- As mensagens de commit devem ser escritas em **inglês**.
- Siga o formato **Conventional Commits**: `<type>[optional scope]: <description>`.
- Tipos válidos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

Exemplos válidos:

- `feat: add Book entity to domain`
- `fix(core): correct ISBN validation`
- `test: add tests for RegisterBook use case`
- `docs: update README with folder structure`

## Dependências

- As dependências devem ser travadas em **versões exatas** (sem caret `^` ou til `~`) no `package.json`.
- O `package-lock.json` é o lockfile de referência e deve ser versionado junto com o projeto.
