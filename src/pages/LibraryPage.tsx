import { useState } from 'react'
import { Link } from 'react-router'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, ChevronLeft, ChevronRight, CircleDashed, Loader2, PlusCircle } from 'lucide-react'
import clsx from 'clsx'
import { api, ApiError } from '../api/client'
import type { Difficulty, GameMode, PlayStatus } from '../api/types'
import { toast } from '../components/Toaster'
import { difficultyColor, difficultyLabel, modeLabel, modeShort } from '../lib/labels'

const PAGE_SIZE = 24

function Filter<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T | undefined
  options: [T | undefined, string][]
  onChange(v: T | undefined): void
}) {
  return (
    <div className="flex rounded-xl bg-surface-2 p-1">
      {options.map(([v, label]) => (
        <button
          key={label}
          onClick={() => onChange(v)}
          className={clsx(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            value === v ? 'bg-surface text-fg shadow' : 'text-muted hover:text-fg',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function LibraryPage() {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<GameMode | undefined>()
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>()
  const [status, setStatus] = useState<PlayStatus | undefined>()
  const [page, setPage] = useState(1)
  const [generating, setGenerating] = useState(false)

  const library = useQuery({
    queryKey: ['library', mode, difficulty, status, page],
    queryFn: () => api.library({ mode, difficulty, status, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  })

  const pages = Math.max(1, Math.ceil((library.data?.totalCount ?? 0) / PAGE_SIZE))
  const change = <T extends string>(setter: (v: T | undefined) => void) => (v: T | undefined) => {
    setter(v)
    setPage(1)
  }

  const generate = async (m: GameMode) => {
    setGenerating(true)
    try {
      const result = await api.generateLibrary(m, 15)
      toast(`${result.puzzlesCreated} yeni bulmaca eklendi.`, 'good')
      queryClient.invalidateQueries({ queryKey: ['library'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Üretilemedi', 'bad')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Kütüphane</h1>
        <p className="text-muted">Önceden üretilmiş bulmacalar. Her kelime en az bir bulmacada yer alıyor.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {library.data?.coverage.map((c) => {
          const pct = Math.round((c.coveredWords / Math.max(1, c.totalWords)) * 100)
          return (
            <div key={c.mode} className="card p-5">
              <div className="flex items-center justify-between">
                <div className="font-display text-lg font-semibold">{modeLabel[c.mode]}</div>
                <button className="btn btn-ghost px-3 py-1.5 text-xs" disabled={generating} onClick={() => generate(c.mode)}>
                  {generating ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />} 15 bulmaca üret
                </button>
              </div>
              <div className="mt-3 flex items-end justify-between text-sm">
                <span className="text-muted">Kelime kapsamı</span>
                <span className="font-semibold tabular-nums">
                  {c.coveredWords} / {c.totalWords} · %{pct}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-linear-to-r from-accent to-accent-2" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-2 text-xs text-muted">{c.puzzleCount} bulmaca</div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Filter<GameMode> value={mode} onChange={change<GameMode>(setMode)} options={[[undefined, 'Tümü'], ['TrToEn', 'TR → EN'], ['EnToTr', 'EN → TR']]} />
        <Filter<Difficulty>
          value={difficulty}
          onChange={change<Difficulty>(setDifficulty)}
          options={[[undefined, 'Tümü'], ['Easy', 'Kolay'], ['Medium', 'Orta'], ['Hard', 'Zor'], ['Expert', 'Uzman']]}
        />
        <Filter<PlayStatus>
          value={status}
          onChange={change<PlayStatus>(setStatus)}
          options={[[undefined, 'Tümü'], ['New', 'Yeni'], ['InProgress', 'Devam eden'], ['Completed', 'Bitti']]}
        />
      </div>

      <div className={clsx('grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', library.isFetching && 'opacity-70')}>
        {library.data?.items.map((item, i) => (
          <Link key={item.id} to={`/play/${item.id}`} className="card group p-4 transition-colors hover:border-accent/60">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-semibold text-muted">#{(page - 1) * PAGE_SIZE + i + 1}</span>
              {item.status === 'Completed' ? (
                <CheckCircle2 size={18} className="text-good" />
              ) : item.status === 'InProgress' ? (
                <CircleDashed size={18} className="text-accent" />
              ) : null}
            </div>
            <div className="mt-2 font-display text-lg font-semibold">{modeShort[item.mode]}</div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className={clsx('rounded-md border px-1.5 py-0.5 font-semibold', difficultyColor[item.difficulty])}>
                {difficultyLabel[item.difficulty]}
              </span>
              <span className="text-muted">
                {item.width}×{item.height} · {item.wordCount} kelime
              </span>
            </div>
            {item.bestScore !== null && <div className="mt-2 text-xs text-muted">En iyi skor: {item.bestScore}</div>}
          </Link>
        ))}
      </div>

      {library.data && library.data.items.length === 0 && (
        <div className="card p-8 text-center text-muted">Bu filtrelere uyan bulmaca yok.</div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button className="btn btn-ghost px-3" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Önceki sayfa">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm tabular-nums text-muted">
            {page} / {pages}
          </span>
          <button className="btn btn-ghost px-3" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} aria-label="Sonraki sayfa">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
