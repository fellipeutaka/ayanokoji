import { formatZodErrors } from "~/utils/format-zod-errors";
import { enhancedConfirm, enhancedSelect, enhancedText } from "~/utils/prompts";
import { getPortSchema } from "../schemas/port";
import type { CreateComposeServiceResult, DatabaseImageConfig } from ".";

const imageConfig: DatabaseImageConfig = {
  repository: "rabbitmq",
  defaultPort: 5672,
};

const fallbackVersions = new Set([
  "4-management",
  "3.13-management",
  "3.12-management",
] as const);

async function createComposeService(): Promise<CreateComposeServiceResult> {
  const serviceName = await enhancedText({
    message: "What is the service name?",
    defaultValue: "rabbitmq",
  });

  const version = await enhancedSelect({
    message: "What RabbitMQ version would you like to use?",
    options: Array.from(fallbackVersions).map((value) => ({
      value,
      label: value,
    })),
    initialValue: "4-management",
  });

  const user = await enhancedText({
    message: "What is the RabbitMQ user?",
    defaultValue: "guest",
  });

  const password = await enhancedText({
    message: "What is the RabbitMQ password?",
    defaultValue: "guest",
  });

  const amqpPort = await enhancedText({
    message: "What is the AMQP port?",
    defaultValue: String(imageConfig.defaultPort),
    validate(value) {
      const result = getPortSchema(imageConfig.defaultPort).safeParse(value);

      if (!result.success) {
        return formatZodErrors(result.error);
      }
    },
  });

  const managementPort = await enhancedText({
    message: "What is the Management UI port?",
    defaultValue: "15672",
    validate(value) {
      const result = getPortSchema(15_672).safeParse(value);

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
        RABBITMQ_DEFAULT_USER: user,
        RABBITMQ_DEFAULT_PASS: password,
      },
      ports: [`${amqpPort}:5672`, `${managementPort}:15672`],
      ...(useVolume && {
        volumes: [`${serviceName}_data:/var/lib/rabbitmq`],
      }),
      healthcheck: {
        test: ["CMD-SHELL", "rabbitmq-diagnostics -q ping"],
        interval: "10s",
        timeout: "5s",
        retries: 5,
      },
    },
    connectionConfig: {
      type: "rabbitmq" as const,
      user,
      password,
      host: "localhost",
      port: amqpPort,
    },
  };
}

export const config = {
  createComposeService,
  imageConfig,
};
