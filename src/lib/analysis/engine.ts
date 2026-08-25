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
  BusinessCategory,
  BIZ_CATEGORY_LABELS,
  RentAnalysis,
  BizAnalysis,
} from '@/types'
import { scoreToGrade, generateId, formatMoney } from '@/lib/utils'

// ── Business category detection ───────────────────────────────────────────────

const BIZ_KEYWORDS: Record<BusinessCategory, string[]> = {
  bar:      ['주점', '술집', '호프', '바 ', '포차', '이자카야', '선술집', '맥주집', '와인바', '칵테일'],
  cafe:     ['카페', '커피', '음료', '베이커리', '디저트', '케이크', '브런치', '티룸'],
  unmanned: ['무인', '뽑기', '가챠', '셀프', '코인', '인형뽑기', '캡슐'],
  food:     ['식당', '밥집', '음식', '분식', '치킨', '피자', '고기', '횟집', '한식', '중식', '일식', '양식',
             '국밥', '냉면', '삼겹살', '갈비', '순대', '곱창', '도시락', '김밥', '라멘', '파스타', '스테이크'],
  retail:   ['쇼핑', '편의점', '마트', '슈퍼', '소매', '의류', '패션', '잡화', '문구', '팬시'],
  service:  ['학원', '미용실', '미용', '세탁', '부동산', '병원', '의원', '약국', '여행사', '보험'],
  general:  [],
}

export function detectBusinessCategory(business: string): BusinessCategory {
  const b = business.toLowerCase()
  for (const cat of ['bar', 'cafe', 'unmanned', 'food', 'retail', 'service'] as BusinessCategory[]) {
    if (BIZ_KEYWORDS[cat].some(k => b.includes(k))) return cat
  }
  return 'general'
}

// ── Business-specific score weights ──────────────────────────────────────────

const BIZ_WEIGHTS: Record<BusinessCategory, { location: number; visibility: number; rent: number; businessFit: number; competition: number }> = {
  food:     { location: 0.30, visibility: 0.20, rent: 0.20, businessFit: 0.20, competition: 0.10 },
  bar:      { location: 0.20, visibility: 0.20, rent: 0.30, businessFit: 0.20, competition: 0.10 },
  cafe:     { location: 0.25, visibility: 0.25, rent: 0.20, businessFit: 0.20, competition: 0.10 },
  unmanned: { location: 0.30, visibility: 0.35, rent: 0.20, businessFit: 0.10, competition: 0.05 },
  retail:   { location: 0.30, visibility: 0.25, rent: 0.20, businessFit: 0.15, competition: 0.10 },
  service:  { location: 0.20, visibility: 0.15, rent: 0.25, businessFit: 0.25, competition: 0.15 },
  general:  { location: 0.25, visibility: 0.20, rent: 0.20, businessFit: 0.20, competition: 0.15 },
}

// ── Scoring helpers ───────────────────────────────────────────────────────────

function score(s: number): { score: number; grade: Grade } {
  return { score: Math.min(100, Math.max(0, s)), grade: scoreToGrade(s) }
}

// ── Dimension scorers ─────────────────────────────────────────────────────────

function scoreLocation(store: Store): ScoreDetail {
  let s = 60
  const parts: string[] = []

  const floorBonus: Record<string, number> = {
    '1f': 25, '2f': 5, '3f': -5, '4f_plus': -10, basement: -5,
  }
  s += floorBonus[store.floor] ?? 0

  if (store.floor === '1f') {
    parts.push('1층 위치로 계단 없이 직접 진입 가능 — 자연 유입 장벽 최소화')
  } else if (store.floor === 'basement') {
    parts.push('지하층 — 목적 방문 유도 전략이 없으면 자연 유입이 제한됨')
  } else {
    parts.push(`${FLOOR_LABELS[store.floor]} — 1층 대비 자연 유입이 어려워 적극적인 안내·마케팅 필요`)
  }

  const walkBonus: Record<string, number> = { excellent: 10, good: 5, average: 0, poor: -10 }
  s += walkBonus[store.walkAccess] ?? 0
  if (store.walkAccess === 'excellent') parts.push('도보 접근성 우수 — 보행 고객 유입 유리')
  else if (store.walkAccess === 'poor') parts.push('도보 접근성 불량 — 보행 고객 유입 어려움')

  if (store.isCorner) { s += 5; parts.push('코너 위치 — 두 방향에서 간판 노출 가능') }

  const r = score(s)
  return {
    ...r,
    label: '입지',
    interpretation: parts.join('. '),
  }
}

function scoreVisibility(store: Store): ScoreDetail {
  let s = 50
  const parts: string[] = []

  if (store.frontageMeters >= 8) { s += 30; parts.push(`전면폭 ${store.frontageMeters}m — 차량·보행자 모두 인지 가능한 넓은 외부 노출`) }
  else if (store.frontageMeters >= 6) { s += 20; parts.push(`전면폭 ${store.frontageMeters}m — 외부 노출성 양호`) }
  else if (store.frontageMeters >= 4) { s += 10; parts.push(`전면폭 ${store.frontageMeters}m — 기본 노출 수준, 간판 디자인으로 보완 필요`) }
  else { parts.push(`전면폭 ${store.frontageMeters}m — 협소하여 간판 크기와 노출에 제약 가능`) }

  const visBonus: Record<string, number> = { excellent: 20, good: 10, average: 0, poor: -10 }
  s += visBonus[store.visibility] ?? 0
  if (store.visibility === 'excellent') parts.push('가시성 우수 — 주요 동선에서 점포 인지 용이')
  else if (store.visibility === 'good') parts.push('가시성 양호 — 통행인 인지 가능')
  else if (store.visibility === 'poor') parts.push('가시성 불량 — 외부 인지도 확보에 별도 노력 필요')

  const r = score(s)
  return {
    ...r,
    label: '가시성',
    interpretation: parts.join('. '),
  }
}

