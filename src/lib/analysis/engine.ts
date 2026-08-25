import {
  Store,
  AnalysisResult,
  AnalysisItem,
  ContractCheck,
  Grade,
  MarketData,
  ScoreDetail,
  Recommendation,
  FLOOR_LABELS,
} from '@/types'
import { scoreToGrade, generateId, formatMoney } from '@/lib/utils'

// ── Scoring helpers ───────────────────────────────────────────────────────────

function score(s: number): { score: number; grade: Grade } {
  return { score: Math.min(100, Math.max(0, s)), grade: scoreToGrade(s) }
}

function isBarOrFood(business: string): boolean {
  return ['주점', '식당', '음식', '카페', '커피', '치킨', '피자', '분식', '고기', '횟집', '술집'].some(
    (k) => business.includes(k),
  )
}

// ── Dimension scorers ─────────────────────────────────────────────────────────

function scoreLocation(store: Store): ScoreDetail {
  let s = 60
  const parts: string[] = []

  const floorBonus: Record<string, number> = {
    '1f': 25,
    '2f': 5,
    '3f': -5,
    '4f_plus': -10,
    basement: -5,
  }
  s += floorBonus[store.floor] ?? 0

  if (store.floor === '1f') parts.push('1층 위치로 접근성 기본 확보')
  else if (store.floor === 'basement') parts.push('지하층 — 목적 방문 유도 전략 필요')
  else parts.push(`${FLOOR_LABELS[store.floor]} — 가시성 및 접근성 추가 확인 필요`)

  const walkBonus: Record<string, number> = { excellent: 10, good: 5, average: 0, poor: -10 }
  s += walkBonus[store.walkAccess] ?? 0
  if (store.walkAccess === 'excellent') parts.push('도보 접근성 우수')
  else if (store.walkAccess === 'poor') parts.push('도보 접근성 불량')

  if (store.isCorner) { s += 5; parts.push('코너 위치로 노출면 증가') }

  const r = score(s)
  return {
    ...r,
    label: '입지',
    interpretation: parts[0] ?? '입지 조건 검토 완료',
  }
}

function scoreVisibility(store: Store): ScoreDetail {
  let s = 50

  if (store.frontageMeters >= 8) s += 30
  else if (store.frontageMeters >= 6) s += 20
  else if (store.frontageMeters >= 4) s += 10

  const visBonus: Record<string, number> = { excellent: 20, good: 10, average: 0, poor: -10 }
  s += visBonus[store.visibility] ?? 0

  const r = score(s)
  return {
    ...r,
    label: '가시성',
    interpretation:
      store.frontageMeters >= 8
        ? `전면폭 ${store.frontageMeters}m — 외부 노출성 매우 우수`
        : store.frontageMeters >= 6
          ? `전면폭 ${store.frontageMeters}m — 외부 노출성 양호`
          : `전면폭 ${store.frontageMeters}m — 노출성 추가 확인 필요`,
  }
}

function scoreRent(store: Store): ScoreDetail {
  let s = 75
  const monthly = store.monthlyRent + store.maintenanceFee
  const parts: string[] = []

  if (monthly > 5_000_000) { s -= 20; parts.push('고정비 부담 높음 — 손익분기점 검토 필수') }
  else if (monthly > 3_500_000) { s -= 10; parts.push('임대료 수준 검토 필요') }
  else if (monthly <= 2_000_000) { s += 5; parts.push('임대료 부담 상대적으로 낮음') }

  if (store.premium > 50_000_000) { s -= 15; parts.push('권리금 고액 — 회수 가능성 면밀 검토') }
  else if (store.premium > 20_000_000) { s -= 5; parts.push('권리금 중간 수준') }
  else if (store.premium === 0) parts.push('권리금 없음')

  const r = score(s)
  return {
    ...r,
    label: '임대조건',
    interpretation: parts[0] ?? '임대 조건 검토 완료',
  }
}

