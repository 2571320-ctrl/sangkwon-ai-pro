import type { Metadata } from 'next'
import './globals.css'
import { MobileLayout } from '@/components/layout/MobileLayout'

export const metadata: Metadata = {
  title: '상권연구소 AI PRO',
  description: '점포 계약 전 의사결정 지원 서비스 — 상권·입지·임대조건 통합 분석',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-white text-slate-900 antialiased">
        <MobileLayout>{children}</MobileLayout>
      </body>
    </html>
  )
}
