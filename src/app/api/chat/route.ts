/**
 * route.ts — 상권연구소 AI PRO 채팅 API V3
 *
 * 아키텍처:
 * USER → Intent Router → needsWebSearch?
 *   YES: Responses API (gpt-4o + web_search_preview) → text reply + sources
 *        + 엔티티 추출 (gpt-4o-mini, JSON, 별도 경량 호출)
 *   NO:  Chat Completions (model tier 기반) → JSON (reply + extractedContext)
 *
 * 환경변수:
 *   OPENAI_CHAT_MODEL    일반 대화 모델 (default: gpt-4o-mini)
 *   OPENAI_ANALYSIS_MODEL 분석 모델 (default: gpt-4o)
 */

import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { Response as OAIResponse } from 'openai/resources/responses/responses'
import { routeIntent } from '@/lib/chat/intentRouter'
import { buildContext, buildContextBlock } from '@/lib/chat/context'
import { buildSystemPrompt, buildJsonSystemPrompt, ENTITY_EXTRACTION_PROMPT } from '@/lib/ai/systemPrompt'
import { detectCategory } from '@/lib/rules/businessRules'
import { buildFieldRiskSummary } from '@/lib/analysis/fieldRules'
import type { CollectedData } from '@/lib/chat/types'

export const runtime = 'nodejs'

// ─── 모델 선택 ───────────────────────────────────────────────────────────────

function getChatModel() {
  return process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o-mini'
}
function getAnalysisModel() {
  return process.env.OPENAI_ANALYSIS_MODEL ?? 'gpt-4o'
}

// ─── 출처 추출 ───────────────────────────────────────────────────────────────

interface Source {
  title: string
  url: string
}

function extractSources(resp: OAIResponse): Source[] {
  const seen = new Set<string>()
  const sources: Source[] = []
  for (const item of resp.output) {
    if (item.type !== 'message') continue
    for (const block of item.content) {
      if (block.type !== 'output_text') continue
      for (const ann of block.annotations) {
        if (ann.type === 'url_citation' && !seen.has(ann.url)) {
          seen.add(ann.url)
          sources.push({ title: (ann as { title?: string; url: string }).title ?? ann.url, url: ann.url })
        }
      }
    }
  }
  return sources
}

// ─── 엔티티 추출 (경량 JSON 호출) ────────────────────────────────────────────

async function extractEntities(
  client: OpenAI,
  userMsg: string,
  currentContext: Partial<CollectedData>,
): Promise<Partial<CollectedData>> {
  try {
    const r = await client.chat.completions.create({
      model: getChatModel(),
      messages: [
        { role: 'system', content: ENTITY_EXTRACTION_PROMPT },
        { role: 'user', content: userMsg },
      ],
      max_tokens: 400,
      temperature: 0,
      response_format: { type: 'json_object' },
    })
    const raw = r.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw) as { extractedContext?: Partial<CollectedData> }
    return parsed.extractedContext ?? {}
  } catch {
    return {}
  }
}

// ─── Field Rule 요약 주입 ──────────────────────────────────────────────────

