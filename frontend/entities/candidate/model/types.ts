export type CandidateStatus =
  | "unassigned"
  | "assigned"
  | "rejected";

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
}