function scoreBusinessFit(store: Store): ScoreDetail {
  let s = 70
  const biz = store.desiredBusiness
  const parts: string[] = []

  if (isBarOrFood(biz)) {
    if (store.floor === '1f') { s += 10; parts.push(`${biz} 업종에 1층 입지 적합`) }
    else if (store.floor === 'basement') { s -= 10; parts.push('음식·주점은 지하에서 목적 방문 유도 전략 필요') }
    else { s -= 5; parts.push(`${FLOOR_LABELS[store.floor]}에서 ${biz} 운영 시 접근성 확인`) }

    if (store.areaPyeong >= 30) { s += 5; parts.push(`${store.areaPyeong}평 — 주방·홀 구성 적합 규모`) }
    else if (store.areaPyeong < 15) { s -= 10; parts.push('소면적 — 주방 동선 및 좌석 구성 제약 가능') }

    if (biz.includes('주점') || biz.includes('술집')) {
      if (store.parkingCount >= 3) { s += 5; parts.push('주차 가능 — 저녁 차량 방문객 유입에 유리') }
      else if (store.parkingCount === 0) { s -= 5; parts.push('주차 없음 — 차량 방문 고객 유입 제한') }
    }
  }

  const r = score(s)
  return {
    ...r,
    label: '업종적합도',
    interpretation: parts[0] ?? `${biz} 업종 적합성 검토 완료`,
  }
}

function scoreCompetition(store: Store): ScoreDetail {
  // V0.1 — 천안·아산 더미 데이터
  const s = 60
  const r = score(s)
  return {
    ...r,
    label: '경쟁위험',
    interpretation: `${store.desiredBusiness} 동종업종 경쟁환경 데이터 미연결 — 현장 직접 확인 필요`,
  }
}

function scoreTotalRisk(
  location: number,
  visibility: number,
  rent: number,
): ScoreDetail {
  const riskRaw = Math.round(100 - (location * 0.3 + visibility * 0.2 + rent * 0.5))
  const clamped = Math.min(100, Math.max(0, riskRaw))
  const riskGrade = scoreToGrade(100 - clamped)
  return {
    score: clamped,
    grade: riskGrade,
    label: '종합 리스크',
    interpretation: clamped <= 30 ? '전반적 위험 수준 낮음' : clamped <= 50 ? '관리 가능한 위험 요인 존재' : '위험 요인 집중 관리 필요',
  }
}

// ── Interpretation generators ─────────────────────────────────────────────────

function genStrengths(store: Store): AnalysisItem[] {
  const items: AnalysisItem[] = []
  const biz = store.desiredBusiness

  if (store.frontageMeters >= 6) {
    items.push({
      title: '전면 노출 우수',
      data: `${FLOOR_LABELS[store.floor]} / 전면폭 ${store.frontageMeters}m`,
      interpretation: '차량과 보행자의 시야에 점포가 노출될 가능성이 높습니다.',
      impact: `${biz}은 저녁시간 유입과 간판 가시성이 중요하기 때문에 긍정적인 요소입니다.`,
    })
  }

  if (store.floor === '1f') {
    items.push({
      title: '1층 접근성 확보',
      data: `${FLOOR_LABELS[store.floor]} · ${store.areaPyeong}평`,
      interpretation: '계단 없이 바로 진입할 수 있어 고객 유입 장벽이 낮습니다.',
      impact: `${biz}의 경우 충동 방문과 재방문 가능성이 높아집니다.`,
    })
  }

  if (store.isCorner) {
    items.push({
      title: '코너 위치 — 양방향 노출',
      data: '코너 점포',
      interpretation: '두 방향에서 간판 노출이 가능하여 가시성이 증가합니다.',
      impact: '유동인구가 많은 방향 양쪽에서 시인성이 확보됩니다.',
    })
  }

  if (store.parkingCount >= 3) {
    items.push({
      title: '주차 가능',
      data: `주차 ${store.parkingCount}대`,
      interpretation: '차량을 이용하는 방문객 수용이 가능합니다.',
      impact: `${biz}은 저녁 시간 차량 방문객 비중이 높아 주차 가능 여부가 매출에 직접 영향을 줄 수 있습니다.`,
    })
  }

  if (store.visibility === 'excellent' || store.visibility === 'good') {
    items.push({
      title: '주요 동선 시인성 양호',
      data: store.visibility === 'excellent' ? '가시성: 우수' : '가시성: 양호',
      interpretation: '주요 통행 동선에서 점포 인지가 가능한 위치입니다.',
      impact: '초기 인지도 확보와 신규 고객 유입에 유리합니다.',
    })
  }

  if (store.premium === 0) {
    items.push({
      title: '권리금 없음',
      data: '권리금: 없음',
      interpretation: '초기 투자 비용이 절감되어 운전자금 확보에 유리합니다.',
      impact: '손익분기점 도달 기간이 단축될 수 있습니다.',
    })
  }

  if (items.length === 0) {
    items.push({
      title: '현장 조건 추가 확인 필요',
      data: `${FLOOR_LABELS[store.floor]} · ${store.areaPyeong}평`,
      interpretation: '현재 입력된 조건만으로는 명확한 입지 장점을 도출하기 어렵습니다.',
      impact: '현장 방문 후 주변 동선, 경쟁점포 위치 등을 직접 확인하십시오.',
    })
  }

  return items
}

