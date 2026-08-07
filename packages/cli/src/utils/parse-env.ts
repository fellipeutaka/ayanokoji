// Source: https://github.com/motdotla/dotenv/blob/master/lib/main.js

const LINE =
  /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm;

export function parseEnv(env: string) {
  const obj: Record<string, string> = {};

  const lines = env.replaceAll(/\r\n?/gm, "\n");

  let match = LINE.exec(lines);

  while (match) {
    const [, key] = match;

    let value = match[2] || "";

    value = value.trim();

    const [maybeQuote] = value;

    value = value.replaceAll(/^(['"`])([\s\S]*)\1$/gm, "$2");

    if (maybeQuote === '"') {
      value = value.replaceAll("\\n", "\n");
      value = value.replaceAll("\\r", "\r");
    }

    if (key) {
      obj[key] = value;
    }

    match = LINE.exec(lines);
  }

  return obj;
}
