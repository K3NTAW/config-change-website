import { createHash, randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { sendResetPasswordEmail } from "@/lib/mail/send-reset-password-email";
import { logInfo, logWarn } from "@/lib/logger";

const ROUNDS = 12;
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const MIN_PASSWORD_LENGTH = 8;

export function generateRawToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

function isStrongPassword(password: string): boolean {
  return (
    password.length >= MIN_PASSWORD_LENGTH &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

/**
 * Initiates a password reset for a user identified by username or email.
 * Always resolves without error to avoid leaking whether the account exists.
 */
export async function requestPasswordReset(usernameOrEmail: string): Promise<void> {
  const value = usernameOrEmail.trim().toLowerCase();

  const user = await prisma.user.findFirst({
    where: { OR: [{ username: value }, { email: value }] },
  });

  if (!user || !user.email || !user.isActive) {
    logWarn({ action: "PASSWORD_RESET_REQUEST_NO_USER", usernameOrEmail: value });
    return;
  }

  // Invalidate any existing unused tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  });

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.passwordResetToken.create({
    data: { tokenHash, userId: user.id, expiresAt },
  });

  await sendResetPasswordEmail({ to: user.email, username: user.username, rawToken });

  logInfo({ action: "PASSWORD_RESET_REQUESTED", userId: user.id });
}

export type ResetPasswordResult =
  | { ok: true }
  | { error: "INVALID" | "EXPIRED" | "USED" | "WEAK_PASSWORD" };

/**
 * Validates the reset token and sets a new password.
 */
export async function resetPassword(
  rawToken: string,
  newPassword: string,
): Promise<ResetPasswordResult> {
  if (!isStrongPassword(newPassword)) {
    return { error: "WEAK_PASSWORD" };
  }

  const tokenHash = hashToken(rawToken);

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!record) return { error: "INVALID" };
  if (record.usedAt) return { error: "USED" };
  if (record.expiresAt < new Date()) return { error: "EXPIRED" };

  const passwordHash = await hash(newPassword, ROUNDS);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: record.userId },
      data: { passwordHash, mustChangePassword: false },
    });
    await tx.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
  });

  logInfo({ action: "PASSWORD_RESET_SUCCESS", userId: record.userId });
  return { ok: true };
}
