/**
 * fieldRules.ts
 * 상권연구소 현장 판단 Rule Engine
 * 임대료 부담, 권리금 회수, 투자 분석, 업종별 설비 기준 계산
 */

import type { BusinessCategory } from '@/lib/rules/businessRules'

export interface RentBurdenResult {
  totalMonthlyFixed: number    // 만원 — 월세 + 관리비 + 보증금기회비용
  rentRatioPct: number | null  // % — 예상매출 대비 (없으면 null)
  minSalesAt10: number         // 만원 — 10% 기준 필요 월매출
  minSalesAt12: number         // 만원 — 12% 기준 필요 월매출
  riskLevel: 'low' | 'caution' | 'high' | 'unknown'
  interpretation: string       // 자연어 해석
}

export interface PremiumPaybackResult {
  monthsToPayback: number | null
  yearsToPayback: number | null
  isReasonable: boolean
  interpretation: string
}

export interface InitialInvestmentResult {
  breakdown: {
    deposit: number
    premium: number
    interior: number
    other: number
  }
  total: number
  interpretation: string
}

export interface FrontageAssessment {
  meters: number
  category: BusinessCategory
  adequate: boolean
  minRequired: number
  interpretation: string
}

// ─── 임대료 부담 분석 ────────────────────────────────────────────────────────

/**
 * 월 고정 임대비용 및 필요 매출 계산
 * @param monthlyRentMan 월세 (만원)
 * @param maintenanceFeeMan 관리비 (만원, 없으면 0)
 * @param depositMan 보증금 (만원, 기회비용 계산용)
 * @param expectedMonthlySalesMan 예상 월매출 (만원, 없으면 undefined)
 * @param category 업종 (임대료 비율 기준 적용)
 */
export function calcRentBurden(
  monthlyRentMan: number,
  maintenanceFeeMan = 0,
  depositMan = 0,
  expectedMonthlySalesMan?: number,
  category: BusinessCategory = 'general',
): RentBurdenResult {
  // 보증금 기회비용: 연 2.5% → 월 환산
  const depositOpportunityCost = Math.round((depositMan * 0.025) / 12)
  const totalMonthlyFixed = monthlyRentMan + maintenanceFeeMan + depositOpportunityCost

  const minSalesAt10 = Math.round(totalMonthlyFixed / 0.10)
  const minSalesAt12 = Math.round(totalMonthlyFixed / 0.12)

  let rentRatioPct: number | null = null
  let riskLevel: RentBurdenResult['riskLevel'] = 'unknown'

  if (expectedMonthlySalesMan && expectedMonthlySalesMan > 0) {
    rentRatioPct = Math.round((totalMonthlyFixed / expectedMonthlySalesMan) * 1000) / 10

    // 업종별 기준 (주점은 임대료 감당력이 낮아 기준이 엄격)
    const dangerThreshold = category === 'bar' ? 14 : category === 'unmanned' ? 12 : 13
    const cautionThreshold = category === 'bar' ? 10 : category === 'unmanned' ? 8 : 10

    if (rentRatioPct >= dangerThreshold) riskLevel = 'high'
    else if (rentRatioPct >= cautionThreshold) riskLevel = 'caution'
    else riskLevel = 'low'
  }

  const interpretation = buildRentInterpretation(
    totalMonthlyFixed, monthlyRentMan, maintenanceFeeMan, depositOpportunityCost,
    rentRatioPct, minSalesAt10, minSalesAt12, riskLevel, category
  )

  return { totalMonthlyFixed, rentRatioPct, minSalesAt10, minSalesAt12, riskLevel, interpretation }
}

function buildRentInterpretation(
  total: number, rent: number, maint: number, oppCost: number,
  ratio: number | null, min10: number, min12: number,
  risk: RentBurdenResult['riskLevel'],
  category: BusinessCategory,
): string {
  const parts: string[] = []

  parts.push(`월 총 임대비용: 월세 ${rent}만원 + 관리비 ${maint}만원 + 보증금 기회비용 ${oppCost}만원 = **${total}만원**`)
  parts.push(`10% 기준 필요 월매출: **${min10.toLocaleString()}만원**`)
  parts.push(`12% 위험선 기준 필요 월매출: **${min12.toLocaleString()}만원**`)

  if (ratio !== null) {
    const riskLabel = { low: '안정', caution: '주의', high: '위험', unknown: '미확인' }[risk]
    parts.push(`예상 매출 대비 임대료 비율: **${ratio}%** (${riskLabel})`)

    if (risk === 'high') {
      parts.push(`→ ${ratio}%는 ${category === 'bar' ? '주점' : '이 업종'}의 고정비 구조에서 손익분기를 맞추기 매우 어려운 수준입니다.`)
    } else if (risk === 'caution') {
      parts.push(`→ 주의 구간입니다. 인건비·원가 절감 또는 매출 상향이 필요합니다.`)
    } else if (risk === 'low') {
      parts.push(`→ 상대적으로 안정적인 범위입니다. 다른 고정비 항목도 함께 점검하세요.`)
    }
  } else {
    parts.push(`→ 예상 매출이 확인되지 않았습니다. ${min10.toLocaleString()}만원을 월 목표 매출 기준으로 달성 가능한지 현실적으로 검토하세요.`)
  }

  return parts.join('\n')
}

