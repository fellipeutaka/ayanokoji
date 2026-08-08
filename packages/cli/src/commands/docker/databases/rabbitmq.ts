import { enhancedConfirm, enhancedSelect, enhancedText } from "~/utils/prompts";

import type { CreateComposeServiceResult, DatabaseImageConfig } from ".";
import { validatePort } from "../schemas/port";

const imageConfig: DatabaseImageConfig = {
  defaultPort: 5672,
  repository: "rabbitmq",
};

const fallbackVersions = new Set([
  "4-management",
  "3.13-management",
  "3.12-management",
] as const);

async function createComposeService(): Promise<CreateComposeServiceResult> {
  const serviceName = await enhancedText({
    defaultValue: "rabbitmq",
    message: "What is the service name?",
  });

  const version = await enhancedSelect({
    initialValue: "4-management",
    message: "What RabbitMQ version would you like to use?",
    options: [...fallbackVersions].map((value) => ({
      label: value,
      value,
    })),
  });

  const user = await enhancedText({
    defaultValue: "guest",
    message: "What is the RabbitMQ user?",
  });

  const password = await enhancedText({
    defaultValue: "guest",
    message: "What is the RabbitMQ password?",
  });

  const amqpPort = await enhancedText({
    defaultValue: String(imageConfig.defaultPort),
    message: "What is the AMQP port?",
    validate(value) {
      return validatePort(value, imageConfig.defaultPort);
    },
  });

  const managementPort = await enhancedText({
    defaultValue: "15672",
    message: "What is the Management UI port?",
    validate(value) {
      return validatePort(value, 15_672);
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
        RABBITMQ_DEFAULT_PASS: password,
        RABBITMQ_DEFAULT_USER: user,
      },
      ports: [`${amqpPort}:5672`, `${managementPort}:15672`],
      ...(useVolume && {
        volumes: [`${serviceName}_data:/var/lib/rabbitmq`],
      }),
      healthcheck: {
        interval: "10s",
        retries: 5,
        test: ["CMD-SHELL", "rabbitmq-diagnostics -q ping"],
        timeout: "5s",
      },
    },
    connectionConfig: {
      host: "localhost",
      password,
      port: amqpPort,
      type: "rabbitmq" as const,
      user,
    },
    name: serviceName,
  };
}

export const config = {
  createComposeService,
  imageConfig,
};
