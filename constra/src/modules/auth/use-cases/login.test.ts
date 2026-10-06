import { describe, expect, it } from "vitest";
import { hashSync, compareSync } from "bcryptjs";
import { login, type UsersPort } from "./login";

const password = "secret-pw";
const port: UsersPort = {
  async findByUsername(username: string) {
    if (username === "foreman1") {
      return {
        id: "u1",
        username: "foreman1",
        displayName: "Foreman One",
        passwordHash: hashSync(password, 4),
        role: "foreman",
        permissions: ["operations.report"],
        isActive: true,
      };
    }
    if (username === "off1") {
      return {
        id: "u2",
        username: "off1",
        displayName: "Off",
        passwordHash: hashSync(password, 4),
        role: "foreman",
        permissions: [],
        isActive: false,
      };
    }
    return null;
  },
};

describe("login use-case", () => {
  it("succeeds with correct credentials and strips the hash", async () => {
    const res = await login(port, "foreman1", password);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.user.username).toBe("foreman1");
      expect("passwordHash" in res.user).toBe(false);
    }
  });
  it("rejects wrong password", async () => {
    const res = await login(port, "foreman1", "nope");
    expect(res).toEqual({ ok: false, error: "invalid_credentials" });
  });
  it("rejects unknown user", async () => {
    const res = await login(port, "ghost", password);
    expect(res).toEqual({ ok: false, error: "invalid_credentials" });
  });
  it("rejects inactive user", async () => {
    const res = await login(port, "off1", password);
    expect(res).toEqual({ ok: false, error: "inactive" });
  });
  it("sanity: fixture hash verifies", () => {
    expect(compareSync(password, hashSync(password, 4))).toBe(true);
  });
});
