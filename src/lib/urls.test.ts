import { describe, expect, it } from "vitest";

import { buildTableUrl } from "./urls";

describe("buildTableUrl", () => {
  it("joins base url, slug and token into the public bill route", () => {
    expect(buildTableUrl("http://localhost:3000", "la-picada-del-puerto", "demo-mesa-1-7f3k")).toBe(
      "http://localhost:3000/r/la-picada-del-puerto/demo-mesa-1-7f3k/cuenta",
    );
  });

  it("strips trailing slashes from the base url", () => {
    expect(buildTableUrl("http://192.168.1.50:3000/", "resto", "tok")).toBe(
      "http://192.168.1.50:3000/r/resto/tok/cuenta",
    );
    expect(buildTableUrl("https://demo.example//", "resto", "tok")).toBe(
      "https://demo.example/r/resto/tok/cuenta",
    );
  });

  it("escapes tokens that need url encoding", () => {
    expect(buildTableUrl("http://localhost:3000", "resto", "a b/c")).toBe(
      "http://localhost:3000/r/resto/a%20b%2Fc/cuenta",
    );
  });

  it("rejects non-http base urls", () => {
    expect(() => buildTableUrl("ftp://demo", "resto", "tok")).toThrow(/base url/i);
    expect(() => buildTableUrl("localhost:3000", "resto", "tok")).toThrow(/base url/i);
  });
});
