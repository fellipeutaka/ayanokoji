import { formatZodErrors } from "~/utils/format-zod-errors";
import { enhancedConfirm, enhancedSelect, enhancedText } from "~/utils/prompts";
import { getPortSchema } from "../schemas/port";
import type { CreateComposeServiceResult, DatabaseImageConfig } from ".";

const imageConfig: DatabaseImageConfig = {
  namespace: "axllent",
  repository: "mailpit",
  defaultPort: 8025,
};

const fallbackVersions = new Set([
  "latest",
  "v1.21",
  "v1.20",
  "v1.19",
] as const);

async function createComposeService(): Promise<CreateComposeServiceResult> {
  const serviceName = await enhancedText({
    message: "What is the service name?",
    defaultValue: "mailpit",
  });

  const version = await enhancedSelect({
    message: "What Mailpit version would you like to use?",
    options: Array.from(fallbackVersions).map((value) => ({
      value,
      label: value,
    })),
    initialValue: "latest",
  });

  const smtpPort = await enhancedText({
    message: "What is the SMTP port?",
    defaultValue: "1025",
    validate(value) {
      const result = getPortSchema(1025).safeParse(value);

      if (!result.success) {
        return formatZodErrors(result.error);
      }
    },
  });

  const uiPort = await enhancedText({
    message: "What is the Web UI port?",
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
    initialValue: false,
  });

  return {
    name: serviceName,
    config: {
      image: `${imageConfig.namespace}/${imageConfig.repository}:${version}`,
      ports: [`${smtpPort}:1025`, `${uiPort}:8025`],
      ...(useVolume && {
        volumes: [`${serviceName}_data:/data`],
      }),
      healthcheck: {
        test: [
          "CMD-SHELL",
          "wget --spider -q http://localhost:8025/api/v1/info || exit 1",
        ],
        interval: "10s",
        timeout: "5s",
        retries: 5,
      },
    },
    connectionConfig: {
      type: "mailpit" as const,
      host: "localhost",
      smtpPort,
      uiPort,
    },
  };
}

export const config = {
  createComposeService,
  imageConfig,
};