// ─── 권리금 회수 분석 ────────────────────────────────────────────────────────

export function calcPremiumPayback(
  premiumMan: number,
  expectedMonthlyProfitMan?: number,
): PremiumPaybackResult {
  if (!expectedMonthlyProfitMan || expectedMonthlyProfitMan <= 0) {
    return {
      monthsToPayback: null,
      yearsToPayback: null,
      isReasonable: false,
      interpretation: `권리금 ${premiumMan.toLocaleString()}만원을 회수하려면 예상 순이익이 확인되어야 합니다. 순이익이 월 200만원이면 ${Math.ceil(premiumMan / 200)}개월, 300만원이면 ${Math.ceil(premiumMan / 300)}개월이 필요합니다.`,
    }
  }

  const monthsToPayback = Math.ceil(premiumMan / expectedMonthlyProfitMan)
  const yearsToPayback = Math.round((monthsToPayback / 12) * 10) / 10
  // 24개월(2년) 이내 회수 가능하면 합리적
  const isReasonable = monthsToPayback <= 24

  const interpretation = `권리금 ${premiumMan.toLocaleString()}만원 ÷ 월 순이익 ${expectedMonthlyProfitMan}만원 = **${monthsToPayback}개월(${yearsToPayback}년) 회수 예상**. ${isReasonable ? '2년 이내 회수는 합리적인 범위입니다.' : '2년 초과 회수는 권리금 부담이 높은 편입니다. 임대차 갱신·상권 변화 리스크를 고려하세요.'}`

  return { monthsToPayback, yearsToPayback, isReasonable, interpretation }
}

// ─── 초기 투자 총액 ──────────────────────────────────────────────────────────

export function calcInitialInvestment(
  depositMan: number,
  premiumMan = 0,
  interiorMan = 0,
  otherMan = 0,
): InitialInvestmentResult {
  const breakdown = { deposit: depositMan, premium: premiumMan, interior: interiorMan, other: otherMan }
  const total = depositMan + premiumMan + interiorMan + otherMan
  const interpretation = `초기 투자 총액: 보증금 ${depositMan}만원 + 권리금 ${premiumMan}만원 + 인테리어 ${interiorMan}만원${otherMan > 0 ? ` + 기타 ${otherMan}만원` : ''} = **${total.toLocaleString()}만원 (약 ${Math.round(total / 10000 * 10) / 10}억원)**`
  return { breakdown, total, interpretation }
}

// ─── 전면폭 적합성 평가 ──────────────────────────────────────────────────────

const MIN_FRONTAGE: Partial<Record<BusinessCategory, number>> = {
  bar: 5,
  food: 4,
  cafe: 4,
  unmanned: 3,
  retail: 5,
  service: 3,
  general: 3,
}

export function assessFrontage(frontageMeters: number, category: BusinessCategory): FrontageAssessment {
  const minRequired = MIN_FRONTAGE[category] ?? 3
  const adequate = frontageMeters >= minRequired
  const interpretation = adequate
    ? `전면폭 ${frontageMeters}m는 ${category} 업종 기준(최소 ${minRequired}m)을 충족합니다.`
    : `전면폭 ${frontageMeters}m는 ${category} 업종 권장 최소(${minRequired}m)에 미치지 못합니다. 간판 노출과 좌석 배치에 불리할 수 있습니다.`
  return { meters: frontageMeters, category, adequate, minRequired, interpretation }
}

// ─── 층수 적합성 ────────────────────────────────────────────────────────────

