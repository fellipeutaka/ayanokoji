import * as z from "zod/mini";

import { PRISMA_DATABASE_VALUES } from "../databases";

export const prismaDatabaseSchema = z.optional(z.enum(PRISMA_DATABASE_VALUES));
