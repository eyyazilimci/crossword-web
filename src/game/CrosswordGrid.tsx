import { useEffect, useMemo, useRef, useState } from 'react'
import { revealInContainer } from '../lib/scroll'
import { activeEntryIndex, useGame } from './gameStore'

const GAP = 2
const MAX_CELL = 40
const MIN_CELL = 16

/** Free-form crossword grid: open cells are tiles, blocked cells are left empty. */
export function CrosswordGrid() {
  const puzzle = useGame((s) => s.puzzle)!
  const letters = useGame((s) => s.letters)
  const numbers = useGame((s) => s.numbers)
  const revealed = useGame((s) => s.revealed)
  const wrong = useGame((s) => s.wrong)
  const selected = useGame((s) => s.selected)
  const direction = useGame((s) => s.direction)
  const links = useGame((s) => s.links)
  const entries = useGame((s) => s.entries)
  const completed = useGame((s) => s.completed)
  const select = useGame((s) => s.select)

  const containerRef = useRef<HTMLDivElement>(null)
  const [cell, setCell] = useState(28)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const resize = () => {
      const byWidth = (el.clientWidth - GAP * (puzzle.width - 1)) / puzzle.width
      const byHeight = (window.innerHeight - 260 - GAP * (puzzle.height - 1)) / puzzle.height
      // On narrow screens the grid may scroll vertically; never shrink below a tappable size.
      const size = window.innerWidth < 768 ? byWidth : Math.min(byWidth, byHeight)
      setCell(Math.max(MIN_CELL, Math.min(MAX_CELL, Math.floor(size))))
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(el)
    window.addEventListener('resize', resize)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', resize)
    }
  }, [puzzle.width, puzzle.height])

  // On small screens the grid scrolls sideways; keep the cursor visible.
  useEffect(() => {
    const el = containerRef.current?.querySelector<HTMLElement>(`[data-cell="${selected}"]`) ?? null
    revealInContainer(el, containerRef.current?.parentElement ?? null)
  }, [selected])

  const activeCells = useMemo(() => {
    const index = activeEntryIndex({ links, selected, direction })
    return new Set(index === undefined ? [] : entries[index].cells)
  }, [links, selected, direction, entries])

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="mx-auto grid select-none"
        style={{
          gridTemplateColumns: `repeat(${puzzle.width}, ${cell}px)`,
          gap: GAP,
          width: puzzle.width * cell + GAP * (puzzle.width - 1),
        }}
        role="grid"
        aria-label="Bulmaca ızgarası"
      >
        {Array.from(puzzle.layout, (ch, i) => {
          if (ch === '#') return <div key={i} style={{ height: cell }} />

          const isSelected = i === selected && !completed
          const inWord = activeCells.has(i) && !completed
          let background = 'var(--cell)'
          if (wrong[i]) background = 'var(--cell-wrong)'
          else if (isSelected) background = 'var(--cell-active)'
          else if (inWord) background = 'var(--cell-word)'
          else if (completed) background = 'var(--cell-revealed)'

          return (
            <div
              key={i}
              data-cell={i}
              role="gridcell"
              onMouseDown={(e) => {
                e.preventDefault()
                select(i)
              }}
              className="relative cursor-pointer rounded-[5px] transition-colors duration-100"
              style={{
                height: cell,
                background,
                boxShadow: `inset 0 0 0 1px var(--cell-border)`,
                color: 'var(--cell-fg)',
              }}
            >
              {numbers[i] !== null && (
                <span
                  className="absolute left-[2px] top-[1px] font-semibold leading-none"
                  style={{ fontSize: Math.max(7, cell * 0.27), color: 'var(--cell-number)' }}
                >
                  {numbers[i]}
                </span>
              )}
              {revealed[i] && (
                <span
                  className="absolute right-0 top-0 h-0 w-0 border-l-transparent border-t-emerald-600"
                  style={{ borderLeftWidth: cell * 0.28, borderTopWidth: cell * 0.28, borderRightWidth: 0, borderBottomWidth: 0 }}
                />
              )}
              <span
                className="absolute inset-0 flex items-center justify-center font-display font-semibold"
                style={{
                  fontSize: cell * 0.56,
                  paddingTop: cell * 0.12,
                  color: wrong[i] ? '#be123c' : revealed[i] ? '#047857' : undefined,
                }}
              >
                {letters[i]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
