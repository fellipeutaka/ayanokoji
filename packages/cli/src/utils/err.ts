import type { Ok } from "./ok";
import type { Result } from "./result-contract";

export class Err<T, E> implements Result<T, E> {
  private readonly successful = false;

  readonly error: E;

  constructor(error: E) {
    this.error = error;
  }

  isOk(): this is Ok<T, E> {
    return this.successful;
  }

  isErr(): this is Err<T, E> {
    return !this.successful;
  }
}
