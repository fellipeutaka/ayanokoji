import * as z from "zod/mini";

import { DRIZZLE_DATABASES } from "../databases";

export const drizzleDatabaseSchema = z.optional(
  z.enum(
    DRIZZLE_DATABASES.map((database) => database.value) as [string, ...string[]]
  )
);
