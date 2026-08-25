'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getAnalysis, getStore } from '@/lib/storage'
import { AnalysisResult, Store, FLOOR_LABELS, RECOMMENDATION_LABELS, VISIBILITY_LABELS } from '@/types'
import { formatMoney, gradeColor, recommendationColor } from '@/lib/utils'
import { Printer, Share2, ArrowLeft, GitCompare, AlertTriangle, TrendingUp, CheckCircle, XCircle, MinusCircle } from 'lucide-react'
import Link from 'next/link'

function ReportSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-200 last:border-0 break-inside-avoid">
      <div className="px-8 py-3 bg-[#f8f9fb] border-b border-slate-200 flex items-center gap-3">
        <span className="text-[10px] font-black text-white bg-[#0b1120] rounded-full w-5 h-5 flex items-center justify-center shrink-0">{number}</span>
        <h3 className="text-sm font-bold text-[#0b1120] uppercase tracking-wide">{title}</h3>
      </div>
      <div className="px-8 py-6">{children}</div>
    </div>
  )
}

function DataRow({ label, value, highlight, note }: { label: string; value: string; highlight?: boolean; note?: string }) {
  return (
    <div className="flex py-2.5 border-b border-slate-100 last:border-0 gap-2">
      <dt className="w-40 shrink-0 text-xs font-semibold text-slate-500">{label}</dt>
      <dd className={`text-sm flex-1 ${highlight ? 'text-[#0b1120] font-bold' : 'text-slate-800 font-medium'}`}>
        {value}
        {note && <span className="text-xs text-slate-400 ml-2">{note}</span>}
      </dd>
    </div>
  )
}

function StatusIcon({ value }: { value: boolean | undefined }) {
  if (value === undefined) return <MinusCircle className="w-4 h-4 text-slate-300 shrink-0" />
  if (value) return <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
  return <XCircle className="w-4 h-4 text-amber-500 shrink-0" />
}

