// Core domain types shared across the app

export type Subject = 'maths' | 'english' | 'economics';

export type Tier = 'Rookie' | 'Skilled';

export type SubjectProgress = {
  successPoints: number;
  gritPoints: number;
  tier: Tier;
  seenQuestionIds: string[];
};

export type Question = {
  id: string;
  subject: Subject;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question_text: string;
  options: string[];
  correct_index: number;
  source: string;
  explanation: string;
};

export type Outcome =
  | 'first_try_correct'
  | 'second_try_correct'
  | 'third_try_correct'
  | 'failed_through'
  | 'abandoned';

export type SessionPhase = 'loading' | 'question' | 'summary';

export type SessionState = {
  phase: SessionPhase;
  subject: Subject;
  questionQueue: string[];
  currentIndex: number;
  currentAttempt: 1 | 2 | 3;
  tappedWrongIndices: number[];
  optionRevealed: boolean;
  lastResolution: 'pending' | 'correct' | 'failed-through';
  sessionSuccess: number;
  sessionGrit: number;
  outcomes: Outcome[];
  abandonedCount: number;
  skilledFiredThisSession: boolean;
  endConfirmOpen: boolean;
  skilledModalOpen: boolean;
  startedAt: string;
  lastActivityAt: string;
};
