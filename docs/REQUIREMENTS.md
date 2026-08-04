# Requirements

These definitions describe the current product behavior. Issue state is tracked in GitHub Issues; this document intentionally contains no status fields.

## Functional Requirements

### CLI scaffolding

#### FR-001: Initialize TypeScript

- **Issue**: (none yet)
- **Description**: The CLI must interactively generate a `tsconfig.json` for an existing target project, offer the supported compiler and runtime choices, install selected development dependencies, and optionally add a type-check script.

#### FR-002: Initialize or remove Biome

- **Issue**: (none yet)
- **Description**: The CLI must initialize Biome configuration and its dependency in a target project, and provide a remove operation that removes the generated Biome setup.

#### FR-003: Generate a `.gitignore`

- **Issue**: (none yet)
- **Description**: The CLI must generate a project `.gitignore` containing the supported development-tool, build-output, dependency, environment, and editor exclusions.

#### FR-004: Initialize Drizzle ORM

- **Issue**: (none yet)
- **Description**: The CLI must initialize Drizzle for a supported PostgreSQL, MySQL, or SQLite database, select the corresponding adapter, generate configuration and client/migration files, optionally generate a sample model and scripts, write the database environment configuration, and install the required dependencies.

#### FR-005: Initialize Prisma ORM

- **Issue**: (none yet)
- **Description**: The CLI must initialize Prisma for a supported PostgreSQL, MySQL, SQLite, MongoDB, SQL Server, or CockroachDB database, generate the schema and environment configuration, optionally add a sample model and scripts, and install the required dependencies.

#### FR-006: Initialize Docker Compose services

- **Issue**: (none yet)
- **Description**: The CLI must create or update a recognized Docker Compose file with selected PostgreSQL, MySQL, MariaDB, Redis, Valkey, MongoDB, RabbitMQ, MinIO, or Mailpit services, including service configuration, health checks where supported, volumes, and connection strings.

#### FR-007: Remove Docker Compose services

- **Issue**: (none yet)
- **Description**: The CLI must remove user-selected services from an existing recognized Docker Compose file, remove orphaned volumes, and optionally remove the related environment variables.

#### FR-008: Generate secure secrets

- **Issue**: (none yet)
- **Description**: The CLI must generate and print a cryptographically random secret suitable for application configuration.

### Documentation

#### FR-009: Document supported CLI commands

- **Issue**: (none yet)
- **Description**: The documentation site must provide usage and configuration guidance for every supported user-facing CLI command and its material options.

#### FR-010: Provide searchable and LLM-friendly documentation

- **Issue**: (none yet)
- **Description**: The documentation site must expose searchable content and Markdown responses for the complete documentation set and individual pages.

### Cross-cutting behavior

#### FR-011: Use the target project's package manager

- **Issue**: (none yet)
- **Description**: When a command installs dependencies or writes package scripts, the CLI must detect and use the target project's package manager, falling back to npm when no manager can be detected.

## Non-functional Requirements

#### NFR-001: Clear interactive feedback

- **Issue**: (none yet)
- **Description**: Commands must communicate success, validation failures, cancellation, and operational errors through clear terminal output and appropriate process results.

#### NFR-002: Preserve existing user configuration

- **Issue**: (none yet)
- **Description**: Initialization commands must avoid silently overwriting existing generated artifacts and must make environment-variable conflicts explicit before changing existing values.

#### NFR-003: Keep CLI and documentation synchronized

- **Issue**: (none yet)
- **Description**: Changes to supported commands, options, generated output, or user-visible behavior must be reflected in the documentation before the change is considered complete.

#### NFR-004: Keep generated setup usable

- **Issue**: (none yet)
- **Description**: Generated configuration must use the selected tool and database choices consistently, include the dependencies required by the generated files, and preserve valid existing project configuration that is outside the command's scope.
