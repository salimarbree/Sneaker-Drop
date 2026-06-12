import { z } from "zod";

export const createDropSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  totalStock: z.number().int().positive("totalStock must be positive"),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional().nullable(),
});

export type CreateDropInput = z.infer<typeof createDropSchema>;
