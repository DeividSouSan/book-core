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
