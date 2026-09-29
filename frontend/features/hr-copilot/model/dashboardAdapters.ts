import type { Candidate as DashboardCandidate } from "@/entities/candidate";
import type { Job as DashboardJob } from "@/entities/job";
import type { Candidate, Vacancy } from "./types";

const candidateStages: Record<Candidate["status"], string> = {
  new: "Новый",
  assigned: "Назначен",
  review: "Доп. рассмотрение",
  interview: "Интервью",
  rejected: "Отклонён",
};

export function toDashboardCandidate(
  candidate: Candidate,
  vacancy?: Vacancy,
): DashboardCandidate {
  const status: DashboardCandidate["status"] =
    candidate.status === "new"
      ? "unassigned"
      : candidate.status === "rejected"
        ? "rejected"
        : "assigned";

  return {
    id: candidate.id,
    tenant_id: candidate.tenantId,
    email: candidate.email,
    status,
    questionnaire: {
      surname: candidate.name,
      first_name: "",
      patronymic: "",
      gender: "",
      birth_date: "",
      birth_place: "",
      nationality: "",
      citizenship: "",
      education_level: "",
      education: [
        {
          institution: "",
          year_from: "",
          year_to: "",
          dropped_at_year: null,
          specialty: candidate.skills,
          diploma: "",
        },
      ],
      languages: "",
      academic_degree: "",
      scientific_works: [],
    },
    resume_url: /^https?:\/\//i.test(candidate.resumeRef)
      ? candidate.resumeRef
      : null,
    assigned_vacancy_id: candidate.vacancyId ?? candidate.requestedVacancyId,
    created_at: candidate.createdAt,
    updated_at: candidate.createdAt,
    name: candidate.name,
    phone: candidate.phone,
    skills: candidate.skills.split(/[,;]+/).map((skill) => skill.trim()).filter(Boolean),
    stage: candidateStages[candidate.status],
    resumeFileName: candidate.resumeRef,
    location: vacancy?.location,
  };
}

export function toDashboardJob(vacancy: Vacancy): DashboardJob {
  return {
    id: vacancy.id,
    title: vacancy.title,
    department: vacancy.department,
    status: vacancy.open ? "Открыта" : "Закрыта",
    description: vacancy.description,
    requirements: vacancy.requirements ?? [],
    location: vacancy.location,
    employmentType: vacancy.employmentType,
    experience: vacancy.experience,
    salaryMin: vacancy.salaryMin,
    salaryMax: vacancy.salaryMax,
    recruiter: vacancy.recruiter,
  };
}