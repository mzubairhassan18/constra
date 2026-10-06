import { describe, expect, it } from "vitest";
import { can } from "./types";

describe("can()", () => {
  it("grants everything to super_admin wildcard", () => {
    expect(can(["*"], "projects.delete")).toBe(true);
  });
  it("grants module wildcard", () => {
    expect(can(["projects.*"], "projects.write")).toBe(true);
    expect(can(["projects.*"], "finance.write")).toBe(false);
  });
  it("grants exact permission", () => {
    expect(can(["operations.report"], "operations.report")).toBe(true);
  });
  it("denies missing permission", () => {
    expect(can(["projects.read"], "projects.write")).toBe(false);
  });
  it("denies empty permissions", () => {
    expect(can([], "portal.read")).toBe(false);
  });
});
