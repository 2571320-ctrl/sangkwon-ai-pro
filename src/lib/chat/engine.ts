import { Conversation, ConversationStep, ChatMessage, CollectedData, ProcessResult, QuickOption } from './types'
import { generateId } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────

function bot(
  text: string,
  type: ChatMessage['type'] = 'text',
  extra: Partial<ChatMessage> = {},
): ChatMessage {
  return { id: generateId(), role: 'bot', type, text, timestamp: new Date().toISOString(), ...extra }
}

function userMsg(text: string): ChatMessage {
  return { id: generateId(), role: 'user', type: 'text', text, timestamp: new Date().toISOString() }
}

// ── Input parser ──────────────────────────────────────────────────────────────

function parseStoreConditions(text: string): Partial<CollectedData> {
  const result: Partial<CollectedData> = {}

  if (text.includes('지하')) result.floor = 'basement'
  else if (/1\s*층|일\s*층/.test(text)) result.floor = '1f'
  else if (/2\s*층|이\s*층/.test(text)) result.floor = '2f'
  else if (/3\s*층|삼\s*층/.test(text)) result.floor = '3f'
  else if (/[4-9]\s*층|[1-9][0-9]\s*층/.test(text)) result.floor = '4f_plus'

  const area = text.match(/(\d+)\s*평/)
  if (area) result.areaPyeong = parseInt(area[1])

  const frontage = text.match(/전면\s*(\d+(?:\.\d+)?)\s*[mM미]/)
    ?? text.match(/(\d+(?:\.\d+)?)\s*[mM미]\b/)
  if (frontage) result.frontageMeters = parseFloat(frontage[1])

  const parking = text.match(/주차\s*(\d+)\s*대/)
    ?? text.match(/(\d+)\s*대\s*주차/)
    ?? text.match(/주차\s*(\d+)/)
  if (parking) result.parkingCount = parseInt(parking[1])
  if (/주차\s*없|주차없/.test(text)) result.parkingCount = 0
  if (/주차\s*0/.test(text)) result.parkingCount = 0

  if (text.includes('우수')) result.visibility = 'excellent'
  else if (text.includes('양호')) result.visibility = 'good'
  else if (text.includes('보통')) result.visibility = 'average'
  else if (text.includes('불량') || text.includes('나쁨')) result.visibility = 'poor'

  if (text.includes('코너')) result.isCorner = true

  return result
}

function parseRent(text: string): Partial<CollectedData> {
  const result: Partial<CollectedData> = {}

  const deposit = text.match(/보증금\s*:?\s*(\d[\d,]*)/)
  if (deposit) result.depositMan = parseInt(deposit[1].replace(/,/g, ''))

  const rent = text.match(/월세\s*:?\s*(\d[\d,]*)/)
  if (rent) result.monthlyRentMan = parseInt(rent[1].replace(/,/g, ''))

  const fee = text.match(/관리비\s*:?\s*(\d[\d,]*)/)
  if (fee) result.maintenanceFeeMan = parseInt(fee[1].replace(/,/g, ''))

  const premium = text.match(/권리금\s*:?\s*(\d[\d,]*)/)
  if (premium) result.premiumMan = parseInt(premium[1].replace(/,/g, ''))
  if (/권리금\s*없|권리금없|권리금\s*0/.test(text)) result.premiumMan = 0

  return result
}

function parseNameAddress(text: string): { name?: string; address?: string } {
  const parts = text.split(/[/|·\n]/).map(p => p.trim()).filter(Boolean)
  const addrPattern = /시|구|동|로|길|읍|면|리|번지/

  if (parts.length >= 2) {
    const [a, b] = parts
    if (addrPattern.test(b)) return { name: a, address: b }
    if (addrPattern.test(a)) return { name: b, address: a }
    return { name: a, address: b }
  }

  if (parts.length === 1) {
    if (addrPattern.test(parts[0])) return { address: parts[0] }
    return { name: parts[0] }
  }

  return {}
}

// ── Bot message templates ─────────────────────────────────────────────────────

const MSGS = {
  welcome: (): ChatMessage =>
    bot(
      '안녕하세요! 저는 **상권연구소 AI PRO**입니다.\n검토 중인 점포와 희망 업종을 알려주시면 상권·입지·임대조건을 종합 분석해드립니다.',
      'text',
      {
        options: [
          { label: '새 점포 분석 시작', value: '__start__' },
          { label: '테스트 데이터로 바로 분석', value: '__test__' },
          { label: '후보지 A/B 비교', value: '/compare' },
        ] as QuickOption[],
      },
    ),

  askNameAddress: (): ChatMessage =>
    bot(
      '검토 중인 **점포명과 주소**를 알려주세요.\n\n예시: `두정동 877 테스트점포 / 천안시 서북구 두정동 877`',
    ),

  askBusiness: (name: string): ChatMessage =>
    bot(`**${name}**의 희망 업종을 알려주세요.\n\n예시: 주점, 카페, 음식점, 치킨, 분식, 편의점`),

  askStoreConditions: (): ChatMessage =>
    bot(
      '점포 기본 조건을 알려주세요.\n\n예시: `1층, 45평, 전면 8m, 주차 3대, 가시성 우수`\n\n(가시성 선택: 우수 / 양호 / 보통 / 불량)',
    ),

  askRent: (): ChatMessage =>
    bot(
      '임대조건을 알려주세요 **(단위: 만원)**.\n\n예시: `보증금 5000, 월세 350, 권리금 없음`\n관리비가 있다면 함께 입력해주세요.',
    ),

  analyzing: (): ChatMessage =>
    bot('분석 중입니다…', 'loading'),
}

// ── Test data ─────────────────────────────────────────────────────────────────

