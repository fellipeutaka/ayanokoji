import { formatZodErrors } from "~/utils/format-zod-errors";
import { enhancedConfirm, enhancedSelect, enhancedText } from "~/utils/prompts";

import type { CreateComposeServiceResult, DatabaseImageConfig } from ".";
import { getPortSchema } from "../schemas/port";

const imageConfig: DatabaseImageConfig = {
  defaultPort: 3306,
  repository: "mariadb",
};

const fallbackVersions = new Set(["latest", "11.6", "11.4", "10.11"] as const);

async function createComposeService(): Promise<CreateComposeServiceResult> {
  const serviceName = await enhancedText({
    defaultValue: "mariadb",
    message: "What is the service name?",
  });

  const version = await enhancedSelect({
    initialValue: "latest",
    message: "What MariaDB version would you like to use?",
    options: [...fallbackVersions].map((value) => ({
      label: value,
      value,
    })),
  });

  const rootPassword = await enhancedText({
    defaultValue: "docker",
    message: "What is the MariaDB root password?",
  });

  const db = await enhancedText({
    defaultValue: "docker",
    message: "What is the MariaDB database?",
  });

  const port = await enhancedText({
    defaultValue: String(imageConfig.defaultPort),
    message: "What is the MariaDB port?",
    validate(value) {
      const result = getPortSchema(imageConfig.defaultPort).safeParse(value);

      if (!result.success) {
        return formatZodErrors(result.error);
      }
    },
  });

  const useVolume = await enhancedConfirm({
    initialValue: true,
    message: "Do you want to persist data with a volume?",
  });

  return {
    config: {
      image: `${imageConfig.repository}:${version}`,
      environment: {
        MARIADB_DATABASE: db,
        MARIADB_ROOT_PASSWORD: rootPassword,
      },
      ports: [`${port}:${imageConfig.defaultPort}`],
      ...(useVolume && {
        volumes: [`${serviceName}_data:/var/lib/mysql`],
      }),
      healthcheck: {
        interval: "10s",
        retries: 5,
        test: [
          "CMD-SHELL",
          "healthcheck.sh --connect --innodb_initialized || exit 1",
        ],
        timeout: "5s",
      },
    },
    connectionConfig: {
      database: db,
      host: "localhost",
      password: rootPassword,
      port,
      type: "mariadb" as const,
      user: "root",
    },
    name: serviceName,
  };
}

export const config = {
  createComposeService,
  imageConfig,
};
