import { z } from "zod";

export const createPurchaseSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  dropId: z.string().uuid("Invalid drop ID"),
  reservationId: z.string().uuid("Invalid reservation ID"),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
