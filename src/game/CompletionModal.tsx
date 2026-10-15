import { useEffect } from 'react'
import { motion } from 'motion/react'
import confetti from 'canvas-confetti'
import { ArrowRight, Flame, Home, Sparkles } from 'lucide-react'
import type { Completion } from '../api/types'
import { XpBar } from '../components/LevelCard'
import { formatDuration } from '../lib/labels'

interface Props {
  completion: Completion
  elapsed: number
  onNext(): void
  onHome(): void
}

export function CompletionModal({ completion, elapsed, onNext, onHome }: Props) {
  const { score, levelBefore, levelAfter } = completion
  const levelUp = levelAfter.level > levelBefore.level
  const missed = completion.words.filter((w) => !w.correct)

  useEffect(() => {
    const colors = ['#8b5cf6', '#06b6d4', '#f59e0b', '#22c55e']
    confetti({ particleCount: 140, spread: 80, origin: { y: 0.35 }, colors })
    if (levelUp) setTimeout(() => confetti({ particleCount: 90, spread: 120, origin: { y: 0.5 }, colors }), 500)
  }, [levelUp])

  const rows: [string, string][] = [
    ['Kelime puanı', `${score.wordPoints}`],
    ['Süre bonusu', `+${score.timeBonus}`],
    ['Kusursuz bonusu', `+${score.flawlessBonus}`],
    ['Zorluk çarpanı', `×${score.difficultyMultiplier}`],
  ]

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="card max-h-[90dvh] w-full max-w-lg overflow-y-auto p-6 scrollbar-thin"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 18 }}
      >
        <div className="text-center">
          <div className="text-4xl">🎉</div>
          <h2 className="mt-2 font-display text-2xl font-bold">Bulmaca tamamlandı!</h2>
          <p className="text-sm text-muted">Süre {formatDuration(elapsed)}</p>
          <div className="mt-4 font-display text-6xl font-bold gradient-text">{score.total}</div>
          <div className="text-xs uppercase tracking-widest text-muted">puan</div>
        </div>

        <div className="mt-5 space-y-1.5 rounded-xl bg-surface-2 p-4 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-muted">{label}</span>
              <span className="font-semibold tabular-nums">{value}</span>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-gold">+{completion.xpEarned} XP</span>
            <span className="flex items-center gap-1 text-muted">
              <Flame size={14} className="text-orange-400" /> {completion.currentStreak} günlük seri
            </span>
          </div>
          <XpBar start={levelAfter.levelStartXp} next={levelAfter.nextLevelXp} value={levelAfter.totalXp} />
          <div className="mt-1.5 text-xs text-muted">
            Seviye {levelAfter.level} · {levelAfter.title}
          </div>
          {levelUp && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/15 p-3 font-semibold"
            >
              <Sparkles size={18} className="text-accent" /> Seviye atladın! {levelBefore.level} → {levelAfter.level}
            </motion.div>
          )}
        </div>

        {completion.newAchievements.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-2 text-sm font-semibold">Yeni rozetler</h3>
            <div className="grid gap-2">
              {completion.newAchievements.map((a, i) => (
                <motion.div
                  key={a.code}
                  initial={{ x: -12, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.12 }}
                  className="flex items-center gap-3 rounded-xl border border-gold/30 bg-gold/10 p-3"
                >
                  <span className="text-2xl">{a.icon}</span>
                  <div>
                    <div className="font-semibold">{a.title}</div>
                    <div className="text-xs text-muted">{a.description}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {missed.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-2 text-sm font-semibold">Tekrar etmen gereken kelimeler</h3>
            <div className="flex flex-wrap gap-2">
              {missed.map((w) => (
                <span key={`${w.orientation}-${w.number}`} className="rounded-lg bg-surface-2 px-2.5 py-1 text-sm">
                  {w.clue} → <b>{w.answer}</b>
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">Bu kelimeler sonraki bulmacalarda daha sık karşına çıkacak.</p>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button className="btn btn-ghost flex-1" onClick={onHome}>
            <Home size={16} /> Ana sayfa
          </button>
          <button className="btn btn-primary flex-1" onClick={onNext}>
            Sonraki bulmaca <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