function genRisks(store: Store): AnalysisItem[] {
  const items: AnalysisItem[] = []
  const biz = store.desiredBusiness
  const totalMonthly = store.monthlyRent + store.maintenanceFee

  items.push({
    title: '월세 고정비 부담',
    data: `월세 ${formatMoney(store.monthlyRent)}${store.maintenanceFee > 0 ? ` + 관리비 ${formatMoney(store.maintenanceFee)}` : ''}`,
    interpretation:
      totalMonthly > 3_500_000
        ? '고정비 부담이 높은 편입니다. 매출이 충분하지 않으면 위험요인이 될 수 있습니다.'
        : '임대 부담 수준을 사전에 점검하십시오.',
    impact: '예상매출이 충분하지 않으면 손익분기점이 높아질 수 있습니다.',
    action: '예상 월매출 대비 월세 비율(목표: 10% 이하)을 반드시 계산하십시오.',
  })

  if (store.floor !== '1f') {
    items.push({
      title: `${FLOOR_LABELS[store.floor]} 접근성 한계`,
      data: `층수: ${FLOOR_LABELS[store.floor]}`,
      interpretation: `${FLOOR_LABELS[store.floor]} 점포는 1층 대비 자연스러운 고객 유입이 어렵습니다.`,
      impact: '목적 방문 비율을 높이는 마케팅 전략이 반드시 병행되어야 합니다.',
      action: `유사 ${biz} 업종의 동일 층수 성공 사례를 현장에서 확인하십시오.`,
    })
  }

  if (store.frontageMeters < 5) {
    items.push({
      title: '전면 노출 제한',
      data: `전면폭 ${store.frontageMeters}m`,
      interpretation: '간판 크기와 외부 노출이 제한될 수 있습니다.',
      impact: `${biz} 업종은 간판 인지가 중요하므로 대안적 노출 방법을 검토해야 합니다.`,
      action: '건물주와 간판 설치 가능 여부 및 크기 제한을 사전에 확인하십시오.',
    })
  }

  if (store.parkingCount === 0) {
    items.push({
      title: '주차 불가',
      data: '주차: 0대',
      interpretation: '차량을 이용하는 방문객의 접근이 어렵습니다.',
      impact: '도보 유입에 의존하게 되어 상권 반경이 제한될 수 있습니다.',
      action: '주변 공영주차장 위치와 요금을 확인하고 고객 안내 방법을 준비하십시오.',
    })
  }

  if (store.premium > 0) {
    items.push({
      title: '권리금 투자 위험',
      data: `권리금 ${formatMoney(store.premium)}`,
      interpretation: '권리금은 임차 종료 시 회수가 보장되지 않는 비용입니다.',
      impact: '초기 투자 회수 기간이 길어지며, 조기 폐업 시 회수 불가 가능성이 있습니다.',
      action: '권리금 발생 근거(시설·영업권·바닥권리)를 구분하고 협상 여지를 확인하십시오.',
    })
  }

  return items
}

