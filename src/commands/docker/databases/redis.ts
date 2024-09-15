import { safeParse } from "valibot";
import { enhancedSelect, enhancedText } from "~/utils/prompts";
import { portSchema } from "../helpers/get-database-config";
import type { ComposeService } from "../interfaces/compose-service";
import type { DatabaseConfig } from "../interfaces/database-config";

const redisVersions = new Set(["latest", "7.4", "7.2", "6.2"] as const);

export async function getRedisConfig(): Promise<DatabaseConfig> {
  const version = await enhancedSelect({
    message: "What Redis version would you like to use?",
    options: Array.from(redisVersions).map((value) => ({
      value,
      label: value,
    })),
    initialValue: "latest",
  });

  const password = await enhancedText({
    message: "What is the Redis password?",
    defaultValue: "docker",
  });

  const db = await enhancedText({
    message: "What is the Redis database?",
    defaultValue: "redis",
  });

  const port = await enhancedText({
    message: "What is the Redis port?",
    defaultValue: "6379",
    validate(value) {
      const result = safeParse(portSchema, value);

      if (result.issues) {
        return result.issues.map((issue) => issue.message).join("\n");
      }
    },
  });

  return {
    version,
    user: "redis",
    password,
    db,
    port: Number(port),
  };
}

export function redisComposeConfig({
  version,
  db,
  password,
  port,
}: DatabaseConfig): ComposeService {
  return {
    image: `bitnami/redis:${version}`,
    environment: {
      REDIS_MASTER_PASSWORD: password,
      REDIS_DATABASE: db,
    },
    ports: [`${port}:6379`],
  };
}
