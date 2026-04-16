import { z } from "zod";

const taaUsername = z
  .string()
  .trim()
  .regex(
    /^TAA\d{4}$/,
    "Benutzerkennung muss dem Format TAAxxxx entsprechen (vier Ziffern).",
  );

/** Login — Passwort nur Längen-Check; niemals loggen. */
export const loginBodySchema = z.object({
  username: taaUsername,
  password: z.string().min(1).max(1024),
});

/** Forgot-password: TAA oder E-Mail (Domain wie Registrierung). */
export const forgotPasswordBodySchema = z.object({
  username: z
    .string()
    .trim()
    .min(1)
    .max(256)
    .refine(
      (s) =>
        /^TAA\d{4}$/.test(s) ||
        (s.includes("@") &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) &&
          s.toLowerCase().endsWith("@swisscom.com")),
      {
        message:
          "Gültige Benutzerkennung (TAAxxxx) oder @swisscom.com E-Mail erforderlich.",
      },
    ),
});

export const resetPasswordBodySchema = z.object({
  token: z.string().min(1).max(512),
  newPassword: z.string().min(8).max(256),
});

export const adminAssignRoleBodySchema = z
  .object({
    role: z.enum(["ADMIN", "BASIC"]),
  })
  .strict();

/** Ablehnungsgrund optional; keine zusätzlichen Felder. */
export const rejectRegistrationBodySchema = z
  .object({
    reason: z.string().max(4000).nullish(),
  })
  .strict();

/** Prisma-Standard-IDs (`@default(cuid())`). */
export const prismaCuidParamSchema = z.string().cuid("Ungültige ID.");

export type LoginBody = z.infer<typeof loginBodySchema>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;
export type AdminAssignRoleBody = z.infer<typeof adminAssignRoleBodySchema>;
export type RejectRegistrationBody = z.infer<typeof rejectRegistrationBodySchema>;
