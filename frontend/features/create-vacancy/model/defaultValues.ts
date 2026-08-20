import type { JobFormValues } from "./JobSchema";

export const jobFormDefaults: JobFormValues = {
  title: "",
  status: "draft",
  department: "",
  description: "",
  requirements: "",
};