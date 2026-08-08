import { describe, expect, test } from "vitest";

import {
  addServices,
  getRemovableServiceNames,
  removeServices,
} from "./compose-document";
import type {
  ComposeDocument,
  ComposeMutationFailure,
} from "./compose-document";

describe("compose document", () => {
  test("reports a valid document without services as a structured no-services result", () => {
    const result = getRemovableServiceNames({ name: "example" });

    expect(result.isErr()).toBeTruthy();
    if (result.isOk()) {
      return;
    }

    expect(result.error).toStrictEqual({ kind: "no-services" });
  });

  test("adds a service while preserving unrelated document data", () => {
    const document: ComposeDocument = {
      name: "example",
      networks: {
        internal: { driver: "bridge" },
      },
      services: {
        app: {
          image: "example/app",
          labels: { "com.example.owner": "user" },
        },
      },
      volumes: {
        shared_data: { labels: { "com.example.owner": "user" } },
      },
    };

    const result = addServices(document, [
      {
        config: {
          image: "postgres:17",
          volumes: ["postgres_data:/var/lib/postgresql/data"],
        },
        name: "postgres",
      },
    ]);

    expect(result.isOk()).toBeTruthy();
    if (result.isErr()) {
      return;
    }

    expect(result.value).toStrictEqual({
      name: "example",
      networks: {
        internal: { driver: "bridge" },
      },
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
        postgres_data: {},
        shared_data: { labels: { "com.example.owner": "user" } },
      },
    });
    expect(document).toStrictEqual({
      name: "example",
      networks: {
        internal: { driver: "bridge" },
      },
      services: {
        app: {
          image: "example/app",
          labels: { "com.example.owner": "user" },
        },
      },
      volumes: {
        shared_data: { labels: { "com.example.owner": "user" } },
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
      { config: { image: "example/worker" }, name: "worker" },
      { config: { image: "replacement" }, name: "app" },
    ]);

    expect(result.isErr()).toBeTruthy();
    if (result.isOk()) {
      return;
    }

    expect(result.error).toStrictEqual<ComposeMutationFailure>({
      kind: "service-name-conflict",
      scope: "existing-document",
      serviceName: "app",
    });
    expect(document).toStrictEqual(original);
  });

  test("rejects duplicate service names within one requested batch", () => {
    const document: ComposeDocument = { services: {} };

    const result = addServices(document, [
      { config: { image: "example/worker" }, name: "worker" },
      { config: { image: "example/other-worker" }, name: "worker" },
    ]);

    expect(result.isErr()).toBeTruthy();
    if (result.isOk()) {
      return;
    }

    expect(result.error).toStrictEqual({
      kind: "service-name-conflict",
      scope: "requested-batch",
      serviceName: "worker",
    });
    expect(document).toStrictEqual({ services: {} });
  });

  test("treats an omitted service collection as empty", () => {
    const document: ComposeDocument = {
      name: "example",
      networks: { internal: { driver: "bridge" } },
    };

    const result = addServices(document, [
      {
        config: {
          image: "redis:7",
          volumes: ["redis_data:/data"],
        },
        name: "redis",
      },
    ]);

    expect(result.isOk()).toBeTruthy();
    if (result.isErr()) {
      return;
    }

    expect(result.value.services).toStrictEqual({
      redis: {
        image: "redis:7",
        volumes: ["redis_data:/data"],
      },
    });
    expect(result.value.volumes).toStrictEqual({ redis_data: {} });
    expect(document).toStrictEqual({
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
        config: {
          image: "postgres:17",
          volumes: ["postgres_data:/var/lib/postgresql/data"],
        },
        name: "postgres",
      },
    ]);

    expect(result.isOk()).toBeTruthy();
    if (result.isErr()) {
      return;
    }

    expect(result.value.volumes).toStrictEqual({
      postgres_data: { external: true, labels: { owner: "user" } },
    });
    expect(document.volumes).toStrictEqual({
      postgres_data: { external: true, labels: { owner: "user" } },
    });
  });

  test("does not create generated volumes for bind or anonymous mounts", () => {
    const document: ComposeDocument = { services: {} };

    const result = addServices(document, [
      {
        config: {
          image: "example/app",
          volumes: [
            "./data:/data",
            "/tmp/cache:/cache",
            "C:/workspace:/workspace",
            "C:\\workspace:/workspace",
            "/anonymous",
          ],
        },
        name: "app",
      },
    ]);

    expect(result.isOk()).toBeTruthy();
    if (result.isErr()) {
      return;
    }

    expect(result.value.volumes).toBeUndefined();
  });

  test("removes a service and its unreferenced generated volume", () => {
    const document: ComposeDocument = {
      name: "example",
      networks: {
        internal: { driver: "bridge" },
      },
      services: {
        app: {
          image: "example/app",
        },
        postgres: {
          image: "postgres:17",
          volumes: ["postgres_data:/var/lib/postgresql/data"],
        },
      },
      volumes: {
        postgres_data: {},
        shared_data: { labels: { owner: "user" } },
      },
    };
    const original = structuredClone(document);

    const result = removeServices(document, ["postgres"]);

    expect(result.isOk()).toBeTruthy();
    if (result.isErr()) {
      return;
    }

    expect(result.value).toStrictEqual({
      name: "example",
      networks: {
        internal: { driver: "bridge" },
      },
      services: {
        app: {
          image: "example/app",
        },
      },
      volumes: {
        shared_data: { labels: { owner: "user" } },
      },
    });
    expect(document).toStrictEqual(original);
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

    expect(result.isOk()).toBeTruthy();
    if (result.isErr()) {
      return;
    }

    expect(result.value).toStrictEqual({ services: {} });
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

    expect(result.isErr()).toBeTruthy();
    if (result.isOk()) {
      return;
    }

    expect(result.error).toStrictEqual<ComposeMutationFailure>({
      kind: "service-not-found",
      serviceName: "missing",
    });
    expect(document).toStrictEqual(original);
  });

  test("rejects an empty removal batch", () => {
    const document: ComposeDocument = {
      services: { postgres: { image: "postgres:17" } },
    };

    const result = removeServices(document, []);

    expect(result.isErr()).toBeTruthy();
    if (result.isOk()) {
      return;
    }

    expect(result.error).toStrictEqual({ kind: "empty-service-batch" });
    expect(document.services).toHaveProperty("postgres");
  });

  test("rejects an empty service name in a removal batch", () => {
    const document: ComposeDocument = {
      services: { postgres: { image: "postgres:17" } },
    };

    const result = removeServices(document, [""]);

    expect(result.isErr()).toBeTruthy();
    if (result.isOk()) {
      return;
    }

    expect(result.error).toStrictEqual<ComposeMutationFailure>({
      index: 0,
      kind: "invalid-service-entry",
      reason: "empty-name",
      serviceName: "",
    });
  });

  test("rejects removal when a remaining service depends on a selected service", () => {
    const document: ComposeDocument = {
      services: {
        app: {
          depends_on: ["postgres"],
          image: "example/app",
        },
        postgres: { image: "postgres:17" },
        redis: { image: "redis:7" },
      },
    };

    const result = removeServices(document, ["postgres", "redis"]);

    expect(result.isErr()).toBeTruthy();
    if (result.isOk()) {
      return;
    }

    expect(result.error).toStrictEqual<ComposeMutationFailure>({
      dependencyName: "postgres",
      kind: "service-dependency-conflict",
      serviceName: "app",
    });
    expect(document.services).toHaveProperty("postgres");
    expect(document.services).toHaveProperty("redis");
  });

  test("protects dependencies declared in the mapping form", () => {
    const document: ComposeDocument = {
      services: {
        app: {
          depends_on: {
            postgres: { condition: "service_healthy" },
          },
          image: "example/app",
        },
        postgres: { image: "postgres:17" },
      },
    };

    const result = removeServices(document, ["postgres"]);

    expect(result.isErr()).toBeTruthy();
    if (result.isOk()) {
      return;
    }

    expect(result.error).toStrictEqual({
      dependencyName: "postgres",
      kind: "service-dependency-conflict",
      serviceName: "app",
    });
  });

  test("ignores service references outside explicit depends_on declarations", () => {
    const document: ComposeDocument = {
      services: {
        app: {
          environment: ["DATABASE_HOST=postgres"],
          image: "example/app",
          links: ["postgres"],
          network_mode: "service:postgres",
        },
        postgres: { image: "postgres:17" },
      },
    };

    const result = removeServices(document, ["postgres"]);

    expect(result.isOk()).toBeTruthy();
    if (result.isErr()) {
      return;
    }

    expect(result.value.services).toStrictEqual({
      app: {
        environment: ["DATABASE_HOST=postgres"],
        image: "example/app",
        links: ["postgres"],
        network_mode: "service:postgres",
      },
    });
  });

  test("preserves a generated volume shared by a remaining service", () => {
    const document: ComposeDocument = {
      services: {
        backup: {
          image: "example/backup",
          volumes: ["postgres_data:/backup"],
        },
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

    expect(result.isOk()).toBeTruthy();
    if (result.isErr()) {
      return;
    }

    expect(result.value.volumes).toStrictEqual({ postgres_data: {} });
  });

  test("cleans only simple generated volume declarations", () => {
    const document: ComposeDocument = {
      services: {
        mysql: {
          image: "mysql:9",
          volumes: ["mysql_data:/var/lib/mysql"],
        },
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
          volumes: [{ source: "redis_data", target: "/data", type: "volume" }],
        },
      },
      volumes: {
        custom_data: {},
        mysql_data: { labels: { owner: "user" } },
        postgres_data: {},
        redis_data: { external: true },
        shared_data: {},
      },
    };

    const result = removeServices(document, ["postgres", "redis", "mysql"]);

    expect(result.isOk()).toBeTruthy();
    if (result.isErr()) {
      return;
    }

    expect(result.value.volumes).toStrictEqual({
      custom_data: {},
      mysql_data: { labels: { owner: "user" } },
      redis_data: { external: true },
      shared_data: {},
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

    expect(result.isOk()).toBeTruthy();
    if (result.isErr()) {
      return;
    }

    expect(result.value.volumes).toStrictEqual({ app_data: {} });
  });

  test("preserves an empty volume collection when no generated declaration is removed", () => {
    const document: ComposeDocument = {
      services: {
        app: { image: "example/app" },
      },
      volumes: {},
    };

    const result = removeServices(document, ["app"]);

    expect(result.isOk()).toBeTruthy();
    if (result.isErr()) {
      return;
    }

    expect(result.value.volumes).toStrictEqual({});
  });
});
