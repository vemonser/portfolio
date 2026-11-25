import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("contact Turnstile gate", () => {
  it("requires a token when a server secret is configured", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("http://localhost/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Sam Rivera",
          email: "sam@example.com",
          message: "A portfolio enquiry.",
        }),
      }),
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "verification" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
