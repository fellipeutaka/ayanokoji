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
import path from "node:path";

import { expect, test } from "vitest";

import {
  COMPOSE_FILE_NAMES,
  discoverComposeFiles,
  readComposeDocument,
  writeComposeDocument,
} from "./compose-file-adapter";
import type {
  ComposeFileFailure,
  ComposeFileSystem,
} from "./compose-file-adapter";

test("discovers every supported Compose candidate without selecting one", async () => {
  const cwd = await createTempDirectory();

  try {
    await writeFile(path.join(cwd, "compose.yaml"), "services: {}\n");
    await writeFile(path.join(cwd, "docker-compose.yml"), "services: {}\n");

    const result = await discoverComposeFiles(cwd);

    expect(result.isOk()).toBeTruthy();
    if (result.isErr()) {
      return;
    }

    expect(result.value).toStrictEqual(["compose.yaml", "docker-compose.yml"]);
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("reports no candidates without inventing a Compose filename", async () => {
  const cwd = await createTempDirectory();

  try {
    const result = await discoverComposeFiles(cwd);

    expect(result.isOk()).toBeTruthy();
    if (result.isErr()) {
      return;
    }

    expect(result.value).toStrictEqual([]);
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("recognizes only the supported Compose filenames", async () => {
  const cwd = await createTempDirectory();

  try {
    await writeFile(path.join(cwd, "compose.json"), "{}\n");
    await writeFile(path.join(cwd, "custom-compose.yaml"), "services: {}\n");

    const result = await discoverComposeFiles(cwd);

    expect(result.isOk()).toBeTruthy();
    if (result.isErr()) {
      return;
    }

    expect(result.value).toStrictEqual([]);
    expect(COMPOSE_FILE_NAMES).toStrictEqual([
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
    await mkdir(path.join(cwd, "compose.yaml"));

    const result = await discoverComposeFiles(cwd);

    expect(result.isOk()).toBeTruthy();
    if (result.isErr()) {
      return;
    }

    expect(result.value).toStrictEqual([]);
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("reports a recognized symlink during Compose discovery", async () => {
  const cwd = await createTempDirectory();

  try {
    await writeFile(path.join(cwd, "user-compose.yaml"), "services: {}\n");
    await symlink(
      path.join(cwd, "user-compose.yaml"),
      path.join(cwd, "compose.yaml")
    );

    const result = await discoverComposeFiles(cwd);

    expect(result.isErr()).toBeTruthy();
    if (result.isOk()) {
      return;
    }

    expect(result.error).toStrictEqual({
      fileName: "compose.yaml",
      kind: "symlinked-document",
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
    readFile: async () => "",
    stat: async () => {
      throw inaccessible;
    },
  });

  expect(result.isErr()).toBeTruthy();
  if (result.isOk()) {
    return;
  }

  expect(result.error).toStrictEqual({
    fileName: "compose.yaml",
    kind: "discovery-failure",
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
    await writeFile(path.join(cwd, "compose.yaml"), source);

    const result = await readComposeDocument(cwd, "compose.yaml");

    expect(result.isOk()).toBeTruthy();
    if (result.isErr()) {
      return;
    }

    expect(result.value.document).toStrictEqual({
      name: "example",
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
      "x-user-extension": { enabled: true },
    });
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("allows a Compose document to omit services for initialization", async () => {
  const cwd = await createTempDirectory();

  try {
    await writeFile(
      path.join(cwd, "compose.yaml"),
      "name: example\nnetworks:\n  internal:\n    driver: bridge\n"
    );

    const result = await readComposeDocument(cwd, "compose.yaml");

    expect(result.isOk()).toBeTruthy();
    if (result.isErr()) {
      return;
    }

    expect(result.value.document).toStrictEqual({
      name: "example",
      networks: { internal: { driver: "bridge" } },
    });
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("rejects invalid YAML without changing the original file", async () => {
  const result = await readComposeFailure("services:\n  app: [\n");

  expect(result.error).toStrictEqual({
    fileName: "compose.yaml",
    kind: "parse-failure",
    reason: "invalid-yaml",
  });
  expect(result.contents).toBe("services:\n  app: [\n");
});

test("rejects multi-document YAML without changing the original file", async () => {
  const result = await readComposeFailure("services: {}\n---\nservices: {}\n");

  expect(result.error).toStrictEqual({
    fileName: "compose.yaml",
    kind: "parse-failure",
    reason: "multi-document",
  });
  expect(result.contents).toBe("services: {}\n---\nservices: {}\n");
});

test("rejects duplicate YAML mapping keys without changing the original file", async () => {
  const result = await readComposeFailure("services: {}\nservices: {}\n");

  expect(result.error).toStrictEqual({
    fileName: "compose.yaml",
    kind: "parse-failure",
    reason: "duplicate-key",
  });
  expect(result.contents).toBe("services: {}\nservices: {}\n");
});

test("rejects an empty YAML stream without changing the original file", async () => {
  const result = await readComposeFailure("");

  expect(result.error).toStrictEqual({
    fileName: "compose.yaml",
    kind: "parse-failure",
    reason: "empty-document",
  });
  expect(result.contents).toBe("");
});

test("rejects a non-mapping Compose root without changing the original file", async () => {
  const result = await readComposeFailure("- not-a-compose-document\n");

  expect(result.error).toStrictEqual({
    field: "root",
    fileName: "compose.yaml",
    kind: "invalid-document",
  });
  expect(result.contents).toBe("- not-a-compose-document\n");
});

test("rejects an invalid services collection without changing the original file", async () => {
  const result = await readComposeFailure("services: []\n");

  expect(result.error).toStrictEqual({
    field: "services",
    fileName: "compose.yaml",
    kind: "invalid-document",
  });
  expect(result.contents).toBe("services: []\n");
});

test("rejects an invalid service entry without changing the original file", async () => {
  const result = await readComposeFailure("services:\n  app: []\n");

  expect(result.error).toStrictEqual({
    field: "services",
    fileName: "compose.yaml",
    kind: "invalid-document",
    serviceName: "app",
  });
  expect(result.contents).toBe("services:\n  app: []\n");
});

test("rejects an invalid volumes collection without changing the original file", async () => {
  const result = await readComposeFailure("services: {}\nvolumes: []\n");

  expect(result.error).toStrictEqual({
    field: "volumes",
    fileName: "compose.yaml",
    kind: "invalid-document",
  });
  expect(result.contents).toBe("services: {}\nvolumes: []\n");
});

test("reports a missing selected Compose document as a structured failure", async () => {
  const cwd = await createTempDirectory();

  try {
    const result = await readComposeDocument(cwd, "compose.yaml");

    expect(result.isErr()).toBeTruthy();
    if (result.isOk()) {
      return;
    }

    expect(result.error).toStrictEqual({
      fileName: "compose.yaml",
      kind: "missing-document",
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
    readFile: async () => {
      throw unreadable;
    },
    stat: async () => ({ isFile: () => true }),
  });

  expect(result.isErr()).toBeTruthy();
  if (result.isOk()) {
    return;
  }

  expect(result.error).toStrictEqual({
    fileName: "compose.yaml",
    kind: "read-failure",
  });
});

test("replaces an existing Compose document through the write seam", async () => {
  const cwd = await createTempDirectory();
  const composePath = path.join(cwd, "compose.yaml");

  try {
    await writeFile(composePath, "services:\n  app:\n    image: old/app\n");

    const readResult = await readComposeDocument(cwd, "compose.yaml");
    expect(readResult.isOk()).toBeTruthy();
    if (readResult.isErr()) {
      return;
    }

    const writeResult = await writeComposeDocument(
      cwd,
      "compose.yaml",
      { services: { app: { image: "new/app" } } },
      readResult.value.revision
    );

    expect(writeResult.isOk()).toBeTruthy();
    expect(await readFile(composePath, "utf-8")).toContain("image: new/app");
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("preserves an existing Compose file's permission mode bits", async () => {
  const cwd = await createTempDirectory();
  const composePath = path.join(cwd, "compose.yaml");

  try {
    await writeFile(composePath, "services:\n  app:\n    image: old/app\n");
    await chmod(composePath, 0o640);

    const readResult = await readComposeDocument(cwd, "compose.yaml");
    expect(readResult.isOk()).toBeTruthy();
    if (readResult.isErr()) {
      return;
    }

    const writeResult = await writeComposeDocument(
      cwd,
      "compose.yaml",
      { services: { app: { image: "new/app" } } },
      readResult.value.revision
    );

    expect(writeResult.isOk()).toBeTruthy();
    expect((await lstat(composePath)).mode % 0o1_0000).toBe(0o640);
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("uses normal filesystem defaults when creating a new Compose file", async () => {
  const cwd = await createTempDirectory();
  const composePath = path.join(cwd, "compose.yaml");
  const expectedPath = path.join(cwd, "expected-mode.txt");

  try {
    await writeFile(expectedPath, "");
    const expectedMode = (await lstat(expectedPath)).mode % 0o1000;

    const result = await writeComposeDocument(cwd, "compose.yaml", {
      services: {},
    });

    expect(result.isOk()).toBeTruthy();
    expect((await lstat(composePath)).mode % 0o1000).toBe(expectedMode);
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("rejects a symlinked Compose path without replacing the link", async () => {
  const cwd = await createTempDirectory();
  const targetPath = path.join(cwd, "user-compose.yaml");
  const composePath = path.join(cwd, "compose.yaml");
  const source = "services:\n  app:\n    image: user/app\n";

  try {
    await writeFile(targetPath, source);
    await symlink(targetPath, composePath);

    const result = await writeComposeDocument(cwd, "compose.yaml", {
      services: { app: { image: "new/app" } },
    });

    expect(result.isErr()).toBeTruthy();
    if (result.isOk()) {
      return;
    }

    expect(result.error).toStrictEqual({
      fileName: "compose.yaml",
      kind: "symlinked-document",
    });
    expect((await lstat(composePath)).isSymbolicLink()).toBeTruthy();
    expect(await readFile(targetPath, "utf-8")).toBe(source);
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("rejects a stale revision without overwriting newer Compose content", async () => {
  const cwd = await createTempDirectory();
  const composePath = path.join(cwd, "compose.yaml");
  const newerSource = "services:\n  app:\n    image: newer/app\n";

  try {
    await writeFile(composePath, "services:\n  app:\n    image: old/app\n");

    const readResult = await readComposeDocument(cwd, "compose.yaml");
    expect(readResult.isOk()).toBeTruthy();
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

    expect(writeResult.isErr()).toBeTruthy();
    if (writeResult.isOk()) {
      return;
    }

    expect(writeResult.error).toStrictEqual({
      fileName: "compose.yaml",
      kind: "stale-document",
    });
    expect(await readFile(composePath, "utf-8")).toBe(newerSource);
    expect(
      (await readdir(cwd)).filter((name) => name.startsWith(".compose.yaml."))
    ).toStrictEqual([]);
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("reports serialization failures without touching an existing file", async () => {
  const cwd = await createTempDirectory();
  const composePath = path.join(cwd, "compose.yaml");
  const source = "services:\n  app:\n    image: old/app\n";

  try {
    await writeFile(composePath, source);
    const readResult = await readComposeDocument(cwd, "compose.yaml");
    expect(readResult.isOk()).toBeTruthy();
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

    expect(writeResult.isErr()).toBeTruthy();
    if (writeResult.isOk()) {
      return;
    }

    expect(writeResult.error).toStrictEqual({
      fileName: "compose.yaml",
      kind: "serialization-failure",
    });
    expect(await readFile(composePath, "utf-8")).toBe(source);
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("reports deterministic write failures without replacing the original", async () => {
  const cwd = await createTempDirectory();
  const composePath = path.join(cwd, "compose.yaml");
  const source = "services:\n  app:\n    image: old/app\n";

  try {
    await writeFile(composePath, source);
    const readResult = await readComposeDocument(cwd, "compose.yaml");
    expect(readResult.isOk()).toBeTruthy();
    if (readResult.isErr()) {
      return;
    }

    const writeResult = await writeComposeDocument(
      cwd,
      "compose.yaml",
      { services: { app: { image: "new/app" } } },
      readResult.value.revision,
      createFileSystem({
        writeFile: async () => {
          throw new Error("disk full");
        },
      })
    );

    expect(writeResult.isErr()).toBeTruthy();
    if (writeResult.isOk()) {
      return;
    }

    expect(writeResult.error).toStrictEqual({
      fileName: "compose.yaml",
      kind: "write-failure",
    });
    expect(await readFile(composePath, "utf-8")).toBe(source);
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("creates a new Compose file exclusively when another process wins the race", async () => {
  const cwd = await createTempDirectory();
  const composePath = path.join(cwd, "compose.yaml");
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

    expect(writeResult.isErr()).toBeTruthy();
    if (writeResult.isOk()) {
      return;
    }

    expect(writeResult.error).toStrictEqual({
      fileName: "compose.yaml",
      kind: "creation-conflict",
    });
    expect(await readFile(composePath, "utf-8")).toBe(competitorSource);
  } finally {
    await removeTempDirectory(cwd);
  }
});

test("reports replacement failures without leaving a temporary file", async () => {
  const cwd = await createTempDirectory();
  const composePath = path.join(cwd, "compose.yaml");
  const source = "services:\n  app:\n    image: old/app\n";

  try {
    await writeFile(composePath, source);
    const readResult = await readComposeDocument(cwd, "compose.yaml");
    expect(readResult.isOk()).toBeTruthy();
    if (readResult.isErr()) {
      return;
    }

    const writeResult = await writeComposeDocument(
      cwd,
      "compose.yaml",
      { services: { app: { image: "new/app" } } },
      readResult.value.revision,
      createFileSystem({
        rename: async () => {
          throw new Error("rename failed");
        },
      })
    );

    expect(writeResult.isErr()).toBeTruthy();
    expect(await readFile(composePath, "utf-8")).toBe(source);
    expect(
      (await readdir(cwd)).filter((name) => name.startsWith(".compose.yaml."))
    ).toStrictEqual([]);
  } finally {
    await removeTempDirectory(cwd);
  }
});

async function readComposeFailure(source: string): Promise<{
  contents: string;
  error: ComposeFileFailure | undefined;
}> {
  const cwd = await createTempDirectory();
  const composePath = path.join(cwd, "compose.yaml");

  try {
    await writeFile(composePath, source);

    const result = await readComposeDocument(cwd, "compose.yaml");
    const error = result.isErr() ? result.error : undefined;

    return {
      contents: await readFile(composePath, "utf-8"),
      error,
    };
  } finally {
    await removeTempDirectory(cwd);
  }
}

async function createTempDirectory(): Promise<string> {
  return await mkdtemp(path.join(tmpdir(), "ayanokoji-compose-adapter-"));
}

function createFileSystem(
  overrides: Partial<ComposeFileSystem> = {}
): ComposeFileSystem {
  return {
    chmod,
    link,
    readFile: async (path) => await readFile(path, "utf-8"),
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
  await rm(cwd, { force: true, recursive: true });
}
