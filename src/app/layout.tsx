import type { Metadata } from 'next'
import './globals.css'
import { ChatSidebar } from '@/components/chat/ChatSidebar'

export const metadata: Metadata = {
  title: '상권연구소 AI PRO',
  description: '점포 계약 전 의사결정 지원 서비스 — 상권·입지·임대조건 통합 분석',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-white text-slate-900 antialiased">
        <div className="flex h-screen">
          {/* no-print: sidebar는 인쇄에서 제외 */}
          <div className="no-print shrink-0">
            <ChatSidebar />
          </div>
          <main
            id="main-scroll"
            className="flex-1 min-w-0 overflow-y-auto"
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
