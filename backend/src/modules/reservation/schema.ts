import { z } from "zod";

export const createReservationSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  dropId: z.string().uuid("Invalid drop ID"),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
