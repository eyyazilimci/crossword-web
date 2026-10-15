import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown } from 'lucide-react'

export interface MenuItem {
  label: string
  hint?: string
  onSelect(): void
}

/** Small dropdown used for the check / hint actions. */
export function Menu({ label, icon, items }: { label: string; icon: ReactNode; items: MenuItem[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button className="btn btn-ghost" onMouseDown={(e) => e.preventDefault()} onClick={() => setOpen((o) => !o)}>
        {icon}
        <span className="hidden sm:inline">{label}</span>
        <ChevronDown size={14} className="text-muted" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="card absolute right-0 z-30 mt-2 w-56 p-1.5 shadow-2xl"
          >
            {items.map((item) => (
              <button
                key={item.label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setOpen(false)
                  item.onSelect()
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2"
              >
                <div className="font-medium">{item.label}</div>
                {item.hint && <div className="text-xs text-muted">{item.hint}</div>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
