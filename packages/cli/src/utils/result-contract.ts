import type { Err } from "./err";
import type { Ok } from "./ok";

export interface Result<T, E> {
  isOk: () => this is Ok<T, E>;
  isErr: () => this is Err<T, E>;
}
