'use client'

import { AppProvider } from '@/lib/context/AppContext'
import { Sidebar } from './Sidebar'
import { RightPanel } from './RightPanel'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Left sidebar */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50">
          {children}
        </main>

        {/* Right panel */}
        <RightPanel />
      </div>
    </AppProvider>
  )
}
