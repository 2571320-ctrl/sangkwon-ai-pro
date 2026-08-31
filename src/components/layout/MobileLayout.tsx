'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { ChatSidebar } from '@/components/chat/ChatSidebar'

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // 페이지 이동 시 사이드바 자동 닫기 (모바일)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  if (pathname === '/') return <>{children}</>

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 모바일 배경 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바: 모바일=fixed 드로어, 데스크톱=static 인라인 */}
      <div
        className={`
          fixed md:static inset-y-0 left-0 z-30 shrink-0
          transition-transform duration-200 ease-in-out
          no-print
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <ChatSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* 메인 영역 */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* 모바일 상단바 */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="메뉴 열기"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm text-slate-800">상권연구소 AI PRO</span>
        </header>

        <main id="main-scroll" className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
