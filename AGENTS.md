# Ayanokoji

CLI for scaffolding and configuring modern web development tools and utilities.

## Docs

- `docs/REQUIREMENTS.md` — functional and non-functional requirement definitions
- `docs/BUSINESS-RULES.md` — domain rules and constraints
- `docs/agents/domain.md` — domain-document consumer rules
- `CONTEXT.md` — single-context glossary, created as domain terms are resolved
- `docs/adr/` — architecture decisions

Keep requirement and business-rule definitions synchronized with the codebase when behavior changes. In team mode, issue state belongs to GitHub Issues; these docs do not carry status.

## Internal toolchain

Repository development uses Node.js v24.19.0 and pnpm v11.20.0. Use the root
pnpm scripts for installation, tests, linting, formatting, type-checking,
documentation validation, builds, and release checks. Bun, nub, Biome, and
Ultracite are not required for internal repository work; references that remain
in public CLI commands, generated templates, or public documentation are part
of the published CLI contract.

## Tracker

GitHub Issues is the tracker. Agents do not create or synchronize issues automatically unless explicitly requested. See `docs/agents/issue-tracker.md`.

## Agent skills

### Issue tracker

GitHub Issues, via `gh`, is the issue tracker. See `docs/agents/issue-tracker.md`.

### Triage labels

Use `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Use the single-context layout: root `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.
