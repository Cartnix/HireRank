import type { Candidate } from "./types";
import { candidateDetail, listCandidateViews } from "@/shared/api/ats";
export function getCandidateFullName(candidate: Candidate): string {
  return candidate.name || [candidate.questionnaire.surname, candidate.questionnaire.first_name, candidate.questionnaire.patronymic].filter(Boolean).join(" ");
}
export async function getCandidates(headers?: HeadersInit) {
  const items = await listCandidateViews(headers);
  return { items, pagination: { page: 1, page_size: items.length, total: items.length, total_pages: items.length ? 1 : 0 } };
}
export const getCandidateById = candidateDetail;
