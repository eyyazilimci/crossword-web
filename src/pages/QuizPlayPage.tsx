import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import confetti from 'canvas-confetti'
import { ArrowLeft, ArrowRight, Check, Flag, Home, RotateCcw, X } from 'lucide-react'
import clsx from 'clsx'
import { api, ApiError } from '../api/client'
import type { QuizQuestion, QuizSession } from '../api/types'
import { toast } from '../components/Toaster'
import { cefrColor, optionLetters } from '../lib/labels'

/** Marks the gap in a prompt; matches the backend question bank. */
const BLANK = '___'

/** The sentence with its gaps; once answered the gaps show the correct option. */
function Prompt({ question }: { question: QuizQuestion }) {
  const parts = question.prompt.split(BLANK)
  const fill = question.correctIndex === null ? null : question.options[question.correctIndex].split(' / ')
  return (
    <p className="font-display text-xl leading-relaxed sm:text-2xl">
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <span
              className={clsx(
                'mx-1 inline-block min-w-16 rounded-md border-b-2 px-2 text-center',
                fill ? 'border-good bg-good/15 font-semibold text-good' : 'border-accent bg-accent/10 text-transparent',
              )}
            >
              {fill ? fill[i] : '___'}
            </span>
          )}
        </span>
      ))}
    </p>
  )
}

function ProgressDots({ questions, position, onSelect }: { questions: QuizQuestion[]; position: number; onSelect(i: number): void }) {
  return (
    <div className="flex gap-1.5">
      {questions.map((q, i) => {
        const answered = q.chosenIndex !== null
        const correct = answered && q.chosenIndex === q.correctIndex
        return (
          <button
            key={q.position}
            onClick={() => onSelect(i)}
            aria-label={`Soru ${i + 1}`}
            className={clsx(
              'h-2 flex-1 rounded-full transition-all',
              answered ? (correct ? 'bg-good' : 'bg-bad') : 'bg-surface-2',
              i === position && 'ring-2 ring-accent ring-offset-2 ring-offset-bg',
            )}
          />
        )
      })}
    </div>
  )
}

