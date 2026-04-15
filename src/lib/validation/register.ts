import { z } from "zod";

export const registerRequestSchema = z.object({
  username: z
    .string()
    .trim()
    .regex(
      /^TAA\d{4}$/,
      "Benutzerkennung muss dem Format TAAxxxx entsprechen (vier Ziffern, z. B. TAA1234).",
    ),
  email: z
    .string()
    .trim()
    .email("Ungültige E-Mail-Adresse.")
    .transform((v) => v.toLowerCase())
    .refine((v) => v.endsWith("@swisscom.com"), {
      message: "Nur E-Mail-Adressen der Domain @swisscom.com sind erlaubt.",
    }),
  password: z
    .string()
    .min(12, "Passwort muss mindestens 12 Zeichen lang sein."),
});

export type RegisterInput = z.infer<typeof registerRequestSchema>;
