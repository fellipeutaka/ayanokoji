import { expect, test } from "bun:test";
import {
  addServices,
  type ComposeDocument,
  type ComposeMutationFailure,
} from "./compose-document";

test("adds a service while preserving unrelated document data", () => {
  const document: ComposeDocument = {
    name: "example",
    services: {
      app: {
        image: "example/app",
        labels: { "com.example.owner": "user" },
      },
    },
    volumes: {
      shared_data: { labels: { "com.example.owner": "user" } },
    },
    networks: {
      internal: { driver: "bridge" },
    },
  };

  const result = addServices(document, [
    {
      name: "postgres",
      config: {
        image: "postgres:17",
        volumes: ["postgres_data:/var/lib/postgresql/data"],
      },
    },
  ]);

  expect(result.isOk()).toBe(true);
  if (result.isErr()) {
    return;
  }

  expect(result.value).toEqual({
    name: "example",
    services: {
      app: {
        image: "example/app",
        labels: { "com.example.owner": "user" },
      },
      postgres: {
        image: "postgres:17",
        volumes: ["postgres_data:/var/lib/postgresql/data"],
      },
    },
    volumes: {
      shared_data: { labels: { "com.example.owner": "user" } },
      postgres_data: {},
    },
    networks: {
      internal: { driver: "bridge" },
    },
  });
  expect(document).toEqual({
    name: "example",
    services: {
      app: {
        image: "example/app",
        labels: { "com.example.owner": "user" },
      },
    },
    volumes: {
      shared_data: { labels: { "com.example.owner": "user" } },
    },
    networks: {
      internal: { driver: "bridge" },
    },
  });
  expect(result.value).not.toBe(document);
});

test("rejects an existing service collision without a partial batch", () => {
  const document: ComposeDocument = {
    services: {
      app: { image: "example/app" },
    },
  };
  const original = structuredClone(document);

  const result = addServices(document, [
    { name: "worker", config: { image: "example/worker" } },
    { name: "app", config: { image: "replacement" } },
  ]);

  expect(result.isErr()).toBe(true);
  if (result.isOk()) {
    return;
  }

  expect(result.error).toEqual<ComposeMutationFailure>({
    kind: "service-name-conflict",
    serviceName: "app",
    scope: "existing-document",
  });
  expect(document).toEqual(original);
});

test("rejects duplicate service names within one requested batch", () => {
  const document: ComposeDocument = { services: {} };

  const result = addServices(document, [
    { name: "worker", config: { image: "example/worker" } },
    { name: "worker", config: { image: "example/other-worker" } },
  ]);

  expect(result.isErr()).toBe(true);
  if (result.isOk()) {
    return;
  }

  expect(result.error).toEqual({
    kind: "service-name-conflict",
    serviceName: "worker",
    scope: "requested-batch",
  });
  expect(document).toEqual({ services: {} });
});

test("treats an omitted service collection as empty", () => {
  const document: ComposeDocument = {
    name: "example",
    networks: { internal: { driver: "bridge" } },
  };

  const result = addServices(document, [
    {
      name: "redis",
      config: {
        image: "redis:7",
        volumes: ["redis_data:/data"],
      },
    },
  ]);

  expect(result.isOk()).toBe(true);
  if (result.isErr()) {
    return;
  }

  expect(result.value.services).toEqual({
    redis: {
      image: "redis:7",
      volumes: ["redis_data:/data"],
    },
  });
  expect(result.value.volumes).toEqual({ redis_data: {} });
  expect(document).toEqual({
    name: "example",
    networks: { internal: { driver: "bridge" } },
  });
});

test("preserves existing generated volume declarations", () => {
  const document: ComposeDocument = {
    services: {},
    volumes: {
      postgres_data: { external: true, labels: { owner: "user" } },
    },
  };

  const result = addServices(document, [
    {
      name: "postgres",
      config: {
        image: "postgres:17",
        volumes: ["postgres_data:/var/lib/postgresql/data"],
      },
    },
  ]);

  expect(result.isOk()).toBe(true);
  if (result.isErr()) {
    return;
  }

  expect(result.value.volumes).toEqual({
    postgres_data: { external: true, labels: { owner: "user" } },
  });
  expect(document.volumes).toEqual({
    postgres_data: { external: true, labels: { owner: "user" } },
  });
});

test("does not create generated volumes for bind or anonymous mounts", () => {
  const document: ComposeDocument = { services: {} };

  const result = addServices(document, [
    {
      name: "app",
      config: {
        image: "example/app",
        volumes: ["./data:/data", "/tmp/cache:/cache", "/anonymous"],
      },
    },
  ]);

  expect(result.isOk()).toBe(true);
  if (result.isErr()) {
    return;
  }

  expect(result.value.volumes).toBeUndefined();
});
