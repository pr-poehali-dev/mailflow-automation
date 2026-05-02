export interface Cohort {
  contact: string;
  email: string;
  ltv: number;
  churn_risk: number;
  best_time: string;
  segment: string;
  score: number;
}

export const COHORTS: Cohort[] = [
  { contact: "Анна Морозова", email: "anna@company.ru", ltv: 84200, churn_risk: 12, best_time: "10:30", segment: "VIP", score: 94 },
  { contact: "Игорь Петров",  email: "igor@biz.ru",     ltv: 67800, churn_risk: 8,  best_time: "09:15", segment: "VIP", score: 91 },
  { contact: "Дмитрий Козлов", email: "d.kozlov@mail.ru", ltv: 42100, churn_risk: 23, best_time: "19:00", segment: "Активный", score: 78 },
  { contact: "Елена Новикова", email: "enov@firm.ru",   ltv: 38500, churn_risk: 15, best_time: "14:30", segment: "Активный", score: 82 },
  { contact: "Сергей Волков", email: "s.volkov@corp.ru", ltv: 29400, churn_risk: 41, best_time: "11:00", segment: "Активный", score: 65 },
  { contact: "Мария Соколова", email: "msok@yandex.ru",  ltv: 12300, churn_risk: 78, best_time: "20:45", segment: "Спящий", score: 32 },
];

export const RETENTION = [100, 87, 74, 65, 58, 52, 48, 45, 43, 41, 40, 39];

export const REVENUE = [
  { month: "Янв", value: 412 },
  { month: "Фев", value: 489 },
  { month: "Мар", value: 567 },
  { month: "Апр", value: 642 },
  { month: "Май", value: 718 },
  { month: "Июн", value: 842 },
];

export const getScoreColor = (s: number) => s >= 80 ? "#10b981" : s >= 60 ? "#06b6d4" : s >= 40 ? "#f59e0b" : "#ef4444";
export const getRiskColor = (r: number) => r < 25 ? "#10b981" : r < 50 ? "#f59e0b" : "#ef4444";
