import {
  maxValue,
  minValue,
  number,
  pipe,
  safeParse,
  string,
  transform,
} from "valibot";
import { enhancedSelect, enhancedText } from "~/utils/prompts";
import type { getDockerComposeConfig } from "./get-docker-compose-config";
import type { DatabaseConfig } from "./get-docker-compose-config-file";

const portSchema = pipe(
  string(),
  transform(Number),
  number("Port must be a number"),
  minValue(0, "Port must be greater than 0"),
  maxValue(65535, "Port must be less than 65536")
);

const postgresVersions = new Set(["latest", "16", "15", "14"] as const);

export async function getDatabaseConfig(): Promise<DatabaseConfig> {
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

export type DockerComposeConfig = Awaited<
  ReturnType<typeof getDockerComposeConfig>
>;
