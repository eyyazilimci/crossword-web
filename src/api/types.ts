// Mirrors the backend DTOs (enums are serialized as their C# names).

export type GameMode = 'TrToEn' | 'EnToTr'
export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert'
export type Orientation = 'Across' | 'Down'
export type PartOfSpeech = 'Noun' | 'Verb' | 'Adjective' | 'Adverb' | 'Other' | 'Phrase'
export type SessionStatus = 'InProgress' | 'Completed'
export type PlayStatus = 'New' | 'InProgress' | 'Completed'

export interface Clue {
  id: number
  number: number
  orientation: Orientation
  row: number
  column: number
  length: number
  clue: string
  partOfSpeech: PartOfSpeech
}

export interface Puzzle {
  id: string
  mode: GameMode
  difficulty: Difficulty
  width: number
  height: number
  /** '#' blocked, '.' open; row-major. */
  layout: string
  dailyDate: string | null
  clues: Clue[]
}

export interface PuzzleSummary {
  id: string
  mode: GameMode
  difficulty: Difficulty
  width: number
  height: number
  wordCount: number
}

export interface Session {
  id: string
  puzzleId: string
  status: SessionStatus
  letters: string
  revealedMask: string
  mistakeMask: string
  elapsedSeconds: number
  checksUsed: number
  revealsUsed: number
  score: number
  xpEarned: number
  startedAt: string
  completedAt: string | null
}

export interface Game {
  puzzle: Puzzle
  session: Session
}

export interface Level {
  level: number
  title: string
  totalXp: number
  levelStartXp: number
  nextLevelXp: number
}

export interface Achievement {
  code: string
  title: string
  description: string
  icon: string
  unlockedAt: string | null
}

export interface ScoreBreakdown {
  wordPoints: number
  timeBonus: number
  flawlessBonus: number
  difficultyMultiplier: number
  total: number
}

export interface WordResult {
  number: number
  orientation: Orientation
  clue: string
  answer: string
  correct: boolean
}

export interface Completion {
  score: ScoreBreakdown
  xpEarned: number
  levelBefore: Level
  levelAfter: Level
  currentStreak: number
  newAchievements: Achievement[]
  words: WordResult[]
}

export interface SubmitResult {
  isSolved: boolean
  wrongOrEmptyCells: number
  completion: Completion | null
}

export interface CheckResult {
  wrongCells: number[]
  mistakeMask: string
}

export interface RevealResult {
  revealed: Record<string, string>
  letters: string
  revealedMask: string
}

export interface Profile {
  level: Level
  puzzlesCompleted: number
  currentStreak: number
  longestStreak: number
  lastPlayedOn: string | null
}

/** Why the daily puzzle got its difficulty: based on the previous daily puzzle of the same mode. */
export interface DailyDecision {
  difficulty: Difficulty
  previousDifficulty: Difficulty | null
  /** 0–1, null when the previous daily puzzle was not finished. */
  previousAccuracy: number | null
}

export interface Dashboard {
  profile: Profile
  inProgress: {
    sessionId: string
    puzzleId: string
    mode: GameMode
    difficulty: Difficulty
    isDaily: boolean
    filledPercent: number
    elapsedSeconds: number
    updatedAt: string
  }[]
  daily: {
    mode: GameMode
    puzzleId: string | null
    completed: boolean
    difficulty: Difficulty
    decision: DailyDecision
  }[]
  libraryPuzzlesLeft: number
}

export interface Stats {
  profile: Profile
  modes: { mode: GameMode; puzzlesCompleted: number; wordsSeen: number; wordsLearned: number; totalWords: number }[]
  recentGames: {
    sessionId: string
    puzzleId: string
    mode: GameMode
    difficulty: Difficulty
    score: number
    elapsedSeconds: number
    completedAt: string
  }[]
  weakWords: { english: string; turkish: string; mode: GameMode; correctCount: number; wrongCount: number }[]
  achievements: Achievement[]
}

export interface LibraryItem {
  id: string
  mode: GameMode
  difficulty: Difficulty
  width: number
  height: number
  wordCount: number
  status: PlayStatus
  bestScore: number | null
  createdAt: string
}

export interface Library {
  coverage: { mode: GameMode; totalWords: number; coveredWords: number; puzzleCount: number }[]
  items: LibraryItem[]
  totalCount: number
}

// Grammar quiz

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type QuizKind = 'Daily' | 'Practice'
export type GrammarCategory =
  | 'Tenses'
  | 'Conditionals'
  | 'Subjunctive'
  | 'Modals'
  | 'VerbPatterns'
  | 'PassiveCausative'
  | 'ReportedSpeech'
  | 'RelativeClauses'
  | 'InversionEmphasis'
  | 'Linkers'
  | 'Comparison'
  | 'TagsAgreement'
  | 'ArticlesPrepositions'

export interface QuizQuestion {
  position: number
  questionId: number
  topic: string
  topicTitle: string
  category: GrammarCategory
  level: CefrLevel
  /** The gap is written as "___"; two-gap questions have options like "a / b". */
  prompt: string
  options: string[]
  /** null until answered; the correct option and explanation are revealed only after answering. */
  chosenIndex: number | null
  correctIndex: number | null
  explanation: string | null
}

export interface QuizSession {
  id: string
  kind: QuizKind
  dailyDate: string | null
  topic: string | null
  topicTitle: string | null
  status: SessionStatus
  correctCount: number
  answeredCount: number
  questions: QuizQuestion[]
  startedAt: string
  completedAt: string | null
}

export interface AnswerResult {
  correct: boolean
  correctIndex: number
  explanation: string
  completed: boolean
  correctCount: number
  answeredCount: number
  questionCount: number
}

export interface TopicStats {
  code: string
  title: string
  category: GrammarCategory
  categoryTitle: string
  questionCount: number
  seenCount: number
  correctCount: number
  /** Smoothed accuracy 0–1; 0.5 when the topic has not been played. */
  strength: number
}

export interface QuizOverview {
  today: { sessionId: string | null; completed: boolean; answeredCount: number; correctCount: number; questionCount: number }
  currentStreak: number
  longestStreak: number
  answeredCount: number
  correctCount: number
  targetLevel: CefrLevel
  topics: TopicStats[]
  recent: {
    sessionId: string
    kind: QuizKind
    dailyDate: string | null
    topicTitle: string | null
    correctCount: number
    questionCount: number
    completedAt: string
  }[]
}
