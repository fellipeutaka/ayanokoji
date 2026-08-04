import { expect, mock, test } from "bun:test";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse } from "yaml";

const handleErrorMock = mock((error: string): never => {
  throw new Error(error);
});
const enhancedSelectMock = mock(async () => "latest");
let confirmResult = false;

mock.module("~/utils/handle-error", () => ({
  handleError: handleErrorMock,
}));

mock.module("~/utils/prompts", () => ({
  enhancedConfirm: mock(async () => confirmResult),
  enhancedMultiselect: mock(async () => ["postgres"]),
  enhancedSelect: enhancedSelectMock,
  enhancedText: mock(
    async ({ defaultValue }: { defaultValue?: string }) => defaultValue ?? ""
  ),
}));

test("remove command writes the pure removal result", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "ayanokoji-compose-remove-"));
  const composePath = join(cwd, "compose.yaml");

  await writeFile(
    composePath,
    `name: example
services:
  postgres:
    image: postgres:17
    volumes:
      - postgres_data:/var/lib/postgresql/data
  app:
    image: example/app
volumes:
  postgres_data: {}
  shared_data:
    labels:
      owner: user
networks:
  internal:
    driver: bridge
`
  );

  try {
    const { remove } = await import("./remove");
    await remove.parseAsync(["node", "ayanokoji", "--cwd", cwd]);

    const document = parse((await readFile(composePath, "utf8")).toString());
    expect(document).toEqual({
      name: "example",
      services: {
        app: {
          image: "example/app",
        },
      },
      volumes: {
        shared_data: {
          labels: {
            owner: "user",
          },
        },
      },
      networks: {
        internal: {
          driver: "bridge",
        },
      },
    });
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("remove reports a missing Compose document without creating one", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "ayanokoji-compose-remove-"));

  try {
    const { remove } = await import("./remove");

    await expect(
      remove.parseAsync(["node", "ayanokoji", "--cwd", cwd])
    ).rejects.toThrow("No Docker Compose file found.");
    expect(await readdir(cwd)).toEqual([]);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("remove reports no services without writing a valid document", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "ayanokoji-compose-remove-"));
  const composePath = join(cwd, "compose.yaml");
  const source = "name: example\nnetworks:\n  internal: {}\n";
  await writeFile(composePath, source);

  try {
    const { remove } = await import("./remove");

    await expect(
      remove.parseAsync(["node", "ayanokoji", "--cwd", cwd])
    ).rejects.toThrow("No services found in the compose file.");
    expect((await readFile(composePath, "utf8")).toString()).toBe(source);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("remove prompts for a candidate when multiple Compose files exist", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "ayanokoji-compose-remove-"));
  const firstPath = join(cwd, "compose.yaml");
  const secondPath = join(cwd, "docker-compose.yml");
  const source = `services:
  postgres:
    image: postgres:17
`;
  await writeFile(firstPath, source);
  await writeFile(secondPath, source);

  enhancedSelectMock.mockImplementationOnce(async () => "docker-compose.yml");

  try {
    const { remove } = await import("./remove");
    await remove.parseAsync(["node", "ayanokoji", "--cwd", cwd]);

    expect((await readFile(secondPath, "utf8")).toString()).not.toBe(source);
    expect((await readFile(firstPath, "utf8")).toString()).toBe(source);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("remove reports an environment failure after the Compose file is written", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "ayanokoji-compose-remove-"));
  const composePath = join(cwd, "compose.yaml");
  const envPath = join(cwd, "env-directory");
  await writeFile(
    composePath,
    `services:
  postgres:
    image: postgres:17
`
  );
  await mkdir(envPath);

  try {
    const { remove } = await import("./remove");

    await expect(
      remove.parseAsync([
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

    expect((await readFile(composePath, "utf8")).toString()).not.toContain(
      "postgres:"
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("remove synchronizes environment cleanup after a successful Compose write", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "ayanokoji-compose-remove-"));
  const composePath = join(cwd, "compose.yaml");
  const envPath = join(cwd, ".env");
  await writeFile(
    composePath,
    `services:
  postgres:
    image: postgres:17
`
  );
  await writeFile(envPath, "POSTGRESQL_URL=postgresql://docker\n");
  confirmResult = true;

  try {
    const { remove } = await import("./remove");
    await remove.parseAsync(["node", "ayanokoji", "--cwd", cwd]);

    expect((await readFile(composePath, "utf8")).toString()).not.toContain(
      "postgres:"
    );
    expect((await readFile(envPath, "utf8")).toString()).toBe("\n");
  } finally {
    confirmResult = false;
    await rm(cwd, { recursive: true, force: true });
  }
});
