const TRAILING_SLASH_REGEX = /\/$/u;
const GITHUB_URL_REGEX = /github\.com\/(?<owner>[^/]+)\/(?<repo>[^/]+)/u;

export function parseGitHubUrl(url: string) {
  const cleanUrl = url.replace(TRAILING_SLASH_REGEX, "");
  const match = GITHUB_URL_REGEX.exec(cleanUrl);
  const { owner, repo } = match?.groups ?? {};

  if (!owner || !repo) {
    throw new Error("Invalid GitHub repository URL");
  }

  return { owner, repo };
}
