# ayanokoji

A powerful CLI tool to scaffold and configure modern web development tools and utilities for your projects.

## Documentation

Visit [https://ayanokoji.vercel.app/docs](https://ayanokoji.vercel.app/docs) to view the documentation.

## Development

The repository's internal workflow uses Node.js v24.19.0 and pnpm v11.20.0.

Install dependencies with:

```bash
corepack enable
pnpm install --frozen-lockfile
```

Run the repository quality gates with:

```bash
pnpm test
pnpm lint
pnpm format
pnpm type-check
pnpm build
pnpm verify
pnpm exec changeset status
```

Bun and nub are not required for repository development.
