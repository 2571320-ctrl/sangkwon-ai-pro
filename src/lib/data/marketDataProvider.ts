/**
 * marketDataProvider.ts
 * 외부 상권 데이터 추상화 인터페이스
 * 현재는 인터페이스만 정의 — 실제 API 연결은 추후 구현
 */

export interface FootTrafficData {
  hourly: Record<string, number>   // "09": 1200 (시간대별 유동인구)
  peakHour: string
  weekdayAvg: number
  weekendAvg: number
  source: string
  collectedAt: string
}

export interface CompetitorInfo {
  name: string
  category: string
  distance: number   // meters
  estimatedSize?: number  // pyeong
  yearsInBusiness?: number
}

export interface AreaStats {
  closureRate1yr: number      // % — 최근 1년 폐업률
  avgBusinessAge: number      // 년 — 평균 영업 기간
  newOpenings3m: number       // 최근 3개월 신규 개업 수
  totalBusinesses: number     // 반경 300m 총 사업체 수
}

export interface MarketSnapshot {
  address: string
  radius: number             // meters
  footTraffic?: FootTrafficData
  competitors: CompetitorInfo[]
  areaStats?: AreaStats
  avgRentPerPyeong?: number  // 평당 월세 (만원)
  dataQuality: 'full' | 'partial' | 'unavailable'
  fetchedAt: string
}

export interface MarketDataProvider {
  fetchMarketSnapshot(address: string, radius?: number): Promise<MarketSnapshot>
  fetchFootTraffic(address: string): Promise<FootTrafficData | null>
  fetchCompetitors(address: string, category: string, radius?: number): Promise<CompetitorInfo[]>
}

/** 데이터 없음 응답 — API 연결 전 폴백 */
export class NoOpMarketDataProvider implements MarketDataProvider {
  async fetchMarketSnapshot(address: string, radius = 300): Promise<MarketSnapshot> {
    return {
      address,
      radius,
      competitors: [],
      dataQuality: 'unavailable',
      fetchedAt: new Date().toISOString(),
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetchFootTraffic(_addr: string): Promise<null> {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetchCompetitors(_addr: string, _cat: string, _r = 300): Promise<CompetitorInfo[]> {
    return []
  }
}

export const defaultMarketProvider: MarketDataProvider = new NoOpMarketDataProvider()
