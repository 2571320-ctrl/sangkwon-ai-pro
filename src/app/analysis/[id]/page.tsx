'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAnalysis, getStore, updateCheckStatus } from '@/lib/storage'
import { AnalysisResult, Store, FLOOR_LABELS, RECOMMENDATION_LABELS, CheckStatus } from '@/types'
import { formatMoney, gradeColor, recommendationColor } from '@/lib/utils'
import {
  ArrowLeft, GitCompare, FileText, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, Clock, MapPin, ChevronDown, ChevronUp, Database, Car,
  Zap, Eye, MessageSquare, ShieldAlert, DollarSign, BadgeCheck, Building2,
} from 'lucide-react'

// ── Sub-components ────────────────────────────────────────────────────────────

function GradeCircle({ score, grade, label }: { score: number; grade: string; label: string }) {
  const gc = gradeColor(grade as import('@/types').Grade)
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-12 h-12 rounded-full flex flex-col items-center justify-center border-2 ${gc.border} ${gc.bg}`}>
        <span className={`text-base font-black leading-none ${gc.text}`}>{grade}</span>
        <span className={`text-[9px] font-semibold ${gc.text} opacity-70`}>{score}점</span>
      </div>
      <span className="text-[11px] text-slate-500 font-medium text-center leading-tight">{label}</span>
    </div>
  )
}

function SectionCard({
  title, badge, icon: Icon, iconColor, children, defaultOpen = true, cardLabel,
}: {
  title: string; badge?: string; icon: React.ElementType; iconColor: string
  children: React.ReactNode; defaultOpen?: boolean; cardLabel?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {cardLabel && (
            <span className="text-[10px] font-black text-white bg-slate-700 rounded px-1.5 py-0.5">{cardLabel}</span>
          )}
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
          {badge && (
            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{badge}</span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="p-6 space-y-4">{children}</div>}
    </div>
  )
}

function AnalysisItemRow({ item, type }: { item: import('@/types').AnalysisItem; type: 'strength' | 'risk' }) {
  const isRisk = type === 'risk'
  return (
    <div className={`rounded-xl p-4 border ${isRisk ? 'border-amber-100 bg-amber-50/40' : 'border-emerald-100 bg-emerald-50/40'}`}>
      <div className="flex items-start gap-3 mb-2.5">
        {isRisk
          ? <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          : <TrendingUp className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />}
        <div>
          <h4 className="font-semibold text-slate-800 text-sm">{item.title}</h4>
          <p className="text-xs text-slate-500 mt-0.5 font-mono bg-slate-50 rounded px-1.5 py-0.5 inline-block">{item.data}</p>
        </div>
      </div>
      <div className="ml-7 space-y-2">
        <div>
          <span className="inline-block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">의미</span>
          <p className="text-xs text-slate-700 leading-relaxed">{item.interpretation}</p>
        </div>
        <div>
          <span className="inline-block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            {isRisk ? '점포·업종에 미치는 영향' : '업종에 미치는 의미'}
          </span>
          <p className="text-xs text-slate-700 leading-relaxed">{item.impact}</p>
        </div>
        {item.action && (
          <div className={`mt-2 rounded-lg px-3 py-2 ${isRisk ? 'bg-amber-100/60' : 'bg-emerald-100/60'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isRisk ? 'text-amber-700' : 'text-emerald-700'}`}>확인할 행동</span>
            <p className={`text-xs mt-0.5 leading-relaxed font-medium ${isRisk ? 'text-amber-800' : 'text-emerald-800'}`}>{item.action}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ChecklistItem({ check, analysisId }: { check: import('@/types').ContractCheck; analysisId: string }) {
  const [status, setStatus] = useState<CheckStatus>(check.status)
  function cycle() {
    const next: CheckStatus = status === 'unchecked' ? 'verified' : status === 'verified' ? 'concern' : 'unchecked'
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
    <div className="flex items-start justify-between py-2.5 border-b border-slate-100 last:border-0 gap-3">
      <div className="flex-1">
        <span className="inline-block text-[10px] font-bold text-slate-400 border border-slate-200 rounded px-1 py-0.5 mr-2">{check.category}</span>
        <span className="text-sm text-slate-700 leading-snug">{check.item}</span>
      </div>
      <button onClick={cycle} className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${cfg.class}`}>
        {cfg.label}
      </button>
    </div>
  )
}

