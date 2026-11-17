import { expect, test } from "./support/fixtures";

const valid = {
  name: "Sam Rivera",
  email: "sam@example.com",
  message: "A project enquiry with enough text.",
  company: "",
};

test.describe("contact route", () => {
  test("rejects an invalid email", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: { ...valid, email: "not-an-email" },
    });

    expect(response.status()).toBe(422);
  });

  test("discards a filled honeypot as if it succeeded", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: { ...valid, company: "Acme" },
    });

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  test("rejects a malformed body", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: "not-an-object",
    });

    expect(response.status()).toBe(400);
  });

  test("rejects an oversized body", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: { ...valid, message: "x".repeat(20_000) },
    });

    expect(response.status()).toBe(413);
  });

  test("reports unconfigured when no provider is set", async ({ request }) => {
    test.skip(
      Boolean(process.env.RESEND_API_KEY),
      "a provider is configured in this environment",
    );

    const response = await request.post("/api/contact", { data: valid });

    expect(response.status()).toBe(503);
    expect((await response.json()).error).toBe("unconfigured");
  });
});
