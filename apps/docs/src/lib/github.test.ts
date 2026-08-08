import { deepStrictEqual } from "node:assert/strict";
import { test } from "node:test";

import { parseGitHubUrl } from "./github";

void test("parses GitHub repository URLs with or without a trailing slash", () => {
  deepStrictEqual(
    parseGitHubUrl("https://github.com/fellipeutaka/ayanokoji/"),
    {
      owner: "fellipeutaka",
      repo: "ayanokoji",
    }
  );
  deepStrictEqual(parseGitHubUrl("https://github.com/octocat/Hello-World"), {
    owner: "octocat",
    repo: "Hello-World",
  });
});
