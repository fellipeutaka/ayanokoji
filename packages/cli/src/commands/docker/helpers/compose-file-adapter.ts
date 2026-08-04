import {
  readFile as readFileFromDisk,
  stat as statOnDisk,
} from "node:fs/promises";
import { join } from "node:path";
import { parseAllDocuments } from "yaml";
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
}

export interface ComposeFileSystem {
  stat(path: string): Promise<ComposeFileStats>;
  readFile(path: string): Promise<string>;
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
    };

const nodeFileSystem: ComposeFileSystem = {
  readFile: async (path) => {
    const contents = await readFileFromDisk(path);
    return contents.toString("utf8");
  },
  stat: (path) => statOnDisk(path),
};

export async function discoverComposeFiles(
  cwd: string,
  fileSystem: ComposeFileSystem = nodeFileSystem
): Promise<
  | Ok<ComposeFileName[], ComposeFileFailure>
  | Err<ComposeFileName[], ComposeFileFailure>
> {
  const candidates: ComposeFileName[] = [];

  for (const fileName of COMPOSE_FILE_NAMES) {
    try {
      const stats = await fileSystem.stat(join(cwd, fileName));
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
  fileSystem: ComposeFileSystem = nodeFileSystem
): Promise<
  | Ok<ComposeDocument, ComposeFileFailure>
  | Err<ComposeDocument, ComposeFileFailure>
> {
  let source: string;

  try {
    source = await fileSystem.readFile(join(cwd, fileName));
  } catch (error) {
    if (isMissingFileError(error)) {
      return new Err({ kind: "missing-document", fileName });
    }

    return new Err({ kind: "read-failure", fileName });
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

  return validateComposeDocument(value, fileName);
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
