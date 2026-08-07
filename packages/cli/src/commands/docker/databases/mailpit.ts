import { formatZodErrors } from "~/utils/format-zod-errors";
import { enhancedConfirm, enhancedSelect, enhancedText } from "~/utils/prompts";

import type { CreateComposeServiceResult, DatabaseImageConfig } from ".";
import { getPortSchema } from "../schemas/port";

const imageConfig: DatabaseImageConfig = {
  defaultPort: 8025,
  namespace: "axllent",
  repository: "mailpit",
};

const fallbackVersions = new Set([
  "latest",
  "v1.21",
  "v1.20",
  "v1.19",
] as const);

async function createComposeService(): Promise<CreateComposeServiceResult> {
  const serviceName = await enhancedText({
    defaultValue: "mailpit",
    message: "What is the service name?",
  });

  const version = await enhancedSelect({
    initialValue: "latest",
    message: "What Mailpit version would you like to use?",
    options: [...fallbackVersions].map((value) => ({
      label: value,
      value,
    })),
  });

  const smtpPort = await enhancedText({
    defaultValue: "1025",
    message: "What is the SMTP port?",
    validate(value) {
      const result = getPortSchema(1025).safeParse(value);

      if (!result.success) {
        return formatZodErrors(result.error);
      }
    },
  });

  const uiPort = await enhancedText({
    defaultValue: String(imageConfig.defaultPort),
    message: "What is the Web UI port?",
    validate(value) {
      const result = getPortSchema(imageConfig.defaultPort).safeParse(value);

      if (!result.success) {
        return formatZodErrors(result.error);
      }
    },
  });

  const useVolume = await enhancedConfirm({
    initialValue: false,
    message: "Do you want to persist data with a volume?",
  });

  return {
    config: {
      image: `${imageConfig.namespace}/${imageConfig.repository}:${version}`,
      ports: [`${smtpPort}:1025`, `${uiPort}:8025`],
      ...(useVolume && {
        volumes: [`${serviceName}_data:/data`],
      }),
      healthcheck: {
        interval: "10s",
        retries: 5,
        test: [
          "CMD-SHELL",
          "wget --spider -q http://localhost:8025/api/v1/info || exit 1",
        ],
        timeout: "5s",
      },
    },
    connectionConfig: {
      host: "localhost",
      smtpPort,
      type: "mailpit" as const,
      uiPort,
    },
    name: serviceName,
  };
}

export const config = {
  createComposeService,
  imageConfig,
};
