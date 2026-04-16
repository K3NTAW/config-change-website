import { describe, it, expect } from "vitest";
import {
  buildAuditListWhere,
  parseAuditListFiltersFromSearchParams,
  parseDateOnlyParam,
  parseUsernameFilter,
} from "@/lib/admin/audit-list-filters";

describe("audit-list-filters (IPA-214)", () => {
  describe("parseUsernameFilter", () => {
    it("trimmt und liefert Wert", () => {
      expect(parseUsernameFilter("  TAA0001  ")).toBe("TAA0001");
    });
    it("leer → undefined", () => {
      expect(parseUsernameFilter(null)).toBeUndefined();
      expect(parseUsernameFilter("   ")).toBeUndefined();
    });
  });

  describe("parseDateOnlyParam", () => {
    it("leer → ok ohne Datum", () => {
      expect(parseDateOnlyParam(null)).toEqual({ ok: true, date: undefined });
      expect(parseDateOnlyParam("")).toEqual({ ok: true, date: undefined });
    });
    it("gültiges YYYY-MM-DD", () => {
      expect(parseDateOnlyParam("2026-04-15")).toEqual({
        ok: true,
        date: "2026-04-15",
      });
    });
    it("ungültiges Format", () => {
      const r = parseDateOnlyParam("15.04.2026");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBeTruthy();
    });
  });

  describe("buildAuditListWhere", () => {
    it("ohne Filter → leeres Objekt", () => {
      expect(buildAuditListWhere({})).toEqual({});
    });
    it("nur Benutzer (TAA / username)", () => {
      expect(buildAuditListWhere({ username: "TAA4242" })).toEqual({
        user: { username: "TAA4242" },
      });
    });
    it("nur Zeitraum", () => {
      const w = buildAuditListWhere({
        dateFrom: "2026-04-01",
        dateTo: "2026-04-10",
      });
      expect(w).toMatchObject({
        AND: expect.any(Array),
      });
      const and = (w as { AND: unknown[] }).AND;
      expect(and).toHaveLength(2);
    });
    it("Benutzer + Zeitraum kombiniert", () => {
      const w = buildAuditListWhere({
        username: "TAA0009",
        dateFrom: "2026-01-01",
        dateTo: "2026-12-31",
      });
      expect(w).toMatchObject({ AND: expect.any(Array) });
      const and = (w as { AND: object[] }).AND;
      expect(and).toHaveLength(3);
      expect(and[0]).toEqual({ user: { username: "TAA0009" } });
    });
  });

  describe("parseAuditListFiltersFromSearchParams", () => {
    it("leere Params → keine Filter", () => {
      const p = parseAuditListFiltersFromSearchParams(new URLSearchParams());
      expect(p.ok).toBe(true);
      if (!p.ok) return;
      expect(p.filters).toEqual({});
      expect(p.where).toEqual({});
    });
    it("nur username", () => {
      const p = parseAuditListFiltersFromSearchParams(
        new URLSearchParams("username=TAA1111"),
      );
      expect(p.ok).toBe(true);
      if (!p.ok) return;
      expect(p.filters.username).toBe("TAA1111");
      expect(p.where).toEqual({ user: { username: "TAA1111" } });
    });
    it("nur Zeitraum", () => {
      const p = parseAuditListFiltersFromSearchParams(
        new URLSearchParams("dateFrom=2026-04-01&dateTo=2026-04-15"),
      );
      expect(p.ok).toBe(true);
      if (!p.ok) return;
      expect(p.filters.dateFrom).toBe("2026-04-01");
      expect(p.filters.dateTo).toBe("2026-04-15");
    });
    it("kombiniert", () => {
      const p = parseAuditListFiltersFromSearchParams(
        new URLSearchParams(
          "username=TAA2222&dateFrom=2026-03-01&dateTo=2026-03-31",
        ),
      );
      expect(p.ok).toBe(true);
      if (!p.ok) return;
      expect(p.filters).toMatchObject({
        username: "TAA2222",
        dateFrom: "2026-03-01",
        dateTo: "2026-03-31",
      });
      expect((p.where as { AND?: unknown }).AND).toHaveLength(3);
    });
    it("negativ: Start nach Ende", () => {
      const p = parseAuditListFiltersFromSearchParams(
        new URLSearchParams("dateFrom=2026-05-01&dateTo=2026-04-01"),
      );
      expect(p.ok).toBe(false);
      if (p.ok) return;
      expect(p.error).toContain("Startdatum");
    });
    it("negativ: ungültiges Datum", () => {
      const p = parseAuditListFiltersFromSearchParams(
        new URLSearchParams("dateFrom=not-a-date"),
      );
      expect(p.ok).toBe(false);
    });
  });
});
