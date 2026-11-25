import { expect, test } from "./support/fixtures";

test.describe("security headers", () => {
  test("sets baseline browser security headers", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["content-security-policy"]).toContain(
      "https://challenges.cloudflare.com",
    );
    expect(headers["content-security-policy"]).toContain(
      "img-src 'self' data: blob: https://challenges.cloudflare.com",
    );
    expect(headers["x-powered-by"]).toBeUndefined();
  });
});
