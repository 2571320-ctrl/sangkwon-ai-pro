import { Store, AnalysisResult, ComparisonResult } from '@/types'

const KEYS = {
  stores: 'sai_stores',
  analyses: 'sai_analyses',
  comparisons: 'sai_comparisons',
}

function load<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as T[]
  } catch {
    return []
  }
}

function save<T>(key: string, items: T[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(items))
}

// ── Stores ────────────────────────────────────────────────────────────────────

export function saveStore(store: Store): void {
  const items = load<Store>(KEYS.stores)
  const idx = items.findIndex(s => s.id === store.id)
  if (idx >= 0) items[idx] = store
  else items.unshift(store)
  save(KEYS.stores, items)
}

export function getStores(): Store[] {
  return load<Store>(KEYS.stores)
}

export function getStore(id: string): Store | null {
  return getStores().find(s => s.id === id) ?? null
}

// ── Analyses ──────────────────────────────────────────────────────────────────

export function saveAnalysis(analysis: AnalysisResult): void {
  const items = load<AnalysisResult>(KEYS.analyses)
  const idx = items.findIndex(a => a.id === analysis.id)
  if (idx >= 0) items[idx] = analysis
  else items.unshift(analysis)
  save(KEYS.analyses, items)
}

export function getAnalyses(): AnalysisResult[] {
  return load<AnalysisResult>(KEYS.analyses)
}

export function getAnalysis(id: string): AnalysisResult | null {
  return getAnalyses().find(a => a.id === id) ?? null
}

export function getAnalysisByStoreId(storeId: string): AnalysisResult | null {
  return getAnalyses().find(a => a.storeId === storeId) ?? null
}

// ── Comparisons ───────────────────────────────────────────────────────────────

export function saveComparison(comp: ComparisonResult): void {
  const items = load<ComparisonResult>(KEYS.comparisons)
  const idx = items.findIndex(c => c.id === comp.id)
  if (idx >= 0) items[idx] = comp
  else items.unshift(comp)
  save(KEYS.comparisons, items)
}

export function getComparisons(): ComparisonResult[] {
  return load<ComparisonResult>(KEYS.comparisons)
}

export function getComparison(id: string): ComparisonResult | null {
  return getComparisons().find(c => c.id === id) ?? null
}

export function updateCheckStatus(
  analysisId: string,
  checkId: string,
  status: import('@/types').CheckStatus,
  note: string,
): void {
  const analyses = getAnalyses()
  const idx = analyses.findIndex(a => a.id === analysisId)
  if (idx < 0) return
  const checkIdx = analyses[idx].contractChecks.findIndex(c => c.id === checkId)
  if (checkIdx < 0) return
  analyses[idx].contractChecks[checkIdx].status = status
  analyses[idx].contractChecks[checkIdx].note = note
  save(KEYS.analyses, analyses)
}
