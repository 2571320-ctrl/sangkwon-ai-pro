import { Grade, Recommendation } from '@/types'

export function formatMoney(won: number): string {
  if (won === 0) return '없음'
  if (won >= 100_000_000) {
    const eok = Math.floor(won / 100_000_000)
    const man = Math.floor((won % 100_000_000) / 10_000)
    if (man === 0) return `${eok}억원`
    return `${eok}억 ${man.toLocaleString('ko-KR')}만원`
  }
  if (won >= 10_000) {
    const man = Math.floor(won / 10_000)
    return `${man.toLocaleString('ko-KR')}만원`
  }
  return `${won.toLocaleString('ko-KR')}원`
}

export function formatNumber(n: number): string {
  return n.toLocaleString('ko-KR')
}

export function gradeColor(grade: Grade): {
  bg: string
  text: string
  border: string
  dot: string
} {
  switch (grade) {
    case 'A+':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' }
    case 'A':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' }
    case 'B+':
      return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' }
    case 'B':
      return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', dot: 'bg-slate-500' }
    case 'C':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' }
    case 'D':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' }
  }
}

export function recommendationColor(rec: Recommendation): {
  bg: string
  text: string
  border: string
} {
  switch (rec) {
    case 'primary':
      return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' }
    case 'conditional':
      return { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' }
    case 'caution':
      return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' }
    case 'review':
      return { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' }
  }
}

export function scoreToGrade(score: number): import('@/types').Grade {
  if (score >= 90) return 'A+'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B+'
  if (score >= 60) return 'B'
  if (score >= 50) return 'C'
  return 'D'
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
