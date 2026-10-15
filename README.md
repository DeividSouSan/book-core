# book-core

Núcleo de domínio de livros independente de frameworks, seguindo Arquitetura Hexagonal + DDD, pronto para ser consumido por adaptadores (API REST, CLI, repositório PostgreSQL, memória, etc.).

## Estrutura de pastas

```text
book-core/
├── core/
│   ├── domain/          # Entidades, Value Objects e exceções de domínio (sem dependências externas)
│   └── application/     # Casos de uso e portas (interfaces)
├── adapters/
│   ├── inbound/         # Controladores REST, CLI, etc.
│   └── outbound/        # Repositórios (PostgreSQL, memória), presenters
└── tests/               # Testes unitários e de integração
```

## Regras de trabalho (AGENTS.md)

- Não faça one-shot de nada, faça implementações de escopo curto.
- Não tome decisões sozinho, decisões precisam ser tomadas em conjunto.
