import {
  chmod,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rename,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import {
  COMPOSE_FILE_NAMES,
  type ComposeFileFailure,
  type ComposeFileSystem,
  discoverComposeFiles,
  readComposeDocument,
  writeComposeDocument,
} from "./compose-file-adapter";

test("discovers every supported Compose candidate without selecting one", async () => {
  const cwd = await createTempDirectory();

  try {
    await writeFile(join(cwd, "compose.yaml"), "services: {}\n");
    await writeFile(join(cwd, "docker-compose.yml"), "services: {}\n");

    const result = await discoverComposeFiles(cwd);

    expect(result.isOk()).toBe(true);
    if (result.isErr()) {
      return;
    }

    expect(result.value).toEqual(["compose.yaml", "docker-compose.yml"]);
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("reports no candidates without inventing a Compose filename", async () => {
  const cwd = await createTempDirectory();

  try {
    const result = await discoverComposeFiles(cwd);

    expect(result.isOk()).toBe(true);
    if (result.isErr()) {
      return;
    }

    expect(result.value).toEqual([]);
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("recognizes only the supported Compose filenames", async () => {
  const cwd = await createTempDirectory();

  try {
    await writeFile(join(cwd, "compose.json"), "{}\n");
    await writeFile(join(cwd, "custom-compose.yaml"), "services: {}\n");

    const result = await discoverComposeFiles(cwd);

    expect(result.isOk()).toBe(true);
    if (result.isErr()) {
      return;
    }

    expect(result.value).toEqual([]);
    expect(COMPOSE_FILE_NAMES).toEqual([
      "compose.yaml",
      "compose.yml",
      "docker-compose.yaml",
      "docker-compose.yml",
    ]);
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("does not treat a directory with a supported name as a Compose candidate", async () => {
  const cwd = await createTempDirectory();

  try {
    await mkdir(join(cwd, "compose.yaml"));

    const result = await discoverComposeFiles(cwd);

    expect(result.isOk()).toBe(true);
    if (result.isErr()) {
      return;
    }

    expect(result.value).toEqual([]);
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("reports a recognized symlink during Compose discovery", async () => {
  const cwd = await createTempDirectory();

  try {
    await writeFile(join(cwd, "user-compose.yaml"), "services: {}\n");
    await symlink(join(cwd, "user-compose.yaml"), join(cwd, "compose.yaml"));

    const result = await discoverComposeFiles(cwd);

    expect(result.isErr()).toBe(true);
    if (result.isOk()) {
      return;
    }

    expect(result.error).toEqual({
      kind: "symlinked-document",
      fileName: "compose.yaml",
    });
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("reports an inspection failure instead of treating an inaccessible candidate as absent", async () => {
  const inaccessible = Object.assign(new Error("permission denied"), {
    code: "EACCES",
  });

  const result = await discoverComposeFiles("/project", {
    readFile: () => Promise.resolve(""),
    stat: () => Promise.reject(inaccessible),
  });

  expect(result.isErr()).toBe(true);
  if (result.isOk()) {
    return;
  }

  expect(result.error).toEqual({
    kind: "discovery-failure",
    fileName: "compose.yaml",
  });
});

test("reads a valid single-document Compose document and preserves open-world data", async () => {
  const cwd = await createTempDirectory();
  const source = `name: example
x-user-extension:
  enabled: true
services:
  app:
    image: example/app
    labels:
      com.example.owner: user
volumes:
  app_data:
    labels:
      com.example.owner: user
`;

  try {
    await writeFile(join(cwd, "compose.yaml"), source);

    const result = await readComposeDocument(cwd, "compose.yaml");

    expect(result.isOk()).toBe(true);
    if (result.isErr()) {
      return;
    }

    expect(result.value.document).toEqual({
      name: "example",
      "x-user-extension": { enabled: true },
      services: {
        app: {
          image: "example/app",
          labels: { "com.example.owner": "user" },
        },
      },
      volumes: {
        app_data: {
          labels: { "com.example.owner": "user" },
        },
      },
    });
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("allows a Compose document to omit services for initialization", async () => {
  const cwd = await createTempDirectory();

  try {
    await writeFile(
      join(cwd, "compose.yaml"),
      "name: example\nnetworks:\n  internal:\n    driver: bridge\n"
    );

    const result = await readComposeDocument(cwd, "compose.yaml");

    expect(result.isOk()).toBe(true);
    if (result.isErr()) {
      return;
    }

    expect(result.value.document).toEqual({
      name: "example",
      networks: { internal: { driver: "bridge" } },
    });
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("rejects invalid YAML without changing the original file", async () => {
  const result = await readComposeFailure("services:\n  app: [\n");

  expect(result.error).toEqual({
    fileName: "compose.yaml",
    kind: "parse-failure",
    reason: "invalid-yaml",
  });
  expect(result.contents).toBe("services:\n  app: [\n");
});

test("rejects multi-document YAML without changing the original file", async () => {
  const result = await readComposeFailure("services: {}\n---\nservices: {}\n");

  expect(result.error).toEqual({
    fileName: "compose.yaml",
    kind: "parse-failure",
    reason: "multi-document",
  });
  expect(result.contents).toBe("services: {}\n---\nservices: {}\n");
});

test("rejects duplicate YAML mapping keys without changing the original file", async () => {
  const result = await readComposeFailure("services: {}\nservices: {}\n");

  expect(result.error).toEqual({
    fileName: "compose.yaml",
    kind: "parse-failure",
    reason: "duplicate-key",
  });
  expect(result.contents).toBe("services: {}\nservices: {}\n");
});

test("rejects an empty YAML stream without changing the original file", async () => {
  const result = await readComposeFailure("");

  expect(result.error).toEqual({
    fileName: "compose.yaml",
    kind: "parse-failure",
    reason: "empty-document",
  });
  expect(result.contents).toBe("");
});

test("rejects a non-mapping Compose root without changing the original file", async () => {
  const result = await readComposeFailure("- not-a-compose-document\n");

  expect(result.error).toEqual({
    fileName: "compose.yaml",
    kind: "invalid-document",
    field: "root",
  });
  expect(result.contents).toBe("- not-a-compose-document\n");
});

test("rejects an invalid services collection without changing the original file", async () => {
  const result = await readComposeFailure("services: []\n");

  expect(result.error).toEqual({
    fileName: "compose.yaml",
    kind: "invalid-document",
    field: "services",
  });
  expect(result.contents).toBe("services: []\n");
});

test("rejects an invalid service entry without changing the original file", async () => {
  const result = await readComposeFailure("services:\n  app: []\n");

  expect(result.error).toEqual({
    fileName: "compose.yaml",
    kind: "invalid-document",
    field: "services",
    serviceName: "app",
  });
  expect(result.contents).toBe("services:\n  app: []\n");
});

test("rejects an invalid volumes collection without changing the original file", async () => {
  const result = await readComposeFailure("services: {}\nvolumes: []\n");

  expect(result.error).toEqual({
    fileName: "compose.yaml",
    kind: "invalid-document",
    field: "volumes",
  });
  expect(result.contents).toBe("services: {}\nvolumes: []\n");
});

test("reports a missing selected Compose document as a structured failure", async () => {
  const cwd = await createTempDirectory();

  try {
    const result = await readComposeDocument(cwd, "compose.yaml");

    expect(result.isErr()).toBe(true);
    if (result.isOk()) {
      return;
    }

    expect(result.error).toEqual({
      kind: "missing-document",
      fileName: "compose.yaml",
    });
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("reports a non-missing read failure as structured data", async () => {
  const unreadable = Object.assign(new Error("permission denied"), {
    code: "EACCES",
  });

  const result = await readComposeDocument("/project", "compose.yaml", {
    readFile: () => Promise.reject(unreadable),
    stat: () => Promise.resolve({ isFile: () => true }),
  });

  expect(result.isErr()).toBe(true);
  if (result.isOk()) {
    return;
  }

  expect(result.error).toEqual({
    kind: "read-failure",
    fileName: "compose.yaml",
  });
});

test("replaces an existing Compose document through the write seam", async () => {
  const cwd = await createTempDirectory();
  const composePath = join(cwd, "compose.yaml");

  try {
    await writeFile(composePath, "services:\n  app:\n    image: old/app\n");

    const readResult = await readComposeDocument(cwd, "compose.yaml");
    expect(readResult.isOk()).toBe(true);
    if (readResult.isErr()) {
      return;
    }

    const writeResult = await writeComposeDocument(
      cwd,
      "compose.yaml",
      { services: { app: { image: "new/app" } } },
      readResult.value.revision
    );

    expect(writeResult.isOk()).toBe(true);
    expect((await readFile(composePath, "utf8")).toString()).toContain(
      "image: new/app"
    );
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("preserves an existing Compose file's permission mode bits", async () => {
  const cwd = await createTempDirectory();
  const composePath = join(cwd, "compose.yaml");

  try {
    await writeFile(composePath, "services:\n  app:\n    image: old/app\n");
    await chmod(composePath, 0o640);

    const readResult = await readComposeDocument(cwd, "compose.yaml");
    expect(readResult.isOk()).toBe(true);
    if (readResult.isErr()) {
      return;
    }

    const writeResult = await writeComposeDocument(
      cwd,
      "compose.yaml",
      { services: { app: { image: "new/app" } } },
      readResult.value.revision
    );

    expect(writeResult.isOk()).toBe(true);
    expect((await lstat(composePath)).mode % 0o1_0000).toBe(0o640);
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("uses normal filesystem defaults when creating a new Compose file", async () => {
  const cwd = await createTempDirectory();
  const composePath = join(cwd, "compose.yaml");
  const expectedPath = join(cwd, "expected-mode.txt");

  try {
    await writeFile(expectedPath, "");
    const expectedMode = (await lstat(expectedPath)).mode % 0o1000;

    const result = await writeComposeDocument(cwd, "compose.yaml", {
      services: {},
    });

    expect(result.isOk()).toBe(true);
    expect((await lstat(composePath)).mode % 0o1000).toBe(expectedMode);
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("rejects a symlinked Compose path without replacing the link", async () => {
  const cwd = await createTempDirectory();
  const targetPath = join(cwd, "user-compose.yaml");
  const composePath = join(cwd, "compose.yaml");
  const source = "services:\n  app:\n    image: user/app\n";

  try {
    await writeFile(targetPath, source);
    await symlink(targetPath, composePath);

    const result = await writeComposeDocument(cwd, "compose.yaml", {
      services: { app: { image: "new/app" } },
    });

    expect(result.isErr()).toBe(true);
    if (result.isOk()) {
      return;
    }

    expect(result.error).toEqual({
      kind: "symlinked-document",
      fileName: "compose.yaml",
    });
    expect((await lstat(composePath)).isSymbolicLink()).toBe(true);
    expect((await readFile(targetPath, "utf8")).toString()).toBe(source);
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("rejects a stale revision without overwriting newer Compose content", async () => {
  const cwd = await createTempDirectory();
  const composePath = join(cwd, "compose.yaml");
  const newerSource = "services:\n  app:\n    image: newer/app\n";

  try {
    await writeFile(composePath, "services:\n  app:\n    image: old/app\n");

    const readResult = await readComposeDocument(cwd, "compose.yaml");
    expect(readResult.isOk()).toBe(true);
    if (readResult.isErr()) {
      return;
    }

    await writeFile(composePath, newerSource);

    const writeResult = await writeComposeDocument(
      cwd,
      "compose.yaml",
      { services: { app: { image: "generated/app" } } },
      readResult.value.revision
    );

    expect(writeResult.isErr()).toBe(true);
    if (writeResult.isOk()) {
      return;
    }

    expect(writeResult.error).toEqual({
      kind: "stale-document",
      fileName: "compose.yaml",
    });
    expect((await readFile(composePath, "utf8")).toString()).toBe(newerSource);
    expect(
      (await readdir(cwd)).filter((name) => name.startsWith(".compose.yaml."))
    ).toEqual([]);
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("reports serialization failures without touching an existing file", async () => {
  const cwd = await createTempDirectory();
  const composePath = join(cwd, "compose.yaml");
  const source = "services:\n  app:\n    image: old/app\n";

  try {
    await writeFile(composePath, source);
    const readResult = await readComposeDocument(cwd, "compose.yaml");
    expect(readResult.isOk()).toBe(true);
    if (readResult.isErr()) {
      return;
    }

    const unserializableDocument = {
      services: {},
      value: Symbol("unsupported"),
    };

    const writeResult = await writeComposeDocument(
      cwd,
      "compose.yaml",
      unserializableDocument,
      readResult.value.revision
    );

    expect(writeResult.isErr()).toBe(true);
    if (writeResult.isOk()) {
      return;
    }

    expect(writeResult.error).toEqual({
      kind: "serialization-failure",
      fileName: "compose.yaml",
    });
    expect((await readFile(composePath, "utf8")).toString()).toBe(source);
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("reports deterministic write failures without replacing the original", async () => {
  const cwd = await createTempDirectory();
  const composePath = join(cwd, "compose.yaml");
  const source = "services:\n  app:\n    image: old/app\n";

  try {
    await writeFile(composePath, source);
    const readResult = await readComposeDocument(cwd, "compose.yaml");
    expect(readResult.isOk()).toBe(true);
    if (readResult.isErr()) {
      return;
    }

    const writeResult = await writeComposeDocument(
      cwd,
      "compose.yaml",
      { services: { app: { image: "new/app" } } },
      readResult.value.revision,
      createFileSystem({
        writeFile: () => Promise.reject(new Error("disk full")),
      })
    );

    expect(writeResult.isErr()).toBe(true);
    if (writeResult.isOk()) {
      return;
    }

    expect(writeResult.error).toEqual({
      kind: "write-failure",
      fileName: "compose.yaml",
    });
    expect((await readFile(composePath, "utf8")).toString()).toBe(source);
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("creates a new Compose file exclusively when another process wins the race", async () => {
  const cwd = await createTempDirectory();
  const composePath = join(cwd, "compose.yaml");
  const competitorSource = "services:\n  competitor:\n    image: other/app\n";

  try {
    const writeResult = await writeComposeDocument(
      cwd,
      "compose.yaml",
      { services: { app: { image: "new/app" } } },
      undefined,
      createFileSystem({
        link: async (_temporaryPath, newPath) => {
          await writeFile(newPath, competitorSource);
          throw Object.assign(new Error("already exists"), { code: "EEXIST" });
        },
      })
    );

    expect(writeResult.isErr()).toBe(true);
    if (writeResult.isOk()) {
      return;
    }

    expect(writeResult.error).toEqual({
      kind: "creation-conflict",
      fileName: "compose.yaml",
    });
    expect((await readFile(composePath, "utf8")).toString()).toBe(
      competitorSource
    );
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("reports replacement failures without leaving a temporary file", async () => {
  const cwd = await createTempDirectory();
  const composePath = join(cwd, "compose.yaml");
  const source = "services:\n  app:\n    image: old/app\n";

  try {
    await writeFile(composePath, source);
    const readResult = await readComposeDocument(cwd, "compose.yaml");
    expect(readResult.isOk()).toBe(true);
    if (readResult.isErr()) {
      return;
    }

    const writeResult = await writeComposeDocument(
      cwd,
      "compose.yaml",
      { services: { app: { image: "new/app" } } },
      readResult.value.revision,
      createFileSystem({
        rename: () => Promise.reject(new Error("rename failed")),
      })
    );

    expect(writeResult.isErr()).toBe(true);
    expect((await readFile(composePath, "utf8")).toString()).toBe(source);
    expect(
      (await readdir(cwd)).filter((name) => name.startsWith(".compose.yaml."))
    ).toEqual([]);
  } finally {
    await removeTempDirectory(cwd);
  }
});

async function readComposeFailure(source: string): Promise<{
  contents: string;
  error: ComposeFileFailure | undefined;
}> {
  const cwd = await createTempDirectory();
  const composePath = join(cwd, "compose.yaml");

  try {
    await writeFile(composePath, source);

    const result = await readComposeDocument(cwd, "compose.yaml");
    const error = result.isErr() ? result.error : undefined;

    return {
      contents: (await readFile(composePath, "utf8")).toString(),
      error,
    };
  } finally {
    await removeTempDirectory(cwd);
  }
}

function createTempDirectory(): Promise<string> {
  return mkdtemp(join(tmpdir(), "ayanokoji-compose-adapter-"));
}

function createFileSystem(
  overrides: Partial<ComposeFileSystem> = {}
): ComposeFileSystem {
  return {
    chmod,
    link,
    readFile: async (path) => (await readFile(path, "utf8")).toString(),
    rename,
    stat: lstat,
    unlink,
    writeFile: async (path, data, options) => {
      await writeFile(path, data, options);
    },
    ...overrides,
  };
}

async function removeTempDirectory(cwd: string): Promise<void> {
  await rm(cwd, { recursive: true, force: true });
}