function scoreRent(store: Store): ScoreDetail {
  let s = 75
  const monthly = store.monthlyRent + store.maintenanceFee
  const parts: string[] = []

  if (monthly > 8_000_000) {
    s -= 30
    parts.push(`월 고정비 ${formatMoney(monthly)} — 매출이 충분하지 않으면 심각한 위험요인`)
  } else if (monthly > 5_000_000) {
    s -= 20
    parts.push(`월 고정비 ${formatMoney(monthly)} — 손익분기 매출 수준이 높아 부담 큼`)
  } else if (monthly > 3_500_000) {
    s -= 10
    parts.push(`월 고정비 ${formatMoney(monthly)} — 임대료 수준을 사전 검토 필요`)
  } else if (monthly <= 2_000_000) {
    s += 5
    parts.push(`월 고정비 ${formatMoney(monthly)} — 임대 부담이 상대적으로 낮아 손익 안전성 양호`)
  } else {
    parts.push(`월 고정비 ${formatMoney(monthly)} — 예상매출 대비 임대료 비율 확인 필요`)
  }

  if (store.premium > 50_000_000) {
    s -= 15
    parts.push(`권리금 ${formatMoney(store.premium)} — 고액 권리금으로 초기 투자 회수 기간 장기화 위험`)
  } else if (store.premium > 20_000_000) {
    s -= 5
    parts.push(`권리금 ${formatMoney(store.premium)} — 권리금 발생 근거와 회수 가능성 검토 필요`)
  } else if (store.premium === 0) {
    parts.push('권리금 없음 — 초기 투자 비용 절감')
  }

  const r = score(s)
  return {
    ...r,
    label: '임대조건',
    interpretation: parts.join('. '),
  }
}

function scoreBusinessFit(store: Store, category: BusinessCategory): ScoreDetail {
  let s = 65
  const biz = store.desiredBusiness
  const parts: string[] = []

  // Floor fit
  if (category === 'bar' || category === 'food' || category === 'cafe' || category === 'unmanned' || category === 'retail') {
    if (store.floor === '1f') { s += 15; parts.push(`${biz} 업종에 1층 입지 최적`) }
    else if (store.floor === 'basement') { s -= 10; parts.push(`지하층 ${biz} — 목적 방문 유도 전략 필수`) }
    else { s -= 8; parts.push(`${FLOOR_LABELS[store.floor]}에서 ${biz} 운영 시 접근성 한계 존재`) }
  }

  // Area fit
  if (category === 'food' || category === 'bar') {
    if (store.areaPyeong >= 30) { s += 8; parts.push(`${store.areaPyeong}평 — 주방·홀 구성 적합 규모`) }
    else if (store.areaPyeong < 15) { s -= 10; parts.push(`${store.areaPyeong}평 — 소면적으로 주방 동선과 좌석 구성 제약`) }
  }

  // Facility fit
  if (category === 'food' || category === 'bar') {
    if (store.duct === true) { s += 5; parts.push('닥트 설치 가능 — 환기·배기 조건 충족') }
    else if (store.duct === false) { s -= 8; parts.push('닥트 미설치 — 음식·주점 환기 조건 불충분') }
    if (store.cityGas === true) { s += 3; parts.push('도시가스 인입') }
  }

  // Parking fit by category
  if (category === 'bar') {
    if (store.parkingCount >= 3) { s += 5; parts.push(`주차 ${store.parkingCount}대 — 야간 차량 고객 유입 유리`) }
    else if (store.parkingCount === 0) { s -= 5; parts.push('주차 없음 — 야간 차량 방문객 유입 제한') }
  }

  const r = score(s)
  return {
    ...r,
    label: '업종적합도',
    interpretation: parts[0] ?? `${biz} 업종 적합성 기본 수준`,
  }
}

function scoreCompetition(store: Store): ScoreDetail {
  return {
    score: 60,
    grade: scoreToGrade(60),
    label: '경쟁위험',
    interpretation: `${store.desiredBusiness} 동종업종 경쟁환경 데이터 미연결 — 현장 방문 시 반경 300m 이내 경쟁점 수를 직접 파악하십시오`,
  }
}

function scoreTotalRisk(location: number, visibility: number, rent: number): ScoreDetail {
  const riskRaw = Math.round(100 - (location * 0.3 + visibility * 0.2 + rent * 0.5))
  const clamped = Math.min(100, Math.max(0, riskRaw))
  return {
    score: clamped,
    grade: scoreToGrade(100 - clamped),
    label: '종합 리스크',
    interpretation:
      clamped <= 25 ? '전반적 위험 수준 낮음 — 현 조건에서 안정적 운영 가능성 높음' :
      clamped <= 45 ? '관리 가능한 위험 요인 존재 — 임대조건·시설 조건 추가 확인 필요' :
      '위험 요인 집중 관리 필요 — 계약 전 현장 재확인과 손익 시뮬레이션 필수',
  }
}

// ── Rent analysis ─────────────────────────────────────────────────────────────

function calcRentAnalysis(store: Store): RentAnalysis {
  const totalMonthly = store.monthlyRent + store.maintenanceFee
  const referenceSalesAt10pct = store.monthlyRent * 10
  const referenceSalesAt12pct = Math.round(store.monthlyRent / 0.12)

  let rentRatioPct: number | null = null
  let riskLevel: RentAnalysis['riskLevel'] = 'unknown'
  let interpretation = ''

  if (store.expectedMonthlySales && store.expectedMonthlySales > 0) {
    rentRatioPct = Math.round((store.monthlyRent / store.expectedMonthlySales) * 1000) / 10
    if (rentRatioPct <= 10) {
      riskLevel = 'low'
      interpretation = `임대료 비율 ${rentRatioPct.toFixed(1)}%는 관리 가능한 범위(10% 이하)입니다. 단, 업종의 원가율과 인건비가 높다면 실제 부담은 이 비율보다 크게 느껴질 수 있습니다.`
    } else if (rentRatioPct <= 12) {
      riskLevel = 'caution'
      interpretation = `임대료 비율 ${rentRatioPct.toFixed(1)}%는 주의 구간(10~12%)입니다. 원가율과 인건비 수준에 따라 손익분기점 도달이 어려울 수 있으므로 보수적인 매출 계획이 필요합니다.`
    } else {
      riskLevel = 'high'
      interpretation = `임대료 비율 ${rentRatioPct.toFixed(1)}%는 고부담 구간(12% 초과)입니다. 예상매출이 목표에 미치지 못하면 수익성이 빠르게 악화되므로 임대조건 재협상 또는 매출 계획 재검토가 필요합니다.`
    }
  } else {
    riskLevel = 'unknown'
    interpretation = `예상 월매출이 입력되지 않아 임대료 부담률을 계산할 수 없습니다. 월세를 월매출의 10% 수준으로 관리한다고 가정하면 약 ${formatMoney(referenceSalesAt10pct)}의 월매출이 필요합니다. 이는 손익분기점이 아니라 임대료 부담 판단을 위한 참고값입니다.`
  }

  return {
    monthlyRent: store.monthlyRent,
    maintenanceFee: store.maintenanceFee,
    totalMonthly,
    expectedMonthlySales: store.expectedMonthlySales ?? null,
    rentRatioPct,
    referenceSalesAt10pct,
    referenceSalesAt12pct,
    interpretation,
    riskLevel,
  }
}

