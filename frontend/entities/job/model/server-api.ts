import { serverApiFetch } from "@/shared/api/server-client";
import { Job } from "./types";

type PaginatedResponse<T> = {
  items: T[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
};

export async function getServerVacancies(): Promise<Job[]> {
  const res = await serverApiFetch<PaginatedResponse<Job>>("/vacancies/", {
    method: "GET",
  });
  return res.items;
}