const TEST_DATA: CollectedData = {
  name: '두정동 877 테스트점포',
  address: '천안시 서북구 두정동 877',
  desiredBusiness: '주점',
  currentBusiness: '음식점',
  floor: '1f',
  areaPyeong: 45,
  frontageMeters: 8,
  isCorner: false,
  visibility: 'excellent',
  parkingCount: 3,
  walkAccess: 'good',
  carAccess: 'good',
  depositMan: 5000,
  monthlyRentMan: 350,
  maintenanceFeeMan: 0,
  premiumMan: 0,
}

// ── Core engine ───────────────────────────────────────────────────────────────

export function createNewConversation(): Conversation {
  const id = generateId()
  return {
    id,
    title: '새 분석',
    step: 'welcome',
    messages: [MSGS.welcome()],
    collectedData: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

const TOKEN_LABELS: Record<string, string> = {
  '__test__': '테스트 데이터로 바로 분석',
  '__start__': '새 점포 분석 시작',
}

export function processUserInput(conv: Conversation, userInput: string): ProcessResult {
  const trimmed = userInput.trim()
  const displayText = TOKEN_LABELS[trimmed] ?? trimmed
  const msgs = [...conv.messages, userMsg(displayText)]
  let { step } = conv
  let collectedData = { ...conv.collectedData }
  let analysisReady = false

  switch (step as ConversationStep) {
    case 'welcome':
    case 'post-analysis': {
      if (trimmed === '__test__' || trimmed.includes('테스트')) {
        collectedData = { ...TEST_DATA }
        msgs.push(bot('테스트 데이터로 분석을 시작합니다.'))
        msgs.push(MSGS.analyzing())
        step = 'analyzing'
        analysisReady = true
      } else if (trimmed === '/compare') {
        // Handled by ChatWindow via navigation
        step = 'post-analysis'
      } else if (trimmed === '__start__') {
        msgs.push(MSGS.askNameAddress())
        step = 'ask-name-address'
      } else {
        const parsed = parseNameAddress(trimmed)
        if (parsed.name && parsed.address) {
          collectedData = { ...collectedData, ...parsed }
          msgs.push(MSGS.askBusiness(parsed.name))
          step = 'ask-business'
        } else if (parsed.name || parsed.address) {
          collectedData = { ...collectedData, ...parsed }
          msgs.push(MSGS.askNameAddress())
          step = 'ask-name-address'
        } else {
          msgs.push(MSGS.askNameAddress())
          step = 'ask-name-address'
        }
      }
      break
    }

    case 'ask-name-address': {
      const parsed = parseNameAddress(trimmed)
      const nameParts = trimmed.split(/[/|·\n,]/)
      const name = parsed.name ?? nameParts[0]?.trim() ?? trimmed
      const address = parsed.address ?? nameParts[1]?.trim() ?? ''
      collectedData = { ...collectedData, name, address }
      msgs.push(MSGS.askBusiness(name))
      step = 'ask-business'
      break
    }

    case 'ask-business': {
      collectedData = { ...collectedData, desiredBusiness: trimmed }
      msgs.push(MSGS.askStoreConditions())
      step = 'ask-store-conditions'
      break
    }

    case 'ask-store-conditions': {
      const parsed = parseStoreConditions(trimmed)
      collectedData = {
        floor: '1f',
        areaPyeong: 30,
        frontageMeters: 5,
        visibility: 'average',
        parkingCount: 0,
        walkAccess: 'average',
        carAccess: 'average',
        isCorner: false,
        ...collectedData,
        ...parsed,
      }
      msgs.push(MSGS.askRent())
      step = 'ask-rent'
      break
    }

    case 'ask-rent': {
      const parsed = parseRent(trimmed)
      collectedData = {
        depositMan: 0,
        monthlyRentMan: 0,
        maintenanceFeeMan: 0,
        premiumMan: 0,
        ...collectedData,
        ...parsed,
      }
      msgs.push(MSGS.analyzing())
      step = 'analyzing'
      analysisReady = true
      break
    }

    case 'results': {
      const lower = trimmed.toLowerCase()
      if (lower.includes('리포트') || lower.includes('report')) {
        msgs.push(
          bot('아래 버튼으로 고객용 리포트 페이지를 열 수 있습니다.', 'text', {
            options: conv.analysisId
              ? [{ label: '리포트 열기', value: `/report/${conv.analysisId}` }]
              : [],
          }),
        )
      } else if (lower.includes('비교')) {
        msgs.push(
          bot('후보지 비교 기능을 사용하세요.', 'text', {
            options: [{ label: '후보지 비교로 이동', value: '/compare' }],
          }),
        )
      } else if (lower.includes('새') || lower.includes('다시') || lower.includes('다른')) {
        msgs.push(
          bot('새 점포를 분석하려면 왼쪽 상단의 **새 채팅** 버튼을 클릭하세요.'),
        )
      } else {
        msgs.push(
          bot('더 궁금한 점이 있으시면 질문해주세요.', 'text', {
            options: conv.analysisId
              ? [
                  { label: '상세 분석 보기', value: `/analysis/${conv.analysisId}` },
                  { label: '고객 리포트', value: `/report/${conv.analysisId}` },
                ]
              : [],
          }),
        )
      }
      step = 'post-analysis'
      break
    }

    default: {
      msgs.push(
        bot('새 채팅에서 점포 분석을 시작해보세요.', 'text', {
          options: [{ label: '새 채팅 시작', value: '/chat' }],
        }),
      )
      break
    }
  }

  const title = collectedData.name && collectedData.name !== '새 분석'
    ? collectedData.name
    : conv.title

  return {
    updatedConversation: {
      ...conv,
      step: step as ConversationStep,
      messages: msgs,
      collectedData,
      title,
      updatedAt: new Date().toISOString(),
    },
    analysisReady,
  }
}
