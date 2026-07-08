import { Stage } from "@/entities/job/model/types";

export interface HistoryEvent {
  date: string;
  action: string;
}

export interface Candidate {
  id: string;
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
