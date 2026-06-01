import { z } from "zod";

// Example resource schemas. Replace with your own domain validation.

export const createNoteSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  body: z.string().max(10_000, "Body too long").optional(),
  // Present for guest creation; verified server-side via Turnstile.
  turnstileToken: z.string().optional(),
});
export type CreateNoteInput = z.infer<typeof createNoteSchema>;

export const updateNoteSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    body: z.string().max(10_000).nullable().optional(),
  })
  .refine(
    (d) => Object.values(d).some((v) => v !== undefined),
    "At least one field must be provided",
  );
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

// ── Auth schemas ──────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: z.string().email().max(200),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1).max(100),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});
