import { afterEach, describe, expect, it, vi } from "vitest";

import { verifyTurnstile } from "./turnstile-server";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("verifyTurnstile", () => {
  it("fails closed without a token and does not call the provider", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(await verifyTurnstile("", "secret")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the secret and token to Cloudflare", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    expect(await verifyTurnstile("token", "secret", "203.0.113.1")).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("secret")).toBe("secret");
    expect((init.body as FormData).get("response")).toBe("token");
    expect((init.body as FormData).get("remoteip")).toBe("203.0.113.1");
  });

  it("fails closed on provider errors and rejected tokens", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response("down", { status: 503 }))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ success: false }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        ),
    );

    expect(await verifyTurnstile("token", "secret")).toBe(false);
    expect(await verifyTurnstile("token", "secret")).toBe(false);
  });
});