function genContractChecks(store: Store): ContractCheck[] {
  const biz = store.desiredBusiness
  const isFoodOrBar = isBarOrFood(biz)

  const base: ContractCheck[] = [
    { id: 'building-use', category: '건물', item: '건물 용도 확인 (주용도·부속용도 — 업종 허가 가능 여부)', status: 'unchecked', note: '' },
    { id: 'biz-reg', category: '행정', item: `${biz} 영업신고 또는 인허가 가능 여부 사전 확인`, status: 'unchecked', note: '' },
    { id: 'prev-op', category: '행정', item: '기존 영업자 폐업 완료 여부 및 행정처분 이력 확인', status: 'unchecked', note: '' },
    { id: 'register', category: '법률', item: '건물 등기부등본 열람 — 근저당·압류·가처분 여부', status: 'unchecked', note: '' },
    { id: 'lease-term', category: '계약', item: '임대차 기간 및 갱신 조건 명시 여부 (최소 2년 권고)', status: 'unchecked', note: '' },
    { id: 'rent-increase', category: '계약', item: '임대료 인상률 상한 및 인상 조건 계약서 명시', status: 'unchecked', note: '' },
    { id: 'sublease', category: '계약', item: '전대차 가능 여부 및 임대인 동의 조건', status: 'unchecked', note: '' },
    { id: 'parking-actual', category: '시설', item: '주차 실제 사용 가능 여부 (구획 지정 여부, 공용/전용 구분)', status: 'unchecked', note: '' },
    { id: 'signage', category: '시설', item: '간판 설치 위치·크기 제한 확인 (건물주 및 행정 기준)', status: 'unchecked', note: '' },
    { id: 'fire', category: '시설', item: '소방시설 현황 및 최근 소방검사 통과 여부', status: 'unchecked', note: '' },
    { id: 'restroom', category: '시설', item: '화장실 위치·전용 여부, 장애인 화장실 기준 적합 여부', status: 'unchecked', note: '' },
    { id: 'electric-cap', category: '전기', item: '전기 용량 확인 (계약 전력 kW — 영업 설비 가동 가능 여부)', status: 'unchecked', note: '' },
    { id: 'mgmt-rule', category: '건물', item: '건물 관리규약 및 공용부 사용 제한 사항 확인', status: 'unchecked', note: '' },
    { id: 'premium-basis', category: '권리금', item: store.premium > 0 ? '권리금 발생 근거(시설·영업·바닥) 구분 및 협상 여지 확인' : '권리금 없음 — 계약서에 미발생 명시 권고', status: 'unchecked', note: '' },
  ]

  if (isFoodOrBar) {
    return [
      { id: 'duct', category: '주방', item: '닥트(환기) 설치 가능 여부 및 배기구 위치 확인', status: 'unchecked', note: '' },
      { id: 'gas', category: '주방', item: '도시가스 인입 여부 및 공급 용량', status: 'unchecked', note: '' },
      { id: 'drainage', category: '주방', item: '주방 배수 용량·구배 및 역류 여부 현장 확인', status: 'unchecked', note: '' },
      { id: 'sewage', category: '주방', item: '하수 역류 이력 및 현황 — 임대인 서면 확인 권고', status: 'unchecked', note: '' },
      { id: 'grease-trap', category: '주방', item: '그리스 트랩(기름막이) 설치 여부 및 용량', status: 'unchecked', note: '' },
      ...base,
    ]
  }

  return base
}

function genMarketData(store: Store): MarketData {
  const biz = store.desiredBusiness
  return {
    mainCustomerAge: '데이터 미연결',
    competitorCount: -1,
    newStores: -1,
    closedStores: -1,
    salesChange: 0,
    interpretation: `${biz} 업종의 상권 경쟁환경 데이터는 현재 연결되지 않았습니다. 현장 방문 시 동종업종 경쟁점 수와 신규·폐업 현황을 직접 파악하여 판단하십시오.`,
  }
}

function genSummary(store: Store, grade: Grade): string {
  const biz = store.desiredBusiness
  const floor = FLOOR_LABELS[store.floor]
  const rent = formatMoney(store.monthlyRent)

  if (grade === 'A+' || grade === 'A') {
    return `${store.address}의 해당 점포는 ${biz} 업종 출점을 우선 검토할 수 있는 입지입니다. ${floor} 위치와 가시성 조건이 양호하며, 월세 ${rent} 대비 매출 목표 달성 가능성을 추가로 검토한 후 계약을 진행하시기 바랍니다.`
  }
  if (grade === 'B+' || grade === 'B') {
    return `${floor}에서 ${biz} 업종 출점을 조건부로 검토할 수 있습니다. 월세 ${rent} 부담과 경쟁강도를 추가 검토해야 하며, 계약 전 현장 재확인과 손익 시뮬레이션을 권장합니다.`
  }
  return `이 점포는 ${biz} 업종 출점 전 추가 검토와 위험요인 확인이 필요합니다. 보수적인 매출 계획과 함께 임대조건 재협상, 현장 점검을 철저히 진행하십시오.`
}

// ── Main entry ────────────────────────────────────────────────────────────────

