import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { routeIntent, Intent } from '@/lib/chat/intentRouter'
import { buildContext, buildContextBlock, hasMinimumData } from '@/lib/chat/context'
import { CollectedData } from '@/lib/chat/types'

export const runtime = 'nodejs'

// ─── 모델 라우팅 ────────────────────────────────────────────────────────────
function getChatModel(): string {
  return process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o-mini'
}

// ─── 인텐트별 시스템 프롬프트 ───────────────────────────────────────────────
function buildSystemPrompt(
  intent: Intent,
  contextBlock: string,
): string {
  const base = `당신은 상권연구소 AI PRO입니다. 점포 계약 전 상권·입지·임대조건 분석 전문 AI입니다. 한국어로만 답변하세요.

${contextBlock}

[공통 원칙]
- 실제 확인되지 않은 유동인구·폐업률 수치를 지어내지 마세요.
- 이미 수집된 정보는 다시 묻지 마세요.
- 계산 가능한 임대료 비율은 반드시 계산해 제공하세요. 예상매출이 없으면 "월세÷0.1 = 10% 기준 필요매출"로 역산하세요.
- 최종 판단은 "현재 정보 기준으로는 ~을 권고합니다" 형식으로 조건부로 표현하세요.

[응답 형식 — 반드시 아래 JSON만]
{
  "reply": "한국어 답변",
  "extractedContext": {},
  "readyForAnalysis": false
}

[extractedContext — 이번 메시지에서 새로 파악된 값만]
address, desiredBusiness, currentBusiness, previousBusiness,
floor("1f"|"2f"|"3f"|"4f_plus"|"basement"), areaPyeong(숫자), frontageMeters(숫자),
isCorner(bool), dualExposure(bool), visibility("excellent"|"good"|"average"|"poor"),
parkingCount(숫자), pedestrianAccess, vehicleAccess, publicTransportAccess,
elevator(bool), restroom(bool), duct(bool), cityGas(bool), drainage(bool), sewer(bool), fireSafety(bool),
depositMan(만원 숫자), monthlyRentMan(만원 숫자), maintenanceFeeMan(만원 숫자), premiumMan(만원 숫자),
vatIncluded(bool), estimatedInteriorCostMan(숫자), expectedMonthlySalesMan(숫자),
contractPeriod(문자열), fieldMemo(문자열)

[readyForAnalysis = true 조건 — 두 가지 모두 충족 필수]
1. 사용자가 이번 메시지에서 분석을 명시적으로 요청 ("분석해줘", "검토해줘", "봐줘", "평가해줘" 등)
2. address + desiredBusiness + (depositMan 또는 monthlyRentMan) 세 가지가 기존+신규 합산하여 모두 확인됨
→ 일반 대화·상권 정보 질문 시에는 데이터가 충분해도 절대 readyForAnalysis: true 금지`

  const intentGuides: Partial<Record<Intent, string>> = {
    GENERAL: `
[현재 인텐트: 일반 대화]
- 친근하게 인사하고 서비스 소개를 간략히 하세요.
- "점포 주소와 희망 업종을 알려주시면 상권·임대조건 분석을 도와드릴 수 있습니다"로 자연스럽게 안내하세요.
- 길게 답하지 말고 2~3문장으로 마무리하세요.`,

    AREA_RESEARCH: `
[현재 인텐트: 상권 조사]
- 사용자가 특정 지역의 상권 특성을 묻고 있습니다.
- 알고 있는 일반적인 상권 특성을 말해주되, 실시간 데이터(유동인구 수치 등)는 "현장 직접 확인 또는 소상공인진흥공단 상권분석 서비스를 활용하세요"로 안내하세요.
- 해당 지역에서 잘 되는 업종 유형, 피크 시간대, 주요 소비층 특성 등을 설명하세요.
- 마지막에 "이 지역에서 보고 계신 점포가 있으시면 상세 분석을 해드릴 수 있습니다"로 전환하세요.`,

    BUSINESS_FIT: `
[현재 인텐트: 업종 적합성 문의]
- 사용자가 업종 선택이나 특정 업종의 적합성을 묻고 있습니다.
- 업종별 핵심 성공 요소(위치, 면적, 설비)를 구체적으로 설명하세요.
- 업종별 임대료 위험 비율 기준도 언급하세요 (음식점 10%, 주점 10~14% 등).
- 점포 정보가 있으면 해당 점포에 업종이 맞는지 판단하세요.
- 정보가 없으면 "어떤 점포를 보고 계신지 알려주시면 더 정확히 분석해드릴 수 있습니다"로 안내하세요.`,

    STORE_ANALYSIS: `
[현재 인텐트: 점포 분석]
- 사용자가 특정 점포의 종합 분석을 요청하고 있습니다.
- 수집된 정보를 기반으로 아래 순서로 답하세요:
  ① 확인된 조건 요약
  ② 조건의 의미 해석
  ③ 희망 업종에 미치는 영향
  ④ 위험요인
  ⑤ 임대료 분석 (계산값 포함 — 월세/예상매출 또는 역산)
  ⑥ 현장 확인사항 5~8개 (업종별 특화)
  ⑦ 최종 조건부 판단
- 업종별 핵심 체크포인트를 반드시 포함하세요 (주점: 닥트·야간동선, 카페: 가시성·체류수요 등).`,

    RENT_ANALYSIS: `
[현재 인텐트: 임대조건·수익성 분석]
- 임대료 관련 계산을 중심으로 답하세요.
- 반드시 포함해야 할 계산:
  • 월 총 임대비용 = 월세 + 관리비 + (보증금 × 0.025 ÷ 12) [기회비용]
  • 10% 기준 필요 월매출 = 월 임대비용 ÷ 0.10
  • 12% 위험 기준 필요 월매출 = 월 임대비용 ÷ 0.12
  • 권리금 회수 기간 = 권리금 ÷ (예상 월 순이익)
- 예상 매출이 없으면 "10% 기준 필요매출 X만원을 달성할 수 있는지가 핵심 판단 기준"으로 표현하세요.`,

    CONTRACT_RISK: `
[현재 인텐트: 계약 위험 분석]
- 계약서·법적 위험 요소를 중심으로 답하세요.
- 반드시 언급해야 할 체크포인트:
  • 등기부등본 근저당·압류·가처분 여부
  • 원상복구 범위 특약 명시 여부
  • 임대인의 계약 해지 사유 명확화
  • 보증금 반환 보증보험 가능 여부
  • 건물 용도 변경 위험
- "법률 전문가 또는 공인중개사와 계약서 검토를 권장합니다"를 포함하세요.`,

    COMPARE: `
[현재 인텐트: 점포 비교]
- 두 개 이상의 점포를 비교 분석하세요.
- 항목별 비교표 형식으로 답하세요: 위치·층수·면적·임대료·가시성·업종 적합성.
- 각 항목의 승/패/무 판단을 내리고 종합 추천을 명확히 하세요.
- 정보가 부족한 점포에 대해서는 "추가 정보 필요" 표시하세요.`,

    REPORT: `
[현재 인텐트: 리포트 생성]
- 사용자가 분석 리포트 또는 PPT 생성을 요청하고 있습니다.
- 수집된 점포 정보가 있으면 리포트를 바로 생성할 수 있음을 안내하세요.
- reply에 "고객용 분석 리포트를 생성하겠습니다. 잠시만 기다려주세요."라고 답하세요.
- extractedContext에 현재 정보를 정리해서 반환하세요.`,

    FOLLOW_UP: `
[현재 인텐트: 추가 질문]
- 이전 분석 또는 대화 내용에 대한 추가 질문입니다.
- 이미 언급된 내용을 반복하지 말고 새로운 관점을 추가하세요.
- 구체적이고 실행 가능한 조언을 제공하세요.`,
  }

  const guide = intentGuides[intent] ?? ''
  return base + guide
}

