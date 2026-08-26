export type UserIntent = 'REPORT_CREATE' | 'NONE'

export interface IntentResult {
  intent: UserIntent
}

const REPORT_KEYWORDS = [
  '리포트', '보고서', '분석보고서', '분석 보고서', '고객용', '고객에게 보여줄', '고객에게 보여줄 자료',
  'pdf', 'PDF', '프린트', '인쇄',
]

const ACTION_KEYWORDS = [
  '만들어줘', '만들어', '만들줘', '만들어 줘', '생성해줘', '생성해', '생성줘',
  '작성해줘', '작성해', '뽑아줘', '뽑줘', '해줘', '해 줘', '줘',
  '볼 수 있어', '보고 싶어', '봐도 돼',
]

export function detectUserIntent(message: string): IntentResult {
  const lower = message.toLowerCase().trim()

  const hasReport = REPORT_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()))
  if (!hasReport) return { intent: 'NONE' }

  const hasAction = ACTION_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()))
  // Short phrases like "리포트 만들어줘" are definitively commands
  const isCommandLength = lower.length <= 25

  if (hasAction || isCommandLength) {
    return { intent: 'REPORT_CREATE' }
  }

  return { intent: 'NONE' }
}
