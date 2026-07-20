import { Stage } from "@/entities/job/model/types";

export type CandidateStatus = "unassigned" | "assigned";

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
  enterprise_id: string;
  user_id?: string | null;
  status: CandidateStatus;
  assigned_vacancy_id?: string | null;
  questionnaire: Questionnaire;
  ai_score?: number | null;
  ai_rankings?: VacancyMatchScore[];
  created_at: string;
  updated_at: string;

  // Compatibility fields for existing UI and mock data
  name: string;
  jobId: string;
  stage: Stage;
  source: string;
  appliedDate: string;
  email: string;
  phone: string;
  location: string;
  skills: string[];
  rating: number;
  resumeFileName: string;
  history: HistoryEvent[];
}
