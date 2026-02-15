import { forwardRef } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { cn, sentimentColor, sentimentBg, isEnglish } from '@/lib/utils'
import type { ClusterData } from '@/services/api'

interface ClusterCardProps {
  cluster: ClusterData
  index: number
}

const ClusterCard = forwardRef<HTMLDivElement, ClusterCardProps>(
  function ClusterCard({ cluster, index }, ref) {
  const navigate = useNavigate()
  const isEn = isEnglish(cluster.title)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ scale: 1.015 }}
      onClick={() => navigate(`/cluster/${cluster.id}`)}
      className={cn(
        'cursor-pointer group',
        cluster.isTeamRelated ? 'glass-card-gold' : 'glass-card',
      )}
    >
      <div className="p-5">
        {/* Top row: sentiment + tags */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              'sentiment-badge',
              sentimentBg(cluster.sentiment),
              sentimentColor(cluster.sentiment),
            )}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {cluster.sentiment.toFixed(0)}
            </div>
            {isEn && (
              <span className="text-[10px] font-mono font-medium text-sky-400 bg-sky-400/10 px-1.5 py-0.5 rounded border border-sky-400/20">
                EN
              </span>
            )}
          </div>

          {cluster.isTeamRelated && (
            <span className="text-gold text-xs font-medium px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20">
              포트폴리오
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-display text-[15px] font-semibold text-txt-primary leading-snug mb-2 group-hover:text-white transition-colors line-clamp-2">
          {cluster.title}
        </h3>

        {/* Summary */}
        {cluster.summary && (
          <p className="text-sm text-txt-secondary leading-relaxed mb-3 line-clamp-2">
            {cluster.summary}
          </p>
        )}

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-glass-border">
          <span className="text-xs text-txt-muted">
            {cluster.newsCount}건
          </span>

          {cluster.relatedStocks.length > 0 && (
            <div className="flex gap-1 flex-wrap justify-end">
              {cluster.relatedStocks.slice(0, 3).map((stock) => (
                <span
                  key={stock}
                  className="text-[10px] font-mono text-accent-light bg-accent/10 px-1.5 py-0.5 rounded"
                >
                  {stock}
                </span>
              ))}
              {cluster.relatedStocks.length > 3 && (
                <span className="text-[10px] text-txt-muted">
                  +{cluster.relatedStocks.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
})

export default ClusterCard
