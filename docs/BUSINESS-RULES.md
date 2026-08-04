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
- **Then**: Services already present must not be offered for selection, selected services must be merged into the existing configuration, and unrelated services must remain unchanged.
- **Rationale**: Initialization is additive and should preserve existing Compose setup.

### BR-009: Docker removal cleans only orphaned resources

- **Issue**: (none yet)
- **When**: Selected Docker services are removed.
- **Then**: Their services must be deleted, volumes must be removed only when no remaining service uses them, and related environment variables may be removed only after user confirmation.
- **Rationale**: Shared resources and unrelated configuration must remain intact.

### BR-010: Docker operations require a recognized Compose file

- **Issue**: (none yet)
- **When**: Docker removal is requested.
- **Then**: The CLI must inspect `compose.yaml`, `compose.yml`, `docker-compose.yaml`, and `docker-compose.yml`; if none exists, it must stop with an error.
- **Rationale**: The CLI must not guess at arbitrary YAML files.

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
