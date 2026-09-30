export interface TopCandidate {
  id: string;
  name: string;
  position: string;
  stage: string;
  aiScore: number;
  initials: string;
  stageColorClass: string;
}

export const topCandidatesMock: TopCandidate[] = [];
