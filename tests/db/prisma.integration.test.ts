import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

/**
 * IPA-201 DoD: positiver + negativer DB-Test.
 * Aktivieren mit RUN_DB_INTEGRATION=1 und gültigem DATABASE_URL (nach migrate + seed für Rollen).
 *
 * Beispiel:
 *   RUN_DB_INTEGRATION=1 npm test
 */
const runIntegration = process.env.RUN_DB_INTEGRATION === "1";

if (!runIntegration) {
  describe.skip("Prisma / IPA-201 schema (set RUN_DB_INTEGRATION=1)", () => {
    it("Integrationstests sind optional ohne lokale DB", () => {});
  });
} else {
  describe("Prisma / IPA-201 schema", () => {
    const prisma = new PrismaClient();

    beforeAll(async () => {
      await prisma.$connect();
    });

    afterAll(async () => {
      await prisma.$disconnect();
    });

    it("positiv: User mit gültiger Rolle anlegen und wieder lesen", async () => {
      const role = await prisma.role.findFirst({ where: { name: "BASIC" } });
      expect(role).toBeTruthy();

      const username = `TAA_POS_${Date.now()}`;
      const created = await prisma.user.create({
        data: {
          username,
          roleId: role!.id,
        },
      });

      const read = await prisma.user.findUnique({ where: { id: created.id } });
      expect(read?.username).toBe(username);
      expect(read?.roleId).toBe(role!.id);

      await prisma.user.delete({ where: { id: created.id } });
    });

    it("negativ: ungültige roleId verletzt Foreign-Key und schlägt fehl", async () => {
      await expect(
        prisma.user.create({
          data: {
            username: `TAA_NEG_${Date.now()}`,
            roleId: "clxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          },
        }),
      ).rejects.toThrow();
    });
  });
}