function Results({ quiz, onReview, onPractice }: { quiz: QuizSession; onReview(i: number): void; onPractice(topic: string): void }) {
  const total = quiz.questions.length
  const missed = quiz.questions.filter((q) => q.chosenIndex !== q.correctIndex)
  const byTopic = Object.values(
    quiz.questions.reduce<Record<string, { title: string; topic: string; correct: number; total: number }>>((acc, q) => {
      const t = (acc[q.topic] ??= { title: q.topicTitle, topic: q.topic, correct: 0, total: 0 })
      t.total++
      if (q.chosenIndex === q.correctIndex) t.correct++
      return acc
    }, {}),
  ).sort((a, b) => a.correct / a.total - b.correct / b.total)
  const weakest = byTopic.find((t) => t.correct < t.total)

  useEffect(() => {
    if (quiz.correctCount / total >= 0.8) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.35 }, colors: ['#8b5cf6', '#06b6d4', '#f59e0b', '#22c55e'] })
    }
  }, [quiz.correctCount, total])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl space-y-6">
      <div className="card p-6 text-center">
        <div className="text-4xl">{quiz.correctCount === total ? '🏆' : quiz.correctCount / total >= 0.7 ? '🎉' : '💪'}</div>
        <h1 className="mt-2 font-display text-2xl font-bold">{quiz.kind === 'Daily' ? 'Günün testi bitti!' : `${quiz.topicTitle} pratiği bitti!`}</h1>
        <div className="mt-4 font-display text-6xl font-bold gradient-text">
          {quiz.correctCount} / {total}
        </div>
        <div className="text-xs uppercase tracking-widest text-muted">doğru</div>
        <p className="mt-3 text-sm text-muted">Yanlış yaptığın sorular sonraki günlerde tekrar karşına çıkacak.</p>
      </div>

      <section className="card p-5">
        <h2 className="mb-3 font-display text-lg font-semibold">Konulara göre</h2>
        <ul className="space-y-2">
          {byTopic.map((t) => (
            <li key={t.topic} className="flex items-center gap-3 text-sm">
              <span className="flex-1">{t.title}</span>
              <span className={clsx('font-semibold tabular-nums', t.correct === t.total ? 'text-good' : 'text-bad')}>
                {t.correct} / {t.total}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {missed.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-3 font-display text-lg font-semibold">Yanlışların</h2>
          <ul className="space-y-3">
            {missed.map((q) => (
              <li key={q.position}>
                <button
                  onClick={() => onReview(q.position)}
                  className="w-full rounded-xl border border-border bg-surface-2 p-3 text-left text-sm transition-colors hover:border-accent/60"
                >
                  <div className="font-medium">{q.prompt}</div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span className="text-bad">
                      <X size={12} className="mr-1 inline" />
                      {q.chosenIndex !== null && q.options[q.chosenIndex]}
                    </span>
                    <span className="text-good">
                      <Check size={12} className="mr-1 inline" />
                      {q.correctIndex !== null && q.options[q.correctIndex]}
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs text-muted">{q.explanation}</div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link to="/quiz" className="btn btn-ghost flex-1">
          <Home size={16} /> Gramer ana sayfası
        </Link>
        {weakest && (
          <button className="btn btn-primary flex-1" onClick={() => onPractice(weakest.topic)}>
            <RotateCcw size={16} /> {weakest.title} pratiği
          </button>
        )}
      </div>
    </motion.div>
  )
}

export function QuizPlayPage() {
  const { sessionId = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const quizQuery = useQuery({
    queryKey: ['quiz', sessionId],
    queryFn: () => api.quizSession(sessionId),
    staleTime: Infinity,
    retry: false,
  })
  const quiz = quizQuery.data

  const [position, setPosition] = useState<number | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [busy, setBusy] = useState(false)
  const [reported, setReported] = useState<Set<number>>(new Set())

  useEffect(() => {
    setPosition(null)
    setShowResults(false)
  }, [sessionId])

  // Open at the first unanswered question, or on the results of a finished quiz.
  useEffect(() => {
    if (!quiz || position !== null) return
    const first = quiz.questions.findIndex((q) => q.chosenIndex === null)
    setPosition(first === -1 ? 0 : first)
    setShowResults(first === -1)
  }, [quiz, position])

  const question = quiz && position !== null ? quiz.questions[position] : null
  const answered = question?.chosenIndex != null
  const isLast = quiz !== undefined && position === quiz.questions.length - 1

  const answer = useCallback(
    async (choice: number) => {
      if (!quiz || !question || question.chosenIndex !== null || busy) return
      setBusy(true)
      try {
        const result = await api.answerQuiz(quiz.id, question.position, choice)
        queryClient.setQueryData<QuizSession>(['quiz', quiz.id], (old) =>
          old && {
            ...old,
            status: result.completed ? 'Completed' : old.status,
            correctCount: result.correctCount,
            answeredCount: result.answeredCount,
            questions: old.questions.map((q) =>
              q.position === question.position
                ? { ...q, chosenIndex: choice, correctIndex: result.correctIndex, explanation: result.explanation }
                : q,
            ),
          },
        )
        if (result.completed) queryClient.invalidateQueries({ queryKey: ['quiz-overview'] })
      } catch (e) {
        toast(e instanceof ApiError ? e.message : 'Cevap gönderilemedi', 'bad')
      } finally {
        setBusy(false)
      }
    },
    [quiz, question, busy, queryClient],
  )

  const next = useCallback(() => {
    if (!quiz || position === null) return
    const unanswered = quiz.questions.findIndex((q, i) => i > position && q.chosenIndex === null)
    const firstOpen = quiz.questions.findIndex((q) => q.chosenIndex === null)
    if (unanswered !== -1) setPosition(unanswered)
    else if (firstOpen !== -1) setPosition(firstOpen)
    else setShowResults(true)
  }, [quiz, position])

  const report = async () => {
    if (!question) return
    try {
      await api.reportQuestion(question.questionId)
      setReported((s) => new Set(s).add(question.questionId))
      toast('Teşekkürler. Bu soru bir daha sorulmayacak.', 'good')
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Bildirilemedi', 'bad')
    }
  }

  const practice = async (topic: string) => {
    try {
      const quiz = await api.practiceQuiz(topic)
      navigate(`/quiz/${quiz.id}`)
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Test açılamadı', 'bad')
    }
  }

  // Keyboard: 1–4 or A–D answer, Enter moves on.
  useEffect(() => {
    if (showResults) return
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const key = e.key.toUpperCase()
      const index = ['1', '2', '3', '4'].includes(key) ? Number(key) - 1 : optionLetters.indexOf(key)
      if (!answered && index >= 0) {
        e.preventDefault()
        answer(index)
      } else if (answered && e.key === 'Enter') {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showResults, answered, answer, next])

  if (quizQuery.isError) {
    return (
      <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
        <div className="text-4xl">🤔</div>
        <h2 className="mt-3 font-display text-xl font-semibold">Test bulunamadı</h2>
        <Link to="/quiz" className="btn btn-primary mt-5">
          Gramer ana sayfası
        </Link>
      </div>
    )
  }

  if (!quiz || position === null || !question) {
    return <div className="grid h-[50dvh] place-items-center text-muted">Yükleniyor…</div>
  }

  if (showResults && quiz.status === 'Completed') {
    return (
      <Results
        quiz={quiz}
        onReview={(i) => {
          setPosition(i)
          setShowResults(false)
        }}
        onPractice={practice}
      />
    )
  }

  const correct = answered && question.chosenIndex === question.correctIndex

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/quiz" className="btn btn-ghost px-3" aria-label="Geri">
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{quiz.kind === 'Daily' ? 'Günün testi' : `${quiz.topicTitle} pratiği`}</div>
          <div className="text-xs text-muted">
            Soru {position + 1} / {quiz.questions.length} · {quiz.correctCount} doğru
          </div>
        </div>
        {quiz.status === 'Completed' && (
          <button className="btn btn-ghost text-sm" onClick={() => setShowResults(true)}>
            Sonuç
          </button>
        )}
      </div>

      <ProgressDots questions={quiz.questions} position={position} onSelect={setPosition} />

      <motion.div
        key={question.position}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.18 }}
        className="card p-5 sm:p-7"
      >
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-md border border-border bg-surface-2 px-2 py-0.5 font-semibold">{question.topicTitle}</span>
          <span className={clsx('rounded-md border px-2 py-0.5 font-semibold', cefrColor[question.level])}>{question.level}</span>
        </div>

        <Prompt question={question} />

        <div className="mt-6 grid gap-2.5">
          {question.options.map((option, i) => {
            const isChosen = question.chosenIndex === i
            const isCorrect = question.correctIndex === i
            return (
              <button
                key={i}
                disabled={answered || busy}
                onClick={() => answer(i)}
                className={clsx(
                  'flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all',
                  !answered && 'border-border bg-surface-2 hover:border-accent hover:bg-accent/10',
                  answered && isCorrect && 'border-good bg-good/15',
                  answered && isChosen && !isCorrect && 'border-bad bg-bad/15',
                  answered && !isChosen && !isCorrect && 'border-border bg-surface-2 opacity-60',
                )}
              >
                <span
                  className={clsx(
                    'grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-bold',
                    answered && isCorrect ? 'bg-good text-white' : answered && isChosen ? 'bg-bad text-white' : 'bg-surface text-muted',
                  )}
                >
                  {answered && isCorrect ? <Check size={16} /> : answered && isChosen ? <X size={16} /> : optionLetters[i]}
                </span>
                <span className="font-medium">{option}</span>
              </button>
            )
          })}
        </div>

        {answered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={clsx('mt-5 rounded-xl border p-4', correct ? 'border-good/40 bg-good/10' : 'border-bad/40 bg-bad/10')}
          >
            <div className="font-semibold">{correct ? 'Doğru! 🎯' : 'Yanlış'}</div>
            <p className="mt-1 text-sm">{question.explanation}</p>
          </motion.div>
        )}

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={report}
            disabled={reported.has(question.questionId)}
            className="flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-bad"
          >
            <Flag size={13} /> {reported.has(question.questionId) ? 'Bildirildi' : 'Bu soru hatalı'}
          </button>
          {answered && (
            <button className="btn btn-primary ml-auto" onClick={next}>
              {isLast || quiz.status === 'Completed' ? 'Sonucu gör' : 'Sonraki soru'} <ArrowRight size={16} />
            </button>
          )}
        </div>
      </motion.div>

      {!answered && <p className="text-center text-xs text-muted">İpucu: 1–4 ya da A–D tuşlarıyla cevaplayabilirsin, Enter ile ilerlersin.</p>}
    </div>
  )
}
