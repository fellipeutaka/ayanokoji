# ayanokoji

## 0.11.0

### Minor Changes

- 58b1090: feat(docker): add connection string generation after service setup
- 7893734: feat(docker): add environment file support with conflict handling
- 488c4b6: feat(docker): add health checks to compose services
- 4fc0e56: feat(docker): add MariaDB, Valkey, RabbitMQ, MinIO, and Mailpit services
- dbdd40f: feat(docker): add remove command to delete services from compose

## 0.10.0

### Minor Changes

- 3e786a7: Migrate validation from Valibot to Zod and improve Docker init

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

### Patch Changes

- f0d8ac5: bump deps

## 0.9.0

### Minor Changes

- fd4db8f: add `typescript init` command

## 0.8.0

### Minor Changes

- 43dcfd2: add `gitignore init` command

## 0.7.0

### Minor Changes

- 7ba2cc0: add support to `--database` flag on docker init
- 923524f: add support to `--database` flag on drizzle init
- 3451ba3: add remove biome command
- 1a20386: add support to `--database` flag on prisma init

## 0.6.0

### Minor Changes

- 0a8079a: add support to mongodb on docker init
- 631890a: replace `execa` to `nano-spawn`

## 0.5.1

### Patch Changes

- 7cbe754: add support to install biome deps
- 2020ede: fix missing export drizzle db

## 0.5.0

### Minor Changes

- c4aa8c8: feat: add support to drizzle

## 0.4.0

### Minor Changes

- 2d01036: feat: add redis support
- 829493b: feat: add --with-scripts flag to prisma
- 125532e: feat: add support to prisma

## 0.3.0

### Minor Changes

- a7507f7: add support to MySQL database
  add logs to biome init
  fix initial value of database version

## 0.2.0

### Minor Changes

- 3e377cf: add docker command

## 0.1.0

### Minor Changes

- ee38e29: add biome init command
