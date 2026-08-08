export function getRepositoryLink(repository: string, namespace?: string) {
  if (namespace !== undefined && namespace !== "") {
    return `https://hub.docker.com/r/${namespace}/${repository}`;
  }
  return `https://hub.docker.com/_/${repository}`;
}