// ── Business analysis ─────────────────────────────────────────────────────────

function genBizAnalysis(store: Store, category: BusinessCategory): BizAnalysis {
  const biz = store.desiredBusiness
  const favorable: string[] = []
  const unfavorable: string[] = []
  const mustCheck: string[] = []
  const specificRisks: string[] = []

  // Common floor factor
  if (store.floor === '1f') favorable.push('1층 위치 — 고객 진입 장벽 최소화, 충동 방문 유도 가능')
  else unfavorable.push(`${FLOOR_LABELS[store.floor]} — 1층 대비 자연 유입 제한, 적극적 유도 전략 필요`)

  if (store.isCorner) favorable.push('코너 점포 — 두 방향 간판·외부 노출로 인지도 향상')
  if (store.visibility === 'excellent' || store.visibility === 'good') {
    favorable.push(`가시성 ${store.visibility === 'excellent' ? '우수' : '양호'} — 외부 인지 및 간판 효과 충분`)
  } else if (store.visibility === 'poor') {
    unfavorable.push('가시성 불량 — 외부에서 점포 인지가 어렵고 신규 고객 유입 장애')
  }

  if (category === 'bar') {
    if (store.parkingCount >= 2) favorable.push(`주차 ${store.parkingCount}대 — 야간 차량 고객 수용 가능`)
    else if (store.parkingCount === 0) unfavorable.push('주차 없음 — 야간 차량 고객 유입이 어려워 도보 상권에만 의존')
    if (store.restroom === true) favorable.push('전용 화장실 — 주점 운영 필수 시설 충족')
    else if (store.restroom === false) unfavorable.push('전용 화장실 없음 — 주점 운영에서 고객 불편 발생 가능')
    if (store.duct === true) favorable.push('닥트(환기) 설치 가능 — 주방 냄새·흡연 환경 관리 가능')
    else if (store.duct === false) unfavorable.push('닥트 미설치 — 주류·주방 냄새 환기 어려움, 고객 불만 원인')
    mustCheck.push('야간 보행 동선 및 야간 유동인구 현황 — 낮과 밤의 유동 패턴이 다름')
    mustCheck.push('반경 200m 내 동종 주점·경쟁업소 수와 가격대')
    mustCheck.push('소음 민원 가능성 및 건물 방음 수준')
    mustCheck.push('영업신고 가능 여부 — 건물 용도·행정구역 확인')
    mustCheck.push('야간 간판 조명·노출 가능 여부')
    mustCheck.push('닥트·전기(음향 설비)·화장실·소방 조건')
    specificRisks.push('주점은 날씨·요일·계절에 따라 매출 변동성이 크며 평일과 주말 차이가 심함')
    specificRisks.push('주류비 + 인건비 + 임대료 3중 고정비 구조에서 손익분기점이 높음')
    specificRisks.push('소음·위생 민원이 반복되면 행정처분(영업정지) 위험')
    specificRisks.push('야간 영업 특성상 안전사고·주취 고객 관리 비용 발생')

  } else if (category === 'food') {
    if (store.duct === true) favorable.push('닥트(환기) 설치 가능 — 음식점 필수 조건 충족')
    else if (store.duct === false) unfavorable.push('닥트 미설치 — 음식점 환기·배기 불충분, 허가 제한 가능')
    if (store.cityGas === true) favorable.push('도시가스 인입 — 가스 장비 운영 가능')
    else if (store.cityGas === false) unfavorable.push('도시가스 미인입 — 가스 조리 장비 운영 어려움, LPG 전환 비용 발생')
    if (store.drainage === true) favorable.push('배수 양호 — 주방 운영 기본 조건 충족')
    else if (store.drainage === false) unfavorable.push('배수 불량 — 주방 운영 시 역류·침수 위험')
    if (store.areaPyeong >= 25) favorable.push(`${store.areaPyeong}평 — 주방과 홀을 동시에 구성할 수 있는 면적`)
    else if (store.areaPyeong < 15) unfavorable.push(`${store.areaPyeong}평 — 주방 동선과 좌석 수 확보에 제약`)
    mustCheck.push('닥트(환기) 설치 가능 여부 및 배기구 위치 — 건물주 협의 필요')
    mustCheck.push('도시가스 인입 및 공급 용량 — 가스 조리 장비 가동 가능 여부')
    mustCheck.push('주방 배수·하수 역류 이력 — 임대인 서면 확인 권고')
    mustCheck.push('전기 용량 — 주방 기기(냉장고·튀김기 등) 동시 가동 가능 여부')
    mustCheck.push('건물 용도 — 음식점 영업신고 가능 여부 사전 확인')
    specificRisks.push('원가율 30~40% + 인건비 25~35% + 임대료가 겹치면 손익분기점이 매우 높아짐')
    specificRisks.push('위생관리·화재 안전 의무 비용 및 정기 점검 부담')
    specificRisks.push('주방 인테리어 초기 투자가 크고 원상복구 의무 확인 필요')
    specificRisks.push('식재료 가격 변동에 따른 원가 상승 위험')

  } else if (category === 'unmanned') {
    if (store.frontageMeters >= 5) favorable.push(`전면폭 ${store.frontageMeters}m — 외부 간판·기기 진열 노출 충분`)
    else unfavorable.push(`전면폭 ${store.frontageMeters}m — 무인점포 외부 인지를 위한 간판 공간 협소`)
    mustCheck.push('10~30대 보행 유동인구 현황 — 학원가·식음시설·오락시설 인접 여부')
    mustCheck.push('야간 보안 체계 및 CCTV 설치 가능 여부')
    mustCheck.push('전기 용량 — 기기 다수 동시 운영 가능 여부')
    mustCheck.push('인근 유사 업종 경쟁 현황')
    mustCheck.push('충동 방문 유도 동선 확보 — 보행로에서 직접 진입 가능 여부')
    specificRisks.push('유동인구 의존도가 매우 높아 인구 감소 시 매출 직접 타격')
    specificRisks.push('무인 운영 특성상 관리·보안·기기 고장 대응 체계가 없으면 리스크 급증')
    specificRisks.push('객단가가 낮아 회전율이 매우 중요 — 면적 대비 기기 배치 효율 계획 필수')
    specificRisks.push('동종 업종 진입 장벽이 낮아 경쟁 급증 가능성')

  } else if (category === 'cafe') {
    if (store.areaPyeong >= 20) favorable.push(`${store.areaPyeong}평 — 체류형 좌석 수 확보 가능`)
    else if (store.areaPyeong < 15) unfavorable.push(`${store.areaPyeong}평 — 좌석 수 부족으로 체류 고객 수용 어려움`)
    mustCheck.push('배후 수요 확인 — 오피스·주거 밀도와 체류 수요 파악')
    mustCheck.push('경쟁 카페 밀도 및 대형 브랜드 입점 현황')
    mustCheck.push('에스프레소 머신 전기 용량 (220V/380V 확인)')
    mustCheck.push('테이크아웃 동선 및 계산대 위치 설계 가능 여부')
    specificRisks.push('카페 포화 시장에서 대형 브랜드 입점 시 고객 이탈이 빠름')
    specificRisks.push('좌석 효율과 객단가를 동시에 관리해야 하는 이중 과제')
    specificRisks.push('인건비(바리스타) + 재료비 + 임대료 3중 구조에서 손익분기점 높음')

  } else if (category === 'retail') {
    if (store.frontageMeters >= 6) favorable.push(`전면폭 ${store.frontageMeters}m — 상품 진열·외부 노출 충분`)
    mustCheck.push('배후 주거·오피스 수요 파악')
    mustCheck.push('경쟁 유사 업종 위치 및 가격대')
    mustCheck.push('물류·납품 동선 확보 가능 여부')
    specificRisks.push('온라인 채널과의 경쟁 심화')
    specificRisks.push('재고 관리 비용과 상품 회전율 문제')

  } else {
    mustCheck.push('건물 용도 및 업종 허가 가능 여부')
    mustCheck.push('주변 동선 및 유동인구 현황')
    specificRisks.push(`${biz} 업종별 특성에 맞는 추가 현장 확인 필요`)
  }

  // Common must-check
  mustCheck.push('임대료 부담률 계산 — 월세 ÷ 예상매출 × 100, 목표 10% 이하')

  // Premium risk
  if (store.premium > 0) {
    specificRisks.push(`권리금 ${formatMoney(store.premium)} — 임차 종료 시 회수 보장 없음, 근거 구분(시설·영업·바닥) 확인 필수`)
  }

  return {
    category,
    categoryLabel: BIZ_CATEGORY_LABELS[category],
    favorableFactors: favorable.length > 0 ? favorable : ['현재 입력된 조건으로 판단 가능한 유리 요소가 없습니다. 전면폭·가시성·시설 조건을 추가 입력하면 분석이 정확해집니다.'],
    unfavorableFactors: unfavorable,
    mustCheckFactors: mustCheck,
    specificRisks,
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
      interpretation: `전면폭 ${store.frontageMeters}m는 보행자와 차량 모두의 시야에 점포가 충분히 노출될 수 있는 폭입니다.`,
      impact: `${biz} 업종은 외부 인지도가 초기 고객 유입의 핵심이므로, 넓은 전면폭은 간판 효과와 충동 방문 가능성을 높여줍니다.`,
    })
  }

  if (store.floor === '1f') {
    items.push({
      title: '1층 접근성 — 진입 장벽 최소화',
      data: `${FLOOR_LABELS[store.floor]} · ${store.areaPyeong}평`,
      interpretation: '계단이나 엘리베이터 없이 바로 진입할 수 있어 고객 유입 장벽이 가장 낮은 조건입니다.',
      impact: `${biz}의 경우 충동 방문과 재방문 비율이 높아지고, 테이크아웃이나 즉흥 방문 고객을 수용하기 쉬워집니다.`,
    })
  }

  if (store.isCorner) {
    items.push({
      title: '코너 위치 — 양방향 노출',
      data: '코너 점포',
      interpretation: '두 방향 도로에서 간판과 점포 외관이 동시에 노출됩니다.',
      impact: '유동인구가 두 방향에서 유입되고, 간판 인지 기회가 일반 점포보다 큽니다.',
    })
  }

  if (store.parkingCount >= 3) {
    items.push({
      title: '주차 가능 — 차량 고객 수용',
      data: `주차 ${store.parkingCount}대`,
      interpretation: `${store.parkingCount}대의 주차 공간으로 차량을 이용하는 방문객을 수용할 수 있습니다.`,
      impact: `${biz} 업종은 차량 방문 고객 비중이 높을수록 상권 반경이 넓어지며, 주차 가능 여부가 재방문 의향에도 영향을 줍니다.`,
    })
  }

  if (store.visibility === 'excellent' || store.visibility === 'good') {
    items.push({
      title: '주요 동선 시인성',
      data: store.visibility === 'excellent' ? '가시성: 우수' : '가시성: 양호',
      interpretation: '주요 통행 동선에서 점포를 인지할 수 있는 위치입니다.',
      impact: '초기 인지도 형성과 신규 고객 유입에 유리하며, 간판 설치 효과가 극대화됩니다.',
    })
  }

  if (store.premium === 0) {
    items.push({
      title: '권리금 없음 — 초기 투자 절감',
      data: '권리금: 없음',
      interpretation: '권리금이 없으면 초기 자금 투입이 줄고, 운전자금을 더 확보할 수 있습니다.',
      impact: `손익분기점 도달 기간이 단축될 수 있으며, 초기 현금 흐름 부담이 감소합니다.`,
      action: '계약서에 권리금 미발생을 명시하여 향후 분쟁을 방지하십시오.',
    })
  }

  if (store.duct === true && (store.desiredBusiness.includes('음식') || store.desiredBusiness.includes('주점') || store.desiredBusiness.includes('카페') || store.desiredBusiness.includes('술집') || store.desiredBusiness.includes('식당'))) {
    items.push({
      title: '닥트(환기) 설치 가능',
      data: '닥트: 가능',
      interpretation: '조리 과정에서 발생하는 연기와 냄새를 외부로 배출할 수 있는 환경입니다.',
      impact: '음식·주점 업종에서 닥트가 없으면 영업신고 자체가 제한될 수 있으므로, 이 조건은 핵심 필수 사항입니다.',
    })
  }

  if (items.length === 0) {
    items.push({
      title: '현장 조건 추가 확인 필요',
      data: `${FLOOR_LABELS[store.floor]} · ${store.areaPyeong}평`,
      interpretation: '현재 입력된 조건만으로는 명확한 입지 강점을 도출하기 어렵습니다.',
      impact: '현장 방문 후 주변 동선, 간판 노출, 경쟁점포 위치 등을 직접 확인하십시오.',
    })
  }

  return items
}

