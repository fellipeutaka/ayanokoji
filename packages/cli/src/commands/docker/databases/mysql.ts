import { formatZodErrors } from "~/utils/format-zod-errors";
import { enhancedConfirm, enhancedSelect, enhancedText } from "~/utils/prompts";
import { getPortSchema } from "../schemas/port";
import type { CreateComposeServiceResult, DatabaseImageConfig } from ".";

const imageConfig: DatabaseImageConfig = {
  repository: "mysql",
  defaultPort: 3306,
};

const fallbackVersions = new Set(["latest", "9.0", "8.4", "8.0"] as const);

async function createComposeService(): Promise<CreateComposeServiceResult> {
  const serviceName = await enhancedText({
    message: "What is the service name?",
    defaultValue: "mysql",
  });

  const version = await enhancedSelect({
    message: "What MySQL version would you like to use?",
    options: Array.from(fallbackVersions).map((value) => ({
      value,
      label: value,
    })),
    initialValue: "latest",
  });

  const rootPassword = await enhancedText({
    message: "What is the MySQL root password?",
    defaultValue: "docker",
  });

  const db = await enhancedText({
    message: "What is the MySQL database?",
    defaultValue: "docker",
  });

  const port = await enhancedText({
    message: "What is the MySQL port?",
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
        MYSQL_ROOT_PASSWORD: rootPassword,
        MYSQL_DATABASE: db,
      },
      ports: [`${port}:${imageConfig.defaultPort}`],
      ...(useVolume && {
        volumes: [`${serviceName}_data:/var/lib/mysql`],
      }),
      healthcheck: {
        test: [
          "CMD-SHELL",
          `mysqladmin ping -h localhost -u root -p${rootPassword}`,
        ],
        interval: "10s",
        timeout: "5s",
        retries: 5,
      },
    },
    connectionConfig: {
      type: "mysql" as const,
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
