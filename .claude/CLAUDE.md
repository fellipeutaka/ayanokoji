# Ayanokoji Development Guidelines

## Quality Gates (MANDATORY)

Before ANY commit:
1. `bun run lint:fix` passes
2. `bun run type-check` passes

lefthook pre-commit hooks enforce this.

## Stack

- Runtime: Bun
- Language: TypeScript (strict)
- Linter: Biome
- Validation: Valibot
- Git hooks: lefthook
- Commits: Conventional Commits (commitlint)

## Monorepo Structure

```⁩
apps/
  docs/      # Documentation site (Fumadocs)
packages/
  cli/       # Ayanokoji CLI
⁨```

## CLI Commands

The CLI (`packages/cli`) provides scaffolding for:
- `biome` - Linter/formatter setup
- `docker` - Docker Compose for databases
- `drizzle` - Drizzle ORM setup
- `gitignore` - Git ignore generation
- `prisma` - Prisma ORM setup
- `secret` - Secure secret generation
- `typescript` - TypeScript configuration

## Code Patterns

- **Error Handling**: Use Result type (`Ok<T>` / `Err<E>`) from `~/utils/result.ts`
- **Validation**: Use Valibot schemas with `safeParseAsync`
- **Prompts**: Use wrapped @clack/prompts from `~/utils/prompts.ts`
- **Logging**: Use logger from `~/utils/logger.ts`

## Documentation

Detailed docs at https://ayanokoji.vercel.app/docs

## Dependencies

Check `package.json` root and `workspaces.catalog` before adding deps.
Use `bun add` to install.