function RiskBadge({ level }: { level: 'low' | 'caution' | 'high' | 'unknown' }) {
  const cfg = {
    low: { label: '관리 가능', cls: 'bg-emerald-100 text-emerald-700' },
    caution: { label: '주의', cls: 'bg-amber-100 text-amber-700' },
    high: { label: '고부담', cls: 'bg-red-100 text-red-700' },
    unknown: { label: '계산 불가', cls: 'bg-slate-100 text-slate-500' },
  }
  const c = cfg[level]
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.cls}`}>{c.label}</span>
}

export default function ReportPage() {
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
  const ra = analysis.rentAnalysis
  const ba = analysis.bizAnalysis
  const checkVerified = analysis.contractChecks.filter(c => c.status === 'verified').length
  const checkConcern = analysis.contractChecks.filter(c => c.status === 'concern').length
  const checkTotal = analysis.contractChecks.length
  const displayName = store.address || store.name
  const totalMonthly = store.monthlyRent + store.maintenanceFee
  const accessLabel = (v?: string) =>
    v === 'excellent' ? '우수' : v === 'good' ? '양호' : v === 'average' ? '보통' : v === 'poor' ? '불량' : '미입력'

  // Final opinion paragraphs
  const finalParagraph1 = (() => {
    const grade = analysis.overallGrade
    const floor = FLOOR_LABELS[store.floor]
    const biz = store.desiredBusiness
    if (grade === 'A+' || grade === 'A') {
      return `${displayName} 점포는 ${biz} 출점을 우선 검토할 수 있는 조건을 갖추고 있습니다. ${floor} 위치와 가시성 조건이 상대적으로 양호하며, 입력된 점포 조건을 종합하면 해당 업종 운영에 필요한 기본 요건을 충족하고 있습니다. 다만, 이 분석은 입력된 데이터를 기반으로 한 것이며 현장에서의 실제 환경이 분석 결과와 다를 수 있으므로 반드시 현장 확인을 병행하십시오.`
    }
    if (grade === 'B+' || grade === 'B') {
      return `${displayName} 점포는 ${biz} 출점을 조건부로 검토할 수 있는 수준입니다. ${floor} 접근성과 임대조건에서 일부 유리한 요소가 확인되지만, 위험요인도 병존하고 있어 계약 전 추가 검토와 현장 재확인이 필요합니다. 이 분석은 입력된 조건 기반의 참고 자료이며, 실제 상권환경은 현장 방문을 통해 직접 확인하여야 합니다.`
    }
    return `${displayName} 점포는 ${biz} 출점에 앞서 위험요인과 임대조건을 보수적으로 재검토할 필요가 있습니다. 분석 결과 일부 항목에서 우려사항이 확인되었으며, 계약 전 임대인과의 조건 협상 및 현장 점검을 철저히 진행할 것을 권고합니다.`
  })()

  const finalParagraph2 = (() => {
    const biz = store.desiredBusiness
    if (ra) {
      if (ra.rentRatioPct !== null) {
        return `임대료 측면에서 월세 ${formatMoney(ra.monthlyRent)}는 입력된 예상매출 기준 ${ra.rentRatioPct.toFixed(1)}% 수준입니다. ${ra.interpretation} ${biz} 업종은 임대료 외에도 인건비, 원재료비, 마케팅 비용 등 변동비 구조를 함께 검토해야 하며, 정확한 손익분기점은 업종별 원가율과 인건비 계획을 반영한 별도의 손익 계산이 필요합니다.`
      } else {
        return `임대료 측면에서 월세 ${formatMoney(ra.monthlyRent)}를 기준으로, 임대료 비율을 10% 수준으로 관리하려면 약 ${formatMoney(ra.referenceSalesAt10pct)}의 월매출이 필요합니다. 이 수치는 임대료 부담 판단을 위한 참고값이며 손익분기점과는 다릅니다. ${biz} 업종의 원가율과 인건비를 포함한 실제 손익분기점은 별도의 계산이 필요합니다.`
      }
    }
    return `임대조건과 예상매출을 함께 검토하여 임대료 부담률을 사전에 계산하십시오. ${biz} 업종의 원가율과 인건비를 포함한 손익분기점 분석을 별도로 진행할 것을 권고합니다.`
  })()

  const finalParagraph3 = (() => {
    const checks = ba?.mustCheckFactors?.slice(0, 3).join(', ') ?? '시설 조건, 건물 용도, 경쟁환경'
    return `계약 전 반드시 확인해야 할 핵심 사항은 ${checks} 등입니다. 특히 경쟁환경 데이터는 현재 연결되지 않아 현장에서 직접 파악해야 합니다. 반경 300~500m 내 동종업종 수와 최근 신규·폐업 현황을 확인하십시오. 본 분석이 현장 판단과 크게 다를 경우, 추가 정보를 입력하여 분석을 업데이트하거나 전문 컨설턴트의 도움을 받는 것이 좋습니다.`
  })()

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm 12mm; }
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size: 12px; }
          .print-break { page-break-before: always; }
          .break-inside-avoid { break-inside: avoid; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-8 no-print">
          <Link href={`/analysis/${analysis.id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            분석 결과로
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/compare" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors">
              <GitCompare className="w-4 h-4" />
              후보지 비교
            </Link>
            <button
              onClick={() => navigator.clipboard.writeText(window.location.href).then(() => alert('링크가 복사되었습니다.'))}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              공유
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0b1120] text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              <Printer className="w-4 h-4" />
              PDF / 인쇄
            </button>
          </div>
        </div>

        {/* Report body */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden print:shadow-none print:border-0">

          {/* Report header */}
          <div className="bg-[#0b1120] px-8 py-10 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-3">상권연구소 AI PRO · Store Location Analysis Report</p>
                <h1 className="text-2xl font-black mb-1 leading-tight">점포·입지 분석 리포트</h1>
                <p className="text-slate-400 text-sm">{displayName}</p>
                <p className="text-slate-500 text-xs mt-1">{store.desiredBusiness} · {FLOOR_LABELS[store.floor]} · {store.areaPyeong}평</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-slate-500 text-[10px] mb-1">분석일</p>
                <p className="text-white text-sm font-semibold">
                  {new Date(analysis.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <div className={`mt-3 inline-flex items-center px-4 py-1.5 rounded-full border ${rc.border} ${rc.bg}`}>
                  <span className={`text-xs font-bold ${rc.text}`}>{RECOMMENDATION_LABELS[analysis.recommendation]}</span>
                </div>
                <div className={`mt-2 w-20 h-20 rounded-2xl border-2 ${gc.border} ${gc.bg} flex flex-col items-center justify-center ml-auto`}>
                  <span className={`text-3xl font-black ${gc.text} leading-none`}>{analysis.overallGrade}</span>
                  <span className={`text-xs font-bold ${gc.text} opacity-70`}>{analysis.overallScore}점</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            {/* 01. Executive Summary */}
            <ReportSection number="01" title="Executive Summary">
              <div className={`rounded-xl p-5 border-l-4 ${rc.border} bg-slate-50 mb-5`}>
                <p className={`text-xs font-bold mb-1.5 ${rc.text}`}>{RECOMMENDATION_LABELS[analysis.recommendation]}</p>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">{analysis.summary}</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-2">핵심 강점</p>
                  <ul className="space-y-1.5">
                    {analysis.strengths.slice(0, 4).map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-xs font-semibold text-slate-800">{s.title}</span>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{s.interpretation.slice(0, 60)}…</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-2">핵심 위험</p>
                  <ul className="space-y-1.5">
                    {analysis.risks.slice(0, 4).map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-xs font-semibold text-slate-800">{r.title}</span>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{r.interpretation.slice(0, 60)}…</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              {ba && ba.mustCheckFactors.length > 0 && (
                <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider mb-2">계약 전 핵심 확인</p>
                  <div className="flex flex-wrap gap-2">
                    {ba.mustCheckFactors.slice(0, 5).map((f, i) => (
                      <span key={i} className="text-xs bg-blue-100 text-blue-800 rounded-full px-2.5 py-1 font-medium">{f.split('—')[0].trim()}</span>
                    ))}
                  </div>
                </div>
              )}
            </ReportSection>

            {/* 02. 점포 기본조건 */}
            <ReportSection number="02" title="점포 기본조건">
              <div className="grid grid-cols-2 gap-x-8">
                <dl>
                  <DataRow label="주소" value={displayName} highlight />
                  <DataRow label="희망 업종" value={store.desiredBusiness} highlight />
                  <DataRow label="업종 분류" value={ba?.categoryLabel ?? '기타'} />
                  {store.currentBusiness && <DataRow label="현재 운영 업종" value={store.currentBusiness} />}
                  {store.previousBusiness && <DataRow label="이전 운영 업종" value={store.previousBusiness} />}
                  {store.contractPeriod && <DataRow label="계약 기간" value={store.contractPeriod} />}
                </dl>
                <dl>
                  <DataRow label="층수" value={FLOOR_LABELS[store.floor]} />
                  <DataRow label="전용면적" value={`${store.areaPyeong}평${store.areaSqm ? ` (${store.areaSqm}㎡)` : ''}`} />
                  <DataRow label="전면폭" value={`${store.frontageMeters}m`} />
                  <DataRow label="코너 여부" value={store.isCorner ? '코너 점포' : '일반 점포'} />
                  {store.dualExposure !== undefined && <DataRow label="양면 노출" value={store.dualExposure ? '해당' : '해당 없음'} />}
                </dl>
              </div>
            </ReportSection>

            {/* 03. 입지 분석 */}
            <ReportSection number="03" title="입지 분석">
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: '입지 점수', score: scores.location.score, grade: scores.location.grade },
                  { label: '가시성 점수', score: scores.visibility.score, grade: scores.visibility.grade },
                  { label: '업종 적합도', score: scores.businessFit.score, grade: scores.businessFit.grade },
                ].map(({ label, score, grade }) => {
                  const sg = gradeColor(grade as import('@/types').Grade)
                  return (
                    <div key={label} className={`rounded-xl p-4 border ${sg.border} ${sg.bg} text-center`}>
                      <p className="text-[10px] font-semibold text-slate-500 mb-1">{label}</p>
                      <p className={`text-2xl font-black ${sg.text}`}>{grade}</p>
                      <p className={`text-xs font-bold ${sg.text} opacity-70`}>{score}점</p>
                    </div>
                  )
                })}
              </div>
              <div className="grid grid-cols-2 gap-x-8">
                <dl>
                  <DataRow label="층수" value={FLOOR_LABELS[store.floor]} />
                  <DataRow label="가시성" value={VISIBILITY_LABELS[store.visibility]} />
                  <DataRow label="전면폭" value={`${store.frontageMeters}m`} />
                  <DataRow label="코너" value={store.isCorner ? '해당' : '해당 없음'} />
                </dl>
                <dl>
                  <DataRow label="도보 접근성" value={accessLabel(store.pedestrianAccess ?? store.walkAccess)} />
                  <DataRow label="차량 접근성" value={accessLabel(store.vehicleAccess ?? store.carAccess)} />
                  <DataRow label="대중교통" value={accessLabel(store.publicTransportAccess)} />
                  <DataRow label="주차" value={`${store.parkingCount}대`} />
                </dl>
              </div>
              <div className="mt-4 space-y-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-600 mb-1">입지 평가</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{scores.location.interpretation}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-600 mb-1">가시성 평가</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{scores.visibility.interpretation}</p>
                </div>
              </div>
            </ReportSection>

            {/* 04. 업종 적합성 */}
            <ReportSection number="04" title="업종 적합성">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                <p className="text-xs font-bold text-slate-600 mb-1">업종 적합도 평가</p>
                <p className="text-xs text-slate-600 leading-relaxed">{scores.businessFit.interpretation}</p>
              </div>
              {ba && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-2">유리 요소</p>
                    <ul className="space-y-1.5">
                      {ba.favorableFactors.map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          <span className="text-xs text-slate-700">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-2">불리 요소 및 특화 리스크</p>
                    <ul className="space-y-1.5">
                      {[...ba.unfavorableFactors, ...ba.specificRisks].map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                          <span className="text-xs text-slate-700">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {ba && ba.mustCheckFactors.length > 0 && (
                <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider mb-2">업종별 필수 확인 항목</p>
                  <ol className="space-y-1">
                    {ba.mustCheckFactors.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[10px] font-black text-blue-400 mt-0.5 shrink-0">{i + 1}.</span>
                        <span className="text-xs text-blue-800">{f}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </ReportSection>

            {/* 05. 임대조건 */}
            <ReportSection number="05" title="임대조건 분석">
              <div className="grid grid-cols-2 gap-x-8 mb-4">
                <dl>
                  <DataRow label="보증금" value={formatMoney(store.deposit)} highlight />
                  <DataRow label="월세" value={formatMoney(store.monthlyRent)} highlight />
                  <DataRow label="관리비" value={store.maintenanceFee > 0 ? formatMoney(store.maintenanceFee) : '별도 없음'} />
                </dl>
                <dl>
                  <DataRow label="권리금" value={store.premium > 0 ? formatMoney(store.premium) : '없음'} />
                  <DataRow label="월 고정비 합계" value={formatMoney(totalMonthly)} highlight />
                  {store.vatIncluded && <DataRow label="VAT" value="포함" />}
                </dl>
              </div>
              {ra && (
                <div className="bg-[#f8f9fb] border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-slate-700">임대료 부담 분석</p>
                    <RiskBadge level={ra.riskLevel} />
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
                      <p className="text-[10px] text-slate-500 mb-1">임대료 비율</p>
                      <p className="text-lg font-black text-slate-800">{ra.rentRatioPct !== null ? `${ra.rentRatioPct.toFixed(1)}%` : '—'}</p>
                      <p className="text-[10px] text-slate-400">월세 ÷ 예상매출</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
                      <p className="text-[10px] text-slate-500 mb-1">10% 기준 필요매출</p>
                      <p className="text-base font-black text-slate-800">{formatMoney(ra.referenceSalesAt10pct)}</p>
                      <p className="text-[10px] text-slate-400">참고값 (손익분기점 아님)</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
                      <p className="text-[10px] text-slate-500 mb-1">예상 월매출</p>
                      <p className="text-base font-black text-slate-800">{ra.expectedMonthlySales ? formatMoney(ra.expectedMonthlySales) : '미입력'}</p>
                      <p className="text-[10px] text-slate-400">입력된 값 기준</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{ra.interpretation}</p>
                </div>
              )}
              {store.estimatedInteriorCost && store.estimatedInteriorCost > 0 && (
                <div className="mt-3">
                  <DataRow label="예상 인테리어" value={formatMoney(store.estimatedInteriorCost)} note="(원상복구 범위 계약서 확인 필요)" />
                </div>
              )}
              <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-600 mb-1">임대조건 평가</p>
                <p className="text-xs text-slate-600 leading-relaxed">{scores.rent.interpretation}</p>
              </div>
            </ReportSection>

            {/* 06. 고객·수요 */}
            <ReportSection number="06" title="고객·수요 현황">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
                <p className="text-sm font-semibold text-slate-400 mb-1">데이터 미연결</p>
                <p className="text-xs text-slate-400 leading-relaxed">유동인구, 생활인구, 연령대별 수요 데이터는 현재 연결되지 않았습니다. 현장 방문 시 직접 파악하십시오.</p>
              </div>
            </ReportSection>

            {/* 07. 경쟁환경 */}
            <ReportSection number="07" title="경쟁환경 및 상권현황">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center mb-4">
                <p className="text-sm font-semibold text-slate-400 mb-1">데이터 미연결</p>
                <p className="text-xs text-slate-400 leading-relaxed">{analysis.marketData.interpretation}</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-700 mb-1">현장 직접 확인 권고</p>
                <ul className="space-y-1">
                  {[
                    `반경 300~500m 내 ${store.desiredBusiness} 동종업종 수`,
                    '최근 3개월 신규 오픈·폐업 현황',
                    '주요 경쟁점의 영업 시간·가격대·고객층',
                    '계절·요일별 유동인구 패턴',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[10px] font-black text-amber-500 mt-0.5">{i + 1}.</span>
                      <span className="text-xs text-amber-800">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ReportSection>

            {/* 08. 주요 위험요인 */}
            <ReportSection number="08" title="주요 위험요인">
              <div className="space-y-5">
                {analysis.risks.map((item, i) => (
                  <div key={i} className="border-l-3 border-amber-400 pl-4" style={{ borderLeftWidth: '3px', borderLeftColor: '#f59e0b' }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-sm font-bold text-slate-800">{item.title}</span>
                      <span className="text-xs font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{item.data}</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-1 leading-relaxed">{item.interpretation}</p>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">{item.impact}</p>
                    {item.action && (
                      <p className="text-xs text-amber-700 font-semibold mt-1.5 leading-relaxed">→ {item.action}</p>
                    )}
                  </div>
                ))}
              </div>
            </ReportSection>

            {/* 09. 계약 전 현장 확인 */}
            <ReportSection number="09" title="계약 전 현장 확인 체크리스트">
              <div className="flex gap-4 mb-3 text-xs text-slate-500">
                <span>전체 {checkTotal}항목</span>
                <span className="text-emerald-600 font-semibold">확인완료 {checkVerified}개</span>
                {checkConcern > 0 && <span className="text-red-600 font-semibold">우려사항 {checkConcern}개</span>}
                <span className="text-slate-400">미확인 {checkTotal - checkVerified - checkConcern}개</span>
              </div>
              <div className="divide-y divide-slate-100">
                {analysis.contractChecks.map(check => (
                  <div key={check.id} className="flex items-start justify-between py-2.5 gap-3">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="text-[10px] font-bold text-slate-400 border border-slate-200 rounded px-1 py-0.5 shrink-0 mt-0.5">{check.category}</span>
                      <span className="text-xs text-slate-700 leading-snug">{check.item}</span>
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                      check.status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                      check.status === 'concern' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-400'
                    }`}>
                      {check.status === 'verified' ? '확인완료' : check.status === 'concern' ? '우려사항' : '미확인'}
                    </span>
                  </div>
                ))}
              </div>
            </ReportSection>

            {/* 10. 시설·설비 */}
            {(store.duct !== undefined || store.cityGas !== undefined || store.elevator !== undefined) && (
              <ReportSection number="10" title="시설·설비 현황">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '닥트(환기) 설치 가능', value: store.duct },
                    { label: '도시가스 인입', value: store.cityGas },
                    { label: '엘리베이터', value: store.elevator },
                    { label: '전용 화장실', value: store.restroom },
                    { label: '배수 양호', value: store.drainage },
                    { label: '하수 역류 이력 없음', value: store.sewer },
                    { label: '소방 적합', value: store.fireSafety },
                  ].map(({ label, value }) =>
                    value !== undefined ? (
                      <div key={label} className="flex items-center gap-2 py-2 border-b border-slate-100 last:border-0">
                        <StatusIcon value={value} />
                        <span className="text-xs text-slate-700">{label}</span>
                        <span className="ml-auto text-xs font-semibold text-slate-500">{value ? '확인' : '미확인·불가'}</span>
                      </div>
                    ) : null
                  )}
                  {store.electricCapacity && (
                    <div className="flex items-center gap-2 py-2 border-b border-slate-100">
                      <CheckCircle className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-700">전기 용량</span>
                      <span className="ml-auto text-xs font-semibold text-slate-600">{store.electricCapacity}</span>
                    </div>
                  )}
                </div>
              </ReportSection>
            )}

            {/* 11. 손익 시뮬레이션 */}
            {store.expectedMonthlySales && store.expectedMonthlySales > 0 && (
              <ReportSection number="11" title="손익 시뮬레이션 (입력값 기준 참고)">
                <div className="divide-y divide-slate-100">
                  {[
                    { label: '입력된 예상 월매출', value: formatMoney(store.expectedMonthlySales), color: 'text-emerald-700', bold: true },
                    { label: '월세 + 관리비 (고정비)', value: `− ${formatMoney(totalMonthly)}`, color: 'text-red-600', bold: true },
                    { label: '인건비', value: '별도 확인 필요', color: 'text-slate-400', bold: false },
                    { label: '재료비·변동비', value: '별도 확인 필요', color: 'text-slate-400', bold: false },
                    { label: '기타 (마케팅·소모품)', value: '별도 확인 필요', color: 'text-slate-400', bold: false },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-2.5">
                      <span className="text-xs text-slate-600">{row.label}</span>
                      <span className={`text-sm ${row.bold ? 'font-bold' : 'font-medium'} ${row.color}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-xs text-amber-800 leading-relaxed">
                    위 수치는 입력된 데이터 기반 참고값입니다. 정확한 손익분기점은 업종별 원가율·인건비·마케팅비를 포함한 별도 계산이 필요합니다. 전문 세무사 또는 컨설턴트와 함께 검토하십시오.
                  </p>
                </div>
              </ReportSection>
            )}

            {/* 12. 현장 메모 */}
            {store.fieldMemo && (
              <ReportSection number="12" title="현장 메모">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{store.fieldMemo}</p>
              </ReportSection>
            )}

            {/* 13. 최종 종합의견 */}
            <ReportSection number="13" title="최종 종합의견">
              <div className={`rounded-xl p-5 border-l-4 mb-5 ${rc.border} bg-slate-50`}>
                <p className={`text-sm font-bold ${rc.text} mb-1`}>{RECOMMENDATION_LABELS[analysis.recommendation]}</p>
                <p className="text-[10px] text-slate-400">종합 점수: {analysis.overallScore}점 ({analysis.overallGrade})</p>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-slate-700 leading-relaxed">{finalParagraph1}</p>
                <p className="text-sm text-slate-700 leading-relaxed">{finalParagraph2}</p>
                <p className="text-sm text-slate-700 leading-relaxed">{finalParagraph3}</p>
              </div>
              <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-400 leading-relaxed">
                  본 리포트는 입력된 점포조건을 기반으로 분석 엔진이 생성한 참고자료입니다. 최종 계약 결정은 반드시 현장 방문, 임대인 확인, 법률·세무 전문가 검토를 병행하십시오. 상권연구소 AI PRO V0.1은 의사결정 지원 서비스이며, 투자 성과를 보장하지 않습니다.
                </p>
              </div>
            </ReportSection>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-[#0b1120] flex items-center justify-between">
            <p className="text-xs text-slate-400">상권연구소 AI PRO V0.1 · 의사결정 지원 서비스</p>
            <p className="text-xs text-slate-400">{new Date(analysis.createdAt).toLocaleDateString('ko-KR')}</p>
          </div>
        </div>
      </div>
    </>
  )
}
