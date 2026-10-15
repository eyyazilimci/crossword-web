import { AnimatePresence, motion } from 'motion/react'
import { create } from 'zustand'
import clsx from 'clsx'

type Tone = 'info' | 'good' | 'bad'

interface Toast {
  id: number
  text: string
  tone: Tone
}

interface ToastState {
  toasts: Toast[]
  push(text: string, tone?: Tone): void
}

let nextId = 1

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push(text, tone = 'info') {
    const id = nextId++
    set((s) => ({ toasts: [...s.toasts, { id, text, tone }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200)
  },
}))

export const toast = (text: string, tone?: Tone) => useToasts.getState().push(text, tone)

export function Toaster() {
  const toasts = useToasts((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className={clsx(
              'card pointer-events-auto max-w-md px-4 py-3 text-sm font-medium shadow-xl',
              t.tone === 'good' && 'border-good/50',
              t.tone === 'bad' && 'border-bad/50',
            )}
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
