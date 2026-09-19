import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { zodToJsonSchema } from "zod-to-json-schema";

import {
  ConsentSchema,
  LoginFormValues,
  RegisterFormValues,
} from "../features/auth/model/FormSchema";

const outputPath = resolve(
  process.cwd(),
  "../contracts/generated/frontend/schemas.json",
);

const schemas = {
  ConsentSchema: zodToJsonSchema(ConsentSchema, "ConsentSchema"),
  LoginFormValues: zodToJsonSchema(LoginFormValues, "LoginFormValues"),
  RegisterFormValues: zodToJsonSchema(RegisterFormValues, "RegisterFormValues"),
};

async function main(): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(schemas, null, 2)}\n`, "utf8");
}

void main();