function DataBadge({ label, value, color = 'slate', sub }: { label: string; value: string; color?: 'slate' | 'blue' | 'emerald' | 'amber' | 'red'; sub?: string }) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-50 border-slate-100',
    blue: 'bg-blue-50 border-blue-100',
    emerald: 'bg-emerald-50 border-emerald-100',
    amber: 'bg-amber-50 border-amber-100',
    red: 'bg-red-50 border-red-100',
  }
  return (
    <div className={`rounded-xl p-3 border text-center ${colors[color]}`}>
      <p className="text-[10px] text-slate-500 mb-1 font-medium">{label}</p>
      <p className="text-sm font-bold text-slate-800">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function ScoreBar({ label, score, grade, interpretation }: { label: string; score: number; grade: string; interpretation: string }) {
  const gc = gradeColor(grade as import('@/types').Grade)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        <span className={`text-xs font-black ${gc.text}`}>{grade} {score}점</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all ${score >= 75 ? 'bg-emerald-500' : score >= 60 ? 'bg-blue-500' : score >= 45 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${score}%` }} />
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">{interpretation}</p>
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
  const md = analysis.marketData
  const ra = analysis.rentAnalysis
  const ba = analysis.bizAnalysis
  const displayName = store.address || store.name
  const totalMonthly = store.monthlyRent + store.maintenanceFee
  const checksByCategory = analysis.contractChecks.reduce<Record<string, import('@/types').ContractCheck[]>>((acc, c) => {
    if (!acc[c.category]) acc[c.category] = []
    acc[c.category].push(c)
    return acc
  }, {})
  const accessLabel = (v?: string) =>
    v === 'excellent' ? '우수' : v === 'good' ? '양호' : v === 'average' ? '보통' : v === 'poor' ? '불량' : '미입력'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/store/new" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          새 분석
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-700 font-medium truncate max-w-[240px]">{displayName}</span>
      </div>

      {/* 분석 대상 정보 요약 */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">분석 대상</p>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <h2 className="font-bold text-slate-900 truncate">{displayName}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                {FLOOR_LABELS[store.floor]} · {store.areaPyeong}평
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700">
                {store.desiredBusiness}
              </span>
              {store.frontageMeters > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">전면 {store.frontageMeters}m</span>
              )}
              {store.isCorner && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-50 text-violet-700">코너</span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0 space-y-1">
            <div>
              <p className="text-[10px] text-slate-400">보증금</p>
              <p className="text-sm font-bold text-slate-800">{formatMoney(store.deposit)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">월세</p>
              <p className="text-sm font-bold text-slate-800">{formatMoney(store.monthlyRent)}</p>
            </div>
          </div>
        </div>
        {/* 미확인 항목 */}
        {(!store.frontageMeters || store.frontageMeters === 5) && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-[10px] text-slate-400">
              <span className="font-bold text-amber-600">미확인: </span>
              {[
                !store.frontageMeters ? '전면폭' : null,
                store.parkingCount === 0 ? '주차 현황' : null,
                store.visibility === 'average' ? '가시성 상세' : null,
                !store.publicTransportAccess ? '대중교통 접근성' : null,
              ].filter(Boolean).join(' / ') || '주요 조건 입력 완료'}
            </p>
          </div>
        )}
      </div>

      {/* CARD A — 종합판단 */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-3 bg-slate-800 flex items-center gap-2">
          <span className="text-[10px] font-black text-white bg-slate-600 rounded px-1.5 py-0.5">CARD A</span>
          <span className="text-sm font-bold text-white">종합판단</span>
        </div>
        <div className={`px-6 pt-6 pb-5 border-b ${rc.border}`}>
          <div className="flex items-start gap-5">
            <div className={`rounded-2xl p-4 ${gc.bg} border ${gc.border} text-center shrink-0 min-w-[80px]`}>
              <div className={`text-4xl font-black ${gc.text} leading-none`}>{analysis.overallGrade}</div>
              <div className={`text-xs font-bold ${gc.text} opacity-70 mt-1`}>{analysis.overallScore}점</div>
            </div>
            <div className="flex-1">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border mb-3 ${rc.border} ${rc.bg} ${rc.text}`}>
                {RECOMMENDATION_LABELS[analysis.recommendation]}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{analysis.summary}</p>
            </div>
          </div>
        </div>

        {/* Score bars */}
        <div className="px-6 py-5 border-b border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">항목별 평가</p>
          <div className="space-y-4">
            <ScoreBar label="입지" score={scores.location.score} grade={scores.location.grade} interpretation={scores.location.interpretation} />
            <ScoreBar label="가시성" score={scores.visibility.score} grade={scores.visibility.grade} interpretation={scores.visibility.interpretation} />
            <ScoreBar label="임대조건" score={scores.rent.score} grade={scores.rent.grade} interpretation={scores.rent.interpretation} />
            <ScoreBar label="업종적합도" score={scores.businessFit.score} grade={scores.businessFit.grade} interpretation={scores.businessFit.interpretation} />
          </div>
        </div>

        {/* Top strengths & risks summary */}
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">핵심 강점</p>
            <ul className="space-y-1.5">
              {analysis.strengths.slice(0, 3).map((s, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span className="text-xs text-slate-700">{s.title}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">핵심 위험</p>
            <ul className="space-y-1.5">
              {analysis.risks.slice(0, 3).map((r, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span className="text-xs text-slate-700">{r.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* CARD B — 입지·가시성 */}
      <SectionCard title="입지·접근성·가시성" icon={MapPin} iconColor="text-blue-500" cardLabel="CARD B">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <DataBadge label="층수" value={FLOOR_LABELS[store.floor]} color="blue" />
          <DataBadge label="전용면적" value={`${store.areaPyeong}평${store.areaSqm ? ` (${store.areaSqm}㎡)` : ''}`} />
          <DataBadge label="전면폭" value={`${store.frontageMeters}m`} color={store.frontageMeters >= 8 ? 'emerald' : store.frontageMeters >= 6 ? 'blue' : 'slate'} />
          <DataBadge label="코너 여부" value={store.isCorner ? '코너 점포' : '일반 점포'} color={store.isCorner ? 'emerald' : 'slate'} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <DataBadge label="가시성" value={accessLabel(store.visibility)} color={store.visibility === 'excellent' || store.visibility === 'good' ? 'emerald' : store.visibility === 'poor' ? 'amber' : 'slate'} />
          <DataBadge label="도보 접근성" value={accessLabel(store.pedestrianAccess ?? store.walkAccess)} />
          <DataBadge label="차량 접근성" value={accessLabel(store.vehicleAccess ?? store.carAccess)} />
          <DataBadge label="대중교통" value={accessLabel(store.publicTransportAccess)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <DataBadge label="주차" value={`${store.parkingCount}대`} color={store.parkingCount >= 3 ? 'emerald' : store.parkingCount > 0 ? 'blue' : 'amber'} />
          <DataBadge label="양면노출" value={store.dualExposure ? '해당' : '해당 없음'} color={store.dualExposure ? 'emerald' : 'slate'} />
        </div>
        <div className="space-y-3">
          {analysis.strengths.map((item, i) => <AnalysisItemRow key={i} item={item} type="strength" />)}
        </div>
      </SectionCard>

      {/* CARD C — 위험요인 */}
      <SectionCard title="위험요인" icon={ShieldAlert} iconColor="text-amber-500" cardLabel="CARD C">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2">
          <p className="text-xs text-amber-800 font-medium leading-relaxed">
            아래 위험요인은 입력된 조건을 기반으로 도출된 것입니다. 현장 방문으로 실제 상태를 직접 확인하십시오.
          </p>
        </div>
        {analysis.risks.map((item, i) => <AnalysisItemRow key={i} item={item} type="risk" />)}
      </SectionCard>

      {/* CARD D — 임대조건 분석 */}
      <SectionCard title="임대조건 분석" icon={DollarSign} iconColor="text-emerald-600" cardLabel="CARD D">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <DataBadge label="보증금" value={formatMoney(store.deposit)} color="blue" />
          <DataBadge label="월세" value={formatMoney(store.monthlyRent)} />
          <DataBadge label="관리비" value={store.maintenanceFee > 0 ? formatMoney(store.maintenanceFee) : '없음'} />
          <DataBadge label="권리금" value={store.premium > 0 ? formatMoney(store.premium) : '없음'} color={store.premium > 0 ? 'amber' : 'emerald'} />
        </div>

        {/* Rent ratio analysis */}
        {ra && (
          <div className="rounded-xl border overflow-hidden">
            <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-bold text-white">임대료 부담 분석</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                ra.riskLevel === 'low' ? 'bg-emerald-500 text-white' :
                ra.riskLevel === 'caution' ? 'bg-amber-500 text-white' :
                ra.riskLevel === 'high' ? 'bg-red-500 text-white' :
                'bg-slate-500 text-white'
              }`}>
                {ra.riskLevel === 'low' ? '관리 가능' : ra.riskLevel === 'caution' ? '주의' : ra.riskLevel === 'high' ? '고부담' : '계산 불가'}
              </span>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <DataBadge label="월 고정비 합계" value={formatMoney(ra.totalMonthly)} />
                <DataBadge
                  label="임대료 비율"
                  value={ra.rentRatioPct !== null ? `${ra.rentRatioPct.toFixed(1)}%` : '계산 불가'}
                  color={ra.riskLevel === 'low' ? 'emerald' : ra.riskLevel === 'caution' ? 'amber' : ra.riskLevel === 'high' ? 'red' : 'slate'}
                  sub="월세 ÷ 예상매출"
                />
                <DataBadge
                  label="10% 기준 필요매출"
                  value={formatMoney(ra.referenceSalesAt10pct)}
                  color="blue"
                  sub="참고값 (손익분기점 아님)"
                />
              </div>
              {store.expectedMonthlySales && store.expectedMonthlySales > 0 && (
                <DataBadge label="입력된 예상 월매출" value={formatMoney(store.expectedMonthlySales)} color="emerald" />
              )}
              <div className={`rounded-xl p-4 border ${
                ra.riskLevel === 'low' ? 'border-emerald-200 bg-emerald-50' :
                ra.riskLevel === 'caution' ? 'border-amber-200 bg-amber-50' :
                ra.riskLevel === 'high' ? 'border-red-200 bg-red-50' :
                'border-slate-200 bg-slate-50'
              }`}>
                <p className="text-xs text-slate-700 leading-relaxed">{ra.interpretation}</p>
              </div>
              {ra.rentRatioPct === null && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <p className="text-xs text-blue-700 font-medium">
                    예상 월매출을 입력하면 임대료 비율을 정확히 계산할 수 있습니다. 점포 입력 화면에서 추가하거나 AI에게 알려주세요.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {(store.estimatedInteriorCost || store.contractPeriod) && (
          <div className="grid grid-cols-2 gap-3">
            {store.estimatedInteriorCost ? (
              <DataBadge label="예상 인테리어" value={formatMoney(store.estimatedInteriorCost)} color="amber" />
            ) : null}
            {store.contractPeriod ? (
              <DataBadge label="계약 기간" value={store.contractPeriod} />
            ) : null}
          </div>
        )}

        <div className={`rounded-xl p-4 border ${gradeColor(scores.rent.grade).border} ${gradeColor(scores.rent.grade).bg}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-black ${gradeColor(scores.rent.grade).text}`}>{scores.rent.grade}</span>
            <span className="text-xs font-semibold text-slate-600">임대조건 점수 {scores.rent.score}점</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">{scores.rent.interpretation}</p>
        </div>
      </SectionCard>

      {/* CARD E — 업종 적합성 */}
      <SectionCard title="업종 적합성" icon={Zap} iconColor="text-violet-500" cardLabel="CARD E">
        <div className="grid grid-cols-2 gap-3">
          <DataBadge label="희망 업종" value={store.desiredBusiness} color="blue" />
          <DataBadge label="업종 분류" value={ba?.categoryLabel ?? '기타'} color="blue" />
          {store.currentBusiness && <DataBadge label="현재 운영" value={store.currentBusiness} />}
          {store.previousBusiness && <DataBadge label="이전 운영" value={store.previousBusiness} />}
        </div>

        <div className={`rounded-xl p-4 border ${gradeColor(scores.businessFit.grade).border} ${gradeColor(scores.businessFit.grade).bg}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-black ${gradeColor(scores.businessFit.grade).text}`}>{scores.businessFit.grade}</span>
            <span className="text-xs font-semibold text-slate-600">업종 적합도 {scores.businessFit.score}점</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">{scores.businessFit.interpretation}</p>
        </div>

        {ba && (
          <>
            {ba.favorableFactors.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2">유리 요소</p>
                <ul className="space-y-1.5">
                  {ba.favorableFactors.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span className="text-xs text-emerald-800">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {ba.unfavorableFactors.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2">불리 요소</p>
                <ul className="space-y-1.5">
                  {ba.unfavorableFactors.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span className="text-xs text-amber-800">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2">반드시 확인할 요소</p>
              <ul className="space-y-1.5">
                {ba.mustCheckFactors.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-blue-500 mt-0.5 shrink-0">{i + 1}.</span>
                    <span className="text-xs text-blue-800">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            {ba.specificRisks.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">업종 특화 리스크</p>
                <ul className="space-y-1.5">
                  {ba.specificRisks.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                      <span className="text-xs text-slate-600">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </SectionCard>

      {/* 경쟁환경 — 데이터 미연결 */}
      <SectionCard title="경쟁환경" icon={Database} iconColor="text-slate-400" badge="데이터 미연결" defaultOpen={false}>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
          <Database className="w-7 h-7 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500 mb-1">상권 경쟁환경 데이터 미연결</p>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            {store.desiredBusiness} 업종의 경쟁점포 수, 신규·폐업 현황, 매출 변화 데이터는 현재 연결되지 않았습니다.
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-bold">현장 직접 확인 권고:</span> 반경 300~500m 내 동종업종 수, 최근 3개월 신규·폐업 현황,
            주요 경쟁점의 영업 시간·가격대·고객층을 현장에서 직접 파악하십시오.
          </p>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{md.interpretation}</p>
      </SectionCard>

      {/* CARD F — 계약 전 확인사항 */}
      <SectionCard title="계약 전 확인사항" icon={CheckCircle2} iconColor="text-slate-500" cardLabel="CARD F">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-slate-500">
            클릭: <span className="font-semibold text-slate-600">미확인</span> →{' '}
            <span className="font-semibold text-emerald-600">확인완료</span> →{' '}
            <span className="font-semibold text-red-600">우려사항</span>
          </p>
          <span className="text-xs text-slate-400 font-medium">
            {analysis.contractChecks.filter(c => c.status === 'verified').length}/{analysis.contractChecks.length} 완료
          </span>
        </div>
        {Object.entries(checksByCategory).map(([category, checks]) => (
          <div key={category}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-3 mb-1">{category}</p>
            {checks.map(check => (
              <ChecklistItem key={check.id} check={check} analysisId={analysis.id} />
            ))}
          </div>
        ))}
        {store.fieldMemo && (
          <div className="mt-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">현장 메모</p>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{store.fieldMemo}</p>
          </div>
        )}
      </SectionCard>

      {/* 시설·설비 현황 */}
      {(store.duct !== undefined || store.cityGas !== undefined || store.elevator !== undefined) && (
        <SectionCard title="시설·설비 현황" icon={Building2} iconColor="text-amber-500" defaultOpen={false}>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {store.duct !== undefined && <DataBadge label="닥트(환기)" value={store.duct ? '설치 가능' : '불가'} color={store.duct ? 'emerald' : 'amber'} />}
            {store.cityGas !== undefined && <DataBadge label="도시가스" value={store.cityGas ? '인입' : '미인입'} color={store.cityGas ? 'emerald' : 'amber'} />}
            {store.elevator !== undefined && <DataBadge label="엘리베이터" value={store.elevator ? '있음' : '없음'} color={store.elevator ? 'emerald' : 'slate'} />}
            {store.restroom !== undefined && <DataBadge label="전용화장실" value={store.restroom ? '있음' : '없음'} color={store.restroom ? 'emerald' : 'slate'} />}
            {store.drainage !== undefined && <DataBadge label="배수" value={store.drainage ? '양호' : '확인필요'} color={store.drainage ? 'emerald' : 'amber'} />}
            {store.sewer !== undefined && <DataBadge label="하수역류" value={store.sewer ? '이력없음' : '이력있음'} color={store.sewer ? 'emerald' : 'amber'} />}
            {store.fireSafety !== undefined && <DataBadge label="소방" value={store.fireSafety ? '적합' : '확인필요'} color={store.fireSafety ? 'emerald' : 'amber'} />}
            {store.electricCapacity && <DataBadge label="전기용량" value={store.electricCapacity} />}
          </div>
        </SectionCard>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2 pb-6">
        <Link
          href="/compare"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
        >
          <GitCompare className="w-4 h-4" />
          후보지 비교
        </Link>
        <Link
          href={`/report/${analysis.id}`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0f172a] text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
        >
          <FileText className="w-4 h-4" />
          고객 리포트 보기
        </Link>
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          AI에게 이 결과 질문하기
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
