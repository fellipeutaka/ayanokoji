import { formatZodErrors } from "~/utils/format-zod-errors";
import { enhancedConfirm, enhancedSelect, enhancedText } from "~/utils/prompts";
import { getPortSchema } from "../schemas/port";
import type { CreateComposeServiceResult, DatabaseImageConfig } from ".";

const imageConfig: DatabaseImageConfig = {
  namespace: "minio",
  repository: "minio",
  defaultPort: 9000,
};

const fallbackVersions = new Set([
  "latest",
  "RELEASE.2024-12-18T13-15-44Z",
  "RELEASE.2024-11-07T00-52-20Z",
] as const);

async function createComposeService(): Promise<CreateComposeServiceResult> {
  const serviceName = await enhancedText({
    message: "What is the service name?",
    defaultValue: "minio",
  });

  const version = await enhancedSelect({
    message: "What MinIO version would you like to use?",
    options: Array.from(fallbackVersions).map((value) => ({
      value,
      label: value,
    })),
    initialValue: "latest",
  });

  const rootUser = await enhancedText({
    message: "What is the MinIO root user?",
    defaultValue: "minioadmin",
  });

  const rootPassword = await enhancedText({
    message: "What is the MinIO root password?",
    defaultValue: "minioadmin",
  });

  const apiPort = await enhancedText({
    message: "What is the API port?",
    defaultValue: String(imageConfig.defaultPort),
    validate(value) {
      const result = getPortSchema(imageConfig.defaultPort).safeParse(value);

      if (!result.success) {
        return formatZodErrors(result.error);
      }
    },
  });

  const consolePort = await enhancedText({
    message: "What is the Console port?",
    defaultValue: "9001",
    validate(value) {
      const result = getPortSchema(9001).safeParse(value);

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
      command: ["server", "/data", "--console-address", ":9001"],
      environment: {
        MINIO_ROOT_USER: rootUser,
        MINIO_ROOT_PASSWORD: rootPassword,
      },
      ports: [`${apiPort}:9000`, `${consolePort}:9001`],
      ...(useVolume && {
        volumes: [`${serviceName}_data:/data`],
      }),
      healthcheck: {
        test: ["CMD-SHELL", "mc ready local || exit 1"],
        interval: "10s",
        timeout: "5s",
        retries: 5,
      },
    },
    connectionConfig: {
      type: "minio" as const,
      user: rootUser,
      password: rootPassword,
      host: "localhost",
      port: apiPort,
    },
  };
}

export const config = {
  createComposeService,
  imageConfig,
};
