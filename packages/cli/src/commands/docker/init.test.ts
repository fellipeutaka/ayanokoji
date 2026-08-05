import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test, vi } from "vitest";

const { confirmResults, handleErrorMock, promptMocks } = vi.hoisted(() => {
  const confirmResults = [true, true];
  const handleErrorMock = vi.fn((error: string): never => {
    throw new Error(error);
  });
  const promptMocks = {
    enhancedConfirm: vi.fn(async () => confirmResults.shift() ?? true),
    enhancedMultiselect: vi.fn(async () => ["postgresql"]),
    enhancedSelect: vi.fn(
      async ({ initialValue }: { initialValue?: string }) =>
        initialValue ?? "latest"
    ),
    enhancedText: vi.fn(
      async ({ defaultValue }: { defaultValue?: string }) => defaultValue ?? ""
    ),
  };

  return { confirmResults, handleErrorMock, promptMocks };
});

vi.mock("~/utils/handle-error", () => ({
  handleError: handleErrorMock,
}));

vi.mock("~/utils/prompts", () => promptMocks);

test("init reports an environment failure after the Compose file is written", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "ayanokoji-docker-init-"));
  const envPath = join(cwd, "env-directory");
  await writeFile(join(cwd, "compose.yaml"), "services: {}\n");
  await mkdir(envPath);
  confirmResults.splice(0, confirmResults.length, true, true);

  try {
    const { init } = await import("./init");

    await expect(
      init.parseAsync([
        "node",
        "ayanokoji",
        "--cwd",
        cwd,
        "--env-path",
        envPath,
      ])
    ).rejects.toThrow(
      "Docker Compose file was written successfully, but environment synchronization failed"
    );

    expect(
      (await readFile(join(cwd, "compose.yaml"), "utf8")).toString()
    ).toContain("postgres:");
    expect(handleErrorMock).toHaveBeenCalledTimes(1);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("init synchronizes the environment after a successful Compose write", async () => {
  const cwd = await createComposeFixture();
  const envPath = join(cwd, ".env.local");
  confirmResults.splice(0, confirmResults.length, true, true);

  try {
    const { init } = await import("./init");
    await init.parseAsync([
      "node",
      "ayanokoji",
      "--cwd",
      cwd,
      "--env-path",
      envPath,
    ]);

    expect((await readFile(envPath, "utf8")).toString()).toContain(
      "POSTGRESQL_URL=postgresql://docker:docker@localhost:5432/docker"
    );
    expect((await readFile(join(cwd, ".gitignore"), "utf8")).toString()).toBe(
      ".env\n"
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("init succeeds without environment changes when synchronization is declined", async () => {
  const cwd = await createComposeFixture();
  const envPath = join(cwd, ".env.local");
  confirmResults.splice(0, confirmResults.length, true, false);

  try {
    const { init } = await import("./init");
    await init.parseAsync([
      "node",
      "ayanokoji",
      "--cwd",
      cwd,
      "--env-path",
      envPath,
    ]);

    await expect(readFile(envPath)).rejects.toThrow();
    await expect(readFile(join(cwd, ".gitignore"))).rejects.toThrow();
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

async function createComposeFixture(): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), "ayanokoji-docker-init-"));
  await writeFile(join(cwd, "compose.yaml"), "services: {}\n");
  return cwd;
}
