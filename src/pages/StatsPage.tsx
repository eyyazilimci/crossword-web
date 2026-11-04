import { Link } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Award, BookOpen, History, Target, X } from 'lucide-react'
import clsx from 'clsx'
import { api, ApiError } from '../api/client'
import type { GameMode } from '../api/types'
import { LevelCard } from '../components/LevelCard'
import { toast } from '../components/Toaster'
import { difficultyLabel, formatDuration, modeLabel, modeShort } from '../lib/labels'

export function StatsPage() {
  const stats = useQuery({ queryKey: ['stats'], queryFn: api.stats })
  const data = stats.data
  const queryClient = useQueryClient()
  const remove = useMutation({
    mutationFn: (word: { mode: GameMode; wordId: number; english: string }) => api.removeUnknownWord(word.mode, word.wordId),
    onSuccess: (_, word) => {
      toast(`${word.english} listeden çıkarıldı.`, 'good')
      return queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Kelime çıkarılamadı', 'bad'),
  })

  if (!data) {
    return <div className="grid h-[50dvh] place-items-center text-muted">{stats.isError ? 'Yüklenemedi.' : 'Yükleniyor…'}</div>
  }

  const unlocked = data.achievements.filter((a) => a.unlockedAt).length

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">İstatistikler</h1>

      <div className="grid gap-4 lg:grid-cols-3">
        <LevelCard profile={data.profile} />
        {data.modes.map((m) => {
          const pct = Math.round((m.wordsLearned / Math.max(1, m.totalWords)) * 100)
          return (
            <div key={m.mode} className="card p-5">
              <div className="flex items-center gap-2 text-sm text-muted">
                <BookOpen size={15} /> {modeLabel[m.mode]}
              </div>
              <div className="mt-3 font-display text-4xl font-bold">{m.wordsLearned}</div>
              <div className="text-sm text-muted">öğrenilen kelime · {m.totalWords} içinde</div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-linear-to-r from-accent to-accent-2" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-surface-2 p-2">
                  <div className="text-xs text-muted">Görülen</div>
                  <div className="font-semibold">{m.wordsSeen}</div>
                </div>
                <div className="rounded-lg bg-surface-2 p-2">
                  <div className="text-xs text-muted">Bulmaca</div>
                  <div className="font-semibold">{m.puzzlesCompleted}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-semibold">
          <Award size={20} className="text-gold" /> Rozetler
          <span className="text-sm font-normal text-muted">
            {unlocked} / {data.achievements.length}
          </span>
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.achievements.map((a) => (
            <div
              key={a.code}
              className={clsx('card flex items-center gap-3 p-4', a.unlockedAt ? 'border-gold/40' : 'opacity-50 grayscale')}
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface-2 text-2xl">{a.icon}</div>
              <div className="min-w-0">
                <div className="font-semibold">{a.title}</div>
                <div className="text-xs text-muted">{a.description}</div>
                {a.unlockedAt && (
                  <div className="mt-0.5 text-[11px] text-gold">{new Date(a.unlockedAt).toLocaleDateString('tr-TR')}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
            <Target size={18} className="text-bad" /> Bilinemeyen kelimeler
          </h2>
          {data.weakWords.length === 0 ? (
            <p className="text-sm text-muted">Henüz yok. Bulmaca sonunda seçtiğin kelimeler burada listelenir ve arada yeniden karşına çıkar.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted">
                  <tr>
                    <th className="pb-2 font-medium">İngilizce</th>
                    <th className="pb-2 font-medium">Türkçe</th>
                    <th className="pb-2 font-medium">Mod</th>
                    <th className="pb-2 text-right font-medium">✓ / ✗</th>
                    <th className="pb-2">
                      <span className="sr-only">Listeden çıkar</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.weakWords.map((w) => (
                    <tr key={`${w.wordId}-${w.mode}`} className="border-t border-border">
                      <td className="py-2 font-medium">{w.english}</td>
                      <td className="py-2">{w.turkish}</td>
                      <td className="py-2 text-muted">{modeShort[w.mode]}</td>
                      <td className="py-2 text-right tabular-nums">
                        <span className="text-good">{w.correctCount}</span> / <span className="text-bad">{w.wrongCount}</span>
                      </td>
                      <td className="py-2 pl-2 text-right">
                        <button
                          className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-bad disabled:opacity-50"
                          aria-label={`${w.english} kelimesini listeden çıkar`}
                          title="Listeden çıkar"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate(w)}
                        >
                          <X size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
            <History size={18} className="text-accent-2" /> Son oyunlar
          </h2>
          {data.recentGames.length === 0 ? (
            <p className="text-sm text-muted">Henüz tamamlanmış bulmaca yok.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.recentGames.map((g) => (
                <li key={g.sessionId}>
                  <Link to={`/play/${g.puzzleId}`} className="flex items-center gap-3 py-2.5 text-sm hover:text-accent">
                    <span className="font-semibold">{modeShort[g.mode]}</span>
                    <span className="text-muted">{difficultyLabel[g.difficulty]}</span>
                    <span className="text-muted">{formatDuration(g.elapsedSeconds)}</span>
                    <span className="ml-auto font-semibold tabular-nums">{g.score} puan</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
