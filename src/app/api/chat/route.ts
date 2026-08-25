import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'

function buildSystemPrompt(currentContext: Record<string, unknown>): string {
  const hasContext = Object.keys(currentContext).length > 0
  const contextStr = hasContext
    ? JSON.stringify(currentContext, null, 2)
    : '없음 (아직 수집된 정보 없음)'

  return `당신은 상권연구소 AI PRO입니다. 점포 계약 전 상권·입지·임대조건을 분석하는 전문 B2B AI입니다.

[현재 세션에서 수집된 점포 정보]
${contextStr}

[역할]
1. 사용자 메시지에서 점포 정보를 추출하여 기존 세션 정보와 병합
2. 확인된 정보를 먼저 요약하고 현재 가능한 판단/분석을 제공
3. 이미 있는 정보는 절대 다시 묻지 않음 — 부족한 핵심 정보만 자연스럽게 추가 질문
4. 주소 + 업종 + 기본 임대조건이 갖춰지면 분석 준비 완료로 판단

[반드시 아래 JSON 형식으로만 응답 — 다른 텍스트 없음]
{
  "reply": "사용자에게 보여줄 한국어 자연스러운 대화 응답",
  "extractedContext": {
    // 이번 메시지에서 새로 추출 또는 변경된 정보만 포함
    // 기존 세션에 이미 있는 값과 동일하면 포함하지 않음
    // 값이 없는 필드는 생략
  },
  "readyForAnalysis": true 또는 false
}

[extractedContext 필드 목록]
- address: 문자열 (주소 또는 지역명)
- desiredBusiness: 문자열 (업종명, 사용자 표현 그대로: 무인 뽑기방, 셀프사진관, 키즈카페 등)
- floor: "1f" | "2f" | "3f" | "4f_plus" | "basement"
- areaPyeong: 숫자 (평, 단위 제외)
- frontageMeters: 숫자 (전면폭 미터, 단위 제외)
- parkingCount: 숫자 (주차 대수, 없음→0)
- depositMan: 숫자 (보증금 만원 단위: 5000만원→5000, 1억→10000)
- monthlyRentMan: 숫자 (월세 만원 단위: 250만원→250)
- maintenanceFeeMan: 숫자 (관리비 만원 단위)
- premiumMan: 숫자 (권리금 만원 단위, 없음→0)
- visibility: "excellent" | "good" | "average" | "poor"
- isCorner: boolean

[readyForAnalysis = true 조건] 기존 + 신규 정보를 합산하여 다음 3가지 모두 확인될 때:
1. 주소 또는 지역명 (address)
2. 희망 업종 (desiredBusiness)
3. 보증금(depositMan) 또는 월세(monthlyRentMan) 중 하나 이상

[reply 작성 원칙]
- 이미 있는 정보는 절대 다시 묻지 않음
- 정보가 충분하면 1차 상권 판단 먼저 제공
- 부족해도 먼저 가치 있는 답변 제공 후 추가 질문 (1~2개만)
- 단순히 "주소를 알려주세요"로 끝내지 말 것 — 맥락 있는 설명 포함
- 반드시 유효한 JSON만 반환, JSON 외 다른 텍스트 없음`
}

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
      currentContext?: Record<string, unknown>
    }
    const { messages, currentContext = {} } = body

    const client = new OpenAI({ apiKey })

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildSystemPrompt(currentContext) },
        ...messages,
      ],
      max_tokens: 900,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const raw = response.choices[0]?.message?.content?.trim() ?? '{}'

    let parsed: {
      reply?: string
      extractedContext?: Record<string, unknown>
      readyForAnalysis?: boolean
    }
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = { reply: raw, extractedContext: {}, readyForAnalysis: false }
    }

    return NextResponse.json({
      success: true,
      reply: parsed.reply ?? '죄송합니다. 다시 시도해주세요.',
      extractedContext: parsed.extractedContext ?? {},
      readyForAnalysis: parsed.readyForAnalysis ?? false,
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
