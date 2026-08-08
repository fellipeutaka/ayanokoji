import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, test, vi } from "vitest";
import { parse } from "yaml";

import type { enhancedConfirm, enhancedText } from "~/utils/prompts";

const promptMocks = vi.hoisted(() => ({
  // Preserve the prompt helper's Promise-returning contract in this Vitest mock.
  enhancedConfirm: vi.fn<typeof enhancedConfirm>().mockResolvedValue(true),
  // Preserve the prompt helper's Promise-returning contract in this Vitest mock.
  // Vitest's Mock type cannot preserve the generic multiselect signature required by the module factory.
  enhancedMultiselect: vi
    // oxlint-disable-next-line typescript/no-explicit-any
    .fn<(...args: any[]) => Promise<any>>()
    .mockResolvedValue(["postgresql"]),
  // Vitest's Mock type cannot preserve the generic select signature required by the module factory.
  enhancedSelect: vi
    // oxlint-disable-next-line typescript/no-explicit-any
    .fn<(...args: any[]) => Promise<any>>()
    .mockImplementation(
      // Preserve the prompt helper's Promise-returning contract in this Vitest mock.
      // oxlint-disable-next-line require-await
      async ({ initialValue }: { initialValue?: string }) =>
        initialValue ?? "latest"
    ),
  enhancedText: vi.fn<typeof enhancedText>(
    // Preserve the prompt helper's Promise-returning contract in this Vitest mock.
    // oxlint-disable-next-line require-await
    async ({ defaultValue }) => defaultValue ?? ""
  ),
}));

vi.mock(import("~/utils/prompts"), () => promptMocks);

async function createComposeFixture(
  overrides: { services?: string } = {}
): Promise<string> {
  const cwd = await mkdtemp(path.join(tmpdir(), "ayanokoji-compose-"));
  const services =
    overrides.services ??
    "  app:\n    image: example/app\n    labels:\n      com.example.owner: user";

  await writeFile(
    path.join(cwd, "compose.yaml"),
    `name: example\nservices:\n${services}\nvolumes:\n  shared_data:\n    labels:\n      com.example.owner: user\n`
  );

  return cwd;
}

describe("initDocker", () => {
  test("initDocker writes the transformed document after service selection", async () => {
    const cwd = await createComposeFixture();

    try {
      const { initDocker } = await import("./init-docker");
      const result = await initDocker({ cwd });

      expect(result.isOk()).toBeTruthy();
      const document: unknown = parse(
        await readFile(path.join(cwd, "compose.yaml"), "utf-8")
      );

      expect(document).toStrictEqual({
        name: "example",
        services: {
          app: {
            image: "example/app",
            labels: { "com.example.owner": "user" },
          },
          postgres: {
            environment: {
              POSTGRES_DB: "docker",
              POSTGRES_PASSWORD: "docker",
              POSTGRES_USER: "docker",
            },
            healthcheck: {
              interval: "10s",
              retries: 5,
              test: ["CMD-SHELL", "pg_isready -U docker -d docker"],
              timeout: "5s",
            },
            image: "postgres:latest",
            ports: ["5432:5432"],
            volumes: ["postgres_data:/var/lib/postgresql/data"],
          },
        },
        volumes: {
          postgres_data: {},
          shared_data: { labels: { "com.example.owner": "user" } },
        },
      });
    } finally {
      await rm(cwd, { force: true, recursive: true });
    }
  });

  test("initDocker preserves selected database order during configuration loading", async () => {
    const cwd = await createComposeFixture();
    promptMocks.enhancedMultiselect.mockImplementationOnce(
      // Preserve the async prompt helper contract in this test double.
      // oxlint-disable-next-line require-await
      async () => ["postgresql", "mysql"]
    );

    try {
      const { initDocker } = await import("./init-docker");
      const result = await initDocker({ cwd });

      expect(result.isOk()).toBeTruthy();
      if (result.isErr()) {
        return;
      }

      expect(
        result.value.imageConfigs.map(({ repository }) => repository)
      ).toStrictEqual(["postgres", "mysql"]);
      expect(
        result.value.connectionConfigs.map(({ type }) => type)
      ).toStrictEqual(["postgresql", "mysql"]);
    } finally {
      await rm(cwd, { force: true, recursive: true });
    }
  });

  test("initDocker reports a service collision without writing a partial batch", async () => {
    const cwd = await createComposeFixture({
      services:
        "  postgres:\n    image: user/postgres\n  app:\n    image: example/app",
    });
    const original = await readFile(path.join(cwd, "compose.yaml"), "utf-8");

    try {
      const { initDocker } = await import("./init-docker");
      const result = await initDocker({ cwd });

      expect(result.isErr()).toBeTruthy();
      if (result.isOk()) {
        return;
      }

      expect(result.error).toContain('service name "postgres"');
      await expect(
        readFile(path.join(cwd, "compose.yaml"), "utf-8")
      ).resolves.toBe(original);
    } finally {
      await rm(cwd, { force: true, recursive: true });
    }
  });

  test("initDocker returns a parse failure without writing the Compose file", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "ayanokoji-compose-"));
    const composePath = path.join(cwd, "compose.yaml");
    const invalidDocument = "services:\n  app: [";
    await writeFile(composePath, invalidDocument);

    try {
      const { initDocker } = await import("./init-docker");
      const result = await initDocker({ cwd });

      expect(result.isErr()).toBeTruthy();
      if (result.isOk()) {
        return;
      }

      expect(result.error).toBe(
        "Failed to parse existing Docker Compose file: compose.yaml"
      );
      await expect(readFile(composePath, "utf-8")).resolves.toBe(
        invalidDocument
      );
    } finally {
      await rm(cwd, { force: true, recursive: true });
    }
  });

  test("initDocker prompts for a candidate when multiple Compose files exist", async () => {
    const cwd = await createComposeFixture();
    const alternatePath = path.join(cwd, "docker-compose.yml");
    const alternateSource = `name: alternate
services:
  app:
    image: alternate/app
  `;
    await writeFile(alternatePath, alternateSource);
    promptMocks.enhancedSelect.mockResolvedValueOnce("docker-compose.yml");

    try {
      const { initDocker } = await import("./init-docker");
      const result = await initDocker({ cwd });

      expect(result.isOk()).toBeTruthy();
      await expect(readFile(alternatePath, "utf-8")).resolves.not.toBe(
        alternateSource
      );
      await expect(
        readFile(path.join(cwd, "compose.yaml"), "utf-8")
      ).resolves.toBe(
        "name: example\nservices:\n  app:\n    image: example/app\n    labels:\n      com.example.owner: user\nvolumes:\n  shared_data:\n    labels:\n      com.example.owner: user\n"
      );
    } finally {
      await rm(cwd, { force: true, recursive: true });
    }
  });

  test("initDocker prompts for a supported filename when no Compose file exists", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "ayanokoji-compose-"));

    try {
      const { initDocker } = await import("./init-docker");
      const result = await initDocker({ cwd });

      expect(result.isOk()).toBeTruthy();
      await expect(
        readFile(path.join(cwd, "compose.yaml"), "utf-8")
      ).resolves.toContain("services:");
    } finally {
      await rm(cwd, { force: true, recursive: true });
    }
  });
});
