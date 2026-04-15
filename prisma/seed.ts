import "dotenv/config";
import { hash } from "bcryptjs";
import { AuditCategory } from "@prisma/client";
import { createPrismaClient } from "../src/lib/db/prisma";

const prisma = createPrismaClient();
const ROUNDS = 12;

const DEMO_ADMIN_PW = "DevAdmin123!!";
const DEMO_BASIC_PW = "DevBasic123!!";

async function main() {
  const admin = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: {
      name: "ADMIN",
      description: "Volle Verwaltung; accountbezogenes Audit einsehbar",
    },
  });

  const basic = await prisma.role.upsert({
    where: { name: "BASIC" },
    update: {},
    create: {
      name: "BASIC",
      description: "Standardnutzer; NRT-Rule-Change-Audit einsehbar nach Freigabe",
    },
  });

  const adminHash = await hash(DEMO_ADMIN_PW, ROUNDS);
  const basicHash = await hash(DEMO_BASIC_PW, ROUNDS);

  await prisma.user.upsert({
    where: { username: "TAA0001" },
    update: {
      passwordHash: adminHash,
      email: "demo.admin@swisscom.com",
      mustChangePassword: false,
    },
    create: {
      username: "TAA0001",
      email: "demo.admin@swisscom.com",
      passwordHash: adminHash,
      roleId: admin.id,
      mustChangePassword: false,
    },
  });

  await prisma.user.upsert({
    where: { username: "TAA0002" },
    update: {
      passwordHash: basicHash,
      email: "demo.basic@swisscom.com",
      mustChangePassword: false,
    },
    create: {
      username: "TAA0002",
      email: "demo.basic@swisscom.com",
      passwordHash: basicHash,
      roleId: basic.id,
      mustChangePassword: false,
    },
  });

  const basicUser = await prisma.user.findUnique({
    where: { username: "TAA0002" },
  });

  if (basicUser) {
    await prisma.auditLog.create({
      data: {
        category: AuditCategory.NRT_RULE_CHANGE,
        action: "RULE_UPDATED",
        resource: "rule:demo-001",
        payload: { message: "Seed: Beispiel NRT-Änderung" },
        userId: basicUser.id,
      },
    });
  }

  console.log(
    "Seed OK: roles ADMIN/BASIC; users TAA0001 (ADMIN) / TAA0002 (BASIC) mit Demo-Passwörtern; Audit-Demo",
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