export function analyzeStore(store: Store): AnalysisResult {
  const location = scoreLocation(store)
  const visibility = scoreVisibility(store)
  const rent = scoreRent(store)
  const businessFit = scoreBusinessFit(store)
  const competition = scoreCompetition(store)
  const totalRisk = scoreTotalRisk(location.score, visibility.score, rent.score)

  const weightedScore = Math.round(
    location.score * 0.25 +
    visibility.score * 0.2 +
    rent.score * 0.2 +
    businessFit.score * 0.2 +
    competition.score * 0.15,
  )
  const overallGrade = scoreToGrade(weightedScore)

  const recommendation: Recommendation =
    weightedScore >= 80 ? 'primary' :
    weightedScore >= 65 ? 'conditional' :
    weightedScore >= 50 ? 'caution' : 'review'

  return {
    id: generateId(),
    storeId: store.id,
    overallGrade,
    overallScore: weightedScore,
    scores: { location, visibility, rent, businessFit, competitionRisk: competition, totalRisk },
    summary: genSummary(store, overallGrade),
    recommendation,
    strengths: genStrengths(store),
    risks: genRisks(store),
    marketData: genMarketData(store),
    contractChecks: genContractChecks(store),
    createdAt: new Date().toISOString(),
  }
}

export function compareStores(
  storeA: Store,
  storeB: Store,
  analysisA: AnalysisResult,
  analysisB: AnalysisResult,
): import('@/types').ComparisonResult {
  const addrA = storeA.address || storeA.name || '후보 A'
  const addrB = storeB.address || storeB.name || '후보 B'

  const visLabel = (v: string) =>
    v === 'excellent' ? '우수' : v === 'good' ? '양호' : v === 'average' ? '보통' : '불량'
  const visRank = ['excellent', 'good', 'average', 'poor']

  const items: import('@/types').ComparisonItem[] = [
    {
      category: '위치 · 층수',
      labelA: `${FLOOR_LABELS[storeA.floor]}`,
      labelB: `${FLOOR_LABELS[storeB.floor]}`,
      advantageFor: storeA.floor === '1f' && storeB.floor !== '1f' ? 'A' : storeB.floor === '1f' && storeA.floor !== '1f' ? 'B' : 'equal',
      interpretation: `후보 A는 ${FLOOR_LABELS[storeA.floor]}, 후보 B는 ${FLOOR_LABELS[storeB.floor]} 위치입니다.`,
    },
    {
      category: '면적',
      labelA: `${storeA.areaPyeong}평`,
      labelB: `${storeB.areaPyeong}평`,
      advantageFor: storeA.areaPyeong > storeB.areaPyeong ? 'A' : storeA.areaPyeong < storeB.areaPyeong ? 'B' : 'equal',
      interpretation: `면적 A ${storeA.areaPyeong}평, B ${storeB.areaPyeong}평 — 희망 업종 운영에 필요한 규모를 기준으로 비교하십시오.`,
    },
    {
      category: '전면폭',
      labelA: `${storeA.frontageMeters}m`,
      labelB: `${storeB.frontageMeters}m`,
      advantageFor: storeA.frontageMeters > storeB.frontageMeters ? 'A' : storeA.frontageMeters < storeB.frontageMeters ? 'B' : 'equal',
      interpretation: `전면폭이 넓을수록 외부 노출성이 높습니다. A(${storeA.frontageMeters}m) vs B(${storeB.frontageMeters}m).`,
    },
    {
      category: '가시성',
      labelA: visLabel(storeA.visibility),
      labelB: visLabel(storeB.visibility),
      advantageFor:
        visRank.indexOf(storeA.visibility) < visRank.indexOf(storeB.visibility) ? 'A' :
        visRank.indexOf(storeA.visibility) > visRank.indexOf(storeB.visibility) ? 'B' : 'equal',
      interpretation: '외부에서의 시인성이 높을수록 간판 효과와 신규 고객 유입에 유리합니다.',
    },
    {
      category: '보증금',
      labelA: formatMoney(storeA.deposit),
      labelB: formatMoney(storeB.deposit),
      advantageFor: storeA.deposit < storeB.deposit ? 'A' : storeA.deposit > storeB.deposit ? 'B' : 'equal',
      interpretation: '보증금이 낮을수록 초기 자금 부담이 적습니다.',
    },
    {
      category: '월세',
      labelA: formatMoney(storeA.monthlyRent),
      labelB: formatMoney(storeB.monthlyRent),
      advantageFor: storeA.monthlyRent < storeB.monthlyRent ? 'A' : storeA.monthlyRent > storeB.monthlyRent ? 'B' : 'equal',
      interpretation: `A ${formatMoney(storeA.monthlyRent)}, B ${formatMoney(storeB.monthlyRent)} — 낮은 고정비가 손익 안전성에 유리합니다.`,
    },
    {
      category: '주차',
      labelA: `${storeA.parkingCount}대`,
      labelB: `${storeB.parkingCount}대`,
      advantageFor: storeA.parkingCount > storeB.parkingCount ? 'A' : storeA.parkingCount < storeB.parkingCount ? 'B' : 'equal',
      interpretation: '주차 가능 대수가 많을수록 차량 방문 고객 유입에 유리합니다.',
    },
    {
      category: '입지 점수',
      labelA: `${analysisA.scores.location.score}점 (${analysisA.scores.location.grade})`,
      labelB: `${analysisB.scores.location.score}점 (${analysisB.scores.location.grade})`,
      advantageFor: analysisA.scores.location.score > analysisB.scores.location.score ? 'A' : analysisA.scores.location.score < analysisB.scores.location.score ? 'B' : 'equal',
      interpretation: '층수, 도보 접근성, 코너 여부를 종합한 입지 점수입니다.',
    },
    {
      category: '임대료 부담',
      labelA: `${analysisA.scores.rent.grade}`,
      labelB: `${analysisB.scores.rent.grade}`,
      advantageFor: analysisA.scores.rent.score > analysisB.scores.rent.score ? 'A' : analysisA.scores.rent.score < analysisB.scores.rent.score ? 'B' : 'equal',
      interpretation: '임대료 부담 등급이 높을수록 고정비 리스크가 낮습니다.',
    },
    {
      category: '업종 적합도',
      labelA: `${analysisA.scores.businessFit.score}점 (${analysisA.scores.businessFit.grade})`,
      labelB: `${analysisB.scores.businessFit.score}점 (${analysisB.scores.businessFit.grade})`,
      advantageFor: analysisA.scores.businessFit.score > analysisB.scores.businessFit.score ? 'A' : analysisA.scores.businessFit.score < analysisB.scores.businessFit.score ? 'B' : 'equal',
      interpretation: '희망 업종과 입지 조건의 적합성을 종합 평가한 수치입니다.',
    },
    {
      category: '종합 점수',
      labelA: `${analysisA.overallScore}점 (${analysisA.overallGrade})`,
      labelB: `${analysisB.overallScore}점 (${analysisB.overallGrade})`,
      advantageFor: analysisA.overallScore > analysisB.overallScore ? 'A' : analysisA.overallScore < analysisB.overallScore ? 'B' : 'equal',
      interpretation: '5개 항목을 가중 평균한 종합 점수입니다.',
    },
  ]

  const aCount = items.filter(i => i.advantageFor === 'A').length
  const bCount = items.filter(i => i.advantageFor === 'B').length

  const winnerLabel = aCount > bCount ? '후보 A' : bCount > aCount ? '후보 B' : null
  const winnerAddr = aCount > bCount ? addrA : bCount > aCount ? addrB : null

  const recommendation = winnerLabel
    ? `${winnerLabel}(${winnerAddr})가 ${Math.max(aCount, bCount)}개 항목에서 우위를 보입니다. 매출 목표가 충분히 확보될 수 있다면 ${winnerLabel}를 우선 검토할 수 있습니다.`
    : '두 후보가 항목별로 균형잡힌 평가를 받았습니다. 희망 업종의 핵심 요건(가시성·주차·임대료)을 기준으로 최종 선택하십시오.'

  const summary = `후보 A(${addrA})는 전면 ${storeA.frontageMeters}m, 주차 ${storeA.parkingCount}대, 월세 ${formatMoney(storeA.monthlyRent)} 조건입니다. 후보 B(${addrB})는 전면 ${storeB.frontageMeters}m, 주차 ${storeB.parkingCount}대, 월세 ${formatMoney(storeB.monthlyRent)} 조건입니다. 두 후보의 결정적 차이는 월세 부담과 가시성 조건이며, 현장 방문을 통해 실제 동선과 경쟁환경을 직접 확인하는 것이 중요합니다.`

  return {
    id: generateId(),
    storeA,
    storeB,
    analysisA,
    analysisB,
    comparisonItems: items,
    summary,
    recommendation,
    createdAt: new Date().toISOString(),
  }
}
