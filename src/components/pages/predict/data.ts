export const getScoreColor = (s: number) => s >= 80 ? "#10b981" : s >= 60 ? "#06b6d4" : s >= 40 ? "#f59e0b" : "#ef4444";
export const getRiskColor = (r: number) => r < 25 ? "#10b981" : r < 50 ? "#f59e0b" : "#ef4444";
