// Supabase repository — V0.1 falls back to localStorage when not configured
import { supabase, isSupabaseConfigured } from './client'
import { Store, AnalysisResult } from '@/types'
import * as local from '@/lib/storage'

export async function persistStore(store: Store): Promise<void> {
  local.saveStore(store)
  if (!isSupabaseConfigured || !supabase) return
  await supabase.from('stores').upsert(store)
}

export async function persistAnalysis(analysis: AnalysisResult): Promise<void> {
  local.saveAnalysis(analysis)
  if (!isSupabaseConfigured || !supabase) return
  await supabase.from('analyses').upsert({
    ...analysis,
    scores: JSON.stringify(analysis.scores),
    strengths: JSON.stringify(analysis.strengths),
    risks: JSON.stringify(analysis.risks),
    market_data: JSON.stringify(analysis.marketData),
    contract_checks: JSON.stringify(analysis.contractChecks),
  })
}

export async function fetchAnalysis(id: string): Promise<AnalysisResult | null> {
  return local.getAnalysis(id)
}

export async function fetchStore(id: string): Promise<Store | null> {
  return local.getStore(id)
}