function buildFieldRuleBlock(data: Partial<CollectedData>): string {
  const category = detectCategory(data.desiredBusiness ?? data.currentBusiness ?? '')
  if (!data.monthlyRentMan) return ''

  const summary = buildFieldRiskSummary({
    monthlyRentMan: data.monthlyRentMan,
    maintenanceFeeMan: data.maintenanceFeeMan ?? 0,
    depositMan: data.depositMan ?? 0,
    premiumMan: data.premiumMan ?? 0,
    expectedMonthlySalesMan: data.expectedMonthlySalesMan,
    frontageMeters: data.frontageMeters,
    floor: data.floor,
    category,
  })

  if (!summary.summary) return ''
  return `\n[상권연구소 Rule Engine 계산 결과]\n${summary.summary}`
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

    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content ?? ''
    const { intent, analysisRequested, needsWebSearch, modelTier } = routeIntent(lastUserMsg)

    const ctx = buildContext(currentContext as CollectedData)
    const contextBlock = buildContextBlock(ctx)
    const fieldRuleBlock = buildFieldRuleBlock(currentContext)

    const client = new OpenAI({ apiKey })

    // ── 웹 검색이 필요한 경우: Responses API ─────────────────────────────────
    if (needsWebSearch) {
      const systemPrompt =
        buildSystemPrompt({ intent, ctx, webSearchAvailable: true }) + fieldRuleBlock

      // 메시지 히스토리를 Responses API input 형식으로 변환
      const inputMessages = messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

      let resp: OAIResponse
      try {
        resp = await client.responses.create({
          model: getAnalysisModel(),
          instructions: systemPrompt,
          input: inputMessages,
          tools: [{ type: 'web_search_preview' as const }],
        })
      } catch (searchErr) {
        // web_search 실패 시 일반 Chat Completions로 폴백
        console.error('[V3] web_search fallback:', searchErr)
        return fallbackToChatCompletions(
          client, messages, currentContext, intent, ctx, contextBlock, fieldRuleBlock, analysisRequested
        )
      }

      const reply = resp.output_text ?? '죄송합니다. 응답을 가져오지 못했습니다.'
      const sources = extractSources(resp)

      // 엔티티 추출 (별도 경량 호출)
      const extractedContext = await extractEntities(client, lastUserMsg, currentContext)

      // 검색 출처를 reply 하단에 자연스럽게 추가
      let finalReply = reply
      if (sources.length > 0) {
        const srcLines = sources
          .slice(0, 4)
          .map(s => `- [${s.title}](${s.url})`)
          .join('\n')
        finalReply += `\n\n**참고 출처:**\n${srcLines}`
      }

      // 서버 측 분석 가드
      const mergedData = { ...currentContext, ...extractedContext } as CollectedData
      const readyForAnalysis =
        analysisRequested &&
        !!(mergedData.address && (mergedData.desiredBusiness ?? mergedData.currentBusiness) && (mergedData.monthlyRentMan ?? mergedData.depositMan))

      return NextResponse.json({
        success: true,
        reply: finalReply,
        extractedContext,
        readyForAnalysis,
        intent,
        webSearchUsed: true,
        sources,
        model: resp.model,
      })
    }

    // ── 웹 검색 불필요: Chat Completions (JSON mode) ─────────────────────────
    return fallbackToChatCompletions(
      client, messages, currentContext, intent, ctx, contextBlock, fieldRuleBlock, analysisRequested
    )
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    return NextResponse.json(
      { success: false, error: e?.message ?? '알 수 없는 오류' },
      { status: e?.status ?? 500 },
    )
  }
}

// ─── Chat Completions 경로 (JSON mode) ───────────────────────────────────────

async function fallbackToChatCompletions(
  client: OpenAI,
  messages: { role: 'user' | 'assistant'; content: string }[],
  currentContext: Partial<CollectedData>,
  intent: ReturnType<typeof routeIntent>['intent'],
  ctx: ReturnType<typeof buildContext>,
  contextBlock: string,
  fieldRuleBlock: string,
  analysisRequested: boolean,
) {
  const systemPrompt = buildJsonSystemPrompt({ intent, ctx }) + fieldRuleBlock

  // 일반 대화는 저비용 모델, 복잡 분석은 고성능 모델
  const { modelTier } = routeIntent(
    [...messages].reverse().find(m => m.role === 'user')?.content ?? ''
  )
  const model = modelTier === 'analysis' ? getAnalysisModel() : getChatModel()

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    max_tokens: 3500,
    temperature: 0.4,
    response_format: { type: 'json_object' },
  })

  const raw = response.choices[0]?.message?.content?.trim() ?? '{}'

  let parsed: {
    reply?: string
    extractedContext?: Partial<CollectedData>
    readyForAnalysis?: boolean
    dataConfidence?: string
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

  // 서버 측 3중 분석 가드:
  // 1) AI가 readyForAnalysis: true
  // 2) 사용자가 명시적으로 분석 요청
  // 3) 최소 데이터(주소+업종+임대조건) 충족
  const mergedData = { ...currentContext, ...(parsed.extractedContext ?? {}) } as CollectedData
  const readyForAnalysis =
    (parsed.readyForAnalysis ?? false) &&
    analysisRequested &&
    !!(mergedData.address && (mergedData.desiredBusiness ?? mergedData.currentBusiness) && (mergedData.monthlyRentMan ?? mergedData.depositMan))

  return NextResponse.json({
    success: true,
    reply: parsed.reply ?? '죄송합니다. 다시 시도해주세요.',
    extractedContext: parsed.extractedContext ?? {},
    readyForAnalysis,
    intent,
    webSearchUsed: false,
    dataConfidence: parsed.dataConfidence ?? 'MEDIUM',
    model: response.model,
  })
}
