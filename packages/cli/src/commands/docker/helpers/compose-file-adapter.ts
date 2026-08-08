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
import path from "node:path";

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
  isFile: () => boolean;
  isSymbolicLink?: () => boolean;
  dev?: number;
  ino?: number;
  mode?: number;
  mtimeMs?: number;
  size?: number;
}

export interface ComposeFileReader {
  stat: (path: string) => Promise<ComposeFileStats>;
  readFile: (path: string) => Promise<string>;
}

export interface ComposeFileSystem extends ComposeFileReader {
  chmod: (path: string, mode: number) => Promise<void>;
  link: (existingPath: string, newPath: string) => Promise<void>;
  rename: (oldPath: string, newPath: string) => Promise<void>;
  unlink: (path: string) => Promise<void>;
  writeFile: (
    path: string,
    data: string,
    options?: { flag?: string; mode?: number }
  ) => Promise<void>;
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
  chmod: async (path, mode) => {
    await chmodOnDisk(path, mode);
  },
  link: async (existingPath, newPath) => {
    await linkOnDisk(existingPath, newPath);
  },
  readFile: async (path) => {
    const contents = await readFileFromDisk(path);
    return contents.toString("utf-8");
  },
  rename: async (oldPath, newPath) => {
    await renameOnDisk(oldPath, newPath);
  },
  stat: async (path) => await statOnDisk(path),
  unlink: async (path) => {
    await unlinkOnDisk(path);
  },
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

  const inspections = await Promise.all(
    COMPOSE_FILE_NAMES.map(async (fileName) => {
      try {
        return {
          fileName,
          stats: await fileSystem.stat(path.join(cwd, fileName)),
        };
      } catch (error) {
        return { error, fileName };
      }
    })
  );

  for (const inspection of inspections) {
    if ("error" in inspection) {
      const { error, fileName } = inspection;
      if (isMissingFileError(error)) {
        continue;
      }

      return new Err({ fileName, kind: "discovery-failure" });
    }

    const { fileName, stats } = inspection;
    if (isSymbolicLink(stats)) {
      return new Err({ fileName, kind: "symlinked-document" });
    }

    if (stats.isFile()) {
      candidates.push(fileName);
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
  const documentPath = path.join(cwd, fileName);
  let initialStats: ComposeFileStats;

  try {
    initialStats = await fileSystem.stat(documentPath);
  } catch (error) {
    if (isMissingFileError(error)) {
      return new Err({ fileName, kind: "missing-document" });
    }

    return new Err({ fileName, kind: "read-failure" });
  }

  if (isSymbolicLink(initialStats)) {
    return new Err({ fileName, kind: "symlinked-document" });
  }

  if (!initialStats.isFile()) {
    return new Err({ fileName, kind: "read-failure" });
  }

  let source: string;

  try {
    source = await fileSystem.readFile(documentPath);
  } catch (error) {
    if (isMissingFileError(error)) {
      return new Err({ fileName, kind: "missing-document" });
    }

    return new Err({ fileName, kind: "read-failure" });
  }

  let finalStats: ComposeFileStats;
  try {
    finalStats = await fileSystem.stat(documentPath);
  } catch {
    return new Err({ fileName, kind: "stale-document" });
  }

  if (isSymbolicLink(finalStats)) {
    return new Err({ fileName, kind: "symlinked-document" });
  }

  if (
    !(finalStats.isFile() && sameRevisionMetadata(initialStats, finalStats))
  ) {
    return new Err({ fileName, kind: "stale-document" });
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
      fileName,
      kind: "parse-failure",
      reason: "invalid-yaml",
    });
  }

  if (documents.length === 0) {
    return new Err({
      fileName,
      kind: "parse-failure",
      reason: "empty-document",
    });
  }

  if (documents.length > 1) {
    return new Err({
      fileName,
      kind: "parse-failure",
      reason: "multi-document",
    });
  }

  const [document] = documents;
  if (!document) {
    return new Err({
      fileName,
      kind: "parse-failure",
      reason: "empty-document",
    });
  }

  if (document.errors.length > 0) {
    return new Err({
      fileName,
      kind: "parse-failure",
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
      fileName,
      kind: "parse-failure",
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
  const documentPath = path.join(cwd, fileName);
  const expectedRevision = revision;
  let targetStats: ComposeFileStats | undefined;

  try {
    targetStats = await fileSystem.stat(documentPath);
  } catch (error) {
    if (!isMissingFileError(error)) {
      return new Err({ fileName, kind: "write-failure" });
    }
  }

  if (targetStats) {
    if (isSymbolicLink(targetStats)) {
      return new Err({ fileName, kind: "symlinked-document" });
    }

    if (!expectedRevision) {
      return new Err({ fileName, kind: "creation-conflict" });
    }

    const revisionFailure = await verifyRevision(
      documentPath,
      fileName,
      expectedRevision,
      fileSystem,
      targetStats
    );
    if (revisionFailure) {
      return new Err(revisionFailure);
    }
  } else if (revision) {
    return new Err({ fileName, kind: "stale-document" });
  }

  let serializedDocument: string;
  try {
    serializedDocument = stringify(document, { indent: 2 });
  } catch {
    return new Err({ fileName, kind: "serialization-failure" });
  }

  const temporaryPath = path.join(cwd, `.${fileName}.${randomUUID()}.tmp`);
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
        return new Err({ fileName, kind: "stale-document" });
      }

      const revisionFailure = await verifyRevision(
        documentPath,
        fileName,
        expectedRevision,
        fileSystem
      );
      if (revisionFailure) {
        return new Err(revisionFailure);
      }

      await fileSystem.rename(temporaryPath, documentPath);
      temporaryFileExists = false;
    } else {
      try {
        await fileSystem.link(temporaryPath, documentPath);
      } catch (error) {
        if (isExistingFileError(error)) {
          const failure = await getExistingTargetFailure(
            documentPath,
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
    return new Err({ fileName, kind: "write-failure" });
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
    return new Err({ field: "root", fileName, kind: "invalid-document" });
  }

  if (value.services !== undefined) {
    if (!isRecord(value.services)) {
      return new Err({ field: "services", fileName, kind: "invalid-document" });
    }

    for (const [serviceName, service] of Object.entries(value.services)) {
      if (!isRecord(service)) {
        return new Err({
          field: "services",
          fileName,
          kind: "invalid-document",
          serviceName,
        });
      }
    }
  }

  if (value.volumes !== undefined && !isRecord(value.volumes)) {
    return new Err({ field: "volumes", fileName, kind: "invalid-document" });
  }

  return new Ok(value);
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
      return { fileName, kind: "stale-document" };
    }
  }

  if (isSymbolicLink(stats)) {
    return { fileName, kind: "symlinked-document" };
  }

  if (!(stats.isFile() && sameRevisionMetadata(stats, revision))) {
    return { fileName, kind: "stale-document" };
  }

  let source: string;
  try {
    source = await fileSystem.readFile(path);
  } catch {
    return { fileName, kind: "read-failure" };
  }

  return sameRevision(revision, createFileRevision(stats, source))
    ? undefined
    : { fileName, kind: "stale-document" };
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
      ? { fileName, kind: "symlinked-document" }
      : { fileName, kind: "creation-conflict" };
  } catch {
    return { fileName, kind: "creation-conflict" };
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
