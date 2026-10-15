import { Flame, Trophy } from 'lucide-react'
import { motion } from 'motion/react'
import type { Profile } from '../api/types'

export function XpBar({ start, next, value }: { start: number; next: number; value: number }) {
  const pct = Math.max(0, Math.min(100, ((value - start) / Math.max(1, next - start)) * 100))
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
      <motion.div
        className="h-full rounded-full bg-linear-to-r from-accent to-accent-2"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  )
}

export function LevelCard({ profile }: { profile: Profile }) {
  const { level } = profile
  return (
    <div className="card relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-accent to-accent-2 font-display text-2xl font-bold text-white shadow-lg shadow-accent/30">
          {level.level}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium uppercase tracking-wider text-muted">Seviye {level.level}</div>
          <div className="font-display text-xl font-semibold">{level.title}</div>
          <div className="mt-2">
            <XpBar start={level.levelStartXp} next={level.nextLevelXp} value={level.totalXp} />
          </div>
          <div className="mt-1.5 text-xs text-muted">
            {level.totalXp - level.levelStartXp} / {level.nextLevelXp - level.levelStartXp} XP · toplam {level.totalXp} XP
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface-2 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Flame size={14} className="text-orange-400" /> Seri
          </div>
          <div className="mt-1 font-display text-2xl font-semibold">
            {profile.currentStreak} <span className="text-sm font-normal text-muted">gün</span>
          </div>
        </div>
        <div className="rounded-xl bg-surface-2 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Trophy size={14} className="text-gold" /> Çözülen
          </div>
          <div className="mt-1 font-display text-2xl font-semibold">
            {profile.puzzlesCompleted} <span className="text-sm font-normal text-muted">bulmaca</span>
          </div>
        </div>
      </div>
    </div>
  )
}
