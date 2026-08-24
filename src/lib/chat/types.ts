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
  floor?: string
  areaPyeong?: number
  frontageMeters?: number
  isCorner?: boolean
  visibility?: string
  parkingCount?: number
  walkAccess?: string
  carAccess?: string
  depositMan?: number
  monthlyRentMan?: number
  maintenanceFeeMan?: number
  premiumMan?: number
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
