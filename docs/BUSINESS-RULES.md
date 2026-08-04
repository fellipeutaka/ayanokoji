# Business Rules

These rules describe the current product behavior. Issue state is tracked in GitHub Issues; this document intentionally contains no status fields.

## Target projects

### BR-001: Initialization requires an existing target directory

- **Issue**: (none yet)
- **When**: A command receives a target working directory.
- **Then**: The CLI must verify that the directory exists before performing the operation; otherwise it must report an error and stop.
- **Rationale**: Setup commands operate on an existing project rather than creating arbitrary directory trees.

### BR-002: Initialization does not overwrite generated artifacts

- **Issue**: (none yet)
- **When**: TypeScript, Biome, `.gitignore`, Drizzle, or Prisma initialization finds its generated file or output directory already present.
- **Then**: The CLI must refuse the initialization and tell the user which artifact conflicts.
- **Rationale**: Existing project configuration may contain intentional user changes.

### BR-003: Dependencies follow the target package manager

- **Issue**: (none yet)
- **When**: A command installs dependencies or adds scripts to a target project.
- **Then**: The CLI must detect the target package manager and use its install, remove, and run-script conventions; if no manager is detected, it must use npm as the fallback.
- **Rationale**: Generated setup must integrate with the project's existing workflow.

## Database and environment configuration

### BR-004: Database selections are limited to supported adapters

- **Issue**: (none yet)
- **When**: A user supplies or selects a Drizzle or Prisma database, or a Drizzle adapter.
- **Then**: The CLI must accept only values in the corresponding supported database registry and reject invalid values.
- **Rationale**: Generated files and dependencies are adapter-specific.

### BR-005: Existing `DATABASE_URL` is never silently replaced

- **Issue**: (none yet)
- **When**: Drizzle or Prisma initialization writes database environment configuration.
- **Then**: The CLI must create `.env` when absent, append `DATABASE_URL` when it is absent, and preserve an existing `DATABASE_URL` rather than replacing it.
- **Rationale**: Existing credentials and deployment configuration belong to the user.

### BR-006: Environment conflicts require an explicit policy

- **Issue**: (none yet)
- **When**: Docker initialization wants to write a variable already present in the selected environment file.
- **Then**: The CLI must prompt to skip or override the value, unless `--skip-conflicts` is supplied, in which case it must skip the existing value.
- **Rationale**: Generated local credentials must not silently replace user configuration.

### BR-007: Generated environment files are ignored by Git

- **Issue**: (none yet)
- **When**: Docker initialization writes connection strings to an environment file.
- **Then**: The CLI must add `.env` to `.gitignore` when it is not already present.
- **Rationale**: Connection strings may contain credentials.

## Docker Compose

### BR-008: Docker initialization adds only missing services

- **Issue**: (none yet)
- **When**: Docker initialization operates on a recognized existing Compose file.
- **Then**: Services already present must not be offered for selection, selected services must be merged into the existing configuration, unrelated services must remain unchanged, and any existing-name or duplicate-name conflict must reject the complete batch without a partial write.
- **Rationale**: Initialization is additive and should preserve existing Compose setup.

### BR-009: Docker removal cleans only orphaned resources

- **Issue**: (none yet)
- **When**: A user selects one or more Docker services for removal.
- **Then**: The complete batch must be validated before transformation; removal must reject a remaining service's explicit `depends_on` reference to any selected service; and only unreferenced, convention-recognized Generated Compose volume declarations may be removed. Shared, external, metadata-bearing, bind-mounted, anonymous, uncertain-ownership, and unrelated resources must remain intact. Related environment variables may be removed only after user confirmation.
- **Rationale**: Dependency protection and conservative ownership rules prevent a local cleanup operation from invalidating or deleting user-owned configuration.

### BR-010: Docker operations require a recognized Compose file

- **Issue**: (none yet)
- **When**: Docker removal is requested.
- **Then**: The CLI must inspect `compose.yaml`, `compose.yml`, `docker-compose.yaml`, and `docker-compose.yml`, return every existing candidate, and require an explicit filename choice when more than one exists; if none exists, initialization must prompt for a supported filename while removal must stop with an error.
- **Rationale**: The CLI must not guess at arbitrary YAML files.

### BR-013: Docker Compose reads fail closed

- **Issue**: (none yet)
- **When**: A Docker command reads a recognized Compose file.
- **Then**: The file must contain exactly one YAML document with a mapping root, unique mapping keys, and mapping-shaped `services` and `volumes` collections when present. Invalid YAML, multi-document input, duplicate keys, and unusable owned collections must stop the operation without coercing the input into an empty document; an omitted `services` collection is treated as empty for initialization and reports no available services for removal.
- **Rationale**: Read validation must preserve user configuration and prevent unsafe input from reaching a mutation or write.

### BR-014: Compose and environment outcomes are independent

- **Issue**: #21
- **When**: Docker initialization or removal has successfully written the Compose document and the user has opted into the related environment update.
- **Then**: Environment synchronization runs afterward as a separate operation; declining it keeps the Compose operation successful, while a failure reports both outcomes, exits nonzero, and does not roll back the Compose document.
- **Rationale**: A failure in one file must not undo a safe, already-committed mutation in another file.

### BR-015: Stale Compose conflicts require an explicit rerun

- **Issue**: #21
- **When**: A Compose document changes between the command's read and write phases.
- **Then**: The command must stop with a stale-document failure without rereading or retrying the obsolete operation, and must tell the user to rerun it explicitly.
- **Rationale**: Only a fresh user invocation can safely reform the requested mutation from current configuration.

## Security and documentation

### BR-011: Secrets use random bytes and hexadecimal encoding

- **Issue**: (none yet)
- **When**: The secret command runs successfully.
- **Then**: It must output 32 cryptographically random bytes encoded as a 64-character hexadecimal string.
- **Rationale**: Secret material must have predictable strength and a shell-safe representation.

### BR-012: Documentation mirrors user-visible CLI behavior

- **Issue**: (none yet)
- **When**: A command, option, supported service, generated artifact, or user-visible behavior changes.
- **Then**: The corresponding documentation must be updated in the same change.
- **Rationale**: The docs app is the synchronized public reference for the CLI, not an independent product context.