function genRisks(store: Store, category: BusinessCategory): AnalysisItem[] {
  const items: AnalysisItem[] = []
  const biz = store.desiredBusiness
  const totalMonthly = store.monthlyRent + store.maintenanceFee

  // Always include rent risk
  if (totalMonthly > 3_500_000) {
    items.push({
      title: '고정비 부담 — 월세 리스크',
      data: `월세 ${formatMoney(store.monthlyRent)}${store.maintenanceFee > 0 ? ` + 관리비 ${formatMoney(store.maintenanceFee)} = 월 ${formatMoney(totalMonthly)}` : ''}`,
      interpretation: `월 고정비 ${formatMoney(totalMonthly)}는 매출이 충분하지 않으면 즉각적인 손실로 이어지는 고정 부담입니다.`,
      impact: `${biz} 업종의 원가율과 인건비를 감안하면 손익분기점 매출이 상당히 높아질 수 있습니다.`,
      action: `예상 월매출 대비 월세 비율(목표: 10% 이하)을 반드시 계산하십시오. 월세 10% 기준 필요 매출은 ${formatMoney(store.monthlyRent * 10)}입니다.`,
    })
  } else if (totalMonthly > 0) {
    items.push({
      title: '월 임대료 고정비 확인',
      data: `월 ${formatMoney(totalMonthly)}`,
      interpretation: '임대료는 매출이 없어도 매월 지출되는 고정비입니다.',
      impact: '예상매출 대비 임대료 비율을 사전에 계산하여 손익 안전성을 확인하십시오.',
      action: `월세를 10% 기준으로 관리하면 약 ${formatMoney(store.monthlyRent * 10)} 이상의 월매출이 필요합니다.`,
    })
  }

  if (store.floor !== '1f') {
    items.push({
      title: `${FLOOR_LABELS[store.floor]} 접근성 한계`,
      data: `층수: ${FLOOR_LABELS[store.floor]}`,
      interpretation: `${FLOOR_LABELS[store.floor]} 점포는 1층 대비 자연스러운 고객 유입이 어렵습니다. 고객이 의도적으로 찾아야 하는 '목적 방문' 구조가 됩니다.`,
      impact: '신규 고객 유치에 추가 마케팅 비용이 발생하며, 인지도 형성 기간이 1층 점포보다 깁니다.',
      action: `유사 ${biz} 업종의 동일 층수 성공 사례와 실제 동선을 현장에서 확인하십시오.`,
    })
  }

  if (store.frontageMeters < 5) {
    items.push({
      title: '전면 노출 제한',
      data: `전면폭 ${store.frontageMeters}m`,
      interpretation: `전면폭 ${store.frontageMeters}m는 간판 설치 가능 크기와 외부 시인성이 제한될 수 있는 수준입니다.`,
      impact: `${biz} 업종은 간판 인지가 중요한 경우가 많아, 좁은 전면폭은 초기 인지도 확보에 불리하게 작용합니다.`,
      action: '건물주와 간판 설치 가능 위치, 크기 제한을 사전에 확인하고 대안적 노출 방법을 검토하십시오.',
    })
  }

  if (store.parkingCount === 0 && (category === 'bar' || category === 'food')) {
    items.push({
      title: '주차 불가 — 차량 고객 유입 제한',
      data: '주차: 0대',
      interpretation: '주차 공간이 없으면 차량을 이용하는 방문객의 접근이 어렵습니다.',
      impact: '도보 유입에만 의존하게 되어 상권 반경이 좁아지고, 단체·가족 방문 고객 유치가 어렵습니다.',
      action: '주변 공영주차장 위치·요금을 사전에 파악하고 고객 안내 방법을 준비하십시오.',
    })
  }

  if (store.premium > 0) {
    items.push({
      title: '권리금 투자 위험',
      data: `권리금 ${formatMoney(store.premium)}`,
      interpretation: '권리금은 임차 계약 종료 시 회수가 법적으로 보장되지 않는 비용입니다.',
      impact: `${formatMoney(store.premium)}의 초기 투자가 추가되어 손익분기점 도달 기간이 길어집니다. 조기 폐업 시 전액 손실 가능성이 있습니다.`,
      action: '권리금 발생 근거(시설권리금·영업권리금·바닥권리금)를 구분하고, 계약서에 상세 내용을 명시하십시오.',
    })
  }

  if (category === 'bar' && store.restroom === false) {
    items.push({
      title: '전용 화장실 없음 — 주점 필수 조건 미충족',
      data: '전용 화장실: 없음',
      interpretation: '주점 업종에서 전용 화장실이 없으면 고객 불편이 크고, 영업신고 과정에서 제한될 수 있습니다.',
      impact: '고객 회전율과 재방문에 직접 영향을 주며, 화장실 공용 사용 시 민원 발생 위험이 있습니다.',
      action: '건물 내 화장실 위치와 공용 사용 조건을 확인하고, 개별 화장실 설치 가능 여부를 검토하십시오.',
    })
  }

  if ((category === 'food' || category === 'bar') && store.duct === false) {
    items.push({
      title: '닥트(환기) 미설치 — 음식·주점 제약',
      data: '닥트: 불가',
      interpretation: '닥트 설치가 불가능하면 조리 연기와 냄새 배출이 어렵습니다.',
      impact: '음식·주점 업종은 닥트 없이 영업신고가 제한될 수 있으며, 환기 불량은 고객 불만과 위생 문제로 이어집니다.',
      action: '건물주와 닥트 설치 가능 여부를 사전에 확인하고, 불가 시 환기 대안을 검토하십시오.',
    })
  }

  return items
}

