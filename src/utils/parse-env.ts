// Source: https://github.com/motdotla/dotenv/blob/master/lib/main.js

const LINE =
  /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm;

export function parseEnv(env: string) {
  const obj: Record<string, string> = {};

  const lines = env.replace(/\r\n?/gm, "\n");

  let match = LINE.exec(lines);

  while (match) {
    const key = match[1];

    let value = match[2] || "";

    value = value.trim();

    const maybeQuote = value[0];

    value = value.replace(/^(['"`])([\s\S]*)\1$/gm, "$2");

    if (maybeQuote === '"') {
      value = value.replace(/\\n/g, "\n");
      value = value.replace(/\\r/g, "\r");
    }

    if (key) {
      obj[key] = value;
    }

    match = LINE.exec(lines);
  }

  return obj;
}
