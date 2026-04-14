import { AuditCategory } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { logWarn } from "@/lib/logger";

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      username: true,
      email: true,
      isActive: true,
      mustChangePassword: true,
      createdAt: true,
      role: { select: { id: true, name: true } },
    },
  });
}

export type AssignRoleResult =
  | { ok: true }
  | { error: "USER_NOT_FOUND" | "ROLE_NOT_FOUND" | "CANNOT_SELF_EDIT" };

export async function assignRole(
  targetUserId: string,
  newRoleName: string,
  adminUserId: string,
): Promise<AssignRoleResult> {
  if (targetUserId === adminUserId) return { error: "CANNOT_SELF_EDIT" };

  const [user, role] = await Promise.all([
    prisma.user.findUnique({ where: { id: targetUserId } }),
    prisma.role.findUnique({ where: { name: newRoleName } }),
  ]);

  if (!user) return { error: "USER_NOT_FOUND" };
  if (!role) return { error: "ROLE_NOT_FOUND" };

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: targetUserId }, data: { roleId: role.id } });
    await tx.auditLog.create({
      data: {
        category: AuditCategory.RBAC,
        action: "ROLE_ASSIGNED",
        resource: targetUserId,
        userId: adminUserId,
        payload: { newRole: newRoleName, targetUsername: user.username },
      },
    });
  });

  return { ok: true };
}

export type DeactivateResult =
  | { ok: true }
  | { error: "USER_NOT_FOUND" | "ALREADY_INACTIVE" | "CANNOT_SELF_EDIT" };

export async function deactivateUser(
  targetUserId: string,
  adminUserId: string,
): Promise<DeactivateResult> {
  if (targetUserId === adminUserId) return { error: "CANNOT_SELF_EDIT" };

  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) return { error: "USER_NOT_FOUND" };
  if (!user.isActive) return { error: "ALREADY_INACTIVE" };

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: targetUserId }, data: { isActive: false } });
    await tx.auditLog.create({
      data: {
        category: AuditCategory.ACCOUNT,
        action: "USER_DEACTIVATED",
        resource: targetUserId,
        userId: adminUserId,
        payload: { targetUsername: user.username },
      },
    });
  });

  return { ok: true };
}
