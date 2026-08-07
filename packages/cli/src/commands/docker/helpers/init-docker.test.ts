import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { expect, test, vi } from "vitest";
import { parse } from "yaml";

const promptMocks = vi.hoisted(() => ({
  enhancedConfirm: vi.fn(async () => true),
  enhancedMultiselect: vi.fn().mockImplementation(async () => ["postgresql"]),
  enhancedSelect: vi
    .fn()
    .mockImplementation(
      async ({ initialValue }: { initialValue?: string }) =>
        initialValue ?? "latest"
    ),
  enhancedText: vi.fn(
    async ({ defaultValue }: { defaultValue?: string }) => defaultValue ?? ""
  ),
}));

vi.mock(import("~/utils/prompts"), () => promptMocks);

test("initDocker writes the transformed document after service selection", async () => {
  const cwd = await createComposeFixture();

  try {
    const { initDocker } = await import("./init-docker");
    const result = await initDocker({ cwd });

    expect(result.isOk()).toBeTruthy();
    const document = parse(
      (await readFile(path.join(cwd, "compose.yaml"), "utf-8")).toString()
    );

    expect(document.services.postgres.image).toBe("postgres:latest");
    expect(document.services.app).toStrictEqual({
      image: "example/app",
      labels: { "com.example.owner": "user" },
    });
    expect(document.volumes).toStrictEqual({
      postgres_data: {},
      shared_data: { labels: { "com.example.owner": "user" } },
    });
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
    expect((await readFile(composePath, "utf-8")).toString()).toBe(
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
  promptMocks.enhancedSelect.mockImplementationOnce(
    async () => "docker-compose.yml"
  );

  try {
    const { initDocker } = await import("./init-docker");
    const result = await initDocker({ cwd });

    expect(result.isOk()).toBeTruthy();
    expect((await readFile(alternatePath, "utf-8")).toString()).not.toBe(
      alternateSource
    );
    expect(
      (await readFile(path.join(cwd, "compose.yaml"), "utf-8")).toString()
    ).toBe(
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
    expect(
      (await readFile(path.join(cwd, "compose.yaml"), "utf-8")).toString()
    ).toContain("services:");
  } finally {
    await rm(cwd, { force: true, recursive: true });
  }
});

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
