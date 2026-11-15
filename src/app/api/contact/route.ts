import { NextResponse } from "next/server";

/**
 * Contact submission.
 *
 * The transport is a plain `fetch` to Resend's HTTP API — no SDK, no dependency.
 * When the provider is not configured the route answers 503 and the form falls
 * back to a composed mailto, so the page never pretends a message was sent.
 *
 * Spam: a honeypot, a body-size cap, and the provider's own limits. There is
 * deliberately no in-memory rate limit (on serverless it counts per instance
 * and evaporates on a cold start) and no client-supplied timer (a bot can lie
 * about it, and a fast autofill user would be punished). Before the form is
 * advertised widely, put Cloudflare Turnstile with server-side siteverify, or
 * the platform's WAF rate limit, in front of it.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_BODY_BYTES = 10_000;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

function fail(status: number, code: string) {
  return NextResponse.json({ error: code }, { status });
}

function text(value: unknown, max: number): string {
  return typeof value === "string"
    ? value.replace(CONTROL_CHARS, " ").trim().slice(0, max)
    : "";
}

export async function POST(request: Request) {
  const raw = await request.text();

  if (raw.length > MAX_BODY_BYTES) return fail(413, "too-large");

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail(400, "invalid");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return fail(400, "invalid");
  }

  const data = body as Record<string, unknown>;
  const name = text(data.name, 100);
  const email = text(data.email, 200);
  const message = text(data.message, 2000);
  const company = text(data.company, 200);

  // A filled honeypot gets the success a bot expects, and nothing is sent.
  if (company) return NextResponse.json({ ok: true });

  if (!name || !EMAIL.test(email) || !message) return fail(422, "invalid");

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM;
  const to = (process.env.CONTACT_TO ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);

  if (!apiKey || !from || to.length === 0) return fail(503, "unconfigured");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: email,
        subject: `Project enquiry from ${name}`,
        text: `${message}\n\n— ${name} <${email}>`,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return fail(502, "provider");
  } catch {
    // Timeout, DNS, provider outage: the visitor gets an action, not a status.
    return fail(502, "provider");
  }

  return NextResponse.json({ ok: true });
}