export function assessFloor(
  floor: string,
  category: BusinessCategory,
): { score: number; interpretation: string } {
  const isGround = floor === '1f'
  const isBasement = floor === 'basement'
  const isUpper = floor === '2f' || floor === '3f' || floor === '4f_plus'

  // 업종별 층수 중요도
  if (category === 'unmanned' || category === 'retail') {
    if (isGround) return { score: 100, interpretation: '1층 — 무인점포·소매 업종에 최적입니다.' }
    if (isBasement) return { score: 30, interpretation: '지하 — 소매·무인 업종에 불리합니다. 별도 유인 수단(간판·조명)이 필요합니다.' }
    return { score: 50, interpretation: `${floor} — 소매·무인은 1층이 유리합니다. 업종 특성상 접근성 저하가 예상됩니다.` }
  }

  if (category === 'food') {
    if (isGround) return { score: 100, interpretation: '1층 — 점심 수요·충동 방문에 최적입니다.' }
    if (isBasement) return { score: 55, interpretation: '지하 — 먹자골목 내 지하라면 운영 가능하나, 간판 야외 노출이 필수입니다.' }
    return { score: 60, interpretation: `${floor} — 음식점 2층 이상은 목적 방문 고객 위주로 운영해야 합니다. 엘리베이터·충분한 간판이 필수입니다.` }
  }

  if (category === 'bar') {
    if (isGround) return { score: 100, interpretation: '1층 — 주점 야간 유입에 최적입니다.' }
    if (isUpper) return { score: 70, interpretation: `${floor} — 주점은 2층도 가능하지만 야간 간판과 입구 유인이 매우 중요합니다.` }
    return { score: 40, interpretation: '지하 — 주점 지하는 소음·환기 관리가 어렵고, 야간 민원 위험이 높습니다.' }
  }

  if (isGround) return { score: 90, interpretation: '1층 — 접근성 우수.' }
  if (isUpper) return { score: 65, interpretation: `${floor} — 목적형 방문 업종이라면 운영 가능합니다. 엘리베이터 유무를 확인하세요.` }
  return { score: 50, interpretation: '지하 — 업종 특성에 따라 차이가 있습니다.' }
}

// ─── 종합 리스크 요약 빌더 ───────────────────────────────────────────────────

export interface FieldRiskSummary {
  rentBurden?: RentBurdenResult
  premiumPayback?: PremiumPaybackResult
  investment?: InitialInvestmentResult
  frontage?: FrontageAssessment
  floor?: { score: number; interpretation: string }
  overallRisk: 'low' | 'medium' | 'high'
  summary: string
}

export function buildFieldRiskSummary(params: {
  monthlyRentMan?: number
  maintenanceFeeMan?: number
  depositMan?: number
  premiumMan?: number
  interiorMan?: number
  expectedMonthlySalesMan?: number
  expectedMonthlyProfitMan?: number
  frontageMeters?: number
  floor?: string
  category: BusinessCategory
}): FieldRiskSummary {
  const {
    monthlyRentMan, maintenanceFeeMan = 0, depositMan = 0,
    premiumMan = 0, interiorMan = 0,
    expectedMonthlySalesMan, expectedMonthlyProfitMan,
    frontageMeters, floor, category,
  } = params

  const result: FieldRiskSummary = { overallRisk: 'medium', summary: '' }

  if (monthlyRentMan) {
    result.rentBurden = calcRentBurden(
      monthlyRentMan, maintenanceFeeMan, depositMan,
      expectedMonthlySalesMan, category
    )
  }

  if (premiumMan > 0) {
    result.premiumPayback = calcPremiumPayback(premiumMan, expectedMonthlyProfitMan)
    result.investment = calcInitialInvestment(depositMan, premiumMan, interiorMan)
  }

  if (frontageMeters) {
    result.frontage = assessFrontage(frontageMeters, category)
  }

  if (floor) {
    result.floor = assessFloor(floor, category)
  }

  // 종합 위험도
  const highFactors = [
    result.rentBurden?.riskLevel === 'high',
    result.premiumPayback?.isReasonable === false,
    result.frontage?.adequate === false,
  ].filter(Boolean).length

  result.overallRisk = highFactors >= 2 ? 'high' : highFactors === 1 ? 'medium' : 'low'

  const lines: string[] = []
  if (result.rentBurden) lines.push(result.rentBurden.interpretation)
  if (result.investment) lines.push(result.investment.interpretation)
  if (result.premiumPayback) lines.push(result.premiumPayback.interpretation)
  if (result.frontage) lines.push(result.frontage.interpretation)
  if (result.floor) lines.push(result.floor.interpretation)
  result.summary = lines.join('\n')

  return result
}
