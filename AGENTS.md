Não faça one-shot de nada.

Sempre sugira o menor escopo útil possível, vamos trabalhar modificações pequenas, mas frequentes.

Não tome decisões sozinho, decisões precisam ser tomadas em conjunto.

Escreva o domínio em inglês.

## Testes

- Sempre escreva os testes primeiro (TDD): crie o teste, veja-o falhar, então implemente.
- Testes unitários ficam em `tests/unit/...`, espelhando a estrutura de `core/`.

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
