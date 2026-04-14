import { describe, it, expect } from "vitest";
import { registerRequestSchema } from "@/lib/validation/register";

describe("registerRequestSchema (IPA-202)", () => {
  it("akzeptiert gültige TAA + Swisscom-E-Mail + Passwort", () => {
    const r = registerRequestSchema.safeParse({
      username: "TAA1234",
      email: "Max.Mustermann@swisscom.com",
      password: "sicherLang123!",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.username).toBe("TAA1234");
      expect(r.data.email).toBe("max.mustermann@swisscom.com");
    }
  });

  it("lehnt falsches TAA-Format ab", () => {
    const r = registerRequestSchema.safeParse({
      username: "TA12345",
      email: "a@swisscom.com",
      password: "sicherLang123!",
    });
    expect(r.success).toBe(false);
  });

  it("lehnt Nicht-Swisscom-Domain ab", () => {
    const r = registerRequestSchema.safeParse({
      username: "TAA1234",
      email: "a@gmail.com",
      password: "sicherLang123!",
    });
    expect(r.success).toBe(false);
  });

  it("lehnt zu kurzes Passwort ab", () => {
    const r = registerRequestSchema.safeParse({
      username: "TAA1234",
      email: "a@swisscom.com",
      password: "kurz",
    });
    expect(r.success).toBe(false);
  });
});
