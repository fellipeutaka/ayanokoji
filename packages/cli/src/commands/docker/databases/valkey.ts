import { formatZodErrors } from "~/utils/format-zod-errors";
import { enhancedConfirm, enhancedSelect, enhancedText } from "~/utils/prompts";
import { getPortSchema } from "../schemas/port";
import type { CreateComposeServiceResult, DatabaseImageConfig } from ".";

const imageConfig: DatabaseImageConfig = {
  namespace: "valkey",
  repository: "valkey",
  defaultPort: 6379,
};

const fallbackVersions = new Set(["latest", "8.0", "7.2"] as const);

async function createComposeService(): Promise<CreateComposeServiceResult> {
  const serviceName = await enhancedText({
    message: "What is the service name?",
    defaultValue: "valkey",
  });

  const version = await enhancedSelect({
    message: "What Valkey version would you like to use?",
    options: Array.from(fallbackVersions).map((value) => ({
      value,
      label: value,
    })),
    initialValue: "latest",
  });

  const password = await enhancedText({
    message: "What is the Valkey password?",
    defaultValue: "docker",
  });

  const port = await enhancedText({
    message: "What is the Valkey port?",
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
      image: `${imageConfig.namespace}/${imageConfig.repository}:${version}`,
      command: ["valkey-server", "--requirepass", password],
      ports: [`${port}:${imageConfig.defaultPort}`],
      ...(useVolume && {
        volumes: [`${serviceName}_data:/data`],
      }),
      healthcheck: {
        test: ["CMD-SHELL", `valkey-cli -a ${password} ping | grep PONG`],
        interval: "10s",
        timeout: "5s",
        retries: 5,
      },
    },
    connectionConfig: {
      type: "valkey" as const,
      password,
      host: "localhost",
      port,
    },
  };
}

export const config = {
  createComposeService,
  imageConfig,
};
