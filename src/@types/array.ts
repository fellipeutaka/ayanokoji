export type DistinctArray<T extends unknown[], U = T> = T extends []
  ? U
  : T extends [head: infer Head, ...rest: infer Tail]
    ? Head extends Tail[number]
      ? never
      : DistinctArray<Tail, U>
    : never;
