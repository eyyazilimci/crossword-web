import type {
  CheckResult,
  Dashboard,
  Difficulty,
  Game,
  GameMode,
  Library,
  PlayStatus,
  PuzzleSummary,
  RevealResult,
  Stats,
  SubmitResult,
} from './types'

const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(BASE + path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ApiError(0, 'Sunucuya ulaşılamadı. Backend çalışıyor mu?')
  }

  if (!response.ok) {
    let message = `İstek başarısız (${response.status})`
    try {
      const problem = await response.json()
      if (problem?.title) message = problem.title
    } catch {
      // Body was not JSON.
    }
    throw new ApiError(response.status, message)
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T)
}

const post = <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) })

export const api = {
  dashboard: () => request<Dashboard>('/dashboard'),
  stats: () => request<Stats>('/stats'),

  library: (filters: { mode?: GameMode; difficulty?: Difficulty; status?: PlayStatus; page: number; pageSize: number }) => {
    const query = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => v !== undefined && query.set(k, String(v)))
    return request<Library>(`/puzzles?${query}`)
  },
  nextPuzzle: (mode: GameMode, difficulty: Difficulty) => post<PuzzleSummary>('/puzzles/next', { mode, difficulty }),
  dailyPuzzle: (mode: GameMode) => post<PuzzleSummary>('/puzzles/daily', { mode }),
  generateLibrary: (mode: GameMode, extraPuzzles: number) =>
    post<{ mode: GameMode; puzzlesCreated: number }>('/puzzles/library', { mode, extraPuzzles }),

  startSession: (puzzleId: string, restart = false) => post<Game>('/sessions', { puzzleId, restart }),

  /** keepalive lets the last autosave finish even while the page is closing. */
  saveProgress: (sessionId: string, letters: string, elapsedSeconds: number) =>
    request<void>(`/sessions/${sessionId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ letters, elapsedSeconds }),
      keepalive: true,
    }),
  check: (sessionId: string, letters: string, elapsedSeconds: number, cells: number[]) =>
    post<CheckResult>(`/sessions/${sessionId}/check`, { letters, elapsedSeconds, cells }),
  reveal: (sessionId: string, letters: string, elapsedSeconds: number, cells: number[]) =>
    post<RevealResult>(`/sessions/${sessionId}/reveal`, { letters, elapsedSeconds, cells }),
  submit: (sessionId: string, letters: string, elapsedSeconds: number) =>
    post<SubmitResult>(`/sessions/${sessionId}/submit`, { letters, elapsedSeconds }),
}
