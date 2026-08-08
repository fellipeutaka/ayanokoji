const TRAILING_SLASH_REGEX = /\/$/u;
const GITHUB_URL_REGEX = /github\.com\/([^/]+)\/([^/]+)/u;

export function parseGitHubUrl(url: string) {
  const cleanUrl = url.replace(TRAILING_SLASH_REGEX, "");
  const match = GITHUB_URL_REGEX.exec(cleanUrl);

  if (!match) {
    throw new Error("Invalid GitHub repository URL");
  }

  return {
    owner: match[1],
    repo: match[2],
  };
}
