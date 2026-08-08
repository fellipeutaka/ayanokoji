import type { Err } from "./err";
import type { Result } from "./result-contract";

export class Ok<T, E> implements Result<T, E> {
  constructor(readonly value: T) {}

  isOk(): this is Ok<T, E> {
    return true;
  }

  isErr(): this is Err<T, E> {
    return false;
  }
}
