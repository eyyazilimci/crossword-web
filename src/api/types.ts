// Mirrors the backend DTOs (enums are serialized as their C# names).

export type GameMode = 'TrToEn' | 'EnToTr'
export type Difficulty = 'Easy' | 'Medium' | 'Hard'
export type Orientation = 'Across' | 'Down'
export type PartOfSpeech = 'Noun' | 'Verb' | 'Adjective' | 'Adverb' | 'Other'
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
  daily: { mode: GameMode; puzzleId: string | null; completed: boolean }[]
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
