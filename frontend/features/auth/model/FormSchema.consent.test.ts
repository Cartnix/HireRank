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
  parseCountries,
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
  consent_cross_border: true,
  consent_cross_border_countries: "kz, ru",
});
assert.equal(ok.account_processing, true);
assert.deepEqual(ok.cross_border_countries, ["KZ", "RU"]);
assert.deepEqual(parseCountries("kz;ru  "), ["KZ", "RU"]);

assert.equal(
  LoginFormValues.safeParse({
    email: "a@b.kz",
    password: "password1",
  }).success,
  true,
);

const implicit = implicitLoginConsentPayload();
assert.equal(implicit.account_processing, true);

expectFail(RegisterFormValues, {
  email: "a@b.kz",
  password: "password1",
  repeatPassword: "password1",
  role: "candidate",
  consent_account_processing: false,
  consent_talent_pool: false,
  consent_cross_border: false,
});

expectFail(RegisterFormValues, {
  email: "a@b.kz",
  password: "password1",
  repeatPassword: "password1",
  role: "candidate",
  consent_account_processing: true,
  consent_talent_pool: false,
  consent_cross_border: true,
  consent_cross_border_countries: "",
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

expectFail(ConsentSchema, {
  account_processing: false,
  talent_pool: false,
  cross_border: false,
  cross_border_countries: [],
});

console.log("FormSchema.consent.test.ts: all assertions passed");
