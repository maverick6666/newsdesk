import { useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { useNewsdeskStore } from '@/stores/useNewsdeskStore'
import Header from '@/components/Header'
import MorningBrief from '@/components/MorningBrief'
import ClusterPanel from '@/components/ClusterPanel'

/* ─── Main Page ────────────────────────────────────── */
/* Single-flow layout: Header → Feed → Detail Panel    */
/* No tabs. No mode switching. Just scroll and read.   */

export default function MainPage() {
  const {
    data,
    isLoading,
    openPanel,
    fetchToday,
  } = useNewsdeskStore()

  useEffect(() => {
    fetchToday()
  }, [fetchToday])

  const handleClusterClick = useCallback((id: number) => {
    openPanel(id)
  }, [openPanel])

  const clusters = data?.clusters || []

  if (isLoading && !data) return <LoadingSkeleton />

  return (
    <div className="min-h-screen bg-surface-0">
      <Header
        date={data?.date || new Date().toISOString().slice(0, 10)}
        overallSentiment={data?.overallSentiment || 50}
        totalClusters={data?.totalClusters || 0}
        totalNews={data?.totalNews || 0}
        lastUpdate={data?.lastUpdate || null}
        status={data?.status || 'no_data'}
        clusters={clusters}
      />

      <main className="max-w-6xl mx-auto px-6 py-6">
        {data?.status === 'no_data' ? (
          <EmptyState />
        ) : (
          <MorningBrief
            clusters={clusters}
            onClusterClick={handleClusterClick}
          />
        )}
      </main>

      <ClusterPanel />
    </div>
  )
}

/* ─── EmptyState ───────────────────────────────────── */

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center"
    >
      <div className="nd-card p-10 max-w-sm">
        <h3 className="font-display text-lg font-semibold text-txt-primary mb-2">
          데이터 없음
        </h3>
        <p className="text-sm text-txt-secondary leading-relaxed mb-5">
          AI 파이프라인을 실행하여 오늘의 뉴스를 분석하세요.
        </p>
        <div className="space-y-1.5 text-left text-xs text-txt-muted font-mono bg-surface-3 rounded-lg p-4">
          <p>1. POST /api/v1/collect/run</p>
          <p>2. POST /api/v1/pipeline/run</p>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── LoadingSkeleton ──────────────────────────────── */

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-surface-0">
      {/* Header skeleton */}
      <div className="bg-surface-1 border-b border-border px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="shimmer h-6 w-36 rounded-md" />
          <div className="flex gap-4">
            <div className="shimmer h-5 w-16 rounded-md" />
            <div className="shimmer h-5 w-16 rounded-md" />
            <div className="shimmer h-5 w-16 rounded-md" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Hero card */}
        <div className="nd-card-hero p-7">
          <div className="shimmer h-8 w-3/4 rounded-md mb-3" />
          <div className="shimmer h-4 w-full rounded-md mb-2" />
          <div className="shimmer h-4 w-5/6 rounded-md mb-2" />
          <div className="shimmer h-4 w-2/3 rounded-md" />
        </div>

        {/* Medium cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="nd-card p-5">
              <div className="shimmer h-4 w-20 rounded-md mb-3" />
              <div className="shimmer h-5 w-full rounded-md mb-2" />
              <div className="shimmer h-3 w-4/5 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
