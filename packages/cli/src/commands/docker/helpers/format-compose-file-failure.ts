import type { ComposeFileFailure } from "./compose-file-adapter";

export function formatComposeFileFailure(failure: ComposeFileFailure): string {
  switch (failure.kind) {
    case "discovery-failure":
      return `Failed to inspect Docker Compose file: ${failure.fileName}`;
    case "missing-document":
      return "No Docker Compose file found.";
    case "read-failure":
      return `Failed to read existing Docker Compose file: ${failure.fileName}`;
    case "parse-failure":
      return formatParseFailure(failure.fileName, failure.reason);
    case "invalid-document":
      return formatInvalidDocumentFailure(
        failure.fileName,
        failure.field,
        failure.serviceName
      );
    case "symlinked-document":
      return `Docker Compose path must not be a symbolic link: ${failure.fileName}`;
    case "stale-document":
      return `Docker Compose file changed during the operation; the operation was not retried. Rerun the command explicitly: ${failure.fileName}`;
    case "creation-conflict":
      return `Docker Compose file was created during the operation: ${failure.fileName}`;
    case "serialization-failure":
      return `Failed to serialize Docker Compose file: ${failure.fileName}`;
    case "write-failure":
      return `Failed to write Docker Compose file: ${failure.fileName}`;
    default:
      return "Docker Compose file operation failed.";
  }
}

function formatParseFailure(
  fileName: string,
  reason: "empty-document" | "invalid-yaml" | "multi-document" | "duplicate-key"
): string {
  switch (reason) {
    case "empty-document":
      return `Docker Compose file is empty: ${fileName}`;
    case "multi-document":
      return `Docker Compose file must contain exactly one YAML document: ${fileName}`;
    case "duplicate-key":
      return `Docker Compose file contains duplicate YAML keys: ${fileName}`;
    case "invalid-yaml":
      return `Failed to parse existing Docker Compose file: ${fileName}`;
    default:
      return `Failed to parse Docker Compose file: ${fileName}`;
  }
}

function formatInvalidDocumentFailure(
  fileName: string,
  field: "root" | "services" | "volumes",
  serviceName?: string
): string {
  if (field === "root") {
    return `Docker Compose document must use a mapping root: ${fileName}`;
  }

  if (field === "services" && serviceName) {
    return `Docker Compose service "${serviceName}" must use a mapping: ${fileName}`;
  }

  return `Docker Compose document has an invalid ${field} collection: ${fileName}`;
}
