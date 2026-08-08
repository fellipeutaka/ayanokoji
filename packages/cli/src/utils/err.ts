import type { Ok } from "./ok";
import type { Result } from "./result-contract";

export class Err<T, E> implements Result<T, E> {
  constructor(readonly error: E) {}

  isOk(): this is Ok<T, E> {
    return false;
  }

  isErr(): this is Err<T, E> {
    return true;
  }
}
