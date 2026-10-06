import { describe, expect, it } from "vitest";
import { routeIntent } from "./intent";

describe("routeIntent", () => {
  it("routes dues queries (user example 1)", () => {
    expect(routeIntent("tell me upcoming dues in next 3 months")).toEqual({
      kind: "dues",
      months: 3,
    });
    expect(routeIntent("what do we owe suppliers?").kind).toBe("dues");
  });

  it("routes cost queries to stage_costs", () => {
    const r = routeIntent("how much spent on marina project stages?");
    expect(r.kind).toBe("stage_costs");
  });

  it("routes survival queries (user example 3)", () => {
    expect(routeIntent("how many more projects should come to survive next year?").kind).toBe(
      "survival",
    );
  });

  it("routes navigation with screen + filters", () => {
    expect(routeIntent("open bills screen")).toEqual({
      kind: "navigate",
      screen: "/bills",
    });
  });

  it("falls back to unknown", () => {
    expect(routeIntent("hello there").kind).toBe("unknown");
  });
});
