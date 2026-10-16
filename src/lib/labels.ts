import type { DailyDecision, Difficulty, GameMode, Orientation, PartOfSpeech } from '../api/types'

export const modeLabel: Record<GameMode, string> = {
  TrToEn: 'Türkçe → İngilizce',
  EnToTr: 'İngilizce → Türkçe',
}

export const modeShort: Record<GameMode, string> = {
  TrToEn: 'TR → EN',
  EnToTr: 'EN → TR',
}

export const modeHint: Record<GameMode, string> = {
  TrToEn: 'Türkçe kelimenin İngilizcesini yaz',
  EnToTr: 'İngilizce kelimenin Türkçesini yaz',
}

export const difficultyLabel: Record<Difficulty, string> = {
  Easy: 'Kolay',
  Medium: 'Orta',
  Hard: 'Zor',
  Expert: 'Uzman',
}

export const difficultyHint: Record<Difficulty, string> = {
  Easy: 'En sık kelimeler (A1–A2)',
  Medium: 'Orta sıklık (A2–B1)',
  Hard: 'Daha az sık (B1–B2)',
  Expert: 'Listenin en zor kelimeleri (C1–C2)',
}

export const orientationLabel: Record<Orientation, string> = {
  Across: 'Soldan Sağa',
  Down: 'Yukarıdan Aşağı',
}

/** Part-of-speech label shown next to the clue, in the clue's language. */
export const posLabel: Record<GameMode, Record<PartOfSpeech, string>> = {
  TrToEn: { Noun: 'isim', Verb: 'fiil', Adjective: 'sıfat', Adverb: 'zarf', Other: '', Phrase: 'kalıp' },
  EnToTr: { Noun: 'noun', Verb: 'verb', Adjective: 'adj.', Adverb: 'adv.', Other: '', Phrase: 'phrase' },
}

/** One-line explanation of the adaptive daily difficulty. */
export function dailyReason(d: DailyDecision): string {
  if (!d.previousDifficulty) return 'İlk günlük bulmacan, kolaydan başlıyoruz'
  if (d.previousAccuracy === null) return 'Son günlük bulmaca bitmedi, seviye aynı'
  const pct = `%${Math.round(d.previousAccuracy * 100)}`
  const change = difficultyOrder[d.difficulty] - difficultyOrder[d.previousDifficulty]
  if (change > 0) return `Son başarın ${pct}, seviye yükseldi`
  if (change < 0) return `Son başarın ${pct}, seviye düştü`
  return `Son başarın ${pct}, seviye korunuyor`
}

const difficultyOrder: Record<Difficulty, number> = { Easy: 0, Medium: 1, Hard: 2, Expert: 3 }

export function formatDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export const difficultyColor: Record<Difficulty, string> = {
  Easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  Hard: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  Expert: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30',
}
