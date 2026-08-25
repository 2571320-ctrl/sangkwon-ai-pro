export type Visibility = 'excellent' | 'good' | 'average' | 'poor'
export type FloorType = 'basement' | '1f' | '2f' | '3f' | '4f_plus'
export type Grade = 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D'
export type CheckStatus = 'unchecked' | 'verified' | 'concern'
export type Recommendation = 'primary' | 'conditional' | 'caution' | 'review'
export type AccessLevel = 'excellent' | 'good' | 'average' | 'poor'

export const FLOOR_LABELS: Record<FloorType, string> = {
  basement: '지하',
  '1f': '1층',
  '2f': '2층',
  '3f': '3층',
  '4f_plus': '4층 이상',
}

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  excellent: '우수',
  good: '양호',
  average: '보통',
  poor: '불량',
}

export const ACCESS_LABELS: Record<AccessLevel, string> = {
  excellent: '우수',
  good: '양호',
  average: '보통',
  poor: '불량',
}

export const RECOMMENDATION_LABELS: Record<Recommendation, string> = {
  primary: '우선 검토 가능',
  conditional: '조건부 검토',
  caution: '추가 확인 필요',
  review: '보수적 접근 필요',
}

export interface Store {
  id: string
  name: string
  address: string
  desiredBusiness: string
  currentBusiness: string
  previousBusiness: string
  floor: FloorType
  areaPyeong: number
  areaSqm?: number
  frontageMeters: number
  isCorner: boolean
  dualExposure?: boolean
  visibility: Visibility
  signageVisibility?: string
  entranceLocation?: string
  customerFlow?: string
  parkingCount: number
  walkAccess: AccessLevel
  carAccess: AccessLevel
  pedestrianAccess?: AccessLevel
  vehicleAccess?: AccessLevel
  publicTransportAccess?: AccessLevel
  elevator?: boolean
  restroom?: boolean
  duct?: boolean
  cityGas?: boolean
  electricCapacity?: string
  drainage?: boolean
  sewer?: boolean
  fireSafety?: boolean
  deposit: number
  monthlyRent: number
  maintenanceFee: number
  premium: number
  vatIncluded: boolean
  estimatedInteriorCost?: number
  expectedMonthlySales?: number
  contractPeriod?: string
  imageUrl: string
  memo: string
  fieldMemo?: string
  createdAt: string
}

export interface AnalysisItem {
  title: string
  data: string
  interpretation: string
  impact: string
  action?: string
}

export interface ContractCheck {
  id: string
  category: string
  item: string
  status: CheckStatus
  note: string
}

export interface ScoreDetail {
  score: number
  grade: Grade
  label: string
  interpretation: string
}

export interface MarketData {
  mainCustomerAge: string
  competitorCount: number
  newStores: number
  closedStores: number
  salesChange: number
  interpretation: string
}

export interface AnalysisResult {
  id: string
  storeId: string
  overallGrade: Grade
  overallScore: number
  scores: {
    location: ScoreDetail
    visibility: ScoreDetail
    rent: ScoreDetail
    businessFit: ScoreDetail
    competitionRisk: ScoreDetail
    totalRisk: ScoreDetail
  }
  summary: string
  recommendation: Recommendation
  strengths: AnalysisItem[]
  risks: AnalysisItem[]
  marketData: MarketData
  contractChecks: ContractCheck[]
  createdAt: string
}

export interface ComparisonItem {
  category: string
  labelA: string
  labelB: string
  advantageFor: 'A' | 'B' | 'equal'
  interpretation: string
}

export interface ComparisonResult {
  id: string
  storeA: Store
  storeB: Store
  analysisA: AnalysisResult
  analysisB: AnalysisResult
  comparisonItems: ComparisonItem[]
  summary: string
  recommendation: string
  createdAt: string
}

// Form types (money values in 만원 unit for user input)
export interface StoreFormValues {
  name: string
  address: string
  desiredBusiness: string
  currentBusiness: string
  previousBusiness: string
  floor: FloorType
  areaPyeong: number
  frontageMeters: number
  isCorner: boolean
  visibility: Visibility
  parkingCount: number
  walkAccess: AccessLevel
  carAccess: AccessLevel
  depositMan: number    // 만원 단위
  monthlyRentMan: number // 만원 단위
  maintenanceFeeMan: number // 만원 단위
  premiumMan: number   // 만원 단위
  vatIncluded: boolean
  imageUrl: string
  memo: string
}
