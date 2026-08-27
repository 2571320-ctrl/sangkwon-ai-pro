/**
 * knowledgeProvider.ts
 * 상권연구소 자체 현장 DB 연결을 위한 인터페이스
 * AI의 최종 경쟁력 = OpenAI + Web Search + 공공데이터 + 상권연구소 자체 DB + Rule Engine
 * 현재는 인터페이스만 정의 — 자체 DB 연결 시 구현체 추가
 */

export interface FieldRule {
  id: string
  category: string
  ruleType: 'rent' | 'location' | 'facility' | 'business' | 'contract'
  title: string
  description: string
  threshold?: number
  unit?: string
  severity: 'critical' | 'important' | 'advisory'
  lastUpdated: string
}

export interface IndustryBenchmark {
  category: string
  region?: string
  avgMonthlyRentMan: number          // 만원/평
  avgMonthlySalesMan: number         // 만원
  avgRentRatioPct: number            // %
  avgPremiumMonthsPayback: number    // 개월
  successRateByFloor: Record<string, number>  // 층별 성공률 %
  referenceYear: number
  sampleSize: number
  source: string
}

export interface FailureCase {
  id: string
  category: string
  region: string
  failureReason: string[]
  rentRatioPct?: number
  monthsBeforeClosure: number
  lessons: string[]
  anonymized: true
}

export interface SuccessCase {
  id: string
  category: string
  region: string
  successFactors: string[]
  rentRatioPct?: number
  businessAgeYears: number
  insights: string[]
  anonymized: true
}

export interface RentBenchmark {
  region: string
  district?: string
  floor: string
  category?: string
  avgMonthlyRentPerPyeong: number  // 만원/평
  premiumRangeMin: number
  premiumRangeMax: number
  referenceDate: string
  source: string
}

export interface BuildingNote {
  address: string
  noteType: 'risk' | 'opportunity' | 'info'
  content: string
  createdAt: string
  verifiedAt?: string
}

export interface SangkwonKnowledgeProvider {
  /** 업종별 현장 판단 규칙 */
  getFieldRules(category?: string): Promise<FieldRule[]>
  /** 업종별 업계 벤치마크 수치 */
  getIndustryBenchmarks(category: string, region?: string): Promise<IndustryBenchmark | null>
  /** 실패 사례 패턴 (익명 처리) */
  getFailureCases(category: string, region?: string): Promise<FailureCase[]>
  /** 성공 사례 패턴 (익명 처리) */
  getSuccessCases(category: string, region?: string): Promise<SuccessCase[]>
  /** 지역별 임대료 벤치마크 */
  getRentBenchmarks(region: string, category?: string): Promise<RentBenchmark[]>
  /** 권리금 벤치마크 */
  getPremiumBenchmarks(region: string, category?: string): Promise<RentBenchmark[]>
  /** 특정 건물 현장 메모 */
  getBuildingNotes(address: string): Promise<BuildingNote[]>
}

/** 자체 DB 연결 전 NoOp 구현체 */
export class NoOpKnowledgeProvider implements SangkwonKnowledgeProvider {
  async getFieldRules(): Promise<FieldRule[]> { return [] }
  async getIndustryBenchmarks(): Promise<null> { return null }
  async getFailureCases(): Promise<FailureCase[]> { return [] }
  async getSuccessCases(): Promise<SuccessCase[]> { return [] }
  async getRentBenchmarks(): Promise<RentBenchmark[]> { return [] }
  async getPremiumBenchmarks(): Promise<RentBenchmark[]> { return [] }
  async getBuildingNotes(): Promise<BuildingNote[]> { return [] }
}

export const defaultKnowledgeProvider: SangkwonKnowledgeProvider =
  new NoOpKnowledgeProvider()