function genContractChecks(store: Store, category: BusinessCategory): ContractCheck[] {
  const biz = store.desiredBusiness
  const isFoodOrBar = category === 'food' || category === 'bar' || category === 'cafe'

  const base: ContractCheck[] = [
    { id: 'register', category: '법률', item: '등기부등본 열람 — 근저당·압류·가처분·전세권 설정 여부 확인', status: 'unchecked', note: '' },
    { id: 'building-use', category: '건물', item: `건물 용도 확인 — ${biz} 영업신고·인허가 가능 여부 사전 확인`, status: 'unchecked', note: '' },
    { id: 'biz-reg', category: '행정', item: `기존 사업자 폐업 완료 여부 및 행정처분(위반 이력) 확인`, status: 'unchecked', note: '' },
    { id: 'lease-term', category: '계약', item: '임대차 기간 및 갱신 조건 명시 여부 (상가임대차보호법 최소 2년 보장)', status: 'unchecked', note: '' },
    { id: 'rent-increase', category: '계약', item: '임대료 인상률 상한 및 인상 조건 계약서 명시 (연 5% 상한 기준)', status: 'unchecked', note: '' },
    { id: 'sublease', category: '계약', item: '전대차 가능 여부 및 임대인 동의 조건 확인', status: 'unchecked', note: '' },
    { id: 'premium-basis', category: '권리금', item: store.premium > 0 ? `권리금 ${formatMoney(store.premium)} — 발생 근거(시설·영업·바닥) 구분 및 협상 여지 확인` : '권리금 없음 — 계약서에 미발생 명시 권고 (향후 분쟁 방지)', status: 'unchecked', note: '' },
    { id: 'restoration', category: '계약', item: '원상복구 범위 계약서 명시 — 인테리어·설비 각각 범위 특정', status: 'unchecked', note: '' },
    { id: 'signage', category: '시설', item: '간판 설치 위치·크기 제한 확인 (건물주 동의 및 행정 기준)', status: 'unchecked', note: '' },
    { id: 'parking-actual', category: '시설', item: '주차 실제 사용 가능 여부 확인 (구획 지정·공용/전용 구분)', status: 'unchecked', note: '' },
    { id: 'fire', category: '시설', item: '소방시설 현황 및 최근 소방검사 적합 여부', status: 'unchecked', note: '' },
    { id: 'restroom', category: '시설', item: '화장실 위치·전용 여부, 장애인 화장실 기준 적합 여부', status: 'unchecked', note: '' },
    { id: 'electric-cap', category: '전기', item: '전기 용량 확인 (계약 전력 kW — 영업 설비 동시 가동 가능 여부)', status: 'unchecked', note: '' },
    { id: 'mgmt-rule', category: '건물', item: '건물 관리규약 및 공용부 사용 제한 사항 확인', status: 'unchecked', note: '' },
    { id: 'noise', category: '환경', item: '소음·진동 발생 가능성 및 인근 민원 이력 확인', status: 'unchecked', note: '' },
    { id: 'facility-takeover', category: '시설', item: '기존 시설·설비 인수 범위와 상태 확인 — 수리 비용 선반영', status: 'unchecked', note: '' },
  ]

  if (isFoodOrBar) {
    return [
      { id: 'duct', category: '주방', item: '닥트(환기) 설치 가능 여부 및 배기구 위치 확인 — 불가 시 영업신고 제한 가능', status: 'unchecked', note: '' },
      { id: 'gas', category: '주방', item: '도시가스 인입 여부 및 공급 용량 확인', status: 'unchecked', note: '' },
      { id: 'drainage', category: '주방', item: '주방 배수 구배·역류 여부 현장 확인 및 임대인 서면 확인 권고', status: 'unchecked', note: '' },
      { id: 'sewage', category: '주방', item: '하수 역류 이력 및 현황 — 임대인 서면 확인 권고', status: 'unchecked', note: '' },
      { id: 'grease-trap', category: '주방', item: '그리스 트랩(기름막이) 설치 여부 및 용량 확인', status: 'unchecked', note: '' },
      ...base,
    ]
  }

  return base
}

