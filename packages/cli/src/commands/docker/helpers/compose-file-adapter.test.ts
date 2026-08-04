import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  COMPOSE_FILE_NAMES,
  type ComposeFileFailure,
  discoverComposeFiles,
  readComposeDocument,
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

    expect(result.value).toEqual({
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

    expect(result.value).toEqual({
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
    stat: () => Promise.resolve(undefined),
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

async function removeTempDirectory(cwd: string): Promise<void> {
  await rm(cwd, { recursive: true, force: true });
}
