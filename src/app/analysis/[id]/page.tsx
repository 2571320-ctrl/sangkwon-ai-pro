'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAnalysis, getStore, updateCheckStatus } from '@/lib/storage'
import { AnalysisResult, Store, FLOOR_LABELS, RECOMMENDATION_LABELS, CheckStatus } from '@/types'
import { formatMoney, gradeColor, recommendationColor } from '@/lib/utils'
import {
  ArrowLeft,
  GitCompare,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Store as StoreIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

// ── Sub-components ────────────────────────────────────────────────────────────

function GradeCircle({ score, grade, label }: { score: number; grade: string; label: string }) {
  const gc = gradeColor(grade as import('@/types').Grade)
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 ${gc.border} ${gc.bg}`}>
        <span className={`text-lg font-black leading-none ${gc.text}`}>{grade}</span>
        <span className={`text-[10px] font-semibold ${gc.text} opacity-70`}>{score}점</span>
      </div>
      <span className="text-xs text-slate-500 font-medium text-center leading-tight">{label}</span>
    </div>
  )
}

function AnalysisCard({
  title,
  icon: Icon,
  iconColor,
  children,
}: {
  title: string
  icon: React.ElementType
  iconColor: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="p-6 space-y-5">{children}</div>}
    </div>
  )
}

function AnalysisItemRow({
  item,
  type,
}: {
  item: import('@/types').AnalysisItem
  type: 'strength' | 'risk'
}) {
  const isRisk = type === 'risk'
  return (
    <div className={`rounded-xl p-5 border ${isRisk ? 'border-amber-100 bg-amber-50/40' : 'border-emerald-100 bg-emerald-50/40'}`}>
      <div className="flex items-start gap-3 mb-3">
        {isRisk ? (
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        ) : (
          <TrendingUp className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
        )}
        <div>
          <h4 className="font-semibold text-slate-800 text-sm">{item.title}</h4>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">{item.data}</p>
        </div>
      </div>
      <div className="ml-7 space-y-2">
        <div>
          <span className="inline-block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">해석</span>
          <p className="text-xs text-slate-700 leading-relaxed">{item.interpretation}</p>
        </div>
        <div>
          <span className="inline-block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            {isRisk ? '점포에 미치는 영향' : '업종에 미치는 의미'}
          </span>
          <p className="text-xs text-slate-700 leading-relaxed">{item.impact}</p>
        </div>
        {item.action && (
          <div className={`mt-2 rounded-lg px-3 py-2 ${isRisk ? 'bg-amber-100/60' : 'bg-emerald-100/60'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isRisk ? 'text-amber-700' : 'text-emerald-700'}`}>
              확인할 행동
            </span>
            <p className={`text-xs mt-0.5 leading-relaxed font-medium ${isRisk ? 'text-amber-800' : 'text-emerald-800'}`}>
              {item.action}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ChecklistItem({
  check,
  analysisId,
}: {
  check: import('@/types').ContractCheck
  analysisId: string
}) {
  const [status, setStatus] = useState<CheckStatus>(check.status)

  function cycle() {
    const next: CheckStatus =
      status === 'unchecked' ? 'verified' : status === 'verified' ? 'concern' : 'unchecked'
    setStatus(next)
    updateCheckStatus(analysisId, check.id, next, check.note)
  }

  const statusConfig = {
    unchecked: { label: '미확인', class: 'bg-slate-100 text-slate-500' },
    verified: { label: '확인완료', class: 'bg-emerald-100 text-emerald-700' },
    concern: { label: '우려사항', class: 'bg-red-100 text-red-700' },
  }
  const cfg = statusConfig[status]

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
      <div>
        <span className="text-xs font-semibold text-slate-400 mr-2">[{check.category}]</span>
        <span className="text-sm text-slate-700">{check.item}</span>
      </div>
      <button
        onClick={cycle}
        className={`shrink-0 ml-4 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${cfg.class}`}
      >
        {cfg.label}
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalysisResultPage() {
  const params = useParams()
  const router = useRouter()
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [store, setStore] = useState<Store | null>(null)

  useEffect(() => {
    const id = params.id as string
    const a = getAnalysis(id)
    if (!a) { router.push('/analysis'); return }
    const s = getStore(a.storeId)
    setAnalysis(a)
    setStore(s)
  }, [params.id, router])

  if (!analysis || !store) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 text-sm">불러오는 중…</div>
      </div>
    )
  }

  const gc = gradeColor(analysis.overallGrade)
  const rc = recommendationColor(analysis.recommendation)
  const scores = analysis.scores

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/analysis" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          새 분석
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-700 font-medium">{store.name}</span>
      </div>

      {/* Store info card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StoreIcon className="w-4 h-4 text-slate-400" />
              <h2 className="font-bold text-slate-900">{store.name}</h2>
            </div>
            <p className="text-xs text-slate-500 mb-3">{store.address}</p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                {FLOOR_LABELS[store.floor]} · {store.areaPyeong}평
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700">
                희망업종: {store.desiredBusiness}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                전면 {store.frontageMeters}m
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-400 mb-0.5">보증금</p>
            <p className="text-sm font-bold text-slate-800">{formatMoney(store.deposit)}</p>
            <p className="text-xs text-slate-400 mt-1.5 mb-0.5">월세</p>
            <p className="text-sm font-bold text-slate-800">{formatMoney(store.monthlyRent)}</p>
          </div>
        </div>
      </div>

      {/* Overall grade card */}
      <div className={`bg-white border rounded-xl shadow-sm overflow-hidden`}>
        <div className={`px-6 pt-6 pb-5 border-b ${rc.border}`}>
          <div className="flex items-start gap-6">
            <div className={`rounded-2xl p-5 ${gc.bg} border ${gc.border} text-center shrink-0`}>
              <div className={`text-4xl font-black ${gc.text} leading-none`}>{analysis.overallGrade}</div>
              <div className={`text-sm font-bold ${gc.text} opacity-70 mt-1`}>{analysis.overallScore}점</div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">종합판단</p>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border mb-3 ${rc.border} ${rc.bg} ${rc.text}`}>
                {RECOMMENDATION_LABELS[analysis.recommendation]}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{analysis.summary}</p>
            </div>
          </div>
        </div>

        {/* Score grid */}
        <div className="px-6 py-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">항목별 평가</p>
          <div className="flex justify-between">
            <GradeCircle score={scores.location.score} grade={scores.location.grade} label="입지" />
            <GradeCircle score={scores.visibility.score} grade={scores.visibility.grade} label="가시성" />
            <GradeCircle score={scores.rent.score} grade={scores.rent.grade} label="임대조건" />
            <GradeCircle score={scores.businessFit.score} grade={scores.businessFit.grade} label="업종적합도" />
            <GradeCircle score={scores.competitionRisk.score} grade={scores.competitionRisk.grade} label="경쟁위험" />
            <GradeCircle score={scores.totalRisk.score} grade={scores.totalRisk.grade} label="종합리스크" />
          </div>
        </div>

        {/* Score interpretations */}
        <div className="px-6 pb-5 space-y-2">
          {(
            [
              scores.location,
              scores.visibility,
              scores.rent,
              scores.businessFit,
              scores.competitionRisk,
            ]
          ).map((s) => {
            const gc2 = gradeColor(s.grade)
            return (
              <div key={s.label} className="flex items-center gap-3">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${gc2.border} ${gc2.bg} ${gc2.text} shrink-0 w-14 justify-center`}>
                  {s.grade} {s.label}
                </span>
                <p className="text-xs text-slate-600">{s.interpretation}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Strengths */}
      <AnalysisCard title="입지의 장점" icon={TrendingUp} iconColor="text-emerald-500">
        {analysis.strengths.map((item, i) => (
          <AnalysisItemRow key={i} item={item} type="strength" />
        ))}
      </AnalysisCard>

      {/* Risks */}
      <AnalysisCard title="위험요인" icon={AlertTriangle} iconColor="text-amber-500">
        {analysis.risks.map((item, i) => (
          <AnalysisItemRow key={i} item={item} type="risk" />
        ))}
      </AnalysisCard>

      {/* Market */}
      <AnalysisCard title="고객·경쟁환경" icon={Users} iconColor="text-blue-500">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: '주요 고객층', value: analysis.marketData.mainCustomerAge },
            { label: '경쟁점포', value: `${analysis.marketData.competitorCount}곳` },
            { label: '최근 신규', value: `${analysis.marketData.newStores}곳` },
            { label: '최근 폐업', value: `${analysis.marketData.closedStores}곳` },
          ].map(m => (
            <div key={m.label} className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">{m.label}</p>
              <p className="text-lg font-bold text-slate-800">{m.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4 mb-4">
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-0.5">상권 매출 변화</p>
            <div className="flex items-center gap-1 justify-center">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <p className="text-xl font-black text-red-600">
                {analysis.marketData.salesChange}%
              </p>
            </div>
          </div>
          <div className="w-px h-12 bg-slate-200 shrink-0" />
          <p className="text-xs text-slate-600 leading-relaxed flex-1">
            {analysis.marketData.interpretation}
          </p>
        </div>
      </AnalysisCard>

      {/* Contract checklist */}
      <AnalysisCard title="계약 전 확인사항" icon={CheckCircle2} iconColor="text-slate-500">
        <p className="text-xs text-slate-500 mb-4">
          항목을 클릭하면 상태가 변경됩니다: <span className="font-semibold text-slate-600">미확인</span> →{' '}
          <span className="font-semibold text-emerald-600">확인완료</span> →{' '}
          <span className="font-semibold text-red-600">우려사항</span>
        </p>
        <div>
          {analysis.contractChecks.map(check => (
            <ChecklistItem key={check.id} check={check} analysisId={analysis.id} />
          ))}
        </div>
      </AnalysisCard>

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-2 pb-6">
        <Link
          href="/compare"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
        >
          <GitCompare className="w-4 h-4" />
          후보지 비교하기
        </Link>
        <Link
          href={`/report/${analysis.id}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0f172a] text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
        >
          <FileText className="w-4 h-4" />
          고객 리포트 보기
        </Link>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          {new Date(analysis.createdAt).toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  )
}
