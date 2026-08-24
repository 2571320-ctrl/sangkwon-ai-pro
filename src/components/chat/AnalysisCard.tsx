import Link from 'next/link'
import { AnalysisResult, Store, FLOOR_LABELS, RECOMMENDATION_LABELS } from '@/types'
import { formatMoney, gradeColor, recommendationColor } from '@/lib/utils'
import { FileText, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react'

interface Props {
  analysis: AnalysisResult
  store: Store
}

export function AnalysisCard({ analysis, store }: Props) {
  const gc = gradeColor(analysis.overallGrade)
  const rc = recommendationColor(analysis.recommendation)

  const scoreItems = [
    analysis.scores.location,
    analysis.scores.visibility,
    analysis.scores.rent,
    analysis.scores.businessFit,
  ]

  return (
    <div className="mt-2 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm max-w-xl">
      {/* Header */}
      <div className="px-5 py-4 flex items-start gap-4 bg-slate-50 border-b border-slate-100">
        <div className={`rounded-xl px-3 py-2 text-center border shrink-0 ${gc.border} ${gc.bg}`}>
          <div className={`text-2xl font-black leading-none ${gc.text}`}>{analysis.overallGrade}</div>
          <div className={`text-[11px] font-bold mt-0.5 ${gc.text} opacity-70`}>{analysis.overallScore}점</div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 truncate">{store.name}</p>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            {FLOOR_LABELS[store.floor]} · {store.areaPyeong}평 · {store.desiredBusiness}
          </p>
          <span className={`inline-flex mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${rc.border} ${rc.bg} ${rc.text}`}>
            {RECOMMENDATION_LABELS[analysis.recommendation]}
          </span>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-slate-400">월세</p>
          <p className="text-sm font-bold text-slate-800">{formatMoney(store.monthlyRent)}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="px-5 py-3 border-b border-slate-100">
        <p className="text-xs text-slate-600 leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Score pills */}
      <div className="px-5 py-3 flex gap-2 flex-wrap border-b border-slate-100">
        {scoreItems.map(s => {
          const sgc = gradeColor(s.grade)
          return (
            <div
              key={s.label}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${sgc.border} ${sgc.bg} ${sgc.text}`}
            >
              <span>{s.grade}</span>
              <span className="opacity-70">{s.label}</span>
            </div>
          )
        })}
      </div>

      {/* Strengths & risks */}
      <div className="px-5 py-3 grid grid-cols-2 gap-3 border-b border-slate-100">
        <div>
          <p className="text-[10px] font-bold text-emerald-600 mb-1.5 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> 주요 장점
          </p>
          {analysis.strengths.slice(0, 2).map((s, i) => (
            <p key={i} className="text-[11px] text-slate-600 mb-0.5 leading-snug">· {s.title}</p>
          ))}
        </div>
        <div>
          <p className="text-[10px] font-bold text-amber-600 mb-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> 주요 위험요인
          </p>
          {analysis.risks.slice(0, 2).map((r, i) => (
            <p key={i} className="text-[11px] text-slate-600 mb-0.5 leading-snug">· {r.title}</p>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-3 flex gap-2">
        <Link
          href={`/analysis/${analysis.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          상세 분석 보기
          <ChevronRight className="w-3 h-3" />
        </Link>
        <Link
          href={`/report/${analysis.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f172a] text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
        >
          <FileText className="w-3 h-3" />
          고객 리포트
        </Link>
      </div>
    </div>
  )
}
