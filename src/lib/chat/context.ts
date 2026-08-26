/**
 * context.ts
 * ConversationContext — 대화 세션 동안 수집되는 점포 정보 상태 관리
 * CollectedData(기존)와 구분: ConversationContext는 AI 프롬프트 주입 전용 가공 뷰
 */

import { CollectedData } from './types'
import { detectCategory, getBusinessRule, buildContextSummary } from '../rules/businessRules'

export interface ConversationContext {
  // 위치
  region?: string           // "성수동", "홍대" 등 지역명
  address?: string          // 전체 주소

  // 점포 기본
  businessType?: string     // 희망 업종 원문
  businessCategory?: string // 분류 (bar / food / cafe / ...)
  floor?: string
  areaPyeong?: number
  frontageMeters?: number
  parking?: number

  // 입지
  visibility?: string

  // 임대 조건
  deposit?: number          // 만원
  monthlyRent?: number      // 만원
  maintenanceFee?: number   // 만원
  premium?: number          // 만원

  // 이전 분석 참조
  previousAnalysis?: string // "분석ID" 또는 "마지막 분석 결과 요약"

  // 미수집 필수 필드
  missingFields: string[]

  // 업종별 규칙 요약 (AI 프롬프트 주입용)
  businessRuleSummary?: string
}

const REQUIRED_FOR_ANALYSIS = ['address', 'businessType', 'monthlyRent'] as const

/** CollectedData → ConversationContext 변환 */
export function buildContext(data: CollectedData, analysisId?: string): ConversationContext {
  const businessType = data.desiredBusiness ?? data.currentBusiness
  const category = businessType ? detectCategory(businessType) : 'general'
  const rule = getBusinessRule(category)

  const missingFields: string[] = []
  if (!data.address) missingFields.push('주소')
  if (!data.desiredBusiness && !data.currentBusiness) missingFields.push('업종')
  if (!data.monthlyRentMan && !data.depositMan) missingFields.push('임대조건(월세 또는 보증금)')

  return {
    region: extractRegion(data.address),
    address: data.address,
    businessType,
    businessCategory: category,
    floor: data.floor,
    areaPyeong: data.areaPyeong,
    frontageMeters: data.frontageMeters,
    parking: data.parkingCount,
    visibility: data.visibility,
    deposit: data.depositMan,
    monthlyRent: data.monthlyRentMan,
    maintenanceFee: data.maintenanceFeeMan,
    premium: data.premiumMan,
    previousAnalysis: analysisId,
    missingFields,
    businessRuleSummary: buildContextSummary(rule),
  }
}

/** 분석 가능 여부 — 3개 필수 필드 충족 시 true */
export function isReadyForAnalysis(ctx: ConversationContext): boolean {
  return !!(ctx.address && ctx.businessType && ctx.monthlyRent)
}

/** 누락 필드를 자연스러운 질문 문장으로 변환 */
export function getMissingFieldPrompt(ctx: ConversationContext): string {
  if (ctx.missingFields.length === 0) return ''
  return `분석을 시작하려면 ${ctx.missingFields.join(', ')} 정보가 필요합니다.`
}

/** 주소에서 지역명 추출 (시·구·동 단위) */
function extractRegion(address?: string): string | undefined {
  if (!address) return undefined
  // "서울시 마포구 합정동" → "합정동"
  const dongMatch = address.match(/([가-힣]+[동읍면])/)
  if (dongMatch) return dongMatch[1]
  // "마포구" 등
  const guMatch = address.match(/([가-힣]+[구군시])/)
  if (guMatch) return guMatch[1]
  return address.split(' ').pop()
}

/** AI 시스템 프롬프트에 주입할 컨텍스트 블록 생성 */
export function buildContextBlock(ctx: ConversationContext): string {
  const lines: string[] = ['[현재 세션 수집 정보]']

  if (ctx.address) lines.push(`주소: ${ctx.address}`)
  if (ctx.region) lines.push(`지역: ${ctx.region}`)
  if (ctx.businessType) lines.push(`희망업종: ${ctx.businessType}`)
  if (ctx.floor) lines.push(`층수: ${ctx.floor}`)
  if (ctx.areaPyeong) lines.push(`면적: ${ctx.areaPyeong}평`)
  if (ctx.frontageMeters) lines.push(`전면폭: ${ctx.frontageMeters}m`)
  if (ctx.visibility) lines.push(`가시성: ${ctx.visibility}`)
  if (ctx.parking !== undefined) lines.push(`주차: ${ctx.parking}대`)
  if (ctx.deposit) lines.push(`보증금: ${ctx.deposit}만원`)
  if (ctx.monthlyRent) lines.push(`월세: ${ctx.monthlyRent}만원`)
  if (ctx.maintenanceFee) lines.push(`관리비: ${ctx.maintenanceFee}만원`)
  if (ctx.premium) lines.push(`권리금: ${ctx.premium}만원`)

  if (ctx.missingFields.length > 0) {
    lines.push(`[미수집]: ${ctx.missingFields.join(', ')}`)
  } else {
    lines.push('[분석 준비 완료]')
  }

  if (ctx.businessRuleSummary) {
    lines.push('')
    lines.push(ctx.businessRuleSummary)
  }

  return lines.join('\n')
}

/** CollectedData에서 REQUIRED_FOR_ANALYSIS 충족 여부 (빠른 체크용) */
export function hasMinimumData(data: CollectedData): boolean {
  return !!(
    data.address &&
    (data.desiredBusiness ?? data.currentBusiness) &&
    (data.monthlyRentMan ?? data.depositMan)
  )
}

export { REQUIRED_FOR_ANALYSIS }
