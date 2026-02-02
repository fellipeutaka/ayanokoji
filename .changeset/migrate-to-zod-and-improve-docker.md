---
"ayanokoji": minor
---

Migrate validation from Valibot to Zod and improve Docker init

**Breaking Changes:**
- Removed `--database` flag from `docker init` (now uses interactive multiselect)

**New Features:**
- Add multiple databases in a single `docker init` run
- Merge new services into existing compose files
- Configure custom service names for each database
- Optional volume persistence with interactive prompt
- Updated to official Docker images (postgres, mysql, mongo, redis)

**Migration:**

Before:
```bash
ayanokoji docker init --database postgresql
```

After:
```bash
ayanokoji docker init
# Select databases interactively
```

**Technical:**
- Replaced Valibot with Zod for schema validation
- Uses official Docker Hub images instead of Bitnami variants
