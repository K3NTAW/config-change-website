import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { RegistrationStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { sendTempPasswordEmail } from "@/lib/mail/send-temp-password-email";
import { writeAudit } from "@/lib/audit/audit-service";

const ROUNDS = 12;

function generateTempPassword(): string {
  return randomBytes(16).toString("base64url").slice(0, 20);
}

export async function listPendingRegistrationRequests() {
  return prisma.registrationRequest.findMany({
    where: { status: RegistrationStatus.PENDING_APPROVAL },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
    },
  });
}

export async function approveRegistration(requestId: string, adminUserId: string) {
  const row = await prisma.registrationRequest.findUnique({
    where: { id: requestId },
  });
  if (!row || row.status !== RegistrationStatus.PENDING_APPROVAL) {
    return { error: "NOT_FOUND" as const };
  }

  const clash = await prisma.user.findFirst({
    where: { OR: [{ username: row.username }, { email: row.email }] },
  });
  if (clash) {
    return { error: "USER_EXISTS" as const };
  }

  const basicRole = await prisma.role.findUnique({ where: { name: "BASIC" } });
  if (!basicRole) {
    return { error: "CONFIG" as const };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hash(tempPassword, ROUNDS);

  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        username: row.username,
        email: row.email,
        passwordHash,
        roleId: basicRole.id,
        isActive: true,
        mustChangePassword: true,
      },
    });
    await tx.registrationRequest.update({
      where: { id: row.id },
      data: { status: RegistrationStatus.APPROVED },
    });
    await writeAudit(tx, {
      category: "AUTH",
      action: "REGISTRATION_APPROVED",
      resource: row.id,
      userId: adminUserId,
      payload: { targetUsername: row.username },
    });
  });

  await sendTempPasswordEmail({
    to: row.email,
    username: row.username,
    tempPassword,
  });

  return { ok: true as const };
}

export async function rejectRegistration(
  requestId: string,
  adminUserId: string,
  reason?: string,
) {
  const row = await prisma.registrationRequest.findUnique({
    where: { id: requestId },
  });
  if (!row || row.status !== RegistrationStatus.PENDING_APPROVAL) {
    return { error: "NOT_FOUND" as const };
  }

  await prisma.$transaction(async (tx) => {
    await tx.registrationRequest.update({
      where: { id: row.id },
      data: {
        status: RegistrationStatus.REJECTED,
        rejectionReason: reason?.trim() || null,
      },
    });
    await writeAudit(tx, {
      category: "AUTH",
      action: "REGISTRATION_REJECTED",
      resource: row.id,
      userId: adminUserId,
      payload: { reason: reason ?? null },
    });
  });

  return { ok: true as const };
}
