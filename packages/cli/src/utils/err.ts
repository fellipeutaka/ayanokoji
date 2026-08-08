import type { Ok } from "./ok";
import type { Result } from "./result-contract";

export class Err<T, E> implements Result<T, E> {
  readonly error: E;

  constructor(error: E) {
    this.error = error;
  }

  isOk(): this is Ok<T, E> {
    return false;
  }

  isErr(): this is Err<T, E> {
    return true;
  }
}
