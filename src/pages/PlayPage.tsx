import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CalendarDays, CheckCheck, Flag, Keyboard, Lightbulb, RotateCcw, Timer } from 'lucide-react'
import clsx from 'clsx'
import { api, ApiError } from '../api/client'
import type { Completion } from '../api/types'
import { activeEntryIndex, isOpenCell, lettersToString, normalizeKey, useGame } from '../game/gameStore'
import { CrosswordGrid } from '../game/CrosswordGrid'
import { ClueBar, ClueLists } from '../game/Clues'
import { OnScreenKeyboard } from '../game/OnScreenKeyboard'
import { CompletionModal } from '../game/CompletionModal'
import { Menu } from '../components/Menu'
import { toast } from '../components/Toaster'
import { difficultyColor, difficultyLabel, formatDuration, modeHint, modeShort } from '../lib/labels'

const AUTOSAVE_DELAY_MS = 1200

export function PlayPage() {
  const { puzzleId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const restart = params.get('restart') === '1'
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const game = useQuery({
    queryKey: ['game', puzzleId, restart],
    queryFn: () => api.startSession(puzzleId, restart),
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  })

  const load = useGame((s) => s.load)
  const puzzle = useGame((s) => s.puzzle)
  const session = useGame((s) => s.session)
  const elapsed = useGame((s) => s.elapsed)
  const completed = useGame((s) => s.completed)
  const version = useGame((s) => s.version)

  const [completion, setCompletion] = useState<Completion | null>(null)
  const [showKeyboard, setShowKeyboard] = useState(() => window.matchMedia('(pointer: coarse)').matches)
  const [busy, setBusy] = useState(false)
  const lastSubmitted = useRef<string>('')

  useEffect(() => {
    if (!game.data) return
    load(game.data)
    setCompletion(null)
    lastSubmitted.current = ''
    // Drop ?restart=1 so a page refresh resumes instead of starting yet another attempt.
    if (restart) setParams({}, { replace: true })
  }, [game.data, load, restart, setParams])

  const ready = puzzle?.id === puzzleId && session !== null

  // Timer: runs while the tab is visible and the puzzle is unsolved.
  useEffect(() => {
    if (!ready || completed) return
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') useGame.getState().tick()
    }, 1000)
    return () => clearInterval(id)
  }, [ready, completed])

  const snapshot = useCallback(() => {
    const s = useGame.getState()
    return { sessionId: s.session!.id, letters: lettersToString(s.letters), elapsed: s.elapsed }
  }, [])

  // Autosave shortly after typing stops, and once more when leaving the page.
  useEffect(() => {
    if (!ready || completed || version === 0) return
    const id = setTimeout(() => {
      const { sessionId, letters, elapsed } = snapshot()
      api.saveProgress(sessionId, letters, elapsed).catch(() => toast('Kaydedilemedi, bağlantını kontrol et.', 'bad'))
    }, AUTOSAVE_DELAY_MS)
    return () => clearTimeout(id)
  }, [ready, completed, version, snapshot])

  useEffect(() => {
    if (!ready) return
    const save = () => {
      if (useGame.getState().completed) return
      const { sessionId, letters, elapsed } = snapshot()
      api.saveProgress(sessionId, letters, elapsed).catch(() => {})
    }
    window.addEventListener('pagehide', save)
    return () => {
      window.removeEventListener('pagehide', save)
      save()
    }
  }, [ready, snapshot])

  const submit = useCallback(
    async (manual: boolean) => {
      if (busy) return
      const { sessionId, letters, elapsed } = snapshot()
      lastSubmitted.current = letters
      setBusy(true)
      try {
        const result = await api.submit(sessionId, letters, elapsed)
        if (result.isSolved && result.completion) {
          useGame.getState().markCompleted()
          setCompletion(result.completion)
          queryClient.invalidateQueries({ queryKey: ['dashboard'] })
          queryClient.invalidateQueries({ queryKey: ['stats'] })
          queryClient.invalidateQueries({ queryKey: ['library'] })
        } else {
          toast(
            manual
              ? `${result.wrongOrEmptyCells} hücre boş ya da hatalı.`
              : `Neredeyse! ${result.wrongOrEmptyCells} harf hatalı. Kontrol menüsünü kullanabilirsin.`,
            'bad',
          )
        }
      } catch (e) {
        toast(e instanceof ApiError ? e.message : 'Gönderilemedi', 'bad')
      } finally {
        setBusy(false)
      }
    },
    [busy, snapshot, queryClient],
  )

  // Hand the grid in automatically once every open cell has a letter.
  useEffect(() => {
    if (!ready || completed || version === 0) return
    const s = useGame.getState()
    const full = s.entries.every((e) => e.cells.every((c) => s.letters[c]))
    if (full && lettersToString(s.letters) !== lastSubmitted.current) submit(false)
  }, [ready, completed, version, submit])

  const check = async (scope: 'cell' | 'word' | 'all') => {
    const s = useGame.getState()
    const entry = activeEntryIndex(s)
    const cells =
      scope === 'cell'
        ? [s.selected]
        : scope === 'word' && entry !== undefined
          ? s.entries[entry].cells
          : s.letters.map((_, i) => i).filter((i) => isOpenCell(s.puzzle!, i))
    const filled = cells.filter((c) => s.letters[c])
    if (filled.length === 0) return toast('Kontrol edilecek harf yok.')

    const { sessionId, letters, elapsed } = snapshot()
    try {
      const result = await api.check(sessionId, letters, elapsed, filled)
      useGame.getState().applyWrong(result.wrongCells)
      toast(
        result.wrongCells.length === 0 ? 'Hepsi doğru! 👏' : `${result.wrongCells.length} hatalı harf işaretlendi.`,
        result.wrongCells.length === 0 ? 'good' : 'bad',
      )
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Kontrol edilemedi', 'bad')
    }
  }

  const reveal = async (scope: 'cell' | 'word') => {
    const s = useGame.getState()
    const entry = activeEntryIndex(s)
    const cells = scope === 'cell' || entry === undefined ? [s.selected] : s.entries[entry].cells
    const { sessionId, letters, elapsed } = snapshot()
    try {
      const result = await api.reveal(sessionId, letters, elapsed, cells)
      useGame.getState().applyReveal(result.letters, result.revealedMask)
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'İpucu alınamadı', 'bad')
    }
  }

  const goNext = async () => {
    if (!puzzle) return
    try {
      const next = await api.nextPuzzle(puzzle.mode, puzzle.difficulty)
      navigate(`/play/${next.id}`)
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Yeni bulmaca alınamadı', 'bad')
    }
  }

  // Keyboard controls.
  useEffect(() => {
    if (!ready || completion) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const g = useGame.getState()
      switch (e.key) {
        case 'ArrowUp':
          g.move(-1, 0)
          break
        case 'ArrowDown':
          g.move(1, 0)
          break
        case 'ArrowLeft':
          g.move(0, -1)
          break
        case 'ArrowRight':
          g.move(0, 1)
          break
        case 'Tab':
          g.jumpEntry(e.shiftKey ? -1 : 1)
          break
        case 'Enter':
          g.jumpEntry(1)
          break
        case ' ':
          g.toggleDirection()
          break
        case 'Backspace':
        case 'Delete':
          g.backspace()
          break
        default: {
          const letter = g.puzzle ? normalizeKey(e.key, g.puzzle.mode) : null
          if (!letter) return
          g.input(letter)
        }
      }
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ready, completion])

  if (game.isError) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="font-semibold">Bulmaca açılamadı</p>
        <p className="mt-1 text-sm text-muted">{(game.error as Error).message}</p>
        <Link to="/" className="btn btn-primary mt-5">
          Ana sayfaya dön
        </Link>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="grid h-[60dvh] place-items-center text-muted">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          Bulmaca hazırlanıyor…
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/" className="btn btn-ghost px-3" aria-label="Geri">
          <ArrowLeft size={16} />
        </Link>
        <span className="rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
          {modeShort[puzzle.mode]}
        </span>
        <span className={clsx('rounded-lg border px-2.5 py-1 text-xs font-semibold', difficultyColor[puzzle.difficulty])}>
          {difficultyLabel[puzzle.difficulty]}
        </span>
        {puzzle.dailyDate && (
          <span className="flex items-center gap-1 rounded-lg border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs font-semibold text-gold">
            <CalendarDays size={13} /> Günün bulmacası
          </span>
        )}
        <span className="hidden text-sm text-muted md:inline">{modeHint[puzzle.mode]}</span>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-1.5 rounded-xl bg-surface-2 px-3 py-2 font-display text-sm font-semibold tabular-nums">
            <Timer size={15} className="text-muted" />
            {formatDuration(elapsed)}
          </div>
          {!completed && (
            <>
              <Menu
                label="Kontrol"
                icon={<CheckCheck size={16} />}
                items={[
                  { label: 'Harfi kontrol et', onSelect: () => check('cell') },
                  { label: 'Kelimeyi kontrol et', onSelect: () => check('word') },
                  { label: 'Tüm bulmacayı kontrol et', hint: 'Kusursuz bonusunu kaybettirir', onSelect: () => check('all') },
                ]}
              />
              <Menu
                label="İpucu"
                icon={<Lightbulb size={16} />}
                items={[
                  { label: 'Harfi aç', hint: 'O kelimenin puanı gider', onSelect: () => reveal('cell') },
                  { label: 'Kelimeyi aç', hint: 'Kelime "tekrar" listesine girer', onSelect: () => reveal('word') },
                ]}
              />
              <button
                className={clsx('btn btn-ghost px-3', showKeyboard && 'border-accent')}
                onClick={() => setShowKeyboard((v) => !v)}
                aria-label="Ekran klavyesi"
              >
                <Keyboard size={16} />
              </button>
              <button className="btn btn-primary" disabled={busy} onClick={() => submit(true)}>
                <Flag size={16} /> <span className="hidden sm:inline">Bitir</span>
              </button>
            </>
          )}
        </div>
      </div>

      {completed && !completion && (
        <div className="card flex flex-wrap items-center gap-3 border-good/40 p-4">
          <span className="text-2xl">✅</span>
          <div className="flex-1">
            <div className="font-semibold">Bu bulmacayı tamamladın</div>
            <div className="text-sm text-muted">
              Skor {session.score} · {session.xpEarned} XP · {formatDuration(session.elapsedSeconds)}
            </div>
          </div>
          <Link to={`/play/${puzzle.id}?restart=1`} className="btn btn-ghost">
            <RotateCcw size={16} /> Tekrar oyna
          </Link>
          <button className="btn btn-primary" onClick={goNext}>
            Sonraki bulmaca
          </button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="min-w-0 space-y-3">
          {!completed && <ClueBar />}
          <div className="card overflow-x-auto p-3 sm:p-4">
            <CrosswordGrid />
          </div>
          {showKeyboard && !completed && <OnScreenKeyboard mode={puzzle.mode} />}
          <p className="hidden text-center text-xs text-muted lg:block">
            Yön tuşları: hareket · Boşluk: yön değiştir · Tab / Enter: sonraki kelime · Backspace: sil
          </p>
        </div>
        <ClueLists />
      </div>

      {completion && (
        <CompletionModal completion={completion} elapsed={elapsed} onNext={goNext} onHome={() => navigate('/')} />
      )}
    </div>
  )
}
