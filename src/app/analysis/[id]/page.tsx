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
  MapPin,
  ChevronDown,
  ChevronUp,
  Database,
  Car,
  User,
  Zap,
  Eye,
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

function SectionCard({
  title,
  badge,
  icon: Icon,
  iconColor,
  children,
  defaultOpen = true,
}: {
  title: string
  badge?: string
  icon: React.ElementType
  iconColor: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
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
    <div className="flex items-start justify-between py-3 border-b border-slate-100 last:border-0 gap-3">
      <div className="flex-1">
        <span className="inline-block text-[10px] font-bold text-slate-400 border border-slate-200 rounded px-1 py-0.5 mr-2">{check.category}</span>
        <span className="text-sm text-slate-700 leading-snug">{check.item}</span>
      </div>
      <button
        onClick={cycle}
        className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${cfg.class}`}
      >
        {cfg.label}
      </button>
    </div>
  )
}

function DataBadge({ label, value, color = 'slate' }: { label: string; value: string; color?: 'slate' | 'blue' | 'emerald' | 'amber' }) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-50 border-slate-100',
    blue: 'bg-blue-50 border-blue-100',
    emerald: 'bg-emerald-50 border-emerald-100',
    amber: 'bg-amber-50 border-amber-100',
  }
  return (
    <div className={`rounded-xl p-4 border text-center ${colors[color]}`}>
      <p className="text-[10px] text-slate-500 mb-1 font-medium">{label}</p>
      <p className="text-sm font-bold text-slate-800">{value}</p>
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
  const displayName = store.address || store.name
  const totalMonthly = store.monthlyRent + store.maintenanceFee
  const checksByCategory = analysis.contractChecks.reduce<Record<string, import('@/types').ContractCheck[]>>((acc, c) => {
    if (!acc[c.category]) acc[c.category] = []
    acc[c.category].push(c)
    return acc
  }, {})

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/analysis" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          새 분석
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-700 font-medium truncate max-w-[240px]">{displayName}</span>
      </div>

      {/* Store info */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <h2 className="font-bold text-slate-900 truncate">{displayName}</h2>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                {FLOOR_LABELS[store.floor]} · {store.areaPyeong}평
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700">
                {store.desiredBusiness}
              </span>
              {store.frontageMeters > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                  전면 {store.frontageMeters}m
                </span>
              )}
              {store.isCorner && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-50 text-violet-700">코너</span>
              )}
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

      {/* Overall grade */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
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
        <div className="px-6 pb-5 space-y-2">
          {[scores.location, scores.visibility, scores.rent, scores.businessFit, scores.competitionRisk].map(s => {
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

      {/* Card A: 입지·접근성 */}
      <SectionCard title="A · 입지·접근성" icon={MapPin} iconColor="text-blue-500">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <DataBadge label="층수" value={FLOOR_LABELS[store.floor]} color="blue" />
          <DataBadge label="전용면적" value={`${store.areaPyeong}평${store.areaSqm ? ` (${store.areaSqm}㎡)` : ''}`} />
          <DataBadge label="전면폭" value={`${store.frontageMeters}m`} />
          <DataBadge label="코너 여부" value={store.isCorner ? '코너 점포' : '일반 점포'} color={store.isCorner ? 'emerald' : 'slate'} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <DataBadge label="도보 접근성" value={store.pedestrianAccess === 'excellent' ? '우수' : store.pedestrianAccess === 'good' ? '양호' : store.walkAccess === 'excellent' ? '우수' : store.walkAccess === 'good' ? '양호' : '보통'} />
          <DataBadge label="차량 접근성" value={store.vehicleAccess === 'excellent' ? '우수' : store.vehicleAccess === 'good' ? '양호' : store.carAccess === 'excellent' ? '우수' : store.carAccess === 'good' ? '양호' : '보통'} />
          <DataBadge label="대중교통" value={store.publicTransportAccess === 'excellent' ? '우수' : store.publicTransportAccess === 'good' ? '양호' : store.publicTransportAccess === 'average' ? '보통' : store.publicTransportAccess === 'poor' ? '불량' : '미입력'} />
        </div>
        <div className={`rounded-xl p-4 border ${gradeColor(scores.location.grade).border} ${gradeColor(scores.location.grade).bg}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-black ${gradeColor(scores.location.grade).text}`}>{scores.location.grade}</span>
            <span className="text-xs font-semibold text-slate-600">{scores.location.score}점</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">{scores.location.interpretation}</p>
        </div>
      </SectionCard>

      {/* Card B: 가시성·노출도 */}
      <SectionCard title="B · 가시성·노출도" icon={Eye} iconColor="text-violet-500">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <DataBadge label="가시성" value={store.visibility === 'excellent' ? '우수' : store.visibility === 'good' ? '양호' : store.visibility === 'average' ? '보통' : '불량'} color={store.visibility === 'excellent' || store.visibility === 'good' ? 'emerald' : store.visibility === 'average' ? 'slate' : 'amber'} />
          <DataBadge label="전면폭" value={`${store.frontageMeters}m`} color={store.frontageMeters >= 8 ? 'emerald' : store.frontageMeters >= 6 ? 'blue' : 'slate'} />
          <DataBadge label="양면노출" value={store.dualExposure ? '해당' : '해당 없음'} color={store.dualExposure ? 'emerald' : 'slate'} />
          <DataBadge label="주차" value={`${store.parkingCount}대`} color={store.parkingCount >= 3 ? 'emerald' : store.parkingCount > 0 ? 'blue' : 'amber'} />
        </div>
        {store.signageVisibility && (
          <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600">
            <span className="font-semibold">간판 가시성 메모: </span>{store.signageVisibility}
          </div>
        )}
        <div className={`rounded-xl p-4 border ${gradeColor(scores.visibility.grade).border} ${gradeColor(scores.visibility.grade).bg}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-black ${gradeColor(scores.visibility.grade).text}`}>{scores.visibility.grade}</span>
            <span className="text-xs font-semibold text-slate-600">{scores.visibility.score}점</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">{scores.visibility.interpretation}</p>
        </div>
      </SectionCard>

      {/* Card C: 임대조건 분석 */}
      <SectionCard title="C · 임대조건 분석" icon={TrendingDown} iconColor="text-emerald-500">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <DataBadge label="보증금" value={formatMoney(store.deposit)} color="blue" />
          <DataBadge label="월세" value={formatMoney(store.monthlyRent)} />
          <DataBadge label="관리비" value={store.maintenanceFee > 0 ? formatMoney(store.maintenanceFee) : '없음'} />
          <DataBadge label="권리금" value={store.premium > 0 ? formatMoney(store.premium) : '없음'} color={store.premium > 0 ? 'amber' : 'emerald'} />
        </div>
        {(store.estimatedInteriorCost || store.expectedMonthlySales) && (
          <div className="grid grid-cols-2 gap-3">
            {store.estimatedInteriorCost ? (
              <DataBadge label="예상 인테리어" value={formatMoney(store.estimatedInteriorCost)} color="amber" />
            ) : null}
            {store.expectedMonthlySales ? (
              <DataBadge label="예상 월매출" value={formatMoney(store.expectedMonthlySales)} color="emerald" />
            ) : null}
          </div>
        )}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-600">월 고정비 합계</span>
            <span className="text-sm font-black text-slate-800">{formatMoney(totalMonthly)}</span>
          </div>
          {store.expectedMonthlySales && store.expectedMonthlySales > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">월세 비율 (목표: 10% 이하)</span>
                <span className={`text-xs font-bold ${(store.monthlyRent / store.expectedMonthlySales) <= 0.1 ? 'text-emerald-600' : (store.monthlyRent / store.expectedMonthlySales) <= 0.15 ? 'text-amber-600' : 'text-red-600'}`}>
                  {((store.monthlyRent / store.expectedMonthlySales) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
        <div className={`rounded-xl p-4 border ${gradeColor(scores.rent.grade).border} ${gradeColor(scores.rent.grade).bg}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-black ${gradeColor(scores.rent.grade).text}`}>{scores.rent.grade}</span>
            <span className="text-xs font-semibold text-slate-600">{scores.rent.score}점</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">{scores.rent.interpretation}</p>
        </div>
      </SectionCard>

      {/* Card D: 업종 적합성 */}
      <SectionCard title="D · 업종 적합성" icon={Zap} iconColor="text-blue-500">
        <div className="grid grid-cols-2 gap-3">
          <DataBadge label="희망 업종" value={store.desiredBusiness} color="blue" />
          <DataBadge label="현재 업종" value={store.currentBusiness || '미입력'} />
          {store.previousBusiness && <DataBadge label="이전 업종" value={store.previousBusiness} />}
          {store.contractPeriod && <DataBadge label="계약 기간" value={store.contractPeriod} />}
        </div>
        <div className={`rounded-xl p-4 border ${gradeColor(scores.businessFit.grade).border} ${gradeColor(scores.businessFit.grade).bg}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-black ${gradeColor(scores.businessFit.grade).text}`}>{scores.businessFit.grade}</span>
            <span className="text-xs font-semibold text-slate-600">{scores.businessFit.score}점 · 업종적합도</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">{scores.businessFit.interpretation}</p>
        </div>
        <div className="space-y-3">
          {analysis.strengths.map((item, i) => <AnalysisItemRow key={i} item={item} type="strength" />)}
        </div>
      </SectionCard>

      {/* Card E: 경쟁환경 (데이터 미연결) */}
      <SectionCard title="E · 경쟁환경" icon={Database} iconColor="text-slate-400" badge="데이터 미연결">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
          <Database className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500 mb-1">상권 경쟁환경 데이터 미연결</p>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            {store.desiredBusiness} 업종의 경쟁점포 수, 신규·폐업 현황, 매출 변화 데이터는 현재 연결되지 않았습니다.
            현장 방문 시 직접 파악하여 판단하십시오.
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-xs text-amber-800 leading-relaxed font-medium">
            현장 확인 권고: 반경 500m 내 동종업종 수, 최근 3개월 신규·폐업 현황, 주요 경쟁점의 영업 시간 및 가격대를 직접 파악하십시오.
          </p>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{md.interpretation}</p>
      </SectionCard>

      {/* Card D-2: 위험요인 */}
      <SectionCard title="위험요인" icon={AlertTriangle} iconColor="text-amber-500">
        {analysis.risks.map((item, i) => <AnalysisItemRow key={i} item={item} type="risk" />)}
      </SectionCard>

      {/* Card F: 계약 전 체크리스트 */}
      <SectionCard title="F · 계약 전 확인사항" icon={CheckCircle2} iconColor="text-slate-500">
        <div className="flex items-center gap-4 mb-2">
          <p className="text-xs text-slate-500">
            항목 클릭: <span className="font-semibold text-slate-600">미확인</span> →{' '}
            <span className="font-semibold text-emerald-600">확인완료</span> →{' '}
            <span className="font-semibold text-red-600">우려사항</span>
          </p>
          <span className="text-xs text-slate-400">
            {analysis.contractChecks.filter(c => c.status === 'verified').length}/{analysis.contractChecks.length} 완료
          </span>
        </div>
        {Object.entries(checksByCategory).map(([category, checks]) => (
          <div key={category}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{category}</p>
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

      {/* Facility summary (if available) */}
      {(store.duct !== undefined || store.cityGas !== undefined || store.elevator !== undefined) && (
        <SectionCard title="시설·설비 현황" icon={Zap} iconColor="text-amber-500" defaultOpen={false}>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {store.duct !== undefined && <DataBadge label="닥트(환기)" value={store.duct ? '가능' : '불가'} color={store.duct ? 'emerald' : 'amber'} />}
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
