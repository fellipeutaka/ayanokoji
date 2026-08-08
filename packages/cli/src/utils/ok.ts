import type { Err } from "./err";
import type { Result } from "./result-contract";

export class Ok<T, E> implements Result<T, E> {
  readonly value: T;

  constructor(value: T) {
    this.value = value;
  }

  isOk(): this is Ok<T, E> {
    return true;
  }

  isErr(): this is Err<T, E> {
    return false;
  }
}
