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
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-5 break-inside-avoid">
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
        <span className="text-[10px] font-black text-slate-400 bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center shrink-0">{number}</span>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function DataRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex py-2 border-b border-slate-100 last:border-0 gap-2">
      <dt className="w-36 shrink-0 text-xs font-semibold text-slate-500">{label}</dt>
      <dd className={`text-sm font-medium flex-1 ${highlight ? 'text-blue-700 font-bold' : 'text-slate-800'}`}>{value}</dd>
    </div>
  )
}

function StatusIcon({ value }: { value: boolean | undefined }) {
  if (value === undefined) return <MinusCircle className="w-4 h-4 text-slate-300" />
  if (value) return <CheckCircle className="w-4 h-4 text-emerald-500" />
  return <XCircle className="w-4 h-4 text-amber-500" />
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
  const checkVerified = analysis.contractChecks.filter(c => c.status === 'verified').length
  const checkConcern = analysis.contractChecks.filter(c => c.status === 'concern').length
  const checkTotal = analysis.contractChecks.length
  const displayName = store.address || store.name
  const totalMonthly = store.monthlyRent + store.maintenanceFee
  const hasRent = store.monthlyRent > 0
  const rentRatio = store.expectedMonthlySales && store.expectedMonthlySales > 0
    ? (store.monthlyRent / store.expectedMonthlySales * 100).toFixed(1)
    : null

  return (
    <>
      {/* Print CSS */}
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm 12mm; }
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-break { page-break-before: always; }
          .break-inside-avoid { break-inside: avoid; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 py-8">
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
              고객 공유
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f172a] text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              <Printer className="w-4 h-4" />
              PDF / 인쇄
            </button>
          </div>
        </div>

        {/* Report body */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden print:shadow-none print:border-0">
          {/* Report header */}
          <div className="bg-[#0b1120] px-8 py-8 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">상권연구소 AI PRO</p>
                <h1 className="text-2xl font-black mb-1">점포·입지 분석 리포트</h1>
                <p className="text-slate-400 text-sm">Store &amp; Location Analysis Report</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-xs mb-1">분석일시</p>
                <p className="text-white text-sm font-semibold">
                  {new Date(analysis.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${rc.border} ${rc.bg}`}>
                  <span className={`text-xs font-bold ${rc.text}`}>{RECOMMENDATION_LABELS[analysis.recommendation]}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-0">
            {/* 1. 분석 점포 */}
            <ReportSection number="1" title="분석 점포">
              <dl className="divide-y divide-slate-100">
                <DataRow label="주소" value={displayName} highlight />
                <DataRow label="희망 업종" value={store.desiredBusiness} />
                {store.currentBusiness && <DataRow label="현재 업종" value={store.currentBusiness} />}
                {store.previousBusiness && <DataRow label="이전 업종" value={store.previousBusiness} />}
                {store.contractPeriod && <DataRow label="계약 기간" value={store.contractPeriod} />}
              </dl>
            </ReportSection>

            {/* 2. 점포 기본조건 */}
            <ReportSection number="2" title="점포 기본조건">
              <div className="grid grid-cols-2 gap-x-8">
                <dl className="divide-y divide-slate-100">
                  <DataRow label="층수" value={FLOOR_LABELS[store.floor]} />
                  <DataRow label="전용면적" value={`${store.areaPyeong}평${store.areaSqm ? ` (${store.areaSqm}㎡)` : ''}`} />
                  <DataRow label="전면폭" value={`${store.frontageMeters}m`} />
                  <DataRow label="코너 여부" value={store.isCorner ? '코너 점포' : '일반 점포'} />
                  {store.dualExposure !== undefined && <DataRow label="양면 노출" value={store.dualExposure ? '해당' : '해당 없음'} />}
                </dl>
                <dl className="divide-y divide-slate-100">
                  <DataRow label="가시성" value={VISIBILITY_LABELS[store.visibility]} />
                  <DataRow label="주차" value={`${store.parkingCount}대`} />
                  <DataRow label="도보 접근성" value={store.pedestrianAccess ? (store.pedestrianAccess === 'excellent' ? '우수' : store.pedestrianAccess === 'good' ? '양호' : store.pedestrianAccess === 'average' ? '보통' : '불량') : (store.walkAccess === 'excellent' ? '우수' : store.walkAccess === 'good' ? '양호' : '보통')} />
                  {store.vehicleAccess && <DataRow label="차량 접근성" value={store.vehicleAccess === 'excellent' ? '우수' : store.vehicleAccess === 'good' ? '양호' : store.vehicleAccess === 'average' ? '보통' : '불량'} />}
                  {store.publicTransportAccess && <DataRow label="대중교통" value={store.publicTransportAccess === 'excellent' ? '우수' : store.publicTransportAccess === 'good' ? '양호' : store.publicTransportAccess === 'average' ? '보통' : '불량'} />}
                </dl>
              </div>
            </ReportSection>

            {/* 3. 임대조건 */}
            <ReportSection number="3" title="임대조건">
              <div className="grid grid-cols-2 gap-x-8 mb-4">
                <dl className="divide-y divide-slate-100">
                  <DataRow label="보증금" value={formatMoney(store.deposit)} />
                  <DataRow label="월세" value={hasRent ? formatMoney(store.monthlyRent) : '미입력'} />
                </dl>
                <dl className="divide-y divide-slate-100">
                  <DataRow label="관리비" value={store.maintenanceFee > 0 ? formatMoney(store.maintenanceFee) : '별도 없음'} />
                  <DataRow label="권리금" value={store.premium > 0 ? formatMoney(store.premium) : '없음'} />
                </dl>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">월 고정비 합계 (월세+관리비)</span>
                  <span className="text-sm font-black text-slate-800">{formatMoney(totalMonthly)}</span>
                </div>
                {store.estimatedInteriorCost && store.estimatedInteriorCost > 0 && (
                  <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-200">
                    <span className="text-xs text-slate-500">예상 인테리어</span>
                    <span className="text-xs font-bold text-slate-700">{formatMoney(store.estimatedInteriorCost)}</span>
                  </div>
                )}
                {rentRatio && (
                  <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-200">
                    <span className="text-xs text-slate-500">월세 비율 (예상 월매출 {formatMoney(store.expectedMonthlySales ?? 0)} 기준)</span>
                    <span className={`text-xs font-bold ${parseFloat(rentRatio) <= 10 ? 'text-emerald-600' : parseFloat(rentRatio) <= 15 ? 'text-amber-600' : 'text-red-600'}`}>{rentRatio}%</span>
                  </div>
                )}
              </div>
            </ReportSection>

            {/* 4. 종합판단 */}
            <ReportSection number="4" title="종합판단">
              <div className={`rounded-xl p-5 border ${rc.border} ${rc.bg} mb-4`}>
                <div className="flex items-center gap-4 mb-3">
                  <div className={`rounded-xl px-4 py-3 ${gc.bg} border ${gc.border} text-center shrink-0`}>
                    <div className={`text-3xl font-black ${gc.text}`}>{analysis.overallGrade}</div>
                    <div className={`text-xs font-bold ${gc.text} opacity-70`}>{analysis.overallScore}점</div>
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${rc.text} mb-1`}>{RECOMMENDATION_LABELS[analysis.recommendation]}</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{analysis.summary}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[scores.location, scores.visibility, scores.rent, scores.businessFit, scores.competitionRisk, scores.totalRisk].map(s => {
                  const sgc = gradeColor(s.grade)
                  return (
                    <div key={s.label} className={`rounded-xl p-4 border ${sgc.border} ${sgc.bg}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-600">{s.label}</span>
                        <span className={`text-sm font-black ${sgc.text}`}>{s.grade}</span>
                      </div>
                      <div className="w-full h-1 bg-white/60 rounded-full">
                        <div className={`h-full ${sgc.dot} rounded-full`} style={{ width: `${s.score}%` }} />
                      </div>
                      <p className={`text-[10px] mt-1.5 ${sgc.text} leading-tight`}>{s.interpretation}</p>
                    </div>
                  )
                })}
              </div>
            </ReportSection>

            {/* 5. 입지의 장점 */}
            <ReportSection number="5" title="입지의 장점">
              <div className="space-y-4">
                {analysis.strengths.map((item, i) => (
                  <div key={i} className="border-l-2 border-emerald-400 pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-sm font-bold text-slate-800">{item.title}</span>
                      <span className="text-xs text-slate-400">{item.data}</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-1">{item.interpretation}</p>
                    <p className="text-xs text-slate-700 font-medium">{item.impact}</p>
                  </div>
                ))}
              </div>
            </ReportSection>

            {/* 6. 위험요인 */}
            <ReportSection number="6" title="위험요인">
              <div className="space-y-4">
                {analysis.risks.map((item, i) => (
                  <div key={i} className="border-l-2 border-amber-400 pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-sm font-bold text-slate-800">{item.title}</span>
                      <span className="text-xs text-slate-400">{item.data}</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-1">{item.interpretation}</p>
                    <p className="text-xs text-slate-700">{item.impact}</p>
                    {item.action && <p className="text-xs text-amber-700 font-semibold mt-1">→ {item.action}</p>}
                  </div>
                ))}
              </div>
            </ReportSection>

            {/* 7. 시설·설비 */}
            {(store.duct !== undefined || store.cityGas !== undefined || store.elevator !== undefined) && (
              <ReportSection number="7" title="시설·설비 현황">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '닥트(환기)', value: store.duct },
                    { label: '도시가스', value: store.cityGas },
                    { label: '엘리베이터', value: store.elevator },
                    { label: '전용 화장실', value: store.restroom },
                    { label: '배수 양호', value: store.drainage },
                    { label: '하수 역류 없음', value: store.sewer },
                    { label: '소방 적합', value: store.fireSafety },
                  ].map(({ label, value }) => (
                    value !== undefined ? (
                      <div key={label} className="flex items-center gap-2 py-2 border-b border-slate-100 last:border-0">
                        <StatusIcon value={value} />
                        <span className="text-xs text-slate-700">{label}</span>
                        <span className="ml-auto text-xs font-semibold text-slate-500">{value ? '확인' : '미확인/불가'}</span>
                      </div>
                    ) : null
                  ))}
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

            {/* 8. 상권현황 */}
            <ReportSection number="8" title="상권현황 및 경쟁환경">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-center">
                <p className="text-sm font-semibold text-slate-500 mb-1">데이터 미연결</p>
                <p className="text-xs text-slate-400 leading-relaxed">{analysis.marketData.interpretation}</p>
              </div>
              <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  현장 확인 권고: 반경 500m 내 {store.desiredBusiness} 동종업종 수, 최근 신규·폐업 현황, 주요 경쟁점의 영업 시간과 가격대를 직접 파악하십시오.
                </p>
              </div>
            </ReportSection>

            {/* 9. 계약 전 확인사항 */}
            <ReportSection number="9" title="계약 전 확인사항">
              <div className="flex gap-4 mb-4 text-xs">
                <span className="font-semibold text-slate-600">전체 {checkTotal}개</span>
                <span className="text-emerald-600 font-semibold">확인완료 {checkVerified}개</span>
                {checkConcern > 0 && <span className="text-red-600 font-semibold">우려사항 {checkConcern}개</span>}
              </div>
              <div className="divide-y divide-slate-100">
                {analysis.contractChecks.map(check => (
                  <div key={check.id} className="flex items-start justify-between py-2.5 gap-3">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="text-[10px] font-bold text-slate-400 border border-slate-200 rounded px-1 py-0.5 shrink-0 mt-0.5">{check.category}</span>
                      <span className="text-xs text-slate-700 leading-snug">{check.item}</span>
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      check.status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                      check.status === 'concern' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {check.status === 'verified' ? '확인완료' : check.status === 'concern' ? '우려사항' : '미확인'}
                    </span>
                  </div>
                ))}
              </div>
            </ReportSection>

            {/* 10. 손익 시뮬레이션 (if data available) */}
            {store.expectedMonthlySales && store.expectedMonthlySales > 0 && (
              <ReportSection number="10" title="손익 시뮬레이션 (입력 기준)">
                <div className="space-y-2">
                  {[
                    { label: '예상 월매출', value: formatMoney(store.expectedMonthlySales), color: 'text-emerald-700' },
                    { label: '월세 + 관리비', value: `- ${formatMoney(totalMonthly)}`, color: 'text-red-600' },
                    { label: '인건비 (추정)', value: '별도 확인 필요', color: 'text-slate-500' },
                    { label: '재료비·기타 변동비', value: '별도 확인 필요', color: 'text-slate-500' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <span className="text-xs text-slate-600">{row.label}</span>
                      <span className={`text-sm font-bold ${row.color}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    위 수치는 입력된 데이터 기반 참고값입니다. 실제 변동비(인건비, 재료비, 배달비 등)를 포함한 정확한 손익 계산은 업종별 전문가와 별도로 진행하십시오.
                  </p>
                </div>
              </ReportSection>
            )}

            {/* 11. 현장메모 */}
            {store.fieldMemo && (
              <ReportSection number="11" title="현장 메모">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{store.fieldMemo}</p>
              </ReportSection>
            )}

            {/* 12. 핵심의견 */}
            <ReportSection number="12" title="핵심의견 및 면책사항">
              <div className={`rounded-xl p-5 border ${rc.border} ${rc.bg} mb-4`}>
                <p className={`text-sm font-bold ${rc.text} mb-2`}>{RECOMMENDATION_LABELS[analysis.recommendation]}</p>
                <p className="text-sm text-slate-700 leading-relaxed">{analysis.summary}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 leading-relaxed">
                  본 리포트는 입력된 점포조건을 기반으로 분석 엔진이 생성한 참고자료입니다.
                  최종 계약 결정은 반드시 현장 방문, 임대인 확인, 법률·세무 전문가 검토를 병행하십시오.
                  상권연구소 AI PRO V0.1은 의사결정 지원 서비스이며, 투자 성과를 보장하지 않습니다.
                </p>
              </div>
            </ReportSection>
          </div>

          {/* Report footer */}
          <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-xs text-slate-400">상권연구소 AI PRO V0.1 · 의사결정 지원 서비스</p>
            <p className="text-xs text-slate-400">{new Date(analysis.createdAt).toLocaleDateString('ko-KR')}</p>
          </div>
        </div>
      </div>
    </>
  )
}
