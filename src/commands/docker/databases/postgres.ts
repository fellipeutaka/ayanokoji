import { safeParse } from "valibot";
import { enhancedSelect, enhancedText } from "~/utils/prompts";
import { portSchema } from "../helpers/get-database-config";
import type { ComposeService } from "../interfaces/compose-service";
import type { DatabaseConfig } from "../interfaces/database-config";

const postgresVersions = new Set(["latest", "16", "15", "14"] as const);

export async function getPostgresConfig(): Promise<DatabaseConfig> {
  const version = await enhancedSelect({
    message: "What Postgres version would you like to use?",
    options: Array.from(postgresVersions).map((value) => ({
      value,
      label: value,
    })),
    initialValue: "latest",
  });

  const user = await enhancedText({
    message: "What is the Postgres user?",
    defaultValue: "docker",
  });

  const password = await enhancedText({
    message: "What is the Postgres password?",
    defaultValue: "docker",
  });

  const db = await enhancedText({
    message: "What is the Postgres database?",
    defaultValue: "docker",
  });

  const port = await enhancedText({
    message: "What is the Postgres port?",
    defaultValue: "5432",
    validate(value) {
      const result = safeParse(portSchema, value);

      if (result.issues) {
        return result.issues.map((issue) => issue.message).join("\n");
      }
    },
  });

  return {
    version,
    user,
    password,
    db,
    port: Number(port),
  };
}

export function postgresComposeConfig({
  version,
  user,
  db,
  password,
  port,
}: DatabaseConfig): ComposeService {
  return {
    image: `bitnami/postgresql:${version}`,
    environment: {
      POSTGRESQL_USERNAME: user,
      POSTGRESQL_PASSWORD: password,
      POSTGRESQL_DATABASE: db,
    },
    ports: [`${port}:5432`],
  };
}
