import { enhancedConfirm, enhancedSelect, enhancedText } from "~/utils/prompts";

import type { CreateComposeServiceResult, DatabaseImageConfig } from ".";
import { validatePort } from "../schemas/port";

const imageConfig: DatabaseImageConfig = {
  defaultPort: 3306,
  repository: "mysql",
};

const fallbackVersions = new Set(["latest", "9.0", "8.4", "8.0"] as const);

async function createComposeService(): Promise<CreateComposeServiceResult> {
  const serviceName = await enhancedText({
    defaultValue: "mysql",
    message: "What is the service name?",
  });

  const version = await enhancedSelect({
    initialValue: "latest",
    message: "What MySQL version would you like to use?",
    options: [...fallbackVersions].map((value) => ({
      label: value,
      value,
    })),
  });

  const rootPassword = await enhancedText({
    defaultValue: "docker",
    message: "What is the MySQL root password?",
  });

  const db = await enhancedText({
    defaultValue: "docker",
    message: "What is the MySQL database?",
  });

  const port = await enhancedText({
    defaultValue: String(imageConfig.defaultPort),
    message: "What is the MySQL port?",
    validate(value) {
      return validatePort(value, imageConfig.defaultPort);
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
        MYSQL_DATABASE: db,
        MYSQL_ROOT_PASSWORD: rootPassword,
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
          `mysqladmin ping -h localhost -u root -p${rootPassword}`,
        ],
        timeout: "5s",
      },
    },
    connectionConfig: {
      database: db,
      host: "localhost",
      password: rootPassword,
      port,
      type: "mysql" as const,
      user: "root",
    },
    name: serviceName,
  };
}

export const config = {
  createComposeService,
  imageConfig,
};
