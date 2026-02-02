import * as z from "zod/mini";
import { PRISMA_DATABASES } from "../databases";

export const prismaDatabaseSchema = z.optional(
  z.enum(
    PRISMA_DATABASES.map((database) => database.value) as [string, ...string[]]
  )
);