function genMarketData(store: Store): MarketData {
  return {
    mainCustomerAge: '데이터 미연결',
    competitorCount: -1,
    newStores: -1,
    closedStores: -1,
    salesChange: 0,
    interpretation: `${store.desiredBusiness} 업종의 상권 경쟁환경 데이터는 현재 연결되지 않았습니다. 현장 방문 시 반경 300m~500m 내 동종업종 수, 신규·폐업 현황, 주요 경쟁점의 영업 시간·가격대를 직접 파악하십시오.`,
  }
}

function genSummary(store: Store, grade: Grade, category: BusinessCategory, rentAnalysis: RentAnalysis): string {
  const biz = store.desiredBusiness
  const floor = FLOOR_LABELS[store.floor]
  const rent = formatMoney(store.monthlyRent)
  const catLabel = BIZ_CATEGORY_LABELS[category]

  const floorNote = store.floor === '1f' ? '1층 접근성' : `${floor} 위치`
  const rentNote = rentAnalysis.rentRatioPct !== null
    ? `월세 비율 ${rentAnalysis.rentRatioPct.toFixed(1)}%`
    : `월세 ${rent} (10% 기준 필요매출 ${formatMoney(rentAnalysis.referenceSalesAt10pct)})`

  if (grade === 'A+' || grade === 'A') {
    return `${store.address || '분석 대상 점포'}는 ${catLabel}(${biz}) 출점을 우선 검토할 수 있는 입지입니다. ${floorNote}과 가시성 조건이 양호하며, ${rentNote}를 추가로 검토한 후 계약을 진행하시기 바랍니다. 계약 전 현장에서 경쟁환경과 시설 조건을 반드시 확인하십시오.`
  }
  if (grade === 'B+' || grade === 'B') {
    return `${floor}에서 ${biz} 업종 출점을 조건부로 검토할 수 있습니다. ${rentNote}는 핵심 점검 사항이며, 경쟁강도와 시설 조건을 추가 확인한 후 계약 여부를 판단하는 것이 적절합니다. 현장 재확인과 손익 시뮬레이션을 권장합니다.`
  }
  return `이 점포는 ${biz} 업종 출점 전 추가 검토와 위험요인 확인이 필요합니다. ${rentNote}를 포함하여 월세 부담, 층수 접근성, 시설 조건 등을 보수적으로 재검토하고, 임대조건 재협상과 현장 점검을 철저히 진행하십시오.`
}

