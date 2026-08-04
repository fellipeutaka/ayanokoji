import { Err, Ok } from "~/utils/result";

const WINDOWS_PATH_PATTERN = /^[A-Za-z]:[\\/]/;

export type ComposeServiceConfig = object;

export interface ComposeDocument {
  [key: string]: unknown;
  services?: Record<string, ComposeServiceConfig>;
  volumes?: Record<string, unknown>;
}

export interface ComposeServiceEntry {
  name: string;
  config: ComposeServiceConfig;
}

export type ComposeMutationFailure =
  | {
      kind: "invalid-document";
      field: "document" | "services" | "volumes";
    }
  | {
      kind: "empty-service-batch";
    }
  | {
      kind: "invalid-service-entry";
      index: number;
      serviceName?: string;
      reason: "empty-name" | "invalid-config";
    }
  | {
      kind: "service-name-conflict";
      serviceName: string;
      scope: "existing-document" | "requested-batch";
    };

export function getServiceNames(document: ComposeDocument): string[] {
  return isRecord(document.services) ? Object.keys(document.services) : [];
}

export function addServices(
  document: ComposeDocument,
  entries: readonly ComposeServiceEntry[]
):
  | Ok<ComposeDocument, ComposeMutationFailure>
  | Err<ComposeDocument, ComposeMutationFailure> {
  if (!isRecord(document)) {
    return new Err({ kind: "invalid-document", field: "document" });
  }

  if (entries.length === 0) {
    return new Err({ kind: "empty-service-batch" });
  }

  const existingServices = document.services;
  if (existingServices !== undefined && !isRecord(existingServices)) {
    return new Err({ kind: "invalid-document", field: "services" });
  }

  const existingVolumes = document.volumes;
  if (existingVolumes !== undefined && !isRecord(existingVolumes)) {
    return new Err({ kind: "invalid-document", field: "volumes" });
  }

  const requestedNames = new Set<string>();

  for (const [index, entry] of entries.entries()) {
    if (typeof entry.name !== "string" || entry.name.length === 0) {
      return new Err({
        kind: "invalid-service-entry",
        index,
        reason: "empty-name",
        ...(typeof entry.name === "string" && { serviceName: entry.name }),
      });
    }

    if (!isRecord(entry.config)) {
      return new Err({
        kind: "invalid-service-entry",
        index,
        reason: "invalid-config",
        serviceName: entry.name,
      });
    }

    if (hasOwn(existingServices, entry.name)) {
      return new Err({
        kind: "service-name-conflict",
        serviceName: entry.name,
        scope: "existing-document",
      });
    }

    if (requestedNames.has(entry.name)) {
      return new Err({
        kind: "service-name-conflict",
        serviceName: entry.name,
        scope: "requested-batch",
      });
    }

    requestedNames.add(entry.name);
  }

  const nextServices: Record<string, ComposeServiceConfig> = {
    ...(existingServices ?? {}),
  };

  for (const entry of entries) {
    nextServices[entry.name] = { ...entry.config };
  }

  const nextDocument: ComposeDocument = {
    ...document,
    services: nextServices,
  };

  const generatedVolumeNames = new Set(
    entries.flatMap((entry) => getGeneratedVolumeNames(entry))
  );

  if (generatedVolumeNames.size > 0) {
    const nextVolumes: Record<string, unknown> = {
      ...(existingVolumes ?? {}),
    };

    for (const volumeName of generatedVolumeNames) {
      if (!hasOwn(nextVolumes, volumeName)) {
        nextVolumes[volumeName] = {};
      }
    }

    nextDocument.volumes = nextVolumes;
  }

  return new Ok(nextDocument);
}

function getGeneratedVolumeNames(entry: ComposeServiceEntry): string[] {
  const config = isRecord(entry.config) ? entry.config : undefined;
  const volumes = config?.volumes;
  if (!Array.isArray(volumes)) {
    return [];
  }

  const generatedVolumeName = `${entry.name}_data`;

  return volumes.flatMap((mount) => {
    const source = getMountSource(mount);
    return source === generatedVolumeName ? [source] : [];
  });
}

function getMountSource(mount: unknown): string | undefined {
  if (typeof mount === "string") {
    const separatorIndex = mount.indexOf(":");
    if (separatorIndex <= 0) {
      return undefined;
    }

    const source = mount.slice(0, separatorIndex);
    if (
      source.startsWith("/") ||
      source.startsWith("./") ||
      source.startsWith("../") ||
      source.startsWith("~") ||
      WINDOWS_PATH_PATTERN.test(mount)
    ) {
      return undefined;
    }

    return source;
  }

  if (!isRecord(mount) || typeof mount.source !== "string") {
    return undefined;
  }

  if (mount.type !== undefined && mount.type !== "volume") {
    return undefined;
  }

  return mount.source;
}

function hasOwn(
  value: Record<string, unknown> | undefined,
  key: string
): boolean {
  return value !== undefined && Object.hasOwn(value, key);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
