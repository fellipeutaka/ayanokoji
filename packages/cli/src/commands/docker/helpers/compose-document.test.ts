import { expect, test } from "vitest";
import {
  addServices,
  type ComposeDocument,
  type ComposeMutationFailure,
  getRemovableServiceNames,
  removeServices,
} from "./compose-document";

test("reports a valid document without services as a structured no-services result", () => {
  const result = getRemovableServiceNames({ name: "example" });

  expect(result.isErr()).toBe(true);
  if (result.isOk()) {
    return;
  }

  expect(result.error).toEqual({ kind: "no-services" });
});

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

test("removes a service and its unreferenced generated volume", () => {
  const document: ComposeDocument = {
    name: "example",
    services: {
      postgres: {
        image: "postgres:17",
        volumes: ["postgres_data:/var/lib/postgresql/data"],
      },
      app: {
        image: "example/app",
      },
    },
    volumes: {
      postgres_data: {},
      shared_data: { labels: { owner: "user" } },
    },
    networks: {
      internal: { driver: "bridge" },
    },
  };
  const original = structuredClone(document);

  const result = removeServices(document, ["postgres"]);

  expect(result.isOk()).toBe(true);
  if (result.isErr()) {
    return;
  }

  expect(result.value).toEqual({
    name: "example",
    services: {
      app: {
        image: "example/app",
      },
    },
    volumes: {
      shared_data: { labels: { owner: "user" } },
    },
    networks: {
      internal: { driver: "bridge" },
    },
  });
  expect(document).toEqual(original);
  expect(result.value).not.toBe(document);
});

test("omits the volume collection when its last generated declaration is removed", () => {
  const document: ComposeDocument = {
    services: {
      postgres: {
        image: "postgres:17",
        volumes: ["postgres_data:/var/lib/postgresql/data"],
      },
    },
    volumes: {
      postgres_data: {},
    },
  };

  const result = removeServices(document, ["postgres"]);

  expect(result.isOk()).toBe(true);
  if (result.isErr()) {
    return;
  }

  expect(result.value).toEqual({ services: {} });
  expect(result.value).not.toHaveProperty("volumes");
});

test("rejects a removal batch with a missing service without changing the document", () => {
  const document: ComposeDocument = {
    services: {
      postgres: { image: "postgres:17" },
      redis: { image: "redis:7" },
    },
  };
  const original = structuredClone(document);

  const result = removeServices(document, ["postgres", "missing"]);

  expect(result.isErr()).toBe(true);
  if (result.isOk()) {
    return;
  }

  expect(result.error).toEqual<ComposeMutationFailure>({
    kind: "service-not-found",
    serviceName: "missing",
  });
  expect(document).toEqual(original);
});

test("rejects an empty removal batch", () => {
  const document: ComposeDocument = {
    services: { postgres: { image: "postgres:17" } },
  };

  const result = removeServices(document, []);

  expect(result.isErr()).toBe(true);
  if (result.isOk()) {
    return;
  }

  expect(result.error).toEqual({ kind: "empty-service-batch" });
  expect(document.services).toHaveProperty("postgres");
});

test("rejects an empty service name in a removal batch", () => {
  const document: ComposeDocument = {
    services: { postgres: { image: "postgres:17" } },
  };

  const result = removeServices(document, [""]);

  expect(result.isErr()).toBe(true);
  if (result.isOk()) {
    return;
  }

  expect(result.error).toEqual<ComposeMutationFailure>({
    kind: "invalid-service-entry",
    index: 0,
    serviceName: "",
    reason: "empty-name",
  });
});

test("rejects removal when a remaining service depends on a selected service", () => {
  const document: ComposeDocument = {
    services: {
      postgres: { image: "postgres:17" },
      redis: { image: "redis:7" },
      app: {
        image: "example/app",
        depends_on: ["postgres"],
      },
    },
  };

  const result = removeServices(document, ["postgres", "redis"]);

  expect(result.isErr()).toBe(true);
  if (result.isOk()) {
    return;
  }

  expect(result.error).toEqual<ComposeMutationFailure>({
    kind: "service-dependency-conflict",
    serviceName: "app",
    dependencyName: "postgres",
  });
  expect(document.services).toHaveProperty("postgres");
  expect(document.services).toHaveProperty("redis");
});

