import type { DashboardPageViewProps, DashboardStats } from "@/views/dashboard";
import { statsMock } from "@/widgets/dashboard-stats/model/dashboard-stats.mock";

type CandidateMock = DashboardPageViewProps["candidateById"][string];

const todaysInterviewsMock: DashboardPageViewProps["todaysInterviews"] = [
  {
    id: "1",
    candidateId: "c1",
    type: "Очно",
    startHour: 10,
    duration: 1,
    interviewer: "Анна Петрова",
    day: 0,
  },
  {
    id: "2",
    candidateId: "c2",
    type: "Звонок",
    startHour: 11,
    duration: 0.5,
    interviewer: "Игорь Соколов",
    day: 0,
  },
  {
    id: "3",
    candidateId: "c3",
    type: "Видео",
    startHour: 13,
    duration: 1,
    interviewer: "Мария Ким",
    day: 0,
  },
];

const ENTERPRISE_ID = "550e8400-e29b-41d4-a716-446655440000";

interface CandidateSeed {
  id: string;
  jobId: string;
  vacancyTitle: string;
  surname: string;
  firstName: string;
  gender: string;
  nationality: string;
  birthDate: string;
  city: string;
  languages: string;
  aiScore: number;
  appliedDate: string; // YYYY-MM-DD
  source: string;
  email: string;
  phone: string;
  skills: string[];
  rating: number;
  resumeFileName: string;
}

const createCandidate = (s: CandidateSeed): CandidateMock => {
  const timestamp = `${s.appliedDate}T00:00:00.000Z`;

  return {
    id: s.id,
    enterprise_id: ENTERPRISE_ID,
    user_id: null,
    status: "assigned",
    assigned_vacancy_id: s.jobId,
    questionnaire: {
      surname: s.surname,
      first_name: s.firstName,
      patronymic: "",
      gender: s.gender,
      birth_date: s.birthDate,
      birth_place: s.city,
      nationality: s.nationality,
      citizenship: "Россия",
      education_level: "высшее",
      education: [],
      languages: s.languages,
      academic_degree: "",
      scientific_works: [],
    },
    ai_score: s.aiScore,
    ai_rankings: [
      { vacancy_id: s.jobId, vacancy_title: s.vacancyTitle, score: s.aiScore },
    ],
    created_at: timestamp,
    updated_at: timestamp,
    name: `${s.firstName} ${s.surname}`,
    jobId: s.jobId,
    stage: "Интервью",
    source: s.source,
    appliedDate: s.appliedDate,
    email: s.email,
    phone: s.phone,
    location: s.city,
    skills: s.skills,
    rating: s.rating,
    resumeFileName: s.resumeFileName,
    history: [],
  };
};

const candidateByIdMock: DashboardPageViewProps["candidateById"] = {
  c1: createCandidate({
    id: "c1",
    jobId: "j1",
    vacancyTitle: "Frontend Developer",
    surname: "Иванов",
    firstName: "Алексей",
    gender: "мужской",
    nationality: "русский",
    birthDate: "1995-03-15",
    city: "Москва",
    languages: "русский (родной), английский (B2)",
    aiScore: 7.4,
    appliedDate: "2025-01-10",
    source: "HeadHunter",
    email: "alexey.ivanov@example.com",
    phone: "+7 900 000-00-01",
    skills: ["React", "TypeScript"],
    rating: 4,
    resumeFileName: "ivanov_resume.pdf",
  }),
  c2: createCandidate({
    id: "c2",
    jobId: "j2",
    vacancyTitle: "Product Designer",
    surname: "Кузнецова",
    firstName: "Марина",
    gender: "женский",
    nationality: "русская",
    birthDate: "1994-09-30",
    city: "Санкт-Петербург",
    languages: "русский (родной), английский (B2)",
    aiScore: 8.1,
    appliedDate: "2025-01-12",
    source: "LinkedIn",
    email: "marina.kuznetsova@example.com",
    phone: "+7 900 000-00-02",
    skills: ["Figma", "UX Research"],
    rating: 5,
    resumeFileName: "kuznetsova_resume.pdf",
  }),
  c3: createCandidate({
    id: "c3",
    jobId: "j3",
    vacancyTitle: "Backend Developer",
    surname: "Соловьёв",
    firstName: "Дмитрий",
    gender: "мужской",
    nationality: "русский",
    birthDate: "1993-06-07",
    city: "Москва",
    languages: "русский (родной), английский (B1)",
    aiScore: 7.1,
    appliedDate: "2025-01-14",
    source: "Рекомендация",
    email: "dmitry.solovyov@example.com",
    phone: "+7 900 000-00-03",
    skills: ["Node.js", "PostgreSQL"],
    rating: 4,
    resumeFileName: "solovyov_resume.pdf",
  }),
};

type JobMock = DashboardPageViewProps["jobById"][string];

const createJob = (id: string, title: string, department: string): JobMock => ({
  id,
  title,
  department,
  status: "draft",
  description: "",
  requirements: [],
});

const jobByIdMock: DashboardPageViewProps["jobById"] = {
  j1: createJob("j1", "Frontend Developer", "Разработка"),
  j2: createJob("j2", "Product Designer", "Дизайн"),
  j3: createJob("j3", "Backend Developer", "Разработка"),
};


const maxPipelineMock = 20;

const pipelineCountsMock: DashboardPageViewProps["pipelineCounts"] = [
  { stage: "Новый", count: 15 },
  { stage: "Интервью", count: 12 },
  { stage: "Оффер", count: 5 },
];

const currentDateMock: DashboardPageViewProps["currentDate"] = {
  greeting: "Добрый день",
  weekDay: "Понедельник",
  day: "10",
  month: "Января",
  year: 2025,
  hours: "14",
  minutes: "32",
};

export const dashboardMock = {
  currentDate: currentDateMock,
  ...statsMock,
  maxPipeline: maxPipelineMock,
  pipelineCounts: pipelineCountsMock,
  todaysInterviews: todaysInterviewsMock,
  candidateById: candidateByIdMock,
  jobById: jobByIdMock,
} satisfies DashboardPageViewProps;
