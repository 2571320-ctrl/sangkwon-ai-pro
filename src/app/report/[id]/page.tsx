'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getAnalysis, getStore } from '@/lib/storage'
import {
  AnalysisResult, Store, FLOOR_LABELS, RECOMMENDATION_LABELS,
  VISIBILITY_LABELS, ACCESS_LABELS, BIZ_CATEGORY_LABELS,
} from '@/types'
import { formatMoney, gradeColor, recommendationColor } from '@/lib/utils'
import {
  Printer, Share2, ArrowLeft, AlertTriangle, TrendingUp,
  CheckCircle, XCircle, MinusCircle, GitCompare, Eye,
  MapPin, Car, Train, Footprints, Building2, ParkingCircle,
  Users, ShieldAlert, ClipboardCheck, BarChart3, FileWarning,
} from 'lucide-react'
import Link from 'next/link'

/* ─── Helpers ─── */

function accessLabel(v?: string) {
  return ACCESS_LABELS[(v as keyof typeof ACCESS_LABELS)] ?? '미입력'
}

function visLabel(v?: string) {
  return VISIBILITY_LABELS[(v as keyof typeof VISIBILITY_LABELS)] ?? '미입력'
}

function riskColor(level: 'low' | 'caution' | 'high' | 'unknown') {
  return {
    low: { badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200', bar: 'bg-emerald-500', label: '관리 가능' },
    caution: { badge: 'bg-amber-100 text-amber-700 border border-amber-200', bar: 'bg-amber-500', label: '주의 구간' },
    high: { badge: 'bg-red-100 text-red-700 border border-red-200', bar: 'bg-red-500', label: '고부담' },
    unknown: { badge: 'bg-slate-100 text-slate-500 border border-slate-200', bar: 'bg-slate-300', label: '계산 불가' },
  }[level]
}

function BizBadge({ status }: { status: '유리' | '보통' | '주의' | '미확인' }) {
  const cls = {
    유리: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    보통: 'bg-slate-100 text-slate-600 border border-slate-200',
    주의: 'bg-amber-100 text-amber-700 border border-amber-200',
    미확인: 'bg-slate-50 text-slate-400 border border-slate-100',
  }[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${cls}`}>
      {status}
    </span>
  )
}

function StatusIcon({ value }: { value: boolean | undefined }) {
  if (value === undefined) return <MinusCircle className="w-4 h-4 text-slate-300 shrink-0" />
  if (value) return <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
  return <XCircle className="w-4 h-4 text-amber-500 shrink-0" />
}

function DataRow({ label, value, mono, highlight }: {
  label: string; value: string; mono?: boolean; highlight?: boolean
}) {
  return (
    <div className="flex items-start py-2 border-b border-slate-100 last:border-0 gap-3">
      <dt className="w-36 shrink-0 text-[11px] font-semibold text-slate-400">{label}</dt>
      <dd className={`text-[12px] flex-1 leading-snug ${highlight ? 'font-bold text-[#0b1120]' : 'font-medium text-slate-700'} ${mono ? 'font-mono' : ''}`}>
        {value}
      </dd>
    </div>
  )
}

/* ─── A4 Page Wrapper ─── */

function ReportPage({ children, pageNum, totalPages, noPadding, darkBg }: {
  children: React.ReactNode
  pageNum: number
  totalPages: number
  noPadding?: boolean
  darkBg?: boolean
}) {
  return (
    <div className={`report-page relative ${darkBg ? 'bg-[#0b1120]' : 'bg-white'} overflow-hidden`}>
      {!noPadding
        ? <div className="px-12 py-10">{children}</div>
        : children
      }
      {/* Page number — screen only */}
      <div className="absolute bottom-5 right-8 text-[10px] text-slate-300 font-medium report-pagenum">
        {pageNum} / {totalPages}
      </div>
    </div>
  )
}

/* ─── Section heading inside a page ─── */

function PageSection({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-[#0b1120]">
      {icon && <span className="text-[#0b1120]">{icon}</span>}
      <h2 className="text-sm font-black text-[#0b1120] uppercase tracking-wide">{label}</h2>
    </div>
  )
}

/* ─── Location block (PAGE 3) ─── */

interface LocBlock {
  icon: React.ReactNode
  title: string
  condition: string
  meaning: string
  bizImpact: string
  fieldCheck: string
}

function buildLocationBlocks(store: Store): LocBlock[] {
  const biz = store.desiredBusiness
  const floor = FLOOR_LABELS[store.floor]
  const pedAcc = accessLabel(store.pedestrianAccess ?? store.walkAccess)
  const carAcc = accessLabel(store.vehicleAccess ?? store.carAccess)
  const pubAcc = accessLabel(store.publicTransportAccess)
  const vis = visLabel(store.visibility)

  const floorMeaning: Record<string, string> = {
    '1층': '지상 1층은 가장 높은 자연 유입률을 가지며, 간판 노출 및 충동 방문 유도에 최적입니다.',
    '2층': '2층은 계단 이동이 필요해 자연 유입이 감소합니다. 간판 노출과 안내사인 강화가 필수입니다.',
    '3층': '3층은 도보 이동 고객 유입이 낮아 목적 방문형 업종에 적합합니다.',
    '4층 이상': '4층 이상은 엘리베이터 필수이며 자연 유입이 매우 낮습니다. 목적 방문 또는 온라인 예약 기반 업종 한정으로 검토하십시오.',
    '지하': '지하는 자연 유입이 낮고 가시성이 제한됩니다. 하부 통로 유동인구와 간판 유도 동선 확인이 중요합니다.',
  }

  return [
    {
      icon: <Footprints className="w-4 h-4" />,
      title: '도보 접근성',
      condition: `도보 접근성 ${pedAcc} · 차량 접근성 ${carAcc} · 대중교통 ${pubAcc}`,
      meaning: pedAcc === '우수' || pedAcc === '양호'
        ? '배후 도보 유동인구가 풍부하며 자연 유입 가능성이 높습니다. 퇴근 동선·쇼핑 동선과의 연계성을 현장에서 확인하십시오.'
        : '도보 접근성이 다소 낮아 간판·유도사인 전략이 더욱 중요해집니다. 근린 배후세대와 대중교통 이용객 분석이 필요합니다.',
      bizImpact: `${biz} 업종은 도보 접근이 ${pedAcc === '우수' || pedAcc === '양호' ? '유리하며 자연 유입 기대 가능' : '제한되어 마케팅·배달 채널 보완이 필요'}합니다. 차량 고객 비중에 따라 주차 확보 여부도 영향을 미칩니다.`,
      fieldCheck: '피크타임(점심·퇴근·주말) 도보 유동량 실측, 대중교통 정류장에서 점포까지의 동선 직접 보행 확인',
    },
    {
      icon: <Eye className="w-4 h-4" />,
      title: '가시성',
      condition: `가시성 ${vis} · 전면폭 ${store.frontageMeters}m · 코너 ${store.isCorner ? '해당' : '일반'}`,
      meaning: store.visibility === 'excellent' || store.visibility === 'good'
        ? '도로나 보행 동선에서 점포가 잘 보이는 조건입니다. 간판 설치 위치·크기에 따라 원거리 인지도를 높일 수 있습니다.'
        : '가시성이 제한되어 있어 신호등 앞, 교통 흐름, 인접 구조물의 차폐 여부를 반드시 현장에서 확인해야 합니다.',
      bizImpact: `${biz}는 충동 방문 비중이 높아 가시성이 매출에 직접 영향을 미칩니다. ${store.visibility === 'poor' ? '가시성이 낮으면 SNS·배달앱 채널 의존도를 높여야 하며 초기 인지 비용이 증가합니다.' : '현 가시성 조건은 초기 고객 유입에 유리하게 작용할 수 있습니다.'}`,
      fieldCheck: '도로 맞은편 50m·100m 지점에서 점포 식별 여부 확인, 야간 간판 가시성 별도 확인(주점 필수), 인접 간판·나무·구조물 차폐 여부 점검',
    },
    {
      icon: <Building2 className="w-4 h-4" />,
      title: '전면폭 및 층수',
      condition: `전면폭 ${store.frontageMeters}m · ${floor} · ${store.elevator ? '엘리베이터 있음' : '엘리베이터 미확인'}`,
      meaning: floorMeaning[floor] ?? `${floor} 위치입니다. 접근성과 가시성 측면에서 현장 확인이 필요합니다.`,
      bizImpact: `전면폭 ${store.frontageMeters}m는 ${store.frontageMeters >= 6 ? '간판 설치와 쇼윈도우 구성에 충분하며 개방감 확보에 유리합니다' : '협소하여 간판 가독성 확보와 실내 배치 최적화에 더 많은 노력이 필요합니다'}. ${store.floor !== '1f' ? '1층이 아니므로 안내사인 및 계단·엘리베이터 접근 동선 강화가 필요합니다.' : '1층으로 자연 유입에 유리합니다.'}`,
      fieldCheck: `실측 전면폭 확인(입구 위치 포함), ${store.floor !== '1f' ? '계단 폭·조명·청결도 확인, 엘리베이터 유무 및 운행 여부 직접 확인,' : ''} 간판 허가 가능 면적 및 위치 건물주 확인`,
    },
    {
      icon: <ParkingCircle className="w-4 h-4" />,
      title: '주차',
      condition: `주차 ${store.parkingCount > 0 ? `${store.parkingCount}대` : '없음 또는 미입력'}`,
      meaning: store.parkingCount > 0
        ? `${store.parkingCount}대의 주차 공간은 차량 방문 고객에게 직접적 편의를 제공합니다. 인근 공영주차장·노상주차 가능 여부도 추가 확인하십시오.`
        : '전용 주차 공간이 없거나 입력되지 않았습니다. 인근 공영주차장, 주차 가능 시간대, 불법주정차 단속 여부를 현장에서 확인하십시오.',
      bizImpact: `${biz} 업종에서 차량 고객 비중은 업종 특성과 상권 유형에 따라 다릅니다. ${store.parkingCount === 0 ? '주차 미확보 시 차량 고객층 이탈 가능성이 있으며, 특히 외식업·주점은 음주 후 귀가 수단 확보 여부가 매출에 영향을 줍니다.' : '주차 확보는 고객 방문 장벽을 낮춰 단가·체류시간 증가에 기여할 수 있습니다.'}`,
      fieldCheck: '주차장 위치·진입로 폭·야간 이용 가능 여부 확인, 인근 공영주차장 위치 및 요금 확인, 주말 만차 여부 직접 방문 확인',
    },
    {
      icon: <Car className="w-4 h-4" />,
      title: '차량 접근성',
      condition: `차량 접근성 ${carAcc} · 코너 ${store.isCorner ? '해당' : '비해당'} · 양면 노출 ${store.dualExposure ? '해당' : '해당 없음 또는 미입력'}`,
      meaning: carAcc === '우수' || carAcc === '양호'
        ? '주변 도로 구조상 차량 접근이 원활하며 승하차 공간 확보가 가능한 조건입니다.'
        : '차량 접근이 다소 제한적입니다. 일방통행·진입 금지 구간·불법주정차 단속 구역 여부를 현장에서 확인하십시오.',
      bizImpact: `코너 점포${store.isCorner ? '(해당)' : '(비해당)'}는 가시성과 차량 인지율에서 ${store.isCorner ? '유리한 조건입니다. 두 방향에서 간판 노출이 가능해 마케팅 효율이 높습니다.' : '일반적인 조건입니다. 단일 방향 노출을 최대화하는 간판 전략을 수립하십시오.'}`,
      fieldCheck: '차량 진입 가능 방향, 유턴·좌회전 가능 여부, 버스·택시 정류장 인접 여부, 단속 카메라 위치 확인',
    },
    {
      icon: <Train className="w-4 h-4" />,
      title: '대중교통 및 고객 동선',
      condition: `대중교통 접근성 ${pubAcc} · 배후세대 및 유동인구: 데이터 미연결`,
      meaning: pubAcc === '우수' || pubAcc === '양호'
        ? '지하철·버스 정류장과의 근접성이 높아 대중교통 이용 고객의 유입이 기대됩니다. 출퇴근 동선과의 중첩 여부를 확인하십시오.'
        : '대중교통 접근이 다소 불편한 조건입니다. 배후세대 도보 유입과 자차 고객 비중을 중심으로 수요를 평가하십시오.',
      bizImpact: `${biz} 업종의 고객 동선은 ${pubAcc === '우수' || pubAcc === '양호' ? '대중교통 이용 고객층까지 포함하여 폭넓은 수요 접근이 가능합니다' : '배후 주거·업무 세대 중심으로 구성될 가능성이 높습니다'}. 피크타임 동선 패턴 분석이 입지 평가에 핵심입니다.`,
      fieldCheck: '가장 가까운 지하철역·버스정류장까지 실측 도보 시간, 출퇴근 피크 시간대 직접 현장 방문, 주변 오피스·학교·주거 단지 분포 확인',
    },
  ]
}

/* ─── BizFit items (PAGE 4) ─── */

interface BizFitRow {
  item: string
  status: '유리' | '보통' | '주의' | '미확인'
  reason: string
}

function buildBizFitRows(store: Store, ba?: AnalysisResult['bizAnalysis']): BizFitRow[] {
  const rows: BizFitRow[] = []

  if (ba) {
    ba.favorableFactors.slice(0, 4).forEach(f => {
      const [item, reason] = f.split('—').map(s => s.trim())
      rows.push({ item: item ?? f, status: '유리', reason: reason ?? f })
    })
    ba.unfavorableFactors.slice(0, 3).forEach(f => {
      const [item, reason] = f.split('—').map(s => s.trim())
      rows.push({ item: item ?? f, status: '주의', reason: reason ?? f })
    })
    ba.mustCheckFactors.slice(0, 3).forEach(f => {
      const [item, reason] = f.split('—').map(s => s.trim())
      rows.push({ item: item ?? f, status: '미확인', reason: reason ?? f })
    })
    ba.specificRisks.slice(0, 2).forEach(f => {
      const [item, reason] = f.split('—').map(s => s.trim())
      rows.push({ item: item ?? f, status: '주의', reason: reason ?? f })
    })
  }

  // Fallback items when bizAnalysis not generated
  if (rows.length === 0) {
    const floor = FLOOR_LABELS[store.floor]
    rows.push(
      { item: '층수 접근성', status: store.floor === '1f' ? '유리' : '주의', reason: `${floor} 위치 — 자연 유입 접근성 영향` },
      { item: '가시성', status: (store.visibility === 'excellent' || store.visibility === 'good') ? '유리' : '보통', reason: `가시성 ${visLabel(store.visibility)} — 간판 노출도 반영` },
      { item: '전면폭', status: store.frontageMeters >= 6 ? '유리' : '보통', reason: `${store.frontageMeters}m — 간판 및 내부 배치에 영향` },
      { item: '주차', status: store.parkingCount > 0 ? '유리' : '미확인', reason: store.parkingCount > 0 ? `${store.parkingCount}대 주차 확보` : '주차 현황 미입력 — 현장 확인 필요' },
      { item: '경쟁환경', status: '미확인', reason: '경쟁 업종 현황 데이터 미연결 — 현장 직접 조사 필요' },
      { item: '시설·설비', status: store.duct !== undefined ? (store.duct ? '유리' : '주의') : '미확인', reason: store.duct !== undefined ? `닥트 ${store.duct ? '설치 가능' : '불가 — 별도 공사 비용 발생'}` : '시설 현황 미입력 — 방문 시 확인' },
    )
  }

  return rows
}

/* ─── Main component ─── */

export default function ReportPageComponent() {
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
  const ra = analysis.rentAnalysis
  const ba = analysis.bizAnalysis
  const displayName = store.address || store.name
  const totalMonthly = store.monthlyRent + store.maintenanceFee
  const createdDate = new Date(analysis.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const locBlocks = buildLocationBlocks(store)
  const bizRows = buildBizFitRows(store, ba)

  // PAGE count: 9 pages (no comparison page since we are single-store report)
  const TOTAL = 9

  // Final opinion paragraphs
  const opinionP1 = (() => {
    const grade = analysis.overallGrade
    const biz = store.desiredBusiness
    const floor = FLOOR_LABELS[store.floor]
    if (grade === 'A+' || grade === 'A') {
      return `${displayName} 점포는 종합 분석 결과 ${grade}등급(${analysis.overallScore}점)으로 ${biz} 출점을 우선 검토할 수 있는 조건을 갖추고 있습니다. ${floor} 접근성과 가시성 조건이 상대적으로 양호하며, 입력된 점포 조건을 종합하면 해당 업종 운영에 필요한 기본 요건을 충족합니다. 이 분석은 입력된 데이터 기반이므로 반드시 현장 방문을 병행하여 실제 환경을 확인하십시오.`
    }
    if (grade === 'B+' || grade === 'B') {
      return `${displayName} 점포는 종합 분석 결과 ${grade}등급(${analysis.overallScore}점)으로 ${biz} 출점을 조건부로 검토할 수 있는 수준입니다. ${floor} 접근성과 임대조건에서 일부 유리한 요소가 확인되지만, 리스크 항목도 병존하고 있어 계약 전 추가 검토와 현장 재확인이 필수입니다.`
    }
    return `${displayName} 점포는 종합 분석 결과 ${grade}등급(${analysis.overallScore}점)으로 ${biz} 출점에 앞서 위험요인과 임대조건을 보수적으로 재검토할 필요가 있습니다. 일부 항목에서 우려사항이 확인되었으며, 계약 전 임대인과의 조건 협상 및 현장 점검을 철저히 진행할 것을 권고합니다.`
  })()

  const opinionP2 = (() => {
    if (ra) {
      if (ra.rentRatioPct !== null) {
        return `임대료 측면에서 월세 ${formatMoney(ra.monthlyRent)}는 입력된 예상매출 기준 ${ra.rentRatioPct.toFixed(1)}% 수준입니다. ${ra.interpretation} ${store.desiredBusiness} 업종은 임대료 외에도 인건비·원재료비·마케팅 비용 등 변동비 구조를 함께 검토해야 하며, 정확한 손익분기점은 업종별 원가율과 인건비 계획을 반영한 별도의 손익 계산이 필요합니다.`
      }
      return `임대료 측면에서 월세 ${formatMoney(ra.monthlyRent)}를 기준으로, 임대료 비율을 10% 수준으로 관리하려면 약 ${formatMoney(ra.referenceSalesAt10pct)}의 월매출이 필요합니다. 이 수치는 임대료 부담 판단을 위한 참고값이며 손익분기점과는 다릅니다. ${store.desiredBusiness} 업종의 원가율과 인건비를 포함한 실제 손익분기점은 별도의 계산이 필요합니다.`
    }
    return `임대조건과 예상매출을 함께 검토하여 임대료 부담률을 사전에 계산하십시오. ${store.desiredBusiness} 업종의 원가율과 인건비를 포함한 손익분기점 분석을 별도로 진행할 것을 권고합니다.`
  })()

  const opinionP3 = `입지 분석 측면에서 가장 주목해야 할 항목은 도보 접근성과 가시성입니다. ${VISIBILITY_LABELS[store.visibility]} 수준의 가시성과 ${store.frontageMeters}m 전면폭은 ${store.desiredBusiness} 업종의 자연 유입 가능성에 직접적인 영향을 미칩니다. 현장에서 피크타임(점심·퇴근·주말) 유동인구를 직접 측정하고, 경쟁 업종 현황과 배후 수요를 현장 조사로 보완하십시오. 특히 야간 조명, 간판 위치, 인근 장애물 여부는 방문 시 반드시 확인하십시오.`

  const opinionP4 = (() => {
    const checks = ba?.mustCheckFactors?.slice(0, 3).join(', ') ?? '시설 조건, 건물 용도, 경쟁환경'
    return `계약 전 반드시 확인해야 할 핵심 사항은 ${checks} 등입니다. 경쟁환경 데이터는 현재 연결되지 않아 현장에서 직접 파악해야 합니다. 반경 300~500m 내 동종업종 수와 최근 신규·폐업 현황을 확인하십시오. 임대차 계약서 작성 전 건물 용도, 영업 가능 업종, 원상복구 범위, 재계약 우선권 여부 등을 법률 전문가와 함께 검토할 것을 강력히 권고합니다.`
  })()

  const opinionP5 = `본 분석 결과는 입력된 점포조건을 기반으로 분석 엔진이 산출한 참고자료입니다. 최종 계약 결정은 반드시 현장 방문, 임대인 확인, 법률·세무 전문가 검토를 병행하십시오. 상권 데이터(유동인구, 매출 변화, 폐업률 등)는 현재 연결되지 않으며, 향후 데이터 연계 시 분석 정밀도가 크게 향상될 수 있습니다. 출점 결정에서의 최종 판단은 컨설턴트와 실사를 통해 진행하시기 바랍니다.`

  return (
    <>
      <style>{`
        .report-page {
          width: 210mm;
          min-height: 297mm;
          box-shadow: 0 4px 28px rgba(0,0,0,0.13);
          margin: 0 auto 2.5rem;
          break-after: page;
          page-break-after: always;
          display: flex;
          flex-direction: column;
        }
        .report-wrapper {
          background: #e8eaef;
          padding: 2.5rem 1rem;
        }
        @media (max-width: 768px) {
          .report-page { width: 100%; min-height: auto; }
        }
        @media print {
          @page { size: A4; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          aside, header, nav, .no-print, [data-sidebar] { display: none !important; }
          main { overflow: visible !important; }
          .report-wrapper { background: white !important; padding: 0 !important; }
          .report-page {
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            min-height: 0 !important;
            page-break-after: always;
            break-after: page;
          }
          .report-page:last-of-type { page-break-after: avoid; break-after: avoid; }
          .report-pagenum { display: none !important; }
          .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      {/* ── Toolbar ── */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-4 no-print">
        <div className="flex items-center justify-between">
          <Link href={`/analysis/${analysis.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />분석 결과로
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/compare"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors">
              <GitCompare className="w-4 h-4" />후보지 비교
            </Link>
            <button
              onClick={() => navigator.clipboard.writeText(window.location.href).then(() => alert('링크 복사 완료'))}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors">
              <Share2 className="w-4 h-4" />공유
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0b1120] text-white text-sm font-semibold hover:bg-slate-800 transition-colors">
              <Printer className="w-4 h-4" />PDF / 인쇄
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400 text-center">아래 A4 페이지를 스크롤하거나 "PDF / 인쇄" 버튼으로 저장하세요</p>
      </div>

      {/* ══ REPORT PAGES ══ */}
      <div className="report-wrapper">

        {/* ═══════════════════════════════
            PAGE 1 — 표지 + Executive Summary
            ═══════════════════════════════ */}
        <ReportPage pageNum={1} totalPages={TOTAL} noPadding darkBg>
          {/* Cover section */}
          <div className="bg-[#0b1120] px-12 pt-12 pb-8 flex flex-col justify-between" style={{ minHeight: '45%' }}>
            <div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-8">
                상권연구소 AI PRO · Store Location Analysis Report
              </p>
              <h1 className="text-3xl font-black text-white mb-2 leading-tight">
                점포 · 입지 분석 리포트
              </h1>
              <p className="text-slate-400 text-base mt-2">{displayName}</p>
              <p className="text-slate-500 text-sm mt-1">
                {store.desiredBusiness} · {FLOOR_LABELS[store.floor]} · {store.areaPyeong}평
              </p>
            </div>
            <div className="flex items-end justify-between mt-8">
              <div className="space-y-1">
                <p className="text-slate-500 text-[10px]">분석일</p>
                <p className="text-white text-sm font-semibold">{createdDate}</p>
                <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full border ${rc.border} ${rc.bg}`}>
                  <span className={`text-xs font-bold ${rc.text}`}>{RECOMMENDATION_LABELS[analysis.recommendation]}</span>
                </div>
              </div>
              <div className="text-right">
                <div className={`w-24 h-24 rounded-2xl border-2 ${gc.border} ${gc.bg} flex flex-col items-center justify-center`}>
                  <span className={`text-4xl font-black ${gc.text} leading-none`}>{analysis.overallGrade}</span>
                  <span className={`text-xs font-bold ${gc.text} opacity-70 mt-1`}>{analysis.overallScore}점</span>
                </div>
                <p className="text-slate-500 text-[10px] mt-1">종합 등급</p>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="bg-white px-12 py-8 flex-1">
            <PageSection label="Executive Summary — 핵심 요약" icon={<BarChart3 className="w-4 h-4" />} />

            <div className={`rounded-xl p-4 border-l-4 ${rc.border} bg-slate-50 mb-5`}>
              <p className={`text-xs font-bold mb-1 ${rc.text}`}>{RECOMMENDATION_LABELS[analysis.recommendation]}</p>
              <p className="text-sm text-slate-700 leading-relaxed">{analysis.summary}</p>
            </div>

            <div className="grid grid-cols-2 gap-5 mb-5">
              <div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-2">핵심 강점</p>
                <ul className="space-y-2">
                  {analysis.strengths.slice(0, 4).map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <TrendingUp className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[11px] font-semibold text-slate-800">{s.title}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{s.interpretation.slice(0, 65)}…</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-2">핵심 위험</p>
                <ul className="space-y-2">
                  {analysis.risks.slice(0, 4).map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[11px] font-semibold text-slate-800">{r.title}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{r.interpretation.slice(0, 65)}…</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {ba && ba.mustCheckFactors.length > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider mb-2">계약 전 핵심 확인사항</p>
                <div className="flex flex-wrap gap-1.5">
                  {ba.mustCheckFactors.slice(0, 5).map((f, i) => (
                    <span key={i} className="text-[10px] bg-blue-100 text-blue-800 rounded-full px-2.5 py-1 font-medium">
                      {f.split('—')[0].trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ReportPage>

        {/* ═══════════════════════════════
            PAGE 2 — 점포 기본조건
            ═══════════════════════════════ */}
        <ReportPage pageNum={2} totalPages={TOTAL}>
          <PageSection label="점포 기본조건" icon={<MapPin className="w-4 h-4" />} />

          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">기본 정보</p>
              <dl>
                <DataRow label="주소 / 지역명" value={displayName} highlight />
                <DataRow label="희망 업종" value={store.desiredBusiness} highlight />
                <DataRow label="업종 분류" value={ba ? BIZ_CATEGORY_LABELS[ba.category] : '기타'} />
                <DataRow label="현재 운영 업종" value={store.currentBusiness || '미입력'} />
                <DataRow label="이전 운영 업종" value={store.previousBusiness || '미입력'} />
                <DataRow label="계약 기간" value={store.contractPeriod || '미입력'} />
                <DataRow label="VAT 포함 여부" value={store.vatIncluded ? '포함' : '별도 또는 미입력'} />
              </dl>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">물리적 조건</p>
              <dl>
                <DataRow label="층수" value={FLOOR_LABELS[store.floor]} />
                <DataRow label="전용 면적" value={`${store.areaPyeong}평${store.areaSqm ? ` (${store.areaSqm}㎡)` : ''}`} />
                <DataRow label="전면폭" value={`${store.frontageMeters}m`} />
                <DataRow label="코너 점포" value={store.isCorner ? '해당' : '해당 없음'} />
                <DataRow label="양면 노출" value={store.dualExposure !== undefined ? (store.dualExposure ? '해당' : '해당 없음') : '미입력'} />
                <DataRow label="주차" value={store.parkingCount > 0 ? `${store.parkingCount}대` : '없음 또는 미입력'} />
              </dl>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">임대 조건</p>
              <dl>
                <DataRow label="보증금" value={formatMoney(store.deposit)} highlight />
                <DataRow label="월세" value={formatMoney(store.monthlyRent)} highlight />
                <DataRow label="관리비" value={store.maintenanceFee > 0 ? formatMoney(store.maintenanceFee) : '없음 또는 미입력'} />
                <DataRow label="권리금" value={store.premium > 0 ? formatMoney(store.premium) : '없음 또는 미입력'} />
                <DataRow label="예상 인테리어" value={store.estimatedInteriorCost && store.estimatedInteriorCost > 0 ? formatMoney(store.estimatedInteriorCost) : '미입력'} />
              </dl>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">입지 조건</p>
              <dl>
                <DataRow label="가시성" value={VISIBILITY_LABELS[store.visibility]} />
                <DataRow label="도보 접근성" value={accessLabel(store.pedestrianAccess ?? store.walkAccess)} />
                <DataRow label="차량 접근성" value={accessLabel(store.vehicleAccess ?? store.carAccess)} />
                <DataRow label="대중교통" value={accessLabel(store.publicTransportAccess)} />
                <DataRow label="엘리베이터" value={store.elevator !== undefined ? (store.elevator ? '있음' : '없음') : '미입력'} />
              </dl>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">시설·설비 현황</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              {[
                { label: '닥트 (환기) 설치 가능', value: store.duct },
                { label: '도시가스 인입', value: store.cityGas },
                { label: '전용 화장실', value: store.restroom },
                { label: '배수 양호', value: store.drainage },
                { label: '하수 역류 이력 없음', value: store.sewer },
                { label: '소방 적합', value: store.fireSafety },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-2 py-1.5 border-b border-slate-100">
                  <StatusIcon value={value} />
                  <span className="text-[11px] text-slate-600">{label}</span>
                  <span className="ml-auto text-[10px] font-semibold text-slate-400">
                    {value === undefined ? '미입력' : value ? '확인' : '미확인·불가'}
                  </span>
                </div>
              ))}
            </div>
            {store.electricCapacity && (
              <div className="flex items-center gap-2 py-1.5 border-b border-slate-100 mt-1">
                <CheckCircle className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-[11px] text-slate-600">전기 용량</span>
                <span className="ml-auto text-[11px] font-semibold text-slate-700">{store.electricCapacity}</span>
              </div>
            )}
          </div>

          {store.fieldMemo && (
            <div className="mt-5 bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-1">현장 메모</p>
              <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-wrap">{store.fieldMemo}</p>
            </div>
          )}
        </ReportPage>

        {/* ═══════════════════════════════
            PAGE 3 — 입지 분석
            ═══════════════════════════════ */}
        <ReportPage pageNum={3} totalPages={TOTAL}>
          <PageSection label="입지 분석" icon={<MapPin className="w-4 h-4" />} />

          {/* Score row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: '입지 점수', s: analysis.scores.location },
              { label: '가시성 점수', s: analysis.scores.visibility },
              { label: '업종 적합도', s: analysis.scores.businessFit },
            ].map(({ label, s }) => {
              const sg = gradeColor(s.grade)
              return (
                <div key={label} className={`rounded-xl p-3 border text-center ${sg.border} ${sg.bg}`}>
                  <p className="text-[10px] font-semibold text-slate-500 mb-1">{label}</p>
                  <p className={`text-2xl font-black ${sg.text}`}>{s.grade}</p>
                  <p className={`text-xs font-bold ${sg.text} opacity-70`}>{s.score}점</p>
                </div>
              )
            })}
          </div>

          {/* Location blocks */}
          <div className="space-y-4">
            {locBlocks.map((b, i) => (
              <div key={i} className="border border-slate-200 rounded-xl overflow-hidden break-inside-avoid">
                <div className="bg-[#f8f9fb] px-4 py-2 flex items-center gap-2 border-b border-slate-200">
                  <span className="text-slate-500">{b.icon}</span>
                  <span className="text-xs font-black text-[#0b1120] uppercase tracking-wide">{b.title}</span>
                  <span className="ml-auto text-[10px] font-semibold text-slate-400 font-mono">{b.condition}</span>
                </div>
                <div className="px-4 py-3 grid grid-cols-4 gap-3">
                  {[
                    { tag: '현재 조건', text: b.condition },
                    { tag: '의미', text: b.meaning },
                    { tag: '업종 영향', text: b.bizImpact },
                    { tag: '현장 확인', text: b.fieldCheck },
                  ].map(({ tag, text }) => (
                    <div key={tag}>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">{tag}</p>
                      <p className="text-[10px] text-slate-600 leading-snug">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ReportPage>

        {/* ═══════════════════════════════
            PAGE 4 — 업종 적합성
            ═══════════════════════════════ */}
        <ReportPage pageNum={4} totalPages={TOTAL}>
          <PageSection label="업종 적합성" icon={<Users className="w-4 h-4" />} />

          <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-600 mb-1">업종 적합도 평가</p>
            <p className="text-xs text-slate-600 leading-relaxed">{analysis.scores.businessFit.interpretation}</p>
          </div>

          <div className="mb-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">업종별 세부 항목 평가</p>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {bizRows.map((row, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 bg-white hover:bg-slate-50">
                  <BizBadge status={row.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800">{row.item}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{row.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {ba && (
            <>
              {ba.mustCheckFactors.length > 0 && (
                <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider mb-2">업종별 필수 확인 항목</p>
                  <ol className="space-y-1.5">
                    {ba.mustCheckFactors.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[10px] font-black text-blue-400 mt-0.5 shrink-0">{i + 1}.</span>
                        <span className="text-[11px] text-blue-800 leading-snug">{f}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {ba.specificRisks.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-2">업종 특화 리스크</p>
                  <ul className="space-y-1">
                    {ba.specificRisks.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                        <span className="text-[11px] text-amber-800 leading-snug">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </ReportPage>

        {/* ═══════════════════════════════
            PAGE 5 — 임대조건 및 수익성
            ═══════════════════════════════ */}
        <ReportPage pageNum={5} totalPages={TOTAL}>
          <PageSection label="임대조건 및 수익성 부담" icon={<Building2 className="w-4 h-4" />} />

          <div className="grid grid-cols-2 gap-8 mb-5">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">임대 조건</p>
              <dl>
                <DataRow label="보증금" value={formatMoney(store.deposit)} highlight />
                <DataRow label="월세" value={formatMoney(store.monthlyRent)} highlight />
                <DataRow label="관리비" value={store.maintenanceFee > 0 ? formatMoney(store.maintenanceFee) : '없음'} />
                <DataRow label="월 고정비 합계" value={formatMoney(totalMonthly)} highlight />
                <DataRow label="권리금" value={store.premium > 0 ? formatMoney(store.premium) : '없음'} />
              </dl>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">임대조건 점수</p>
              {(() => {
                const sg = gradeColor(analysis.scores.rent.grade)
                return (
                  <div className={`rounded-xl p-4 border text-center ${sg.border} ${sg.bg} mb-3`}>
                    <p className="text-[10px] font-semibold text-slate-500 mb-1">임대 점수</p>
                    <p className={`text-3xl font-black ${sg.text}`}>{analysis.scores.rent.grade}</p>
                    <p className={`text-xs font-bold ${sg.text} opacity-70`}>{analysis.scores.rent.score}점</p>
                  </div>
                )
              })()}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-[10px] text-slate-600 leading-snug">{analysis.scores.rent.interpretation}</p>
              </div>
            </div>
          </div>

          {ra && (
            <div className="bg-[#f8f9fb] border border-slate-200 rounded-xl p-5 mb-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-slate-700">임대료 부담 분석</p>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${riskColor(ra.riskLevel).badge}`}>
                  {riskColor(ra.riskLevel).label}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
                  <p className="text-[10px] text-slate-500 mb-1">임대료 비율</p>
                  <p className="text-xl font-black text-slate-800">
                    {ra.rentRatioPct !== null ? `${ra.rentRatioPct.toFixed(1)}%` : '—'}
                  </p>
                  <p className="text-[9px] text-slate-400">월세 ÷ 예상매출</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
                  <p className="text-[10px] text-slate-500 mb-1">10% 기준 필요매출</p>
                  <p className="text-base font-black text-slate-800">{formatMoney(ra.referenceSalesAt10pct)}</p>
                  <p className="text-[9px] text-slate-400">참고값 (손익분기점 아님)</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
                  <p className="text-[10px] text-slate-500 mb-1">12% 기준 필요매출</p>
                  <p className="text-base font-black text-slate-800">{formatMoney(ra.referenceSalesAt12pct)}</p>
                  <p className="text-[9px] text-slate-400">고부담 임계점</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{ra.interpretation}</p>
            </div>
          )}

          {store.expectedMonthlySales && store.expectedMonthlySales > 0 ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-[#f8f9fb] px-4 py-2 border-b border-slate-200">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider">손익 시뮬레이션 (입력값 기준 참고)</p>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { label: '입력된 예상 월매출', value: formatMoney(store.expectedMonthlySales), color: 'text-emerald-700 font-bold' },
                  { label: '월세 + 관리비 (고정비)', value: `− ${formatMoney(totalMonthly)}`, color: 'text-red-600 font-bold' },
                  { label: '인건비', value: '별도 확인 필요', color: 'text-slate-400' },
                  { label: '재료비·변동비', value: '별도 확인 필요', color: 'text-slate-400' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-slate-600">{row.label}</span>
                    <span className={`text-sm ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-600 mb-1">예상매출 미입력</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                월세 {formatMoney(store.monthlyRent)}를 10% 기준으로 관리하려면 약 {ra ? formatMoney(ra.referenceSalesAt10pct) : '—'}의 월매출이 필요합니다.
                이는 임대료 부담 판단을 위한 참고값이며 손익분기점이 아닙니다.
                정확한 손익 계산은 업종별 원가율·인건비를 포함한 별도 분석이 필요합니다.
              </p>
            </div>
          )}
        </ReportPage>

        {/* ═══════════════════════════════
            PAGE 6 — 주요 위험요인
            ═══════════════════════════════ */}
        <ReportPage pageNum={6} totalPages={TOTAL}>
          <PageSection label="주요 위험요인" icon={<ShieldAlert className="w-4 h-4" />} />

          <div className="space-y-4">
            {analysis.risks.map((item, i) => {
              const colors = [
                'border-red-400 bg-red-50',
                'border-amber-400 bg-amber-50',
                'border-orange-400 bg-orange-50',
              ]
              const headerColors = [
                'bg-red-100 text-red-800',
                'bg-amber-100 text-amber-800',
                'bg-orange-100 text-orange-800',
              ]
              const ci = i % 3
              return (
                <div key={i} className={`border-l-4 rounded-r-xl overflow-hidden break-inside-avoid ${colors[ci]}`}>
                  <div className={`px-4 py-2 flex items-center gap-2 ${headerColors[ci]}`}>
                    <FileWarning className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs font-black">{item.title}</span>
                    <span className="ml-auto text-[10px] font-mono bg-white bg-opacity-60 px-1.5 py-0.5 rounded">
                      {item.data}
                    </span>
                  </div>
                  <div className="px-4 py-3 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">의미</p>
                      <p className="text-[10px] text-slate-700 leading-snug">{item.interpretation}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">업종 영향</p>
                      <p className="text-[10px] text-slate-700 leading-snug">{item.impact}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">대응 방법</p>
                      <p className="text-[10px] text-slate-700 leading-snug">{item.action ?? '계약 전 현장 직접 확인 및 임대인에게 확인 요청'}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">위험 종합 점수</p>
            <div className="grid grid-cols-2 gap-4">
              {(() => {
                const crs = gradeColor(analysis.scores.competitionRisk.grade)
                const trs = gradeColor(analysis.scores.totalRisk.grade)
                return (
                  <>
                    <div className={`rounded-lg p-3 border text-center ${crs.border} ${crs.bg}`}>
                      <p className="text-[10px] text-slate-500 mb-1">경쟁 리스크</p>
                      <p className={`text-xl font-black ${crs.text}`}>{analysis.scores.competitionRisk.grade}</p>
                      <p className={`text-[10px] ${crs.text} opacity-70`}>{analysis.scores.competitionRisk.score}점</p>
                    </div>
                    <div className={`rounded-lg p-3 border text-center ${trs.border} ${trs.bg}`}>
                      <p className="text-[10px] text-slate-500 mb-1">종합 리스크</p>
                      <p className={`text-xl font-black ${trs.text}`}>{analysis.scores.totalRisk.grade}</p>
                      <p className={`text-[10px] ${trs.text} opacity-70`}>{analysis.scores.totalRisk.score}점</p>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </ReportPage>

        {/* ═══════════════════════════════
            PAGE 7 — 계약 전 현장 확인사항
            ═══════════════════════════════ */}
        <ReportPage pageNum={7} totalPages={TOTAL}>
          <PageSection label="계약 전 현장 확인사항" icon={<ClipboardCheck className="w-4 h-4" />} />

          {(() => {
            const verified = analysis.contractChecks.filter(c => c.status === 'verified').length
            const concern = analysis.contractChecks.filter(c => c.status === 'concern').length
            const total = analysis.contractChecks.length
            return (
              <div className="flex gap-4 mb-4 text-xs">
                <span className="text-slate-500">전체 {total}항목</span>
                <span className="text-emerald-600 font-bold">확인완료 {verified}개</span>
                {concern > 0 && <span className="text-red-600 font-bold">우려사항 {concern}개</span>}
                <span className="text-slate-400">미확인 {total - verified - concern}개</span>
              </div>
            )
          })()}

          <div className="border border-slate-200 rounded-xl overflow-hidden mb-5">
            {analysis.contractChecks.map((check, i) => (
              <div key={check.id} className={`flex items-start justify-between px-4 py-2.5 gap-3 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} border-b border-slate-100 last:border-0`}>
                <div className="flex items-start gap-2 flex-1">
                  <span className="text-[9px] font-bold text-slate-400 border border-slate-200 rounded px-1 py-0.5 shrink-0 mt-0.5 whitespace-nowrap">
                    {check.category}
                  </span>
                  <div>
                    <span className="text-[11px] text-slate-700 leading-snug">{check.item}</span>
                    {check.note && <p className="text-[10px] text-slate-400 mt-0.5">{check.note}</p>}
                  </div>
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

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-2">추가 현장 확인 권고</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              {[
                `반경 300~500m 내 ${store.desiredBusiness} 동종업종 수`,
                '최근 3개월 신규 오픈·폐업 현황',
                '주요 경쟁점 영업시간·가격대·고객층',
                '계절·요일별 유동인구 패턴',
                '건물 외벽·옥상 간판 허가 가능 위치',
                '원상복구 범위 및 비용 임대인 확인',
                '재계약 우선권 및 임대료 인상률 상한',
                '건물 용도(업종 허가 가능 여부)',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-1.5 py-0.5">
                  <span className="text-[10px] font-black text-amber-500 shrink-0 mt-0.5">{i + 1}.</span>
                  <span className="text-[10px] text-amber-800">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </ReportPage>

        {/* ═══════════════════════════════
            PAGE 8 — 상권데이터 현황
            ═══════════════════════════════ */}
        <ReportPage pageNum={8} totalPages={TOTAL}>
          <PageSection label="상권 데이터 현황" icon={<BarChart3 className="w-4 h-4" />} />

          <div className="mb-4 bg-slate-100 border border-slate-200 rounded-xl p-4 text-center">
            <p className="text-sm font-bold text-slate-400 mb-1">전체 상권 데이터 미연결</p>
            <p className="text-xs text-slate-400">
              아래 항목들은 현재 외부 데이터 소스와 연결되지 않았습니다. 향후 데이터 연계 시 분석 정밀도가 크게 향상됩니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                title: '유동인구 데이터',
                icon: <Footprints className="w-4 h-4" />,
                desc: '시간대별·요일별 보행 유동인구 분석',
                fieldNote: '피크타임 직접 방문하여 실측 카운팅 권고',
              },
              {
                title: '생활인구 데이터',
                icon: <Users className="w-4 h-4" />,
                desc: '배후 세대수·연령대별 거주 인구 분석',
                fieldNote: '부동산 플랫폼 또는 시·군·구청 통계 참고',
              },
              {
                title: '상권 매출 데이터',
                icon: <TrendingUp className="w-4 h-4" />,
                desc: '동종업종 평균 매출·매출 변화율',
                fieldNote: '소상공인진흥공단 상권분석 서비스 활용 가능',
              },
              {
                title: '경쟁 업종 현황',
                icon: <AlertTriangle className="w-4 h-4" />,
                desc: `반경 500m 내 ${store.desiredBusiness} 업종 수·신규/폐업 현황`,
                fieldNote: '현장 직접 도보 조사 및 배달앱 검색 병행',
              },
              {
                title: '폐업률 데이터',
                icon: <FileWarning className="w-4 h-4" />,
                desc: '해당 상권·업종 폐업률 및 생존율',
                fieldNote: '소상공인진흥공단 통계 참고 (업종별 3년 생존율)',
              },
              {
                title: '임대료 시세 데이터',
                icon: <Building2 className="w-4 h-4" />,
                desc: '동일 상권 내 동종 면적 평균 임대료',
                fieldNote: '인근 부동산 중개소 2~3곳 방문 시세 확인',
              },
            ].map(({ title, icon, desc, fieldNote }) => (
              <div key={title} className="border border-slate-200 rounded-xl p-4 bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-slate-400">{icon}</span>
                  <span className="text-xs font-bold text-slate-700">{title}</span>
                  <span className="ml-auto text-[10px] bg-slate-100 text-slate-400 rounded-full px-2 py-0.5 font-bold">미연결</span>
                </div>
                <p className="text-[10px] text-slate-500 mb-2 leading-snug">{desc}</p>
                <div className="bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
                  <p className="text-[10px] text-amber-700 font-medium leading-snug">현장 대안: {fieldNote}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider mb-1">데이터 연결 후 향상 가능한 분석</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                '업종별 상권 매출 적합성 정밀 분석',
                '경쟁 포화도 지수',
                '시간대별 유동인구 히트맵',
                '배후 세대 수요 추정',
                '유사 상권 비교 분석',
              ].map(item => (
                <span key={item} className="text-[10px] bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-medium">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </ReportPage>

        {/* ═══════════════════════════════
            PAGE 9 — 최종 종합의견
            ═══════════════════════════════ */}
        <ReportPage pageNum={9} totalPages={TOTAL}>
          <PageSection label="최종 종합의견" icon={<FileWarning className="w-4 h-4" />} />

          <div className={`rounded-xl p-5 border-l-4 mb-6 ${rc.border} bg-slate-50`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-base font-black ${rc.text}`}>{RECOMMENDATION_LABELS[analysis.recommendation]}</p>
                <p className="text-[10px] text-slate-400 mt-1">종합 점수: {analysis.overallScore}점 ({analysis.overallGrade}등급)</p>
              </div>
              <div className={`w-16 h-16 rounded-2xl border-2 ${gc.border} ${gc.bg} flex flex-col items-center justify-center`}>
                <span className={`text-2xl font-black ${gc.text} leading-none`}>{analysis.overallGrade}</span>
                <span className={`text-[10px] font-bold ${gc.text} opacity-70`}>{analysis.overallScore}점</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <p className="text-sm text-slate-700 leading-relaxed">{opinionP1}</p>
            <p className="text-sm text-slate-700 leading-relaxed">{opinionP2}</p>
            <p className="text-sm text-slate-700 leading-relaxed">{opinionP3}</p>
            <p className="text-sm text-slate-700 leading-relaxed">{opinionP4}</p>
            <p className="text-sm text-slate-700 leading-relaxed">{opinionP5}</p>
          </div>

          {/* Final verdict card */}
          <div className={`rounded-2xl border-2 ${gc.border} p-6 text-center mb-5`}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">최종 판단</p>
            <p className={`text-2xl font-black ${gc.text} mb-1`}>{RECOMMENDATION_LABELS[analysis.recommendation]}</p>
            <p className="text-xs text-slate-500 mb-3">{displayName} · {store.desiredBusiness} · {FLOOR_LABELS[store.floor]}</p>
            <div className="flex items-center justify-center gap-6">
              <div>
                <p className={`text-3xl font-black ${gc.text}`}>{analysis.overallGrade}</p>
                <p className="text-[10px] text-slate-400">종합 등급</p>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <p className="text-3xl font-black text-slate-800">{analysis.overallScore}</p>
                <p className="text-[10px] text-slate-400">종합 점수</p>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <p className="text-3xl font-black text-slate-800">{analysis.contractChecks.length}</p>
                <p className="text-[10px] text-slate-400">확인 항목</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              본 리포트는 입력된 점포조건을 기반으로 분석 엔진이 생성한 참고자료입니다.
              최종 계약 결정은 반드시 현장 방문, 임대인 확인, 법률·세무 전문가 검토를 병행하십시오.
              상권연구소 AI PRO V0.1은 의사결정 지원 서비스이며, 투자 성과를 보장하지 않습니다.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
            <p className="text-[10px] text-slate-400">상권연구소 AI PRO V0.1 · 의사결정 지원 서비스</p>
            <p className="text-[10px] text-slate-400">{createdDate}</p>
          </div>
        </ReportPage>

      </div>
    </>
  )
}
