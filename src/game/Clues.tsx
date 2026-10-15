import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import type { Orientation } from '../api/types'
import { orientationLabel, posLabel } from '../lib/labels'
import { revealInContainer } from '../lib/scroll'
import { activeEntryIndex, useGame } from './gameStore'

/** The current clue, shown above the grid, with previous/next buttons. */
export function ClueBar() {
  const puzzle = useGame((s) => s.puzzle)!
  const entries = useGame((s) => s.entries)
  const links = useGame((s) => s.links)
  const selected = useGame((s) => s.selected)
  const direction = useGame((s) => s.direction)
  const jumpEntry = useGame((s) => s.jumpEntry)

  const index = activeEntryIndex({ links, selected, direction })
  const entry = index === undefined ? undefined : entries[index]

  return (
    <div className="card flex items-center gap-2 p-2">
      <button className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-fg" onClick={() => jumpEntry(-1)} aria-label="Önceki ipucu">
        <ChevronLeft size={20} />
      </button>
      <div className="min-w-0 flex-1 text-center">
        {entry && (
          <>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted">
              {entry.number} · {orientationLabel[entry.orientation]} · {entry.length} harf
            </div>
            <div className="truncate font-display text-lg font-semibold">
              {entry.clue}
              {posLabel[puzzle.mode][entry.partOfSpeech] && (
                <span className="ml-2 text-sm font-normal text-muted">({posLabel[puzzle.mode][entry.partOfSpeech]})</span>
              )}
            </div>
          </>
        )}
      </div>
      <button className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-fg" onClick={() => jumpEntry(1)} aria-label="Sonraki ipucu">
        <ChevronRight size={20} />
      </button>
    </div>
  )
}

function ClueColumn({ orientation }: { orientation: Orientation }) {
  const puzzle = useGame((s) => s.puzzle)!
  const entries = useGame((s) => s.entries)
  const letters = useGame((s) => s.letters)
  const links = useGame((s) => s.links)
  const selected = useGame((s) => s.selected)
  const direction = useGame((s) => s.direction)
  const selectEntry = useGame((s) => s.selectEntry)
  const activeRef = useRef<HTMLButtonElement>(null)

  const active = activeEntryIndex({ links, selected, direction })
  const crossing = orientation === 'Across' ? links[selected]?.across : links[selected]?.down

  useEffect(() => {
    const list = activeRef.current?.closest<HTMLElement>('[data-clue-scroll]') ?? null
    revealInContainer(activeRef.current, list, 40)
  }, [active, crossing])

  return (
    <div>
      <h3 className="sticky top-0 z-10 bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
        {orientationLabel[orientation]}
      </h3>
      <ul className="space-y-0.5 px-1 pb-2">
        {entries.map((entry, i) => {
          if (entry.orientation !== orientation) return null
          const isActive = i === active
          const isCrossing = i === crossing && !isActive
          const filled = entry.cells.every((c) => letters[c])
          return (
            <li key={entry.id}>
              <button
                ref={isActive || isCrossing ? activeRef : undefined}
                onClick={() => selectEntry(i)}
                className={clsx(
                  'flex w-full items-baseline gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors',
                  isActive ? 'bg-accent/20 text-fg' : isCrossing ? 'bg-surface-2' : 'hover:bg-surface-2',
                  filled && !isActive && 'text-muted line-through decoration-muted/40',
                )}
              >
                <span className="w-6 shrink-0 text-right font-semibold tabular-nums text-muted">{entry.number}</span>
                <span className="flex-1">
                  {entry.clue}
                  {posLabel[puzzle.mode][entry.partOfSpeech] && (
                    <span className="ml-1 text-xs text-muted">({posLabel[puzzle.mode][entry.partOfSpeech]})</span>
                  )}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted">{entry.length}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function ClueLists() {
  return (
    <div data-clue-scroll className="card grid max-h-[calc(100dvh-10rem)] grid-cols-1 items-start overflow-y-auto scrollbar-thin sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      <ClueColumn orientation="Across" />
      <ClueColumn orientation="Down" />
    </div>
  )
}
