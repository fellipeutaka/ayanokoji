import { describe, expect, test } from "vitest";

import { Err, Ok } from "./result";

describe("Result", () => {
  test("Ok stores its value and identifies a successful result", () => {
    const result = new Ok<number, string>(42);

    expect(result.value).toBe(42);
    expect(result.isOk()).toBeTruthy();
    expect(result.isErr()).toBeFalsy();
  });

  test("Err stores its error and identifies a failed result", () => {
    const result = new Err<number, string>("failure");

    expect(result.error).toBe("failure");
    expect(result.isOk()).toBeFalsy();
    expect(result.isErr()).toBeTruthy();
  });
});