// ── Main entry ────────────────────────────────────────────────────────────────

export function analyzeStore(store: Store): AnalysisResult {
  const category = detectBusinessCategory(store.desiredBusiness)
  const weights = BIZ_WEIGHTS[category]

  const location = scoreLocation(store)
  const visibility = scoreVisibility(store)
  const rent = scoreRent(store)
  const businessFit = scoreBusinessFit(store, category)
  const competition = scoreCompetition(store)
  const totalRisk = scoreTotalRisk(location.score, visibility.score, rent.score)

  const weightedScore = Math.round(
    location.score * weights.location +
    visibility.score * weights.visibility +
    rent.score * weights.rent +
    businessFit.score * weights.businessFit +
    competition.score * weights.competition,
  )
  const overallGrade = scoreToGrade(weightedScore)

  const recommendation: Recommendation =
    weightedScore >= 80 ? 'primary' :
    weightedScore >= 65 ? 'conditional' :
    weightedScore >= 50 ? 'caution' : 'review'

  const rentAnalysis = calcRentAnalysis(store)
  const bizAnalysis = genBizAnalysis(store, category)
  const risks = genRisks(store, category)
  const summary = genSummary(store, overallGrade, category, rentAnalysis)

  return {
    id: generateId(),
    storeId: store.id,
    overallGrade,
    overallScore: weightedScore,
    scores: { location, visibility, rent, businessFit, competitionRisk: competition, totalRisk },
    summary,
    recommendation,
    strengths: genStrengths(store),
    risks,
    marketData: genMarketData(store),
    contractChecks: genContractChecks(store, category),
    rentAnalysis,
    bizAnalysis,
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
      interpretation: `A는 ${FLOOR_LABELS[storeA.floor]}, B는 ${FLOOR_LABELS[storeB.floor]}. 층수가 낮을수록 자연 유입에 유리하며, 1층이 아닌 경우 별도의 유도 전략이 필요합니다.`,
    },
    {
      category: '면적',
      labelA: `${storeA.areaPyeong}평`,
      labelB: `${storeB.areaPyeong}평`,
      advantageFor: storeA.areaPyeong > storeB.areaPyeong ? 'A' : storeA.areaPyeong < storeB.areaPyeong ? 'B' : 'equal',
      interpretation: `A ${storeA.areaPyeong}평, B ${storeB.areaPyeong}평. 면적은 크다고 유리한 것이 아니라 희망 업종 운영에 필요한 면적인지가 중요합니다.`,
    },
    {
      category: '전면폭',
      labelA: `${storeA.frontageMeters}m`,
      labelB: `${storeB.frontageMeters}m`,
      advantageFor: storeA.frontageMeters > storeB.frontageMeters ? 'A' : storeA.frontageMeters < storeB.frontageMeters ? 'B' : 'equal',
      interpretation: `A(${storeA.frontageMeters}m) vs B(${storeB.frontageMeters}m). 전면폭이 넓을수록 간판·외부 진열 노출이 유리하며 신규 고객 인지 가능성이 높아집니다.`,
    },
    {
      category: '가시성',
      labelA: visLabel(storeA.visibility),
      labelB: visLabel(storeB.visibility),
      advantageFor:
        visRank.indexOf(storeA.visibility) < visRank.indexOf(storeB.visibility) ? 'A' :
        visRank.indexOf(storeA.visibility) > visRank.indexOf(storeB.visibility) ? 'B' : 'equal',
      interpretation: '가시성이 높을수록 간판 효과와 충동 방문 가능성이 커집니다. 특히 초기 인지도가 중요한 업종에서는 결정적 요소입니다.',
    },
    {
      category: '보증금',
      labelA: formatMoney(storeA.deposit),
      labelB: formatMoney(storeB.deposit),
      advantageFor: storeA.deposit < storeB.deposit ? 'A' : storeA.deposit > storeB.deposit ? 'B' : 'equal',
      interpretation: '보증금이 낮을수록 초기 자금 부담이 줄어들고, 여유 운전자금을 확보하는 데 유리합니다.',
    },
    {
      category: '월세',
      labelA: formatMoney(storeA.monthlyRent),
      labelB: formatMoney(storeB.monthlyRent),
      advantageFor: storeA.monthlyRent < storeB.monthlyRent ? 'A' : storeA.monthlyRent > storeB.monthlyRent ? 'B' : 'equal',
      interpretation: `A ${formatMoney(storeA.monthlyRent)}, B ${formatMoney(storeB.monthlyRent)}. 월세 차이 ${formatMoney(Math.abs(storeA.monthlyRent - storeB.monthlyRent))}는 연간 ${formatMoney(Math.abs(storeA.monthlyRent - storeB.monthlyRent) * 12)} 차이로 손익에 직접 영향을 줍니다.`,
    },
    {
      category: '주차',
      labelA: `${storeA.parkingCount}대`,
      labelB: `${storeB.parkingCount}대`,
      advantageFor: storeA.parkingCount > storeB.parkingCount ? 'A' : storeA.parkingCount < storeB.parkingCount ? 'B' : 'equal',
      interpretation: '주차 가능 대수가 많을수록 차량 방문 고객 유입과 단체 방문에 유리합니다.',
    },
    {
      category: '입지 점수',
      labelA: `${analysisA.scores.location.score}점 (${analysisA.scores.location.grade})`,
      labelB: `${analysisB.scores.location.score}점 (${analysisB.scores.location.grade})`,
      advantageFor: analysisA.scores.location.score > analysisB.scores.location.score ? 'A' : analysisA.scores.location.score < analysisB.scores.location.score ? 'B' : 'equal',
      interpretation: '층수·도보 접근성·코너 여부를 종합한 입지 점수입니다. 점수 차이가 클수록 자연 유입에서 유의미한 차이가 발생합니다.',
    },
    {
      category: '임대료 부담',
      labelA: `${analysisA.scores.rent.grade} (${analysisA.scores.rent.score}점)`,
      labelB: `${analysisB.scores.rent.grade} (${analysisB.scores.rent.score}점)`,
      advantageFor: analysisA.scores.rent.score > analysisB.scores.rent.score ? 'A' : analysisA.scores.rent.score < analysisB.scores.rent.score ? 'B' : 'equal',
      interpretation: '임대료 부담 점수가 높을수록 고정비 리스크가 낮습니다. 두 후보의 예상매출이 유사하다면 이 점수가 손익 안전성을 결정합니다.',
    },
    {
      category: '업종 적합도',
      labelA: `${analysisA.scores.businessFit.score}점 (${analysisA.scores.businessFit.grade})`,
      labelB: `${analysisB.scores.businessFit.score}점 (${analysisB.scores.businessFit.grade})`,
      advantageFor: analysisA.scores.businessFit.score > analysisB.scores.businessFit.score ? 'A' : analysisA.scores.businessFit.score < analysisB.scores.businessFit.score ? 'B' : 'equal',
      interpretation: '희망 업종과 점포 조건의 적합성입니다. 시설 조건(닥트·가스·화장실)과 층수·면적이 업종 요건에 맞는지 평가한 결과입니다.',
    },
    {
      category: '종합 점수',
      labelA: `${analysisA.overallScore}점 (${analysisA.overallGrade})`,
      labelB: `${analysisB.overallScore}점 (${analysisB.overallGrade})`,
      advantageFor: analysisA.overallScore > analysisB.overallScore ? 'A' : analysisA.overallScore < analysisB.overallScore ? 'B' : 'equal',
      interpretation: '업종별 가중치를 적용한 종합 점수입니다. 단순한 점수 비교보다는 항목별 판단 차이를 함께 검토하십시오.',
    },
  ]

  const aCount = items.filter(i => i.advantageFor === 'A').length
  const bCount = items.filter(i => i.advantageFor === 'B').length
  const winnerLabel = aCount > bCount ? `후보 A(${addrA})` : bCount > aCount ? `후보 B(${addrB})` : null

  // Build judgment-first recommendation
  const aRentRatio = analysisA.rentAnalysis?.rentRatioPct
  const bRentRatio = analysisB.rentAnalysis?.rentRatioPct
  const aRentRef = analysisA.rentAnalysis?.referenceSalesAt10pct ?? 0
  const bRentRef = analysisB.rentAnalysis?.referenceSalesAt10pct ?? 0

  let aJudgment = `후보 A(${addrA})는 ${FLOOR_LABELS[storeA.floor]} ${storeA.areaPyeong}평, 월세 ${formatMoney(storeA.monthlyRent)} 조건입니다.`
  if (aRentRatio !== null && aRentRatio !== undefined) {
    aJudgment += ` 임대료 비율 ${aRentRatio.toFixed(1)}%로 ${aRentRatio <= 10 ? '관리 가능한 수준' : aRentRatio <= 12 ? '주의 수준' : '고부담 수준'}입니다.`
  } else {
    aJudgment += ` 월세 10% 기준 필요매출은 약 ${formatMoney(aRentRef)}입니다.`
  }

  let bJudgment = `후보 B(${addrB})는 ${FLOOR_LABELS[storeB.floor]} ${storeB.areaPyeong}평, 월세 ${formatMoney(storeB.monthlyRent)} 조건입니다.`
  if (bRentRatio !== null && bRentRatio !== undefined) {
    bJudgment += ` 임대료 비율 ${bRentRatio.toFixed(1)}%로 ${bRentRatio <= 10 ? '관리 가능한 수준' : bRentRatio <= 12 ? '주의 수준' : '고부담 수준'}입니다.`
  } else {
    bJudgment += ` 월세 10% 기준 필요매출은 약 ${formatMoney(bRentRef)}입니다.`
  }

  const recommendation = winnerLabel
    ? `${winnerLabel}가 ${Math.max(aCount, bCount)}개 항목에서 우위를 보입니다. 단, 점수가 아닌 판단 차이를 기준으로 최종 선택하십시오.`
    : `두 후보가 항목별로 균형 잡힌 평가를 받았습니다. 희망 업종의 핵심 요건(가시성·시설조건·임대료)을 기준으로 최종 선택하십시오.`

  const summary = `${aJudgment} ${bJudgment} 두 후보의 결정적 차이는 월세 부담(${formatMoney(storeA.monthlyRent)} vs ${formatMoney(storeB.monthlyRent)})과 가시성·층수 조건이며, 현장 방문을 통해 실제 동선과 경쟁환경을 직접 확인하는 것이 중요합니다.`

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
