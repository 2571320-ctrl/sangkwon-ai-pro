/**
 * publicDataProvider.ts
 * 향후 공공데이터 API 연결을 위한 CommercialDataProvider 인터페이스
 * 현재는 NoOpCommercialDataProvider만 구현 (연결 전 폴백)
 *
 * 향후 연결 후보:
 * - 소상공인시장진흥공단 상권분석 API
 * - 공공데이터포털 (data.go.kr)
 * - 국토교통부 실거래가·공시지가
 * - 통계청 사업체 조사
 * - 건축물대장 API
 */

export interface PopulationData {
  totalResidents: number
  ageGroups: Record<string, number>  // "20s", "30s" 등
  source: string
  referenceDate: string
}

export interface BusinessCountData {
  totalBusinesses: number
  byCategory: Record<string, number>
  radius: number  // meters
  source: string
}

export interface OpenCloseStats {
  openingsLast12m: number
  closuresLast12m: number
  closureRate: number  // %
  avgBusinessAge: number  // years
  source: string
}

export interface SalesEstimate {
  monthlyAvgSalesMan: number  // 만원
  category: string
  source: string
  confidence: 'high' | 'medium' | 'low'
}

export interface BuildingInfo {
  buildingUse: string
  totalFloors: number
  buildingAge: number  // years
  buildingArea: number  // m²
  permitDate: string
}

export interface LandPriceInfo {
  officialLandPricePerSqm: number  // 원/m²
  referenceyear: number
  zone: string
}

export interface DevelopmentPlan {
  type: string
  description: string
  expectedCompletionYear?: number
  source: string
}

export interface CommercialDataProvider {
  /** 배후 거주 인구 */
  getPopulation(address: string, radius?: number): Promise<PopulationData | null>
  /** 반경 내 사업체 수 */
  getBusinessCount(address: string, category?: string, radius?: number): Promise<BusinessCountData | null>
  /** 개폐업 통계 */
  getOpenCloseStats(address: string, category?: string): Promise<OpenCloseStats | null>
  /** 업종별 매출 추정 */
  getSalesEstimate(address: string, category: string): Promise<SalesEstimate | null>
  /** 건축물 정보 */
  getBuildingInfo(address: string): Promise<BuildingInfo | null>
  /** 공시지가 */
  getLandPrice(address: string): Promise<LandPriceInfo | null>
  /** 개발계획 */
  getDevelopmentPlans(address: string, radius?: number): Promise<DevelopmentPlan[]>
  /** 인허가 정보 */
  getPermits(address: string, permitType?: string): Promise<unknown[]>
}

/** 데이터 없음 폴백 — API 연결 전 */
export class NoOpCommercialDataProvider implements CommercialDataProvider {
  async getPopulation(): Promise<null> { return null }
  async getBusinessCount(): Promise<null> { return null }
  async getOpenCloseStats(): Promise<null> { return null }
  async getSalesEstimate(): Promise<null> { return null }
  async getBuildingInfo(): Promise<null> { return null }
  async getLandPrice(): Promise<null> { return null }
  async getDevelopmentPlans(): Promise<DevelopmentPlan[]> { return [] }
  async getPermits(): Promise<unknown[]> { return [] }
}

export const defaultCommercialDataProvider: CommercialDataProvider =
  new NoOpCommercialDataProvider()
