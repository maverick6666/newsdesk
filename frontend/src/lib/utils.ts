import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ClusterData } from '@/services/api'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* ─── Sentiment ──────────────────────────────────── */

export function sentimentColor(score: number): string {
  if (score < 25) return 'text-signal-down'
  if (score < 40) return 'text-amber'
  if (score < 60) return 'text-txt-secondary'
  if (score < 75) return 'text-signal-up'
  return 'text-signal-up'
}

export function sentimentBg(score: number): string {
  if (score < 25) return 'bg-signal-down-muted'
  if (score < 40) return 'bg-amber-muted'
  if (score < 60) return 'bg-signal-flat-muted'
  if (score < 75) return 'bg-signal-up-muted'
  return 'bg-signal-up-muted'
}

export function sentimentLabel(score: number): string {
  if (score < 20) return '극단적 공포'
  if (score < 35) return '공포'
  if (score < 45) return '주의'
  if (score < 55) return '중립'
  if (score < 65) return '낙관'
  if (score < 80) return '탐욕'
  return '극단적 탐욕'
}

export function isEnglish(text: string): boolean {
  if (!text) return false
  return /^[A-Za-z0-9\s"'\-:,.]/.test(text.trim())
}

/* ─── Investment Signal ──────────────────────────── */

export type SignalDirection = 'bullish' | 'cautious_positive' | 'neutral' | 'cautious_negative' | 'bearish'

export const SIGNAL_CONFIG: Record<string, {
  label: string
  icon: string
  color: string
  bgClass: string
  barColor: string
}> = {
  bullish:           { label: '강세',        icon: '▲', color: 'text-signal-up',   bgClass: 'bg-signal-up-muted border border-signal-up/20',  barColor: '#4aad72' },
  cautious_positive: { label: '조심스런 낙관', icon: '▲', color: 'text-signal-up',   bgClass: 'bg-signal-up-muted border border-signal-up/15',  barColor: '#4aad72' },
  neutral:           { label: '중립',        icon: '●', color: 'text-signal-flat',  bgClass: 'bg-signal-flat-muted border border-signal-flat/15', barColor: '#88827c' },
  cautious_negative: { label: '조심스런 비관', icon: '▼', color: 'text-amber',       bgClass: 'bg-amber-muted border border-amber/15',          barColor: '#d48a3a' },
  bearish:           { label: '약세',        icon: '▼', color: 'text-signal-down',  bgClass: 'bg-signal-down-muted border border-signal-down/20', barColor: '#c85050' },
}

export function getSignalConfig(direction?: string) {
  return SIGNAL_CONFIG[direction || 'neutral'] || SIGNAL_CONFIG.neutral
}

/* ─── Signal Group ───────────────────────────────── */

export type SignalGroup = 'bullish' | 'neutral' | 'bearish'

export function classifySignal(cluster: ClusterData): SignalGroup {
  const dir = cluster.investmentSignal?.direction
  if (!dir) return 'neutral'
  if (dir === 'bullish' || dir === 'cautious_positive') return 'bullish'
  if (dir === 'bearish' || dir === 'cautious_negative') return 'bearish'
  return 'neutral'
}

/* ─── Cluster Importance ─────────────────────────── */

export type ImportanceTier = 'hero' | 'medium' | 'compact'

export function clusterImportanceScore(c: ClusterData): number {
  const confidence = c.investmentSignal?.confidence ?? 50
  return c.newsCount * 2 + confidence
}

export function clusterImportanceTier(c: ClusterData): ImportanceTier {
  const score = clusterImportanceScore(c)
  if (score >= 100) return 'hero'
  if (score >= 30) return 'medium'
  return 'compact'
}
