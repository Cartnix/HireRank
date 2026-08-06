/**
 * TDD: register requires explicit consent; login does not use checkboxes.
 * Run: npx tsx features/auth/model/FormSchema.consent.test.ts
 */
import assert from "node:assert/strict";
import {
  ConsentSchema,
  LoginFormValues,
  RegisterFormValues,
  REQUIRED_CONSENT_MSG,
  hasRequiredConsent,
  implicitLoginConsentPayload,
  toConsentPayload,
} from "./FormSchema.ts";

function expectFail(
  schema: { safeParse: (v: unknown) => { success: boolean } },
  value: unknown,
) {
  const r = schema.safeParse(value);
  assert.equal(
    r.success,
    false,
    `expected validation failure for ${JSON.stringify(value)}`,
  );
}

// --- hasRequiredConsent ---
assert.equal(
  hasRequiredConsent({
    consent_account_processing: false,
    consent_talent_pool: false,
    consent_cross_border: false,
  }),
  false,
);

assert.equal(
  hasRequiredConsent({
    consent_account_processing: true,
    consent_talent_pool: false,
    consent_cross_border: false,
  }),
  true,
);

// --- toConsentPayload must throw without mandatory tick ---
assert.throws(
  () =>
    toConsentPayload({
      consent_account_processing: false,
      consent_talent_pool: true,
      consent_cross_border: false,
    }),
  (err: unknown) => err instanceof Error && err.message === REQUIRED_CONSENT_MSG,
);

const ok = toConsentPayload({
  consent_account_processing: true,
  consent_talent_pool: false,
  consent_cross_border: false,
});
assert.equal(ok.account_processing, true);

// --- Login: email + password only (implicit consent via UI disclaimer) ---
assert.equal(
  LoginFormValues.safeParse({
    email: "a@b.kz",
    password: "password1",
  }).success,
  true,
);

assert.equal(
  LoginFormValues.safeParse({
    email: "a@b.kz",
    password: "password1",
    consent_account_processing: false,
  }).success,
  true,
);

expectFail(LoginFormValues, {
  email: "not-an-email",
  password: "password1",
});

const implicit = implicitLoginConsentPayload();
assert.equal(implicit.account_processing, true);
assert.equal(implicit.talent_pool, false);
assert.equal(implicit.cross_border, false);

// --- Register schema rejects unchecked consent ---
expectFail(RegisterFormValues, {
  email: "a@b.kz",
  password: "password1",
  repeatPassword: "password1",
  role: "candidate",
  consent_account_processing: false,
  consent_talent_pool: false,
  consent_cross_border: false,
});

assert.equal(
  RegisterFormValues.safeParse({
    email: "a@b.kz",
    password: "password1",
    repeatPassword: "password1",
    role: "candidate",
    consent_account_processing: true,
    consent_talent_pool: false,
    consent_cross_border: false,
  }).success,
  true,
);

// --- ConsentSchema literal true ---
expectFail(ConsentSchema, {
  account_processing: false,
  talent_pool: false,
  cross_border: false,
  cross_border_countries: [],
});

console.log("FormSchema.consent.test.ts: all assertions passed");
