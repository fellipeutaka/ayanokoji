import { formatZodErrors } from "~/utils/format-zod-errors";
import { enhancedConfirm, enhancedSelect, enhancedText } from "~/utils/prompts";
import { getPortSchema } from "../schemas/port";
import type { CreateComposeServiceResult, DatabaseImageConfig } from ".";

const imageConfig: DatabaseImageConfig = {
  repository: "mariadb",
  defaultPort: 3306,
};

const fallbackVersions = new Set(["latest", "11.6", "11.4", "10.11"] as const);

async function createComposeService(): Promise<CreateComposeServiceResult> {
  const serviceName = await enhancedText({
    message: "What is the service name?",
    defaultValue: "mariadb",
  });

  const version = await enhancedSelect({
    message: "What MariaDB version would you like to use?",
    options: Array.from(fallbackVersions).map((value) => ({
      value,
      label: value,
    })),
    initialValue: "latest",
  });

  const rootPassword = await enhancedText({
    message: "What is the MariaDB root password?",
    defaultValue: "docker",
  });

  const db = await enhancedText({
    message: "What is the MariaDB database?",
    defaultValue: "docker",
  });

  const port = await enhancedText({
    message: "What is the MariaDB port?",
    defaultValue: String(imageConfig.defaultPort),
    validate(value) {
      const result = getPortSchema(imageConfig.defaultPort).safeParse(value);

      if (!result.success) {
        return formatZodErrors(result.error);
      }
    },
  });

  const useVolume = await enhancedConfirm({
    message: "Do you want to persist data with a volume?",
    initialValue: true,
  });

  return {
    name: serviceName,
    config: {
      image: `${imageConfig.repository}:${version}`,
      environment: {
        MARIADB_ROOT_PASSWORD: rootPassword,
        MARIADB_DATABASE: db,
      },
      ports: [`${port}:${imageConfig.defaultPort}`],
      ...(useVolume && {
        volumes: [`${serviceName}_data:/var/lib/mysql`],
      }),
      healthcheck: {
        test: [
          "CMD-SHELL",
          "healthcheck.sh --connect --innodb_initialized || exit 1",
        ],
        interval: "10s",
        timeout: "5s",
        retries: 5,
      },
    },
    connectionConfig: {
      type: "mariadb" as const,
      user: "root",
      password: rootPassword,
      host: "localhost",
      port,
      database: db,
    },
  };
}

export const config = {
  createComposeService,
  imageConfig,
};
