export interface Question {
  id: string;
  text: string;
  options: string[];
}

export interface SolutionKey {
  [questionId: string]: number; // index of correct option
}

export interface ExamConfig {
  id: string;
  durationMinutes: number;
  totalMarks: number;
  questions: Question[];
}

export interface ExamResult {
  studentName: string;
  responses: { [questionId: string]: number };
  score: number;
  totalCorrect: number;
  percentage: number;
  timeTakenSeconds: number;
  terminated: boolean;
  terminationReason?: string;
  timestamp: string;
}
