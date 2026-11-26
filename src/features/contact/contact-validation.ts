import {
  CONTACT_FIELDS,
  type ContactErrors,
  type ContactLabels,
  type ContactValues,
  type FieldName,
} from "./contact-types";

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Validate a single field. Returns the error message when invalid, otherwise
 * `undefined`. Values are trimmed before checking, matching the form's
 * on-blur/on-submit behavior.
 */
export function validateContactField(
  field: FieldName,
  value: string,
  labels: ContactLabels,
): string | undefined {
  const trimmed = value.trim();

  if (field === "name") {
    return trimmed ? undefined : labels.requiredName;
  }

  if (field === "email") {
    if (!trimmed) return labels.requiredEmail;
    return EMAIL_SHAPE.test(trimmed) ? undefined : labels.invalidEmail;
  }

  return trimmed ? undefined : labels.requiredMessage;
}

/**
 * Validate every contact field and return the resulting error map. Only fields
 * with an error are included.
 */
export function validateContactValues(
  values: ContactValues,
  labels: ContactLabels,
): ContactErrors {
  const next: ContactErrors = {};

  for (const field of CONTACT_FIELDS) {
    const error = validateContactField(field, values[field], labels);
    if (error) next[field] = error;
  }

  return next;
}

/**
 * Return the first invalid field in canonical field order, or `undefined` when
 * there are no errors.
 */
export function firstInvalidContactField(
  errors: ContactErrors,
): FieldName | undefined {
  return CONTACT_FIELDS.find((field) => Boolean(errors[field]));
}