import { create } from 'zustand'
import type { Clue, Game, GameMode, Orientation, Puzzle, Session } from '../api/types'

export interface Entry extends Clue {
  cells: number[]
}

interface CellLinks {
  across?: number
  down?: number
}

interface GameState {
  puzzle: Puzzle | null
  session: Session | null
  entries: Entry[]
  /** For every cell, the across/down entry it belongs to (index into `entries`). */
  links: CellLinks[]
  /** Clue number shown in the corner of a cell, if any. */
  numbers: (number | null)[]
  letters: string[]
  revealed: boolean[]
  /** Cells the last check found wrong; cleared as soon as the cell is edited. */
  wrong: boolean[]
  selected: number
  direction: Orientation
  elapsed: number
  completed: boolean
  /** Bumped on every letter change so autosave knows when to run. */
  version: number
  /** Cell typed into most recently; the Turkish-letter key converts it. Cleared when the cursor is moved by hand. */
  lastTyped: number | null

  load(game: Game): void
  select(index: number): void
  selectEntry(entryIndex: number): void
  toggleDirection(): void
  input(letter: string): void
  backspace(): void
  convertLastLetter(): void
  move(dRow: number, dCol: number): void
  jumpEntry(delta: 1 | -1): void
  tick(): void
  applyReveal(letters: string, revealedMask: string): void
  applyWrong(cells: number[]): void
  markCompleted(): void
}

export const isOpenCell = (puzzle: Puzzle, index: number) => puzzle.layout[index] !== '#'

/** Space toggles a letter with its Turkish counterpart, so no Turkish keyboard is needed. */
const TURKISH_TOGGLE: Record<string, string> = {
  C: 'Ç', Ç: 'C',
  G: 'Ğ', Ğ: 'G',
  İ: 'I', I: 'İ',
  O: 'Ö', Ö: 'O',
  S: 'Ş', Ş: 'S',
  U: 'Ü', Ü: 'U',
}

export function lettersToString(letters: string[]) {
  return letters.map((l) => l || '.').join('')
}

/** Upper-cases a typed key for the answer language and rejects keys outside its alphabet. */
export function normalizeKey(key: string, mode: GameMode): string | null {
  if (key.length !== 1) return null
  if (mode === 'TrToEn') {
    const upper = key.toLocaleUpperCase('en-US')
    return /^[A-Z]$/.test(upper) ? upper : null
  }
  const upper = key.toLocaleUpperCase('tr-TR')
  return /^[ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ]$/.test(upper) ? upper : null
}

function buildEntries(puzzle: Puzzle): { entries: Entry[]; links: CellLinks[]; numbers: (number | null)[] } {
  const size = puzzle.width * puzzle.height
  const links: CellLinks[] = Array.from({ length: size }, () => ({}))
  const numbers: (number | null)[] = Array(size).fill(null)

  const entries = puzzle.clues.map((clue, entryIndex) => {
    const cells = Array.from({ length: clue.length }, (_, i) =>
      clue.orientation === 'Across'
        ? clue.row * puzzle.width + clue.column + i
        : (clue.row + i) * puzzle.width + clue.column,
    )
    cells.forEach((c) => {
      if (clue.orientation === 'Across') links[c].across = entryIndex
      else links[c].down = entryIndex
    })
    numbers[cells[0]] = clue.number
    return { ...clue, cells }
  })

  return { entries, links, numbers }
}

export function activeEntryIndex(state: Pick<GameState, 'links' | 'selected' | 'direction'>): number | undefined {
  const link = state.links[state.selected]
  if (!link) return undefined
  return state.direction === 'Across' ? (link.across ?? link.down) : (link.down ?? link.across)
}

