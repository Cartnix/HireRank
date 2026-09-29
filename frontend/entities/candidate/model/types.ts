export type CandidateStatus =
  | "unassigned"
  | "assigned"
  | "rejected"
  | "pending_hitl"
  | "action_applied";

export interface HistoryEvent {
  date: string;
  action: string;
}
export interface EducationEntry {
  institution: string;
  year_from: string;
  year_to: string;
  dropped_at_year: string | null;
  specialty: string;
  diploma: string;
}

export interface VacancyMatchScore {
  vacancy_id: string;
  vacancy_title: string;
  score: number;
}

export interface Questionnaire {
  surname: string;
  first_name: string;
  patronymic: string;
  gender: string;
  birth_date: string;
  birth_place: string;
  nationality: string;
  citizenship: string;
  education_level: string;
  education: EducationEntry[];
  languages: string;
  academic_degree: string;
  scientific_works: string[];
}

export interface Candidate {
  id: string;
  tenant_id: string;
  user_id?: string | null;
  email: string;
  status: CandidateStatus;
  questionnaire: Questionnaire;
  resume_url?: string | null;
  active_package_id?: string | null;
  assigned_vacancy_id?: string | null;
  created_at: string;
  updated_at: string;
  // Optional presentation fields used by the legacy dashboard mock. API candidates
  // only guarantee the questionnaire and snake_case fields above.
  name?: string;
  jobId?: string;
  source?: string;
  rating?: number;
  stage?: string;
  skills?: string[];
  phone?: string;
  location?: string;
  ai_score?: number | null;
  ai_rankings?: VacancyMatchScore[];
  history?: HistoryEvent[];
  resumeFileName?: string;
  appliedDate?: string;
}
