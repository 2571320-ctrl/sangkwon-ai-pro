'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getAnalysis, getStore } from '@/lib/storage'
import { AnalysisResult, Store, FLOOR_LABELS, RECOMMENDATION_LABELS, VISIBILITY_LABELS } from '@/types'
import { formatMoney, gradeColor, recommendationColor } from '@/lib/utils'
import { Printer, Share2, ArrowLeft, GitCompare, AlertTriangle, TrendingUp } from 'lucide-react'
import Link from 'next/link'

function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors no-print"
    >
      <Printer className="w-4 h-4" />
      PDF / 인쇄
    </button>
  )
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex py-2 border-b border-slate-100 last:border-0">
      <dt className="w-36 shrink-0 text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-800 font-medium">{value}</dd>
    </div>
  )
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
  const md = analysis.marketData

  const checkVerified = analysis.contractChecks.filter(c => c.status === 'verified').length
  const checkConcern = analysis.contractChecks.filter(c => c.status === 'concern').length
  const checkTotal = analysis.contractChecks.length

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-8 no-print">
        <div className="flex items-center gap-3">
          <Link
            href={`/analysis/${analysis.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            분석 결과로
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/compare"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            <GitCompare className="w-4 h-4" />
            후보지 비교 추가
          </Link>
          <button
            onClick={() => {
              const url = window.location.href
              navigator.clipboard.writeText(url).then(() => alert('링크가 복사되었습니다.'))
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            고객 공유
          </button>
          <PrintButton />
        </div>
      </div>

      {/* Report */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden print:shadow-none print:border-0">
        {/* Header */}
        <div className="bg-[#0b1120] px-8 py-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">상권연구소 AI PRO</p>
              <h1 className="text-2xl font-black mb-1">점포·입지 분석 리포트</h1>
              <p className="text-slate-400 text-sm">Store & Location Analysis Report</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs mb-1">분석일시</p>
              <p className="text-white text-sm font-semibold">
                {new Date(analysis.createdAt).toLocaleDateString('ko-KR', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
              <p className="text-slate-500 text-xs mt-3">* 테스트 데이터 기반 분석</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-0">
          {/* 1. 분석점포 */}
          <ReportSection title="1. 분석 점포">
            <dl className="divide-y divide-slate-100">
              <DataRow label="점포명" value={store.name} />
              <DataRow label="주소" value={store.address} />
              <DataRow label="희망 업종" value={store.desiredBusiness} />
              {store.currentBusiness && <DataRow label="현재 업종" value={store.currentBusiness} />}
              {store.previousBusiness && <DataRow label="이전 업종" value={store.previousBusiness} />}
            </dl>
          </ReportSection>

          {/* 2. 점포 기본조건 */}
          <ReportSection title="2. 점포 기본조건">
            <div className="grid grid-cols-2 gap-x-8">
              <dl className="divide-y divide-slate-100">
                <DataRow label="층수" value={FLOOR_LABELS[store.floor]} />
                <DataRow label="전용면적" value={`${store.areaPyeong}평`} />
                <DataRow label="전면폭" value={`${store.frontageMeters}m`} />
                <DataRow label="코너 여부" value={store.isCorner ? '코너 점포' : '일반 점포'} />
              </dl>
              <dl className="divide-y divide-slate-100">
                <DataRow label="가시성" value={VISIBILITY_LABELS[store.visibility]} />
                <DataRow label="주차" value={`${store.parkingCount}대`} />
                <DataRow label="도보 접근성" value={store.walkAccess === 'excellent' ? '우수' : store.walkAccess === 'good' ? '양호' : '보통'} />
              </dl>
            </div>
          </ReportSection>

          {/* 3. 임대조건 */}
          <ReportSection title="3. 임대조건">
            <div className="grid grid-cols-2 gap-x-8">
              <dl className="divide-y divide-slate-100">
                <DataRow label="보증금" value={formatMoney(store.deposit)} />
                <DataRow label="월세" value={formatMoney(store.monthlyRent)} />
              </dl>
              <dl className="divide-y divide-slate-100">
                <DataRow label="관리비" value={store.maintenanceFee > 0 ? formatMoney(store.maintenanceFee) : '별도 없음'} />
                <DataRow label="권리금" value={store.premium > 0 ? formatMoney(store.premium) : '없음'} />
              </dl>
            </div>
          </ReportSection>

          {/* 4. 종합판단 */}
          <ReportSection title="4. 종합판단">
            <div className={`rounded-xl p-5 border ${rc.border} ${rc.bg} mb-4`}>
              <div className="flex items-center gap-4 mb-3">
                <div className={`rounded-xl px-4 py-3 ${gc.bg} border ${gc.border} text-center`}>
                  <div className={`text-3xl font-black ${gc.text}`}>{analysis.overallGrade}</div>
                  <div className={`text-xs font-bold ${gc.text} opacity-70`}>{analysis.overallScore}점</div>
                </div>
                <div>
                  <p className={`text-sm font-bold ${rc.text} mb-1`}>{RECOMMENDATION_LABELS[analysis.recommendation]}</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{analysis.summary}</p>
                </div>
              </div>
            </div>

            {/* Score grid */}
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  scores.location,
                  scores.visibility,
                  scores.rent,
                  scores.businessFit,
                  scores.competitionRisk,
                  scores.totalRisk,
                ]
              ).map(s => {
                const sgc = gradeColor(s.grade)
                return (
                  <div key={s.label} className={`rounded-xl p-4 border ${sgc.border} ${sgc.bg}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-600">{s.label}</span>
                      <span className={`text-sm font-black ${sgc.text}`}>{s.grade}</span>
                    </div>
                    <div className="w-full h-1 bg-white/60 rounded-full">
                      <div
                        className={`h-full ${sgc.dot} rounded-full`}
                        style={{ width: `${s.score}%` }}
                      />
                    </div>
                    <p className={`text-[10px] mt-1.5 ${sgc.text} leading-tight`}>{s.interpretation}</p>
                  </div>
                )
              })}
            </div>
          </ReportSection>

          {/* 5. 입지 장점 */}
          <ReportSection title="5. 입지의 장점">
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
          <ReportSection title="6. 위험요인">
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
                  {item.action && (
                    <p className="text-xs text-amber-700 font-semibold mt-1">→ {item.action}</p>
                  )}
                </div>
              ))}
            </div>
          </ReportSection>

          {/* 7. 상권현황 */}
          <ReportSection title="7. 상권현황 및 경쟁환경">
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: '주요 고객층', value: md.mainCustomerAge },
                { label: '경쟁점포', value: `${md.competitorCount}곳` },
                { label: '신규 점포', value: `${md.newStores}곳` },
                { label: '폐업 점포', value: `${md.closedStores}곳` },
              ].map(m => (
                <div key={m.label} className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                  <p className="text-[10px] text-slate-500 mb-1">{m.label}</p>
                  <p className="text-lg font-bold text-slate-800">{m.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-1">상권 매출 변화: <span className="text-red-600">{md.salesChange}%</span></p>
              <p className="text-xs text-slate-700 leading-relaxed">{md.interpretation}</p>
            </div>
          </ReportSection>

          {/* 8. 계약 전 확인사항 */}
          <ReportSection title="8. 계약 전 확인사항">
            <div className="flex gap-4 mb-4 text-xs">
              <span className="font-semibold text-slate-600">전체 {checkTotal}개 항목</span>
              <span className="text-emerald-600 font-semibold">확인완료 {checkVerified}개</span>
              {checkConcern > 0 && <span className="text-red-600 font-semibold">우려사항 {checkConcern}개</span>}
            </div>
            <div className="divide-y divide-slate-100">
              {analysis.contractChecks.map(check => (
                <div key={check.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 border border-slate-200 rounded px-1 py-0.5">{check.category}</span>
                    <span className="text-xs text-slate-700">{check.item}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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

          {/* 9. 핵심의견 */}
          <ReportSection title="9. 핵심의견">
            <div className={`rounded-xl p-5 border ${rc.border} ${rc.bg}`}>
              <p className={`text-sm font-bold ${rc.text} mb-3`}>{RECOMMENDATION_LABELS[analysis.recommendation]}</p>
              <p className="text-sm text-slate-700 leading-relaxed">{analysis.summary}</p>
            </div>
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
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
          <p className="text-xs text-slate-400">
            {new Date(analysis.createdAt).toLocaleDateString('ko-KR')}
          </p>
        </div>
      </div>
    </div>
  )
}
