import { apiFetch } from "@/shared/api/client";
import { Candidate } from "./types";

interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

interface CandidatesResponse {
  items: Candidate[];
  pagination: Pagination;
}

export function getCandidateFullName(candidate: Candidate): string {
  const { surname, first_name, patronymic } = candidate.questionnaire;
  return [surname, first_name, patronymic].filter(Boolean).join(" ");
}

export async function getCandidates(
  headers?: HeadersInit,
): Promise<CandidatesResponse> {
  return apiFetch<CandidatesResponse>("/candidates/", {
    method: "GET",
    headers,
  });
}

export async function getCandidateById(
  id: string,
  headers?: HeadersInit,
): Promise<Candidate | null> {
  try {
    return await apiFetch<Candidate>(`/candidates/${id}`, {
      method: "GET",
      headers,
    });
  } catch (err) {
    throw err;
  }
}
