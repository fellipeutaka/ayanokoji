import { expect, test } from "vitest";

import { parseEnv } from "./parse-env";

test("parses quoted and colon-delimited values across Windows line endings", () => {
  const env = [
    "export API_KEY = secret",
    'MESSAGE = "hello\\nworld"',
    "LABEL: 'quoted value'",
  ].join("\r\n");

  expect(parseEnv(env)).toStrictEqual({
    API_KEY: "secret",
    LABEL: "quoted value",
    MESSAGE: "hello\nworld",
  });
});
