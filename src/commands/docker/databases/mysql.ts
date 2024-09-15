import { safeParse } from "valibot";
import { enhancedSelect, enhancedText } from "~/utils/prompts";
import { portSchema } from "../helpers/get-database-config";
import type { ComposeService } from "../interfaces/compose-service";
import type { DatabaseConfig } from "../interfaces/database-config";

const mysqlVersions = new Set([
  "latest",
  "9.0.1",
  "9.0",
  "8.4.2",
  "8.4",
  "8.0",
] as const);

export async function getMySQLConfig(): Promise<DatabaseConfig> {
  const version = await enhancedSelect({
    message: "What MySQL version would you like to use?",
    options: Array.from(mysqlVersions).map((value) => ({
      value,
      label: value,
    })),
    initialValue: "latest",
  });

  const user = await enhancedText({
    message: "What is the MySQL user?",
    defaultValue: "docker",
  });

  const password = await enhancedText({
    message: "What is the MySQL password?",
    defaultValue: "docker",
  });

  const db = await enhancedText({
    message: "What is the MySQL database?",
    defaultValue: "docker",
  });

  const port = await enhancedText({
    message: "What is the MySQL port?",
    defaultValue: "3306",
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

export function mysqlComposeConfig({
  version,
  user,
  db,
  password,
  port,
}: DatabaseConfig): ComposeService {
  return {
    image: `bitnami/mysql:${version}`,
    environment: {
      MYSQL_ROOT_USER: user,
      MYSQL_ROOT_PASSWORD: password,
      MYSQL_DATABASE: db,
    },
    ports: [`${port}:3306`],
  };
}
