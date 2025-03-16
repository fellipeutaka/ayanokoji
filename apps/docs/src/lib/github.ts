const TRAILING_SLASH_REGEX = /\/$/;
const GITHUB_URL_REGEX = /github\.com\/([^/]+)\/([^/]+)/;

export function parseGitHubUrl(url: string) {
  const cleanUrl = url.replace(TRAILING_SLASH_REGEX, "");
  const match = cleanUrl.match(GITHUB_URL_REGEX);

  if (!match) {
    throw new Error("Invalid GitHub repository URL");
  }

  return {
    owner: match[1],
    repo: match[2],
  };
}
