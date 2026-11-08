export interface TopCandidate {
  id: string;
  name: string;
  position: string;
  stage: string;
  rating: number;
  initials: string;
  stageColorClass: string;
  grade?: string;
  skills?: string[];
  isMock?: boolean;
}

export const topCandidatesMock: TopCandidate[] = [];