export const useGame = create<GameState>((set, get) => ({
  puzzle: null,
  session: null,
  entries: [],
  links: [],
  numbers: [],
  letters: [],
  revealed: [],
  wrong: [],
  selected: 0,
  direction: 'Across',
  elapsed: 0,
  completed: false,
  version: 0,
  lastTyped: null,

  load({ puzzle, session }) {
    const { entries, links, numbers } = buildEntries(puzzle)
    const letters = Array.from(session.letters, (ch) => (ch === '.' ? '' : ch))
    const revealed = Array.from(session.revealedMask, (ch) => ch === '1')
    const firstEntry = entries[0]
    // Start on the first empty cell so resuming lands where the player left off.
    const firstEmpty = entries.flatMap((e) => e.cells).find((c) => !letters[c])
    set({
      puzzle,
      session,
      entries,
      links,
      numbers,
      letters,
      revealed,
      wrong: Array(letters.length).fill(false),
      selected: firstEmpty ?? firstEntry?.cells[0] ?? 0,
      direction: firstEmpty !== undefined && links[firstEmpty].across === undefined ? 'Down' : 'Across',
      elapsed: session.elapsedSeconds,
      completed: session.status === 'Completed',
      version: 0,
      lastTyped: null,
    })
  },

  select(index) {
    const { puzzle, selected, direction, links } = get()
    if (!puzzle || !isOpenCell(puzzle, index)) return
    const link = links[index]
    if (index === selected) {
      if (link.across !== undefined && link.down !== undefined)
        set({ direction: direction === 'Across' ? 'Down' : 'Across' })
      return
    }
    const hasCurrent = direction === 'Across' ? link.across !== undefined : link.down !== undefined
    set({ selected: index, direction: hasCurrent ? direction : direction === 'Across' ? 'Down' : 'Across', lastTyped: null })
  },

  selectEntry(entryIndex) {
    const { entries, letters } = get()
    const entry = entries[entryIndex]
    if (!entry) return
    const target = entry.cells.find((c) => !letters[c]) ?? entry.cells[0]
    set({ selected: target, direction: entry.orientation, lastTyped: null })
  },

  toggleDirection() {
    const { links, selected, direction } = get()
    const link = links[selected]
    if (link?.across !== undefined && link?.down !== undefined)
      set({ direction: direction === 'Across' ? 'Down' : 'Across' })
  },

  input(letter) {
    const state = get()
    if (state.completed) return
    const entryIndex = activeEntryIndex(state)
    const letters = [...state.letters]
    const wrong = [...state.wrong]
    let version = state.version
    if (!state.revealed[state.selected] && letters[state.selected] !== letter) {
      letters[state.selected] = letter
      wrong[state.selected] = false
      version++
    }

    let selected = state.selected
    if (entryIndex !== undefined) {
      const cells = state.entries[entryIndex].cells
      const pos = cells.indexOf(state.selected)
      if (pos < cells.length - 1) selected = cells[pos + 1]
    }
    set({ letters, wrong, selected, version, lastTyped: state.selected })
  },

  convertLastLetter() {
    const state = get()
    if (state.completed) return
    const target = state.lastTyped ?? state.selected
    const current = state.letters[target]
    const converted = current ? TURKISH_TOGGLE[current] : undefined
    if (!converted || state.revealed[target]) return
    const letters = [...state.letters]
    const wrong = [...state.wrong]
    letters[target] = converted
    wrong[target] = false
    set({ letters, wrong, version: state.version + 1 })
  },

  backspace() {
    const state = get()
    if (state.completed) return
    const letters = [...state.letters]
    const wrong = [...state.wrong]
    let selected = state.selected

    if (letters[selected] && !state.revealed[selected]) {
      letters[selected] = ''
      wrong[selected] = false
    } else {
      const entryIndex = activeEntryIndex(state)
      if (entryIndex !== undefined) {
        const cells = state.entries[entryIndex].cells
        const pos = cells.indexOf(selected)
        if (pos > 0) {
          selected = cells[pos - 1]
          if (!state.revealed[selected]) {
            letters[selected] = ''
            wrong[selected] = false
          }
        }
      }
    }
    set({ letters, wrong, selected, version: state.version + 1, lastTyped: null })
  },

  move(dRow, dCol) {
    const { puzzle, selected, direction, links } = get()
    if (!puzzle) return
    const wanted: Orientation = dCol !== 0 ? 'Across' : 'Down'
    const link = links[selected]
    // First press of a perpendicular arrow just turns the cursor, like most crossword apps.
    if (wanted !== direction && (wanted === 'Across' ? link.across : link.down) !== undefined) {
      set({ direction: wanted })
      return
    }

    let row = Math.floor(selected / puzzle.width)
    let col = selected % puzzle.width
    for (;;) {
      row += dRow
      col += dCol
      if (row < 0 || col < 0 || row >= puzzle.height || col >= puzzle.width) return
      const index = row * puzzle.width + col
      if (isOpenCell(puzzle, index)) {
        const next = links[index]
        const keep = wanted === 'Across' ? next.across !== undefined : next.down !== undefined
        set({ selected: index, direction: keep ? wanted : wanted === 'Across' ? 'Down' : 'Across', lastTyped: null })
        return
      }
    }
  },

  jumpEntry(delta) {
    const state = get()
    const current = activeEntryIndex(state) ?? 0
    const n = state.entries.length
    state.selectEntry((current + delta + n) % n)
  },

  tick() {
    if (!get().completed) set((s) => ({ elapsed: s.elapsed + 1 }))
  },

  applyReveal(lettersString, revealedMask) {
    set((s) => ({
      letters: Array.from(lettersString, (ch) => (ch === '.' ? '' : ch)),
      revealed: Array.from(revealedMask, (ch) => ch === '1'),
      wrong: s.wrong.map((w, i) => w && revealedMask[i] !== '1'),
      version: s.version + 1,
    }))
  },

  applyWrong(cells) {
    set((s) => {
      const wrong = [...s.wrong]
      cells.forEach((c) => (wrong[c] = true))
      return { wrong }
    })
  },

  markCompleted() {
    set({ completed: true })
  },
}))
