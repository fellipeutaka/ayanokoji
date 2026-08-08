import type { Err } from "./err";
import type { Result } from "./result-contract";

export class Ok<T, E> implements Result<T, E> {
  private readonly successful = true;

  readonly value: T;

  constructor(value: T) {
    this.value = value;
  }

  isOk(): this is Ok<T, E> {
    return this.successful;
  }

  isErr(): this is Err<T, E> {
    return !this.successful;
  }
}
