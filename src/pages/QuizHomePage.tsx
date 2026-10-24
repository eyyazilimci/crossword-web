import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { ArrowRight, CheckCircle2, Flame, GraduationCap, History, Play, Target, Trophy } from 'lucide-react'
import clsx from 'clsx'
import { api, ApiError } from '../api/client'
import type { QuizSession, TopicStats } from '../api/types'
import { toast } from '../components/Toaster'
import { cefrColor, strengthLabel } from '../lib/labels'

function strengthColor(t: TopicStats) {
  if (t.seenCount === 0) return 'bg-border'
  if (t.strength >= 0.8) return 'bg-good'
  if (t.strength >= 0.6) return 'bg-accent-2'
  if (t.strength >= 0.4) return 'bg-gold'
  return 'bg-bad'
}

export function QuizHomePage() {
  const navigate = useNavigate()
  const overview = useQuery({ queryKey: ['quiz-overview'], queryFn: api.quizOverview })
  const [starting, setStarting] = useState(false)

  const start = async (action: () => Promise<QuizSession>) => {
    setStarting(true)
    try {
      const quiz = await action()
      navigate(`/quiz/${quiz.id}`)
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Test açılamadı', 'bad')
    } finally {
      setStarting(false)
    }
  }

  if (overview.isError) {
    return (
      <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
        <div className="text-4xl">🔌</div>
        <h2 className="mt-3 font-display text-xl font-semibold">Sunucuya bağlanılamadı</h2>
        <p className="mt-2 text-sm text-muted">{(overview.error as Error).message}</p>
        <button className="btn btn-primary mt-5" onClick={() => overview.refetch()}>
          Tekrar dene
        </button>
      </div>
    )
  }

  const data = overview.data
  if (!data) return <div className="grid h-[50dvh] place-items-center text-muted">Yükleniyor…</div>

  const { today } = data
  const accuracy = data.answeredCount > 0 ? Math.round((data.correctCount / data.answeredCount) * 100) : null
  const played = data.topics.filter((t) => t.seenCount > 0)
  const weakest = [...played].sort((a, b) => a.strength - b.strength).slice(0, 3)
  const categories = [...new Set(data.topics.map((t) => t.categoryTitle))]

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
              <GraduationCap size={14} /> Günlük 10
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Her gün 10 soru, <span className="gradient-text">zayıf noktana</span> göre.
            </h1>
            <p className="mt-2 max-w-xl text-muted">
              Çoktan seçmeli gramer soruları. Yanlış yaptıkların sonraki günlerde geri gelir, en zayıf konularından daha çok soru çıkar.
            </p>

            {today.completed ? (
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 rounded-2xl border border-good/40 bg-good/10 px-4 py-3 font-semibold">
                  <CheckCircle2 size={20} className="text-good" /> Bugünün testi tamam: {today.correctCount} / {today.questionCount}
                </div>
                <Link to={`/quiz/${today.sessionId}`} className="btn btn-ghost">
                  Cevapları gör <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <button
                className="btn btn-primary mt-6 w-full py-3.5 text-base sm:w-auto sm:px-8"
                disabled={starting}
                onClick={() => start(api.dailyQuiz)}
              >
                <Play size={18} />
                {today.sessionId ? `Devam et (${today.answeredCount} / ${today.questionCount})` : 'Bugünün testine başla'}
              </button>
            )}
          </div>
        </motion.section>

        <section>
          <h2 className="mb-1 font-display text-lg font-semibold">Konular</h2>
          <p className="mb-3 text-sm text-muted">Bir konuya tıkla, o konudan 10 soruluk pratik başlasın.</p>
          <div className="space-y-5">
            {categories.map((category) => (
              <div key={category}>
                {/* Not uppercased: under lang="tr" CSS would turn the English "i" into "İ". */}
                <h3 className="mb-2 text-sm font-semibold text-muted">{category}</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {data.topics
                    .filter((t) => t.categoryTitle === category)
                    .map((t) => (
                      <button
                        key={t.code}
                        disabled={starting || t.questionCount === 0}
                        onClick={() => start(() => api.practiceQuiz(t.code))}
                        className="card group p-3 text-left transition-colors hover:border-accent/60"
                      >
                        <div className="flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{t.title}</span>
                          <ArrowRight size={15} className="text-muted transition-transform group-hover:translate-x-1" />
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                          <div
                            className={clsx('h-full rounded-full', strengthColor(t))}
                            style={{ width: `${t.seenCount === 0 ? 0 : Math.round(t.strength * 100)}%` }}
                          />
                        </div>
                        <div className="mt-1.5 flex justify-between text-xs text-muted">
                          <span>{strengthLabel(t.strength, t.seenCount)}</span>
                          <span className="tabular-nums">
                            {t.seenCount > 0 ? `${t.correctCount} / ${t.seenCount} doğru · ` : ''}
                            {t.questionCount} soru
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="card p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface-2 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <Flame size={14} className="text-orange-400" /> Seri
              </div>
              <div className="mt-1 font-display text-2xl font-semibold">
                {data.currentStreak} <span className="text-sm font-normal text-muted">gün</span>
              </div>
              <div className="text-[11px] text-muted">en uzun {data.longestStreak}</div>
            </div>
            <div className="rounded-xl bg-surface-2 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <Trophy size={14} className="text-gold" /> Başarı
              </div>
              <div className="mt-1 font-display text-2xl font-semibold">{accuracy === null ? '–' : `%${accuracy}`}</div>
              <div className="text-[11px] text-muted">{data.answeredCount} cevap</div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-surface-2 p-3 text-sm">
            <span className="text-muted">Hedef seviye</span>
            <span className={clsx('rounded-md border px-2 py-0.5 text-xs font-semibold', cefrColor[data.targetLevel])}>
              {data.targetLevel}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted">Yeni sorular bu seviyeye yakın seçilir. Bir seviyede %70 başarıya ulaşınca hedef yükselir.</p>
        </section>

        <section className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
            <Target size={18} className="text-bad" /> En zayıf konular
          </h2>
          {weakest.length === 0 ? (
            <p className="text-sm text-muted">Henüz yok. Birkaç test çözünce zorlandığın konular burada görünür.</p>
          ) : (
            <ul className="space-y-2">
              {weakest.map((t) => (
                <li key={t.code}>
                  <button
                    disabled={starting}
                    onClick={() => start(() => api.practiceQuiz(t.code))}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface-2 p-3 text-left text-sm transition-colors hover:border-accent/60"
                  >
                    <span className="flex-1 font-medium">{t.title}</span>
                    <span className="tabular-nums text-muted">
                      {t.correctCount} / {t.seenCount}
                    </span>
                    <ArrowRight size={15} className="text-muted" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
            <History size={18} className="text-accent-2" /> Son testler
          </h2>
          {data.recent.length === 0 ? (
            <p className="text-sm text-muted">Henüz tamamlanmış test yok.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.recent.map((r) => (
                <li key={r.sessionId}>
                  <Link to={`/quiz/${r.sessionId}`} className="flex items-center gap-3 py-2.5 text-sm hover:text-accent">
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {r.kind === 'Daily' ? 'Günlük test' : r.topicTitle}
                    </span>
                    <span className="text-muted">{new Date(r.completedAt).toLocaleDateString('tr-TR')}</span>
                    <span className="font-semibold tabular-nums">
                      {r.correctCount} / {r.questionCount}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </div>
  )
}
