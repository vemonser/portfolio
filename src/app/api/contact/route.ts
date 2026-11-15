import { NextResponse } from "next/server";

/**
 * Contact submission.
 *
 * The transport is a plain `fetch` to Resend's HTTP API — no SDK, no dependency.
 * When the provider is not configured the route answers 503 and the form falls
 * back to a composed mailto, so the page never pretends a message was sent.
 *
 * Spam: a honeypot and a minimum fill time, both free. There is deliberately no
 * in-memory rate limit: on serverless it counts per instance and evaporates on
 * a cold start. Before the form is advertised widely, put Cloudflare Turnstile
 * (server-side siteverify) or the platform's WAF rate limit in front of it.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_FILL_MS = 600;

function fail(status: number, code: string) {
  return NextResponse.json({ error: code }, { status });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail(400, "invalid");
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
  const email =
    typeof body.email === "string" ? body.email.trim().slice(0, 200) : "";
  const message =
    typeof body.message === "string" ? body.message.trim().slice(0, 2000) : "";
  const company = typeof body.company === "string" ? body.company.trim() : "";
  const startedAt = Number(body.startedAt);

  // A filled honeypot gets the success a bot expects, and nothing is sent.
  if (company) return NextResponse.json({ ok: true });

  if (!name || !EMAIL.test(email) || !message) return fail(422, "invalid");

  if (!Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FILL_MS) {
    return fail(400, "too-fast");
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO;
  const from = process.env.CONTACT_FROM;

  if (!apiKey || !to || !from) return fail(503, "unconfigured");

  const subject = `Project enquiry from ${name.replace(/[\r\n]+/g, " ")}`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: to.split(",").map((address) => address.trim()),
        reply_to: email,
        subject,
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
