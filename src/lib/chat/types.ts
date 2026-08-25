export type ConversationStep =
  | 'welcome'
  | 'ask-name-address'
  | 'ask-business'
  | 'ask-store-conditions'
  | 'ask-rent'
  | 'analyzing'
  | 'results'
  | 'post-analysis'

export interface QuickOption {
  label: string
  value: string
}

export interface Attachment {
  id: string
  name: string
  type: string      // MIME type
  dataUrl: string   // base64 data URL
  size: number      // bytes (original)
}

export interface ChatMessage {
  id: string
  role: 'user' | 'bot'
  type: 'text' | 'options' | 'analysis-card' | 'loading'
  text: string
  timestamp: string
  options?: QuickOption[]
  analysisId?: string
  storeId?: string
  attachments?: Attachment[]
}

export interface CollectedData {
  name?: string
  address?: string
  desiredBusiness?: string
  currentBusiness?: string
  previousBusiness?: string
  floor?: string
  areaPyeong?: number
  areaSqm?: number
  frontageMeters?: number
  isCorner?: boolean
  dualExposure?: boolean
  visibility?: string
  signageVisibility?: string
  entranceLocation?: string
  customerFlow?: string
  parkingCount?: number
  pedestrianAccess?: string
  vehicleAccess?: string
  publicTransportAccess?: string
  walkAccess?: string
  carAccess?: string
  elevator?: boolean
  restroom?: boolean
  duct?: boolean
  cityGas?: boolean
  electricCapacity?: string
  drainage?: boolean
  sewer?: boolean
  fireSafety?: boolean
  depositMan?: number
  monthlyRentMan?: number
  maintenanceFeeMan?: number
  premiumMan?: number
  vatIncluded?: boolean
  estimatedInteriorCostMan?: number
  expectedMonthlySalesMan?: number
  contractPeriod?: string
  fieldMemo?: string
}

export interface Conversation {
  id: string
  title: string
  step: ConversationStep
  messages: ChatMessage[]
  collectedData: CollectedData
  analysisId?: string
  createdAt: string
  updatedAt: string
}

export interface ProcessResult {
  updatedConversation: Conversation
  analysisReady: boolean
}
