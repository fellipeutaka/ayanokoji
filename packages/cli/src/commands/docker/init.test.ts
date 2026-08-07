import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { expect, test, vi } from "vitest";

const { confirmResults, handleErrorMock, promptMocks } = vi.hoisted(() => {
  const confirmResults = [true, true];
  const handleErrorMock = vi.fn((error: string): never => {
    throw new Error(error);
  });
  const promptMocks = {
    enhancedConfirm: vi.fn(async () => confirmResults.shift() ?? true),
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
  };

  return { confirmResults, handleErrorMock, promptMocks };
});

vi.mock(import("~/utils/handle-error"), () => ({
  handleError: handleErrorMock,
}));

vi.mock(import("~/utils/prompts"), () => promptMocks);

test("init reports an environment failure after the Compose file is written", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "ayanokoji-docker-init-"));
  const envPath = path.join(cwd, "env-directory");
  await writeFile(path.join(cwd, "compose.yaml"), "services: {}\n");
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
      (await readFile(path.join(cwd, "compose.yaml"), "utf-8")).toString()
    ).toContain("postgres:");
    expect(handleErrorMock).toHaveBeenCalledOnce();
  } finally {
    await rm(cwd, { force: true, recursive: true });
  }
});

test("init synchronizes the environment after a successful Compose write", async () => {
  const cwd = await createComposeFixture();
  const envPath = path.join(cwd, ".env.local");
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

    expect((await readFile(envPath, "utf-8")).toString()).toContain(
      "POSTGRESQL_URL=postgresql://docker:docker@localhost:5432/docker"
    );
    expect(
      (await readFile(path.join(cwd, ".gitignore"), "utf-8")).toString()
    ).toBe(".env\n");
  } finally {
    await rm(cwd, { force: true, recursive: true });
  }
});

test("init succeeds without environment changes when synchronization is declined", async () => {
  const cwd = await createComposeFixture();
  const envPath = path.join(cwd, ".env.local");
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
    await expect(readFile(path.join(cwd, ".gitignore"))).rejects.toThrow();
  } finally {
    await rm(cwd, { force: true, recursive: true });
  }
});

async function createComposeFixture(): Promise<string> {
  const cwd = await mkdtemp(path.join(tmpdir(), "ayanokoji-docker-init-"));
  await writeFile(path.join(cwd, "compose.yaml"), "services: {}\n");
  return cwd;
}
