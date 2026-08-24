'use client'

import React, { createContext, useContext, useState } from 'react'
import { Store, AnalysisResult } from '@/types'

interface AppContextValue {
  currentStore: Store | null
  currentAnalysis: AnalysisResult | null
  setCurrentStore: (store: Store | null) => void
  setCurrentAnalysis: (result: AnalysisResult | null) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentStore, setCurrentStore] = useState<Store | null>(null)
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null)

  return (
    <AppContext.Provider
      value={{ currentStore, currentAnalysis, setCurrentStore, setCurrentAnalysis }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
