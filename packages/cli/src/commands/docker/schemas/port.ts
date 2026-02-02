import * as z from "zod/mini";

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
