import { Delete } from 'lucide-react'
import type { GameMode } from '../api/types'
import { useGame } from './gameStore'

// Turkish F/Q layout without Q, W and X, which are not in the Turkish alphabet.
const LAYOUTS: Record<GameMode, string[][]> = {
  TrToEn: ['QWERTYUIOP'.split(''), 'ASDFGHJKL'.split(''), 'ZXCVBNM'.split('')],
  EnToTr: ['ERTYUIOPĞÜ'.split(''), 'ASDFGHJKLŞİ'.split(''), 'ZCVBNMÖÇ'.split('')],
}

export function OnScreenKeyboard({ mode }: { mode: GameMode }) {
  const input = useGame((s) => s.input)
  const backspace = useGame((s) => s.backspace)

  return (
    <div className="card select-none space-y-1.5 p-2">
      {LAYOUTS[mode].map((row, r) => (
        <div key={r} className="flex justify-center gap-1">
          {row.map((key) => (
            <button
              key={key}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => input(key)}
              className="h-11 min-w-0 flex-1 rounded-lg bg-surface-2 font-display text-base font-semibold shadow-sm active:bg-accent/30 sm:max-w-11"
            >
              {key}
            </button>
          ))}
          {r === LAYOUTS[mode].length - 1 && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={backspace}
              className="flex h-11 flex-[1.5] items-center justify-center rounded-lg bg-surface-2 active:bg-accent/30 sm:max-w-16"
              aria-label="Sil"
            >
              <Delete size={18} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