// ─── POST Handler ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'API 키가 설정되지 않았습니다.' },
      { status: 500 },
    )
  }

  try {
    const body = await req.json() as {
      messages: { role: 'user' | 'assistant'; content: string }[]
      currentContext?: Partial<CollectedData>
    }
    const { messages, currentContext = {} } = body

    // ── 인텐트 분류 ──
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content ?? ''
    const { intent, analysisRequested } = routeIntent(lastUserMsg)

    // ── 컨텍스트 블록 구성 ──
    const ctx = buildContext(currentContext as CollectedData)
    const contextBlock = buildContextBlock(ctx)

    const systemPrompt = buildSystemPrompt(intent, contextBlock)

    const client = new OpenAI({ apiKey })

    const response = await client.chat.completions.create({
      model: getChatModel(),
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 3000,
      temperature: 0.5,
      response_format: { type: 'json_object' },
    })

    const raw = response.choices[0]?.message?.content?.trim() ?? '{}'

    let parsed: {
      reply?: string
      extractedContext?: Partial<CollectedData>
      readyForAnalysis?: boolean
    }
    try {
      parsed = JSON.parse(raw)
    } catch {
      const replyMatch = raw.match(/"reply"\s*:\s*"([\s\S]*?)(?<!\\)"(?:\s*,|\s*\})/)
      const fallbackReply = replyMatch
        ? replyMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
        : '죄송합니다. 응답 처리 중 오류가 발생했습니다. 다시 시도해주세요.'
      parsed = { reply: fallbackReply, extractedContext: {}, readyForAnalysis: false }
    }

    // 서버 측 이중 차단:
    // 1) 사용자가 명시적으로 분석 요청하지 않으면 false
    // 2) 최소 데이터(주소+업종+임대조건) 미충족이면 false
    const mergedData = { ...currentContext, ...(parsed.extractedContext ?? {}) } as CollectedData
    const readyForAnalysis =
      (parsed.readyForAnalysis ?? false) &&
      analysisRequested &&
      hasMinimumData(mergedData)

    return NextResponse.json({
      success: true,
      reply: parsed.reply ?? '죄송합니다. 다시 시도해주세요.',
      extractedContext: parsed.extractedContext ?? {},
      readyForAnalysis,
      intent,
      model: response.model,
    })
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    return NextResponse.json(
      { success: false, error: e?.message ?? '알 수 없는 오류' },
      { status: e?.status ?? 500 },
    )
  }
}
