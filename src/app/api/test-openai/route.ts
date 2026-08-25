import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// 서버 전용 라우트 — API 키는 절대 클라이언트에 노출되지 않음
export const runtime = 'nodejs'

export async function GET() {
  const keyExists = !!process.env.OPENAI_API_KEY

  if (!keyExists) {
    return NextResponse.json(
      { success: false, error: 'OPENAI_API_KEY가 .env.local에 없습니다.' },
      { status: 500 },
    )
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: '연결 테스트입니다. "OpenAI 연결 성공"이라고만 답하세요.',
        },
      ],
      max_tokens: 20,
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
      {
        success: false,
        status: e?.status ?? 500,
        error: e?.message ?? '알 수 없는 오류',
      },
      { status: e?.status ?? 500 },
    )
  }
}
