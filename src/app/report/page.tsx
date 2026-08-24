'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAnalyses, getStore } from '@/lib/storage'
import { AnalysisResult, Store, FLOOR_LABELS } from '@/types'
import { gradeColor } from '@/lib/utils'
import { FileText, ChevronRight, Printer } from 'lucide-react'

interface ReportItem { analysis: AnalysisResult; store: Store | null }

export default function ReportListPage() {
  const [items, setItems] = useState<ReportItem[]>([])

  useEffect(() => {
    setItems(getAnalyses().map(a => ({ analysis: a, store: getStore(a.storeId) })))
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">고객 리포트</h1>
        <p className="text-slate-500 text-sm">분석 결과를 고객용 리포트로 출력합니다.</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium mb-4">생성된 리포트가 없습니다</p>
          <Link href="/analysis" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f172a] text-white text-sm font-semibold">
            점포 분석 시작
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(({ analysis, store }) => {
            const gc = gradeColor(analysis.overallGrade)
            return (
              <div key={analysis.id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex items-center gap-4">
                <div className={`rounded-xl px-3 py-2 text-center border ${gc.border} ${gc.bg} shrink-0`}>
                  <div className={`text-xl font-black ${gc.text}`}>{analysis.overallGrade}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{store?.name ?? '점포명 없음'}</p>
                  <p className="text-xs text-slate-500">{store ? `${FLOOR_LABELS[store.floor]} · ${store.desiredBusiness}` : ''}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(analysis.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link
                    href={`/report/${analysis.id}`}
                    onClick={e => {
                      e.preventDefault()
                      window.open(`/report/${analysis.id}`, '_blank')
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    인쇄
                  </Link>
                  <Link
                    href={`/report/${analysis.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f172a] text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    보기
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
