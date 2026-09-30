import fixture from "../../../../backend/app/dev/fixtures.json";
import { CopilotStateSchema } from "./types";
export const testState = () => CopilotStateSchema.parse(structuredClone(fixture));
