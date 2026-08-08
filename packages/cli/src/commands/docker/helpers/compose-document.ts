import { Err, Ok } from "~/utils/result";

const WINDOWS_PATH_PATTERN = /^[A-Za-z]:[\\/]/u;

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
      kind: "no-services";
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
    }
  | {
      kind: "service-not-found";
      serviceName: string;
    }
  | {
      kind: "service-dependency-conflict";
      serviceName: string;
      dependencyName: string;
    };

export function getServiceNames(document: unknown): string[] {
  if (!(isRecord(document) && isRecord(document.services))) {
    return [];
  }

  return Object.keys(document.services);
}

export function getRemovableServiceNames(
  document: unknown
):
  | Ok<string[], ComposeMutationFailure>
  | Err<string[], ComposeMutationFailure> {
  if (!isRecord(document)) {
    return new Err({ field: "document", kind: "invalid-document" });
  }

  if (document.services !== undefined && !isRecord(document.services)) {
    return new Err({ field: "services", kind: "invalid-document" });
  }

  const serviceNames = Object.keys(document.services ?? {});
  if (serviceNames.length === 0) {
    return new Err({ kind: "no-services" });
  }

  return new Ok(serviceNames);
}

export function addServices(
  document: ComposeDocument,
  entries: readonly ComposeServiceEntry[]
):
  | Ok<ComposeDocument, ComposeMutationFailure>
  | Err<ComposeDocument, ComposeMutationFailure> {
  if (!isRecord(document)) {
    return new Err({ field: "document", kind: "invalid-document" });
  }

  if (entries.length === 0) {
    return new Err({ kind: "empty-service-batch" });
  }

  const existingServices = document.services;
  if (existingServices !== undefined && !isRecord(existingServices)) {
    return new Err({ field: "services", kind: "invalid-document" });
  }

  const existingVolumes = document.volumes;
  if (existingVolumes !== undefined && !isRecord(existingVolumes)) {
    return new Err({ field: "volumes", kind: "invalid-document" });
  }

  const requestedNames = new Set<string>();

  for (const [index, entry] of entries.entries()) {
    if (typeof entry.name !== "string" || entry.name.length === 0) {
      return new Err({
        index,
        kind: "invalid-service-entry",
        reason: "empty-name",
        ...(typeof entry.name === "string" && { serviceName: entry.name }),
      });
    }

    if (!isRecord(entry.config)) {
      return new Err({
        index,
        kind: "invalid-service-entry",
        reason: "invalid-config",
        serviceName: entry.name,
      });
    }

    if (hasOwn(existingServices, entry.name)) {
      return new Err({
        kind: "service-name-conflict",
        scope: "existing-document",
        serviceName: entry.name,
      });
    }

    if (requestedNames.has(entry.name)) {
      return new Err({
        kind: "service-name-conflict",
        scope: "requested-batch",
        serviceName: entry.name,
      });
    }

    requestedNames.add(entry.name);
  }

  const nextServices: Record<string, ComposeServiceConfig> = {
    ...existingServices,
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
      ...existingVolumes,
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

export function removeServices(
  document: ComposeDocument,
  serviceNames: readonly string[]
):
  | Ok<ComposeDocument, ComposeMutationFailure>
  | Err<ComposeDocument, ComposeMutationFailure> {
  if (!isRecord(document)) {
    return new Err({ field: "document", kind: "invalid-document" });
  }

  if (serviceNames.length === 0) {
    return new Err({ kind: "empty-service-batch" });
  }

  const existingServices = document.services;
  if (existingServices !== undefined && !isRecord(existingServices)) {
    return new Err({ field: "services", kind: "invalid-document" });
  }

  const existingVolumes = document.volumes;
  if (existingVolumes !== undefined && !isRecord(existingVolumes)) {
    return new Err({ field: "volumes", kind: "invalid-document" });
  }

  const services = existingServices ?? {};
  const requestedNames = new Set<string>();

  for (const [index, serviceName] of serviceNames.entries()) {
    if (typeof serviceName !== "string" || serviceName.length === 0) {
      return new Err({
        index,
        kind: "invalid-service-entry",
        reason: "empty-name",
        ...(typeof serviceName === "string" && { serviceName }),
      });
    }

    if (requestedNames.has(serviceName)) {
      return new Err({
        kind: "service-name-conflict",
        scope: "requested-batch",
        serviceName,
      });
    }

    if (!hasOwn(services, serviceName)) {
      return new Err({ kind: "service-not-found", serviceName });
    }

    requestedNames.add(serviceName);
  }

  for (const [serviceName, service] of Object.entries(services)) {
    if (requestedNames.has(serviceName)) {
      continue;
    }

    const dependencies = getDependencyNames(service);
    for (const dependencyName of dependencies) {
      if (requestedNames.has(dependencyName)) {
        return new Err({
          dependencyName,
          kind: "service-dependency-conflict",
          serviceName,
        });
      }
    }
  }

  const nextServices: Record<string, ComposeServiceConfig> = {
    ...services,
  };
  const removedGeneratedVolumes = new Set<string>();

  for (const serviceName of serviceNames) {
    const service = services[serviceName];
    if (!isRecord(service)) {
      return new Err({ field: "services", kind: "invalid-document" });
    }

    for (const volumeName of getGeneratedVolumeNames({
      config: service,
      name: serviceName,
    })) {
      removedGeneratedVolumes.add(volumeName);
    }
    delete nextServices[serviceName];
  }

  let nextVolumes: Record<string, unknown> | undefined;
  let volumeChanged = false;
  if (existingVolumes !== undefined) {
    nextVolumes = { ...existingVolumes };
    const remainingVolumeNames = new Set(
      Object.values(nextServices).flatMap((service) =>
        getReferencedVolumeNames(service)
      )
    );

    for (const volumeName of removedGeneratedVolumes) {
      if (
        !remainingVolumeNames.has(volumeName) &&
        isGeneratedVolumeDeclaration(nextVolumes[volumeName])
      ) {
        delete nextVolumes[volumeName];
        volumeChanged = true;
      }
    }
  }

  const nextDocument: ComposeDocument = {
    ...(volumeChanged &&
    nextVolumes !== undefined &&
    Object.keys(nextVolumes).length === 0
      ? withoutVolumes(document)
      : document),
    services: nextServices,
    ...(nextVolumes !== undefined &&
      (!volumeChanged || Object.keys(nextVolumes).length > 0) && {
        volumes: nextVolumes,
      }),
  };

  return new Ok(nextDocument);
}

function getDependencyNames(service: ComposeServiceConfig): string[] {
  if (!isRecord(service) || service.depends_on === undefined) {
    return [];
  }

  if (Array.isArray(service.depends_on)) {
    return service.depends_on.filter(
      (dependency): dependency is string => typeof dependency === "string"
    );
  }

  if (isRecord(service.depends_on)) {
    return Object.keys(service.depends_on);
  }

  return [];
}

function isGeneratedVolumeDeclaration(value: unknown): boolean {
  return isRecord(value) && Object.keys(value).length === 0;
}

function withoutVolumes(document: ComposeDocument): ComposeDocument {
  const { volumes: _volumes, ...documentWithoutVolumes } = document;
  return documentWithoutVolumes;
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

function getReferencedVolumeNames(service: ComposeServiceConfig): string[] {
  if (!(isRecord(service) && Array.isArray(service.volumes))) {
    return [];
  }

  return service.volumes.flatMap((mount) => {
    const source = getMountSource(mount);
    return source ? [source] : [];
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
