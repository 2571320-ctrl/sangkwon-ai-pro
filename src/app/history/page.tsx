'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAnalyses, getStore } from '@/lib/storage'
import { AnalysisResult, Store, FLOOR_LABELS } from '@/types'
import { formatMoney, gradeColor } from '@/lib/utils'
import { Clock, MapPin, ChevronRight, FileText } from 'lucide-react'

interface HistoryItem {
  analysis: AnalysisResult
  store: Store | null
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([])

  useEffect(() => {
    const analyses = getAnalyses()
    const mapped = analyses.map(a => ({
      analysis: a,
      store: getStore(a.storeId),
    }))
    setItems(mapped)
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-10">
        <p className="text-[11px] font-black text-[#C24A2C] tracking-[0.2em] uppercase mb-3">분석 히스토리</p>
        <h1 className="text-[1.85rem] font-bold text-[#0A0A0A] leading-tight mb-3">분석 기록</h1>
        <p className="text-[#666] text-sm">이전에 분석한 점포 목록입니다.</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-[#E0DED9] rounded-2xl p-12 text-center">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium mb-1">분석 기록이 없습니다</p>
          <p className="text-slate-400 text-xs mb-4">점포를 분석하면 여기에 기록이 쌓입니다.</p>
          <Link href="/analysis" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C24A2C] hover:bg-[#A83D23] text-white text-sm font-semibold">
            첫 분석 시작하기
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(({ analysis, store }) => {
            const gc = gradeColor(analysis.overallGrade)
            return (
              <Link
                key={analysis.id}
                href={`/analysis/${analysis.id}`}
                className="block bg-white border border-[#E0DED9] rounded-2xl shadow-sm p-5 hover:border-[#C24A2C]/30 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <h3 className="font-semibold text-slate-800 text-sm truncate">
                        {store?.name ?? '점포명 없음'}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-2 ml-5">
                      {store?.address ?? '주소 없음'}
                    </p>
                    <div className="flex items-center gap-2 ml-5">
                      {store && (
                        <>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                            {FLOOR_LABELS[store.floor]} · {store.areaPyeong}평
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#F4EBE7] text-[#C24A2C]">
                            {store.desiredBusiness}
                          </span>
                          <span className="text-xs text-slate-400">
                            월세 {formatMoney(store.monthlyRent)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className={`rounded-xl px-3 py-2 text-center border ${gc.border} ${gc.bg}`}>
                      <div className={`text-xl font-black ${gc.text}`}>{analysis.overallGrade}</div>
                      <div className={`text-[10px] ${gc.text} opacity-70`}>{analysis.overallScore}점</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                        <Clock className="w-3 h-3" />
                        {new Date(analysis.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex gap-1.5">
                        <Link
                          href={`/report/${analysis.id}`}
                          onClick={e => e.stopPropagation()}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </Link>
                        <div className="p-1.5 rounded-lg text-slate-300 group-hover:text-slate-500 transition-colors">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
