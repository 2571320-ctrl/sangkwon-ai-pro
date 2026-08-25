import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'

const SYSTEM_PROMPT = `당신은 상권연구소 AI PRO입니다. 점포 계약 전 상권·입지·임대조건을 종합 분석해주는 전문 AI입니다.

주요 역할:
- 상권 분석, 입지 평가, 임대조건 검토, 업종 적합성에 대한 질문에 친절하고 전문적으로 답합니다.
- 프랜차이즈 계약, 권리금, 보증금, 월세에 관한 실용적 조언을 제공합니다.
- 특정 점포의 상세 분석이 필요하면 "새 점포 분석 시작" 버튼을 안내하세요.

답변 원칙:
- 한국어로 답변합니다.
- 간결하고 실용적으로 작성합니다. (3~5문장 이내)
- 전문 용어는 쉽게 풀어서 설명합니다.`

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'API 키가 설정되지 않았습니다.' },
      { status: 500 },
    )
  }

  try {
    const { messages } = await req.json() as {
      messages: { role: 'user' | 'assistant'; content: string }[]
    }

    const client = new OpenAI({ apiKey })

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 600,
      temperature: 0.7,
    })

    const reply = response.choices[0]?.message?.content?.trim() ?? ''

    return NextResponse.json({
      success: true,
      reply,
      model: response.model,
      usage: response.usage,
    })
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    return NextResponse.json(
      { success: false, error: e?.message ?? '알 수 없는 오류' },
      { status: e?.status ?? 500 },
    )
  }
}
