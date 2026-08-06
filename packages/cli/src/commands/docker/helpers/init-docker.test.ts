import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test, vi } from "vitest";
import { parse } from "yaml";

const promptMocks = vi.hoisted(() => ({
  enhancedConfirm: vi.fn(async () => true),
  enhancedMultiselect: vi.fn(async () => ["postgresql"]),
  enhancedSelect: vi.fn(
    async ({ initialValue }: { initialValue?: string }) =>
      initialValue ?? "latest"
  ),
  enhancedText: vi.fn(
    async ({ defaultValue }: { defaultValue?: string }) => defaultValue ?? ""
  ),
}));

vi.mock("~/utils/prompts", () => promptMocks);

test("initDocker writes the transformed document after service selection", async () => {
  const cwd = await createComposeFixture();

  try {
    const { initDocker } = await import("./init-docker");
    const result = await initDocker({ cwd });

    expect(result.isOk()).toBe(true);
    const document = parse(
      (await readFile(join(cwd, "compose.yaml"), "utf8")).toString()
    );

    expect(document.services.postgres.image).toBe("postgres:latest");
    expect(document.services.app).toEqual({
      image: "example/app",
      labels: { "com.example.owner": "user" },
    });
    expect(document.volumes).toEqual({
      shared_data: { labels: { "com.example.owner": "user" } },
      postgres_data: {},
    });
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("initDocker reports a service collision without writing a partial batch", async () => {
  const cwd = await createComposeFixture({
    services:
      "  postgres:\n    image: user/postgres\n  app:\n    image: example/app",
  });
  const original = await readFile(join(cwd, "compose.yaml"), "utf8");

  try {
    const { initDocker } = await import("./init-docker");
    const result = await initDocker({ cwd });

    expect(result.isErr()).toBe(true);
    if (result.isOk()) {
      return;
    }

    expect(result.error).toContain('service name "postgres"');
    expect(await readFile(join(cwd, "compose.yaml"), "utf8")).toBe(original);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("initDocker returns a parse failure without writing the Compose file", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "ayanokoji-compose-"));
  const composePath = join(cwd, "compose.yaml");
  const invalidDocument = "services:\n  app: [";
  await writeFile(composePath, invalidDocument);

  try {
    const { initDocker } = await import("./init-docker");
    const result = await initDocker({ cwd });

    expect(result.isErr()).toBe(true);
    if (result.isOk()) {
      return;
    }

    expect(result.error).toBe(
      "Failed to parse existing Docker Compose file: compose.yaml"
    );
    expect((await readFile(composePath, "utf8")).toString()).toBe(
      invalidDocument
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("initDocker prompts for a candidate when multiple Compose files exist", async () => {
  const cwd = await createComposeFixture();
  const alternatePath = join(cwd, "docker-compose.yml");
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

    expect(result.isOk()).toBe(true);
    expect((await readFile(alternatePath, "utf8")).toString()).not.toBe(
      alternateSource
    );
    expect((await readFile(join(cwd, "compose.yaml"), "utf8")).toString()).toBe(
      "name: example\nservices:\n  app:\n    image: example/app\n    labels:\n      com.example.owner: user\nvolumes:\n  shared_data:\n    labels:\n      com.example.owner: user\n"
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("initDocker prompts for a supported filename when no Compose file exists", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "ayanokoji-compose-"));

  try {
    const { initDocker } = await import("./init-docker");
    const result = await initDocker({ cwd });

    expect(result.isOk()).toBe(true);
    expect(
      (await readFile(join(cwd, "compose.yaml"), "utf8")).toString()
    ).toContain("services:");
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

async function createComposeFixture(
  overrides: { services?: string } = {}
): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), "ayanokoji-compose-"));
  const services =
    overrides.services ??
    "  app:\n    image: example/app\n    labels:\n      com.example.owner: user";

  await writeFile(
    join(cwd, "compose.yaml"),
    `name: example\nservices:\n${services}\nvolumes:\n  shared_data:\n    labels:\n      com.example.owner: user\n`
  );

  return cwd;
}
