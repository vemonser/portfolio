import { describe, expect, it } from "vitest";

import { CONTACT_FIELDS, CONTACT_IDS, EMPTY_CONTACT_VALUES } from "./contact-types";
import {
  firstInvalidContactField,
  validateContactField,
  validateContactValues,
} from "./contact-validation";

const labels = {
  name: "Name",
  email: "Email",
  message: "Message",
  send: "Send message",
  hint: "I usually reply within two working days.",
  subjectPrefix: "Project enquiry from",
  requiredName: "Please add your name.",
  requiredEmail: "Please add an email address.",
  invalidEmail: "That email address does not look right.",
  requiredMessage: "Please write a message.",
  sending: "Sending…",
  sent: "Your message is on its way.",
  ready: "Your message is ready. Open your mail app to send it.",
  openMail: "Open mail app",
  failed: "Something went wrong. Your message is still here — try again.",
  privacy: "Your details are used only to reply to this enquiry.",
  verifyRequired: "Please complete the human verification.",
};

describe("contact validation", () => {
  it("requires name", () => {
    expect(validateContactField("name", "", labels)).toBe(labels.requiredName);
    expect(validateContactField("name", "   ", labels)).toBe(labels.requiredName);
  });

  it("requires email", () => {
    expect(validateContactField("email", "", labels)).toBe(labels.requiredEmail);
    expect(validateContactField("email", "   ", labels)).toBe(labels.requiredEmail);
  });

  it("rejects an invalid email", () => {
    expect(validateContactField("email", "not-an-email", labels)).toBe(
      labels.invalidEmail,
    );
  });

  it("requires message", () => {
    expect(validateContactField("message", "", labels)).toBe(labels.requiredMessage);
    expect(validateContactField("message", "   ", labels)).toBe(labels.requiredMessage);
  });

  it("accepts valid values", () => {
    const values = {
      name: "Ada",
      email: "ada@example.com",
      message: "Hello there",
    };
    expect(validateContactValues(values, labels)).toEqual({});
    expect(validateContactField("name", values.name, labels)).toBeUndefined();
    expect(validateContactField("email", values.email, labels)).toBeUndefined();
    expect(validateContactField("message", values.message, labels)).toBeUndefined();
  });

  it("reports the first invalid field in field order", () => {
    const errors = validateContactValues(
      { name: "", email: "bad", message: "" },
      labels,
    );
    expect(firstInvalidContactField(errors)).toBe("name");

    const laterErrors = validateContactValues(
      { name: "Ada", email: "bad", message: "" },
      labels,
    );
    expect(firstInvalidContactField(laterErrors)).toBe("email");

    expect(firstInvalidContactField({})).toBeUndefined();
  });

  it("exposes stable constants", () => {
    expect(CONTACT_FIELDS).toEqual(["name", "email", "message"]);
    expect(EMPTY_CONTACT_VALUES).toEqual({ name: "", email: "", message: "" });
    expect(CONTACT_IDS).toEqual({
      name: "contact-name",
      email: "contact-email",
      message: "contact-message",
    });
  });
});
