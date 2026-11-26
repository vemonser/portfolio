/**
 * Shared contact-form types and constants.
 *
 * Pure data: no React, no browser APIs. Safe to import from server code,
 * hooks, and unit tests.
 */

export type FieldName = "name" | "email" | "message";

export type ContactValues = {
  name: string;
  email: string;
  message: string;
};

export type ContactErrors = Partial<Record<FieldName, string>>;

export type ContactStatus = "idle" | "submitting" | "success" | "error";

export type ContactLabels = {
  name: string;
  email: string;
  message: string;
  send: string;
  hint: string;
  subjectPrefix: string;
  requiredName: string;
  requiredEmail: string;
  invalidEmail: string;
  requiredMessage: string;
  sending: string;
  sent: string;
  ready: string;
  openMail: string;
  failed: string;
  privacy: string;
  verifyRequired: string;
};

export const CONTACT_FIELDS: readonly FieldName[] = [
  "name",
  "email",
  "message",
] as const;

export const EMPTY_CONTACT_VALUES: ContactValues = {
  name: "",
  email: "",
  message: "",
};

export const CONTACT_IDS: Record<FieldName, string> = {
  name: "contact-name",
  email: "contact-email",
  message: "contact-message",
};