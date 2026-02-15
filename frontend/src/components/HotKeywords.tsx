import { motion } from 'motion/react'
import { cn, sentimentColor } from '@/lib/utils'
import type { KeywordData } from '@/services/api'

interface HotKeywordsProps {
  keywords: KeywordData[]
  activeKeyword: string | null
  onKeywordClick: (keyword: string | null) => void
}

export default function HotKeywords({ keywords, activeKeyword, onKeywordClick }: HotKeywordsProps) {
  if (!keywords.length) return null

  const maxCount = Math.max(...keywords.map((k) => k.count), 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card p-6"
    >
      <h3 className="text-xs uppercase tracking-widest text-txt-muted mb-4 font-display">
        핫 키워드
      </h3>

      <div className="space-y-2">
        {keywords.slice(0, 10).map((kw, i) => {
          const isActive = activeKeyword === kw.word
          const barWidth = (kw.count / maxCount) * 100

          return (
            <motion.button
              key={kw.word}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.04 }}
              onClick={() => onKeywordClick(isActive ? null : kw.word)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all',
                isActive
                  ? 'bg-accent/15 border border-accent/30'
                  : 'hover:bg-glass-hover border border-transparent',
              )}
            >
              <span className="text-xs text-txt-muted font-mono w-4 text-right">
                {i + 1}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    'text-sm font-medium truncate',
                    isActive ? 'text-accent-light' : 'text-txt-primary',
                  )}>
                    {kw.word}
                  </span>
                  <span className={cn('text-xs font-mono ml-2', sentimentColor(kw.sentiment))}>
                    {kw.count}
                  </span>
                </div>

                {/* Bar */}
                <div className="h-1 rounded-full bg-glass overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ duration: 0.6, delay: 0.5 + i * 0.04 }}
                    className="h-full rounded-full bg-accent/40"
                  />
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
