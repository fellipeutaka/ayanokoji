import { maxValue, minValue, number, pipe, string, transform } from "valibot";

export const portSchema = pipe(
  string(),
  transform(Number),
  number("Port must be a number"),
  minValue(0, "Port must be greater than 0"),
  maxValue(65535, "Port must be less than 65536")
);
