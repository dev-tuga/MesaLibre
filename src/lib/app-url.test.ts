import { describe, expect, it } from "vitest";

import { resolvePublicBaseUrl } from "./app-url";

describe("resolvePublicBaseUrl", () => {
  it("uses the request host when accessed through a tunnel", () => {
    expect(
      resolvePublicBaseUrl({
        host: "demo.trycloudflare.com",
        proto: "https",
        configuredBaseUrl: "http://localhost:3000",
      }),
    ).toBe("https://demo.trycloudflare.com");
  });

  it("falls back to configured URL for localhost requests", () => {
    expect(
      resolvePublicBaseUrl({
        host: "localhost:3000",
        proto: "http",
        configuredBaseUrl: "https://demo.trycloudflare.com",
      }),
    ).toBe("https://demo.trycloudflare.com");
  });

  it("strips trailing slashes from the configured URL", () => {
    expect(
      resolvePublicBaseUrl({
        host: null,
        proto: null,
        configuredBaseUrl: "http://localhost:3000/",
      }),
    ).toBe("http://localhost:3000");
  });
});
