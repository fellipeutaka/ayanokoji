import { createHash, randomUUID } from "node:crypto";
import {
  chmod as chmodOnDisk,
  link as linkOnDisk,
  readFile as readFileFromDisk,
  rename as renameOnDisk,
  lstat as statOnDisk,
  unlink as unlinkOnDisk,
  writeFile as writeFileToDisk,
} from "node:fs/promises";
import { join } from "node:path";
import { parseAllDocuments, stringify } from "yaml";
import { Err, Ok } from "~/utils/result";
import type { ComposeDocument } from "./compose-document";

export const COMPOSE_FILE_NAMES = [
  "compose.yaml",
  "compose.yml",
  "docker-compose.yaml",
  "docker-compose.yml",
] as const;

export type ComposeFileName = (typeof COMPOSE_FILE_NAMES)[number];

export interface ComposeFileStats {
  isFile(): boolean;
  isSymbolicLink?(): boolean;
  dev?: number;
  ino?: number;
  mode?: number;
  mtimeMs?: number;
  size?: number;
}

export interface ComposeFileReader {
  stat(path: string): Promise<ComposeFileStats>;
  readFile(path: string): Promise<string>;
}

export interface ComposeFileSystem extends ComposeFileReader {
  chmod(path: string, mode: number): Promise<void>;
  link(existingPath: string, newPath: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  unlink(path: string): Promise<void>;
  writeFile(
    path: string,
    data: string,
    options?: { flag?: string; mode?: number }
  ): Promise<void>;
}

export interface ComposeFileRevision {
  readonly contentHash: string;
  readonly dev?: number;
  readonly ino?: number;
  readonly mode?: number;
  readonly mtimeMs?: number;
  readonly size?: number;
}

export interface ComposeDocumentSnapshot {
  document: ComposeDocument;
  revision: ComposeFileRevision;
}

export type ComposeFileFailure =
  | {
      kind: "discovery-failure";
      fileName: ComposeFileName;
    }
  | {
      kind: "missing-document";
      fileName: ComposeFileName;
    }
  | {
      kind: "read-failure";
      fileName: ComposeFileName;
    }
  | {
      kind: "parse-failure";
      fileName: ComposeFileName;
      reason:
        | "empty-document"
        | "invalid-yaml"
        | "multi-document"
        | "duplicate-key";
    }
  | {
      kind: "invalid-document";
      fileName: ComposeFileName;
      field: "root" | "services" | "volumes";
      serviceName?: string;
    }
  | {
      kind: "symlinked-document";
      fileName: ComposeFileName;
    }
  | {
      kind: "stale-document";
      fileName: ComposeFileName;
    }
  | {
      kind: "creation-conflict";
      fileName: ComposeFileName;
    }
  | {
      kind: "serialization-failure";
      fileName: ComposeFileName;
    }
  | {
      kind: "write-failure";
      fileName: ComposeFileName;
    };

const nodeFileSystem: ComposeFileSystem = {
  chmod: (path, mode) => chmodOnDisk(path, mode),
  link: (existingPath, newPath) => linkOnDisk(existingPath, newPath),
  readFile: async (path) => {
    const contents = await readFileFromDisk(path);
    return contents.toString("utf8");
  },
  rename: (oldPath, newPath) => renameOnDisk(oldPath, newPath),
  stat: (path) => statOnDisk(path),
  unlink: (path) => unlinkOnDisk(path),
  writeFile: async (path, data, options) => {
    await writeFileToDisk(path, data, options);
  },
};

export async function discoverComposeFiles(
  cwd: string,
  fileSystem: ComposeFileReader = nodeFileSystem
): Promise<
  | Ok<ComposeFileName[], ComposeFileFailure>
  | Err<ComposeFileName[], ComposeFileFailure>
> {
  const candidates: ComposeFileName[] = [];

  for (const fileName of COMPOSE_FILE_NAMES) {
    try {
      const stats = await fileSystem.stat(join(cwd, fileName));
      if (isSymbolicLink(stats)) {
        return new Err({ kind: "symlinked-document", fileName });
      }

      if (stats.isFile()) {
        candidates.push(fileName);
      }
    } catch (error) {
      if (isMissingFileError(error)) {
        continue;
      }

      return new Err({ kind: "discovery-failure", fileName });
    }
  }

  return new Ok(candidates);
}

export async function readComposeDocument(
  cwd: string,
  fileName: ComposeFileName,
  fileSystem: ComposeFileReader = nodeFileSystem
): Promise<
  | Ok<ComposeDocumentSnapshot, ComposeFileFailure>
  | Err<ComposeDocumentSnapshot, ComposeFileFailure>
> {
  const path = join(cwd, fileName);
  let initialStats: ComposeFileStats;

  try {
    initialStats = await fileSystem.stat(path);
  } catch (error) {
    if (isMissingFileError(error)) {
      return new Err({ kind: "missing-document", fileName });
    }

    return new Err({ kind: "read-failure", fileName });
  }

  if (isSymbolicLink(initialStats)) {
    return new Err({ kind: "symlinked-document", fileName });
  }

  if (!initialStats.isFile()) {
    return new Err({ kind: "read-failure", fileName });
  }

  let source: string;

  try {
    source = await fileSystem.readFile(path);
  } catch (error) {
    if (isMissingFileError(error)) {
      return new Err({ kind: "missing-document", fileName });
    }

    return new Err({ kind: "read-failure", fileName });
  }

  let finalStats: ComposeFileStats;
  try {
    finalStats = await fileSystem.stat(path);
  } catch {
    return new Err({ kind: "stale-document", fileName });
  }

  if (isSymbolicLink(finalStats)) {
    return new Err({ kind: "symlinked-document", fileName });
  }

  if (
    !(finalStats.isFile() && sameRevisionMetadata(initialStats, finalStats))
  ) {
    return new Err({ kind: "stale-document", fileName });
  }

  let documents: ReturnType<typeof parseAllDocuments>;
  try {
    documents = parseAllDocuments(source, {
      logLevel: "silent",
      strict: true,
      uniqueKeys: true,
    });
  } catch {
    return new Err({
      kind: "parse-failure",
      fileName,
      reason: "invalid-yaml",
    });
  }

  if (documents.length === 0) {
    return new Err({
      kind: "parse-failure",
      fileName,
      reason: "empty-document",
    });
  }

  if (documents.length > 1) {
    return new Err({
      kind: "parse-failure",
      fileName,
      reason: "multi-document",
    });
  }

  const document = documents[0];
  if (!document) {
    return new Err({
      kind: "parse-failure",
      fileName,
      reason: "empty-document",
    });
  }

  if (document.errors.length > 0) {
    return new Err({
      kind: "parse-failure",
      fileName,
      reason: document.errors.some((error) => error.code === "DUPLICATE_KEY")
        ? "duplicate-key"
        : "invalid-yaml",
    });
  }

  let value: unknown;
  try {
    value = document.toJS();
  } catch {
    return new Err({
      kind: "parse-failure",
      fileName,
      reason: "invalid-yaml",
    });
  }

  const validationResult = validateComposeDocument(value, fileName);
  if (validationResult.isErr()) {
    return new Err(validationResult.error);
  }

  return new Ok({
    document: validationResult.value,
    revision: createFileRevision(finalStats, source),
  });
}

export async function writeComposeDocument(
  cwd: string,
  fileName: ComposeFileName,
  document: ComposeDocument,
  revision?: ComposeFileRevision,
  fileSystem: ComposeFileSystem = nodeFileSystem
): Promise<Ok<null, ComposeFileFailure> | Err<null, ComposeFileFailure>> {
  const path = join(cwd, fileName);
  const expectedRevision = revision;
  let targetStats: ComposeFileStats | undefined;

  try {
    targetStats = await fileSystem.stat(path);
  } catch (error) {
    if (!isMissingFileError(error)) {
      return new Err({ kind: "write-failure", fileName });
    }
  }

  if (targetStats) {
    if (isSymbolicLink(targetStats)) {
      return new Err({ kind: "symlinked-document", fileName });
    }

    if (!expectedRevision) {
      return new Err({ kind: "creation-conflict", fileName });
    }

    const revisionFailure = await verifyRevision(
      path,
      fileName,
      expectedRevision,
      fileSystem,
      targetStats
    );
    if (revisionFailure) {
      return new Err(revisionFailure);
    }
  } else if (revision) {
    return new Err({ kind: "stale-document", fileName });
  }

  let serializedDocument: string;
  try {
    serializedDocument = stringify(document, { indent: 2 });
  } catch {
    return new Err({ kind: "serialization-failure", fileName });
  }

  const temporaryPath = join(cwd, `.${fileName}.${randomUUID()}.tmp`);
  let temporaryFileExists = false;

  try {
    await fileSystem.writeFile(temporaryPath, serializedDocument, {
      flag: "wx",
    });
    temporaryFileExists = true;

    if (targetStats?.mode !== undefined) {
      await fileSystem.chmod(temporaryPath, targetStats.mode % 0o1_0000);
    }

    if (targetStats) {
      if (!expectedRevision) {
        return new Err({ kind: "stale-document", fileName });
      }

      const revisionFailure = await verifyRevision(
        path,
        fileName,
        expectedRevision,
        fileSystem
      );
      if (revisionFailure) {
        return new Err(revisionFailure);
      }

      await fileSystem.rename(temporaryPath, path);
      temporaryFileExists = false;
    } else {
      try {
        await fileSystem.link(temporaryPath, path);
      } catch (error) {
        if (isExistingFileError(error)) {
          const failure = await getExistingTargetFailure(
            path,
            fileName,
            fileSystem
          );
          return new Err(failure);
        }

        throw error;
      }

      await fileSystem.unlink(temporaryPath);
      temporaryFileExists = false;
    }

    return new Ok(null);
  } catch {
    return new Err({ kind: "write-failure", fileName });
  } finally {
    if (temporaryFileExists) {
      await removeTemporaryFile(temporaryPath, fileSystem);
    }
  }
}

function validateComposeDocument(
  value: unknown,
  fileName: ComposeFileName
):
  | Ok<ComposeDocument, ComposeFileFailure>
  | Err<ComposeDocument, ComposeFileFailure> {
  if (!isRecord(value)) {
    return new Err({ kind: "invalid-document", fileName, field: "root" });
  }

  if (value.services !== undefined) {
    if (!isRecord(value.services)) {
      return new Err({ kind: "invalid-document", fileName, field: "services" });
    }

    for (const [serviceName, service] of Object.entries(value.services)) {
      if (!isRecord(service)) {
        return new Err({
          kind: "invalid-document",
          fileName,
          field: "services",
          serviceName,
        });
      }
    }
  }

  if (value.volumes !== undefined && !isRecord(value.volumes)) {
    return new Err({ kind: "invalid-document", fileName, field: "volumes" });
  }

  return new Ok(value as ComposeDocument);
}

function isMissingFileError(error: unknown): boolean {
  return isRecord(error) && error.code === "ENOENT";
}

function isExistingFileError(error: unknown): boolean {
  return isRecord(error) && error.code === "EEXIST";
}

function isSymbolicLink(stats: ComposeFileStats): boolean {
  return stats.isSymbolicLink?.() ?? false;
}

function createFileRevision(
  stats: ComposeFileStats,
  source: string
): ComposeFileRevision {
  return {
    contentHash: createHash("sha256").update(source).digest("hex"),
    dev: stats.dev,
    ino: stats.ino,
    mode: stats.mode,
    mtimeMs: stats.mtimeMs,
    size: stats.size,
  };
}

async function verifyRevision(
  path: string,
  fileName: ComposeFileName,
  revision: ComposeFileRevision,
  fileSystem: ComposeFileReader,
  knownStats?: ComposeFileStats
): Promise<ComposeFileFailure | undefined> {
  let stats = knownStats;

  if (!stats) {
    try {
      stats = await fileSystem.stat(path);
    } catch {
      return { kind: "stale-document", fileName };
    }
  }

  if (isSymbolicLink(stats)) {
    return { kind: "symlinked-document", fileName };
  }

  if (!(stats.isFile() && sameRevisionMetadata(stats, revision))) {
    return { kind: "stale-document", fileName };
  }

  let source: string;
  try {
    source = await fileSystem.readFile(path);
  } catch {
    return { kind: "read-failure", fileName };
  }

  return sameRevision(revision, createFileRevision(stats, source))
    ? undefined
    : { kind: "stale-document", fileName };
}

function sameRevisionMetadata(
  first: Pick<ComposeFileStats, "dev" | "ino" | "mode" | "mtimeMs" | "size">,
  second: Pick<ComposeFileStats, "dev" | "ino" | "mode" | "mtimeMs" | "size">
): boolean {
  return (
    first.dev === second.dev &&
    first.ino === second.ino &&
    first.mode === second.mode &&
    first.mtimeMs === second.mtimeMs &&
    first.size === second.size
  );
}

function sameRevision(
  first: ComposeFileRevision,
  second: ComposeFileRevision
): boolean {
  return (
    first.contentHash === second.contentHash &&
    sameRevisionMetadata(first, second)
  );
}

async function getExistingTargetFailure(
  path: string,
  fileName: ComposeFileName,
  fileSystem: ComposeFileReader
): Promise<
  Extract<
    ComposeFileFailure,
    { kind: "symlinked-document" | "creation-conflict" }
  >
> {
  try {
    const stats = await fileSystem.stat(path);
    return isSymbolicLink(stats)
      ? { kind: "symlinked-document", fileName }
      : { kind: "creation-conflict", fileName };
  } catch {
    return { kind: "creation-conflict", fileName };
  }
}

async function removeTemporaryFile(
  path: string,
  fileSystem: ComposeFileSystem
): Promise<void> {
  try {
    await fileSystem.unlink(path);
  } catch {
    // Preserve the original file even when temporary-file cleanup fails.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
