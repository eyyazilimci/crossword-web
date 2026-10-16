import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { ArrowRight, CalendarDays, CheckCircle2, Play, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { api, ApiError } from '../api/client'
import type { Difficulty, GameMode } from '../api/types'
import { LevelCard } from '../components/LevelCard'
import { toast } from '../components/Toaster'
import { dailyReason, difficultyColor, difficultyHint, difficultyLabel, formatDuration, modeHint, modeLabel, modeShort } from '../lib/labels'

const MODES: GameMode[] = ['TrToEn', 'EnToTr']
const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard', 'Expert']

function usePersistentState<T extends string>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      return (localStorage.getItem(key) as T) || initial
    } catch {
      return initial
    }
  })
  const update = (v: T) => {
    setValue(v)
    try {
      localStorage.setItem(key, v)
    } catch {
      // Storage unavailable; keep the in-memory choice.
    }
  }
  return [value, update] as const
}

export function HomePage() {
  const navigate = useNavigate()
  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: api.dashboard })
  const [mode, setMode] = usePersistentState<GameMode>('mode', 'TrToEn')
  const [difficulty, setDifficulty] = usePersistentState<Difficulty>('difficulty', 'Easy')
  const [starting, setStarting] = useState(false)

  const start = async (action: () => Promise<{ id: string }>) => {
    setStarting(true)
    try {
      const puzzle = await action()
      navigate(`/play/${puzzle.id}`)
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Bulmaca açılamadı', 'bad')
    } finally {
      setStarting(false)
    }
  }

  if (dashboard.isError) {
    return (
      <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
        <div className="text-4xl">🔌</div>
        <h2 className="mt-3 font-display text-xl font-semibold">Sunucuya bağlanılamadı</h2>
        <p className="mt-2 text-sm text-muted">{(dashboard.error as Error).message}</p>
        <button className="btn btn-primary mt-5" onClick={() => dashboard.refetch()}>
          Tekrar dene
        </button>
      </div>
    )
  }

  const data = dashboard.data

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card relative overflow-hidden p-6 sm:p-8"
        >
          <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-accent-2/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent">
              <Sparkles size={14} /> Yeni bulmaca
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Kelimeleri <span className="gradient-text">çaprazla</span>, dili öğren.
            </h1>
            <p className="mt-2 max-w-xl text-muted">
              En sık kullanılan ~2100 İngilizce kelimeden üretilen 21×21 çengel bulmacalar.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {MODES.map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={clsx(
                    'rounded-2xl border p-4 text-left transition-all',
                    mode === m ? 'border-accent bg-accent/10 shadow-lg shadow-accent/10' : 'border-border bg-surface-2 hover:border-accent/50',
                  )}
                >
                  <div className="font-display text-lg font-semibold">{modeLabel[m]}</div>
                  <div className="text-sm text-muted">{modeHint[m]}</div>
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={clsx(
                    'rounded-2xl border p-3 text-left transition-all',
                    difficulty === d ? 'border-accent bg-accent/10' : 'border-border bg-surface-2 hover:border-accent/50',
                  )}
                >
                  <div className="font-semibold">{difficultyLabel[d]}</div>
                  <div className="hidden text-xs text-muted sm:block">{difficultyHint[d]}</div>
                </button>
              ))}
            </div>

            <button
              className="btn btn-primary mt-6 w-full py-3.5 text-base sm:w-auto sm:px-8"
              disabled={starting}
              onClick={() => start(() => api.nextPuzzle(mode, difficulty))}
            >
              <Play size={18} /> Başla
            </button>
          </div>
        </motion.section>

        {data && data.inProgress.length > 0 && (
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">Devam et</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.inProgress.map((g) => (
                <Link key={g.sessionId} to={`/play/${g.puzzleId}`} className="card group p-4 transition-colors hover:border-accent/60">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{modeShort[g.mode]}</span>
                    <span className={clsx('rounded-md border px-1.5 py-0.5 text-[11px] font-semibold', difficultyColor[g.difficulty])}>
                      {difficultyLabel[g.difficulty]}
                    </span>
                    {g.isDaily && <CalendarDays size={14} className="text-gold" />}
                    <ArrowRight size={16} className="ml-auto text-muted transition-transform group-hover:translate-x-1" />
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${g.filledPercent}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted">
                    <span>%{g.filledPercent} dolu</span>
                    <span>{formatDuration(g.elapsedSeconds)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <aside className="space-y-6">
        {data ? <LevelCard profile={data.profile} /> : <div className="card h-56 animate-pulse" />}

        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <CalendarDays size={18} className="text-gold" /> Günün bulmacası
          </h2>
          <p className="mt-1 text-sm text-muted">
            Her gün iki yeni bulmaca. Zorluk son günlük başarına göre ayarlanır: %90 ve üstü bir seviye yukarı, %70 altı bir seviye aşağı.
          </p>
          <div className="mt-4 grid gap-2">
            {MODES.map((m) => {
              const daily = data?.daily.find((d) => d.mode === m)
              return (
                <button
                  key={m}
                  disabled={starting}
                  onClick={() => start(() => api.dailyPuzzle(m))}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-3 text-left transition-colors hover:border-gold/60"
                >
                  <div className="flex-1">
                    <div className="font-semibold">{modeLabel[m]}</div>
                    {daily && (
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                        <span className={clsx('rounded-md border px-1.5 py-0.5 font-semibold', difficultyColor[daily.difficulty])}>
                          {difficultyLabel[daily.difficulty]}
                        </span>
                        {daily.completed
                          ? 'Tamamlandı'
                          : daily.decision?.difficulty === daily.difficulty && dailyReason(daily.decision)}
                      </div>
                    )}
                  </div>
                  {daily?.completed ? <CheckCircle2 size={20} className="text-good" /> : <ArrowRight size={18} className="text-muted" />}
                </button>
              )
            })}
          </div>
        </section>

        {data && (
          <Link to="/library" className="card block p-5 transition-colors hover:border-accent/60">
            <div className="text-sm text-muted">Kütüphanede seni bekleyen</div>
            <div className="font-display text-3xl font-bold">{data.libraryPuzzlesLeft}</div>
            <div className="text-sm text-muted">oynanmamış bulmaca →</div>
          </Link>
        )}
      </aside>
    </div>
  )
}
