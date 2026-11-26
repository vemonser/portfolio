# Contact form organization implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Separate contact-form types, validation, state/submission orchestration, and markup without changing the approved form behavior or layout.

**Architecture:** Keep `ContactForm.tsx` as the JSX adapter. Add a pure validation module, a shared types/constants module, and a `useContactForm` hook that owns values, errors, status, Turnstile state, mailto fallback and submission. Existing `Field`, `StatusMessage`, `Turnstile` and the contact API remain unchanged.

**Tech Stack:** Next.js 16, React 19, TypeScript, Playwright, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-26-code-organization-design.md`

## Global Constraints

- No contact-form layout, copy, markup, API, dependency or interaction changes.
- Preserve field names, IDs, status live regions, honeypot, Turnstile behavior and mailto fallback.
- No edits outside each task's explicit file list.
- TDD is required; tests must be deterministic.
- No pass-through-only modules.

## Review Focus

- Empty required fields still focus the first invalid field (Task 2/3).
- Invalid email preserves values and associates the error (Task 1/3).
- A 503 endpoint still falls back to mailto without losing values (Task 2/3).
- Turnstile missing token still blocks submit with the existing error (Task 2/3).
- The approved layout and arrow-free circular action remain unchanged (Task 3).

---

### Task 1: Extract contact types and validation

**Files:**
- Create: `src/features/contact/contact-types.ts`
- Create: `src/features/contact/contact-validation.ts`
- Create: `src/features/contact/contact-validation.test.ts`

**Interfaces:**
- `contact-types.ts` exports `FieldName`, `ContactValues`, `ContactErrors`, `ContactStatus`, `ContactLabels`, `CONTACT_FIELDS`, `EMPTY_CONTACT_VALUES`, `CONTACT_IDS`.
- `contact-validation.ts` exports `validateContactField(field, value, labels)`, `validateContactValues(values, labels)`, `firstInvalidContactField(errors)`.

- [ ] **Step 1:** Add failing Vitest cases for required name/email/message, invalid email, valid values, and first-invalid ordering.
- [ ] **Step 2:** Run the test and verify it fails because the modules do not exist.
- [ ] **Step 3:** Implement the types/constants and pure validation functions.
- [ ] **Step 4:** Run the test and verify it passes.
- [ ] **Step 5:** Commit.

### Task 2: Extract contact state and submission

**Files:**
- Create: `src/features/contact/use-contact-form.ts`
- Test: `tests/contact-form.spec.ts`

**Interfaces:**
- `useContactForm({ to, endpoint, labels })` returns `values`, `errors`, `status`, `mailto`, `company`, `setCompany`, `turnstileToken`, `turnstileReset`, `verificationError`, `submitting`, `onTurnstile`, `changeField`, `blurField`, `submit`.
- `submit(event: FormEvent<HTMLFormElement>)` owns validation, focus, Turnstile gate, fetch, 503 mailto fallback, generic error and reset behavior.

- [ ] **Step 1:** Run the existing contact Playwright suite as the characterization baseline.
- [ ] **Step 2:** Implement the hook by moving state and submission logic out of `ContactForm.tsx`; do not change markup yet.
- [ ] **Step 3:** Run the contact Playwright suite and verify it passes.
- [ ] **Step 4:** Commit.

### Task 3: Slim the contact component and verify

**Files:**
- Modify: `src/features/contact/ContactForm.tsx`
- Test: `tests/contact-form.spec.ts`

**Interfaces:**
- Consumes the hook return value and existing `Field`, `StatusMessage`, `Turnstile` components.
- Produces the same form DOM, labels, IDs, live regions and circular action.

- [ ] **Step 1:** Replace inline state/validation/submission with the hook while preserving the exact JSX and layout.
- [ ] **Step 2:** Run contact Playwright, scoped typecheck and scoped lint.
- [ ] **Step 3:** Capture desktop/mobile form evidence and confirm the circular action remains arrow-free.
- [ ] **Step 4:** Run adversarial/interface review for the form scope and fix confirmed findings.
- [ ] **Step 5:** Run the Evidence Gate and commit any review fixes.