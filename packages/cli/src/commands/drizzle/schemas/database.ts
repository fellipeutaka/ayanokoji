import * as z from "zod/mini";

import { DRIZZLE_DATABASE_VALUES } from "../databases";

export const drizzleDatabaseSchema = z.optional(
  z.enum(DRIZZLE_DATABASE_VALUES)
);