test("protects dependencies declared in the mapping form", () => {
  const document: ComposeDocument = {
    services: {
      postgres: { image: "postgres:17" },
      app: {
        image: "example/app",
        depends_on: {
          postgres: { condition: "service_healthy" },
        },
      },
    },
  };

  const result = removeServices(document, ["postgres"]);

  expect(result.isErr()).toBe(true);
  if (result.isOk()) {
    return;
  }

  expect(result.error).toEqual({
    kind: "service-dependency-conflict",
    serviceName: "app",
    dependencyName: "postgres",
  });
});

test("ignores service references outside explicit depends_on declarations", () => {
  const document: ComposeDocument = {
    services: {
      postgres: { image: "postgres:17" },
      app: {
        image: "example/app",
        links: ["postgres"],
        network_mode: "service:postgres",
        environment: ["DATABASE_HOST=postgres"],
      },
    },
  };

  const result = removeServices(document, ["postgres"]);

  expect(result.isOk()).toBe(true);
  if (result.isErr()) {
    return;
  }

  expect(result.value.services).toEqual({
    app: {
      image: "example/app",
      links: ["postgres"],
      network_mode: "service:postgres",
      environment: ["DATABASE_HOST=postgres"],
    },
  });
});

test("preserves a generated volume shared by a remaining service", () => {
  const document: ComposeDocument = {
    services: {
      postgres: {
        image: "postgres:17",
        volumes: ["postgres_data:/var/lib/postgresql/data"],
      },
      backup: {
        image: "example/backup",
        volumes: ["postgres_data:/backup"],
      },
    },
    volumes: {
      postgres_data: {},
    },
  };

  const result = removeServices(document, ["postgres"]);

  expect(result.isOk()).toBe(true);
  if (result.isErr()) {
    return;
  }

  expect(result.value.volumes).toEqual({ postgres_data: {} });
});

test("cleans only simple generated volume declarations", () => {
  const document: ComposeDocument = {
    services: {
      postgres: {
        image: "postgres:17",
        volumes: [
          "postgres_data:/var/lib/postgresql/data",
          "shared_data:/shared",
          "./host-data:/bind",
          "/anonymous",
          "custom_data:/custom",
        ],
      },
      redis: {
        image: "redis:7",
        volumes: [{ type: "volume", source: "redis_data", target: "/data" }],
      },
      mysql: {
        image: "mysql:9",
        volumes: ["mysql_data:/var/lib/mysql"],
      },
    },
    volumes: {
      postgres_data: {},
      shared_data: {},
      custom_data: {},
      redis_data: { external: true },
      mysql_data: { labels: { owner: "user" } },
    },
  };

  const result = removeServices(document, ["postgres", "redis", "mysql"]);

  expect(result.isOk()).toBe(true);
  if (result.isErr()) {
    return;
  }

  expect(result.value.volumes).toEqual({
    shared_data: {},
    custom_data: {},
    redis_data: { external: true },
    mysql_data: { labels: { owner: "user" } },
  });
});

test("preserves top-level volumes for bind and anonymous mounts", () => {
  const document: ComposeDocument = {
    services: {
      app: {
        image: "example/app",
        volumes: ["./app-data:/data", "/cache"],
      },
    },
    volumes: {
      app_data: {},
    },
  };

  const result = removeServices(document, ["app"]);

  expect(result.isOk()).toBe(true);
  if (result.isErr()) {
    return;
  }

  expect(result.value.volumes).toEqual({ app_data: {} });
});

test("preserves an empty volume collection when no generated declaration is removed", () => {
  const document: ComposeDocument = {
    services: {
      app: { image: "example/app" },
    },
    volumes: {},
  };

  const result = removeServices(document, ["app"]);

  expect(result.isOk()).toBe(true);
  if (result.isErr()) {
    return;
  }

  expect(result.value.volumes).toEqual({});
});
