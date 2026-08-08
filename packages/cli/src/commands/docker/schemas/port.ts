import * as z from "zod/mini";

import { formatZodErrors } from "~/utils/format-zod-errors";

const stringToNumber = z.pipe(z.string(), z.transform(Number));

export const getPortSchema = (defaultPort: number) =>
  z._default(
    z.optional(
      z.pipe(
        stringToNumber,
        z
          .number()
          .check(
            z.gt(0, "Port must be greater than 0"),
            z.lt(65_536, "Port must be less than 65536")
          )
      )
    ),
    defaultPort
  );

export function validatePort(
  value: string | undefined,
  defaultPort: number
): string | undefined {
  const result = getPortSchema(defaultPort).safeParse(value);

  return result.success ? undefined : formatZodErrors(result.error);
}
