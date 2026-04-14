import { hash } from "bcryptjs";
import { RegistrationStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { registerRequestSchema } from "@/lib/validation/register";
import { logWarn } from "@/lib/logger";
import { writeAudit } from "@/lib/audit/audit-service";

const BCRYPT_ROUNDS = 12;

export class RegistrationError extends Error {
  constructor(
    public readonly code: "VALIDATION" | "CONFLICT" | "INTERNAL",
    public readonly httpStatus: number,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "RegistrationError";
  }
}

/**
 * Legt einen Registrierungsantrag mit Status PENDING_APPROVAL an (IPA-202).
 */
export async function createRegistrationRequest(raw: unknown) {
  const parsed = registerRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const fields = Object.fromEntries(
      parsed.error.issues.map((i) => [i.path.join(".") || "root", i.message]),
    );
    throw new RegistrationError(
      "VALIDATION",
      400,
      "Die Eingaben sind ungültig.",
      fields,
    );
  }

  const { username, email, password } = parsed.data;

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (existingUser) {
    logWarn({
      action: "REGISTER_CONFLICT",
      reason: "existing_user",
      httpStatus: 409,
    });
    throw new RegistrationError(
      "CONFLICT",
      409,
      "Diese Benutzerkennung oder E-Mail ist bereits registriert.",
    );
  }

  const pending = await prisma.registrationRequest.findFirst({
    where: {
      status: RegistrationStatus.PENDING_APPROVAL,
      OR: [{ username }, { email }],
    },
  });
  if (pending) {
    logWarn({
      action: "REGISTER_CONFLICT",
      reason: "pending_request",
      httpStatus: 409,
    });
    throw new RegistrationError(
      "CONFLICT",
      409,
      "Für diese Benutzerkennung oder E-Mail liegt bereits ein ausstehender Antrag vor.",
    );
  }

  const passwordHash = await hash(password, BCRYPT_ROUNDS);

  const row = await prisma.registrationRequest.create({
    data: {
      username,
      email,
      passwordHash,
      status: RegistrationStatus.PENDING_APPROVAL,
    },
  });

  await writeAudit(prisma, {
    category: "AUTH",
    action: "REGISTRATION_REQUESTED",
    resource: row.id,
    payload: { username },
  });

  return { id: row.id, status: row.status };
}
