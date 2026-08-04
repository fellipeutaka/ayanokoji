import type { EnvFileFailure } from "./env-file";

export function formatEnvironmentSyncFailure(failure: EnvFileFailure): string {
  const operation = {
    "append-failure": "update",
    "read-failure": "read",
    "write-failure": "write",
  }[failure.kind];

  return `Docker Compose file was written successfully, but environment synchronization failed while attempting to ${operation} ${failure.path}.`;
}
