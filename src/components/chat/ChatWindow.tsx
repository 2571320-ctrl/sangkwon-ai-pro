'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BarChart3, ClipboardList, Plus } from 'lucide-react'
import { Attachment, ChatMessage, CollectedData, Conversation } from '@/lib/chat/types'
import { createNewConversation, processUserInput } from '@/lib/chat/engine'
import { getConversation, saveConversation } from '@/lib/chat/storage'
import { analyzeStore } from '@/lib/analysis/engine'
import { persistStore, persistAnalysis } from '@/lib/supabase/repository'
import { Store } from '@/types'
import { generateId } from '@/lib/utils'
import { getAnalysis, getStore } from '@/lib/storage'
import { detectUserIntent } from '@/lib/chat/intent'
import { MessageBubble } from './MessageBubble'
import { AnalysisCard } from './AnalysisCard'
import { InputBar } from './InputBar'

interface Props {
  conversationId?: string
}

// Build a Store object from conversation's collected data
function buildStoreFromCollectedData(d: CollectedData): Store {
  return {
    id: generateId(),
    name: d.address ?? d.name ?? '분석 점포',
    address: d.address ?? d.name ?? '',
    desiredBusiness: d.desiredBusiness ?? '',
    currentBusiness: d.currentBusiness ?? '',
    previousBusiness: d.previousBusiness ?? '',
    floor: (d.floor as Store['floor']) ?? '1f',
    areaPyeong: d.areaPyeong ?? 0,
    areaSqm: d.areaSqm,
    frontageMeters: d.frontageMeters ?? 0,
    isCorner: d.isCorner ?? false,
    dualExposure: d.dualExposure,
    visibility: (d.visibility as Store['visibility']) ?? 'average',
    signageVisibility: d.signageVisibility,
    entranceLocation: d.entranceLocation,
    customerFlow: d.customerFlow,
    parkingCount: d.parkingCount ?? 0,
    walkAccess: (d.pedestrianAccess as Store['walkAccess']) ?? (d.walkAccess as Store['walkAccess']) ?? 'average',
    carAccess: (d.vehicleAccess as Store['carAccess']) ?? (d.carAccess as Store['carAccess']) ?? 'average',
    pedestrianAccess: d.pedestrianAccess as Store['pedestrianAccess'],
    vehicleAccess: d.vehicleAccess as Store['vehicleAccess'],
    publicTransportAccess: d.publicTransportAccess as Store['publicTransportAccess'],
    elevator: d.elevator,
    restroom: d.restroom,
    duct: d.duct,
    cityGas: d.cityGas,
    electricCapacity: d.electricCapacity,
    drainage: d.drainage,
    sewer: d.sewer,
    fireSafety: d.fireSafety,
    deposit: (d.depositMan ?? 0) * 10_000,
    monthlyRent: (d.monthlyRentMan ?? 0) * 10_000,
    maintenanceFee: (d.maintenanceFeeMan ?? 0) * 10_000,
    premium: (d.premiumMan ?? 0) * 10_000,
    vatIncluded: d.vatIncluded ?? false,
    estimatedInteriorCost: (d.estimatedInteriorCostMan ?? 0) * 10_000,
    // Only use expectedMonthlySales if user explicitly provided it; 0 means "not provided"
    expectedMonthlySales: d.expectedMonthlySalesMan ? d.expectedMonthlySalesMan * 10_000 : 0,
    contractPeriod: d.contractPeriod,
    imageUrl: '',
    memo: '',
    fieldMemo: d.fieldMemo,
    createdAt: new Date().toISOString(),
  }
}

export function ChatWindow({ conversationId }: Props) {
  const [conv, setConv] = useState<Conversation | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (conversationId) {
      const saved = getConversation(conversationId)
      if (saved) {
        setConv(saved)
      } else {
        router.push('/chat')
      }
    } else {
      setConv(createNewConversation())
    }
  }, [conversationId, router])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conv?.messages.length])

  const runAnalysis = useCallback(
    async (target: Conversation) => {
      const store = buildStoreFromCollectedData({
        ...target.collectedData,
        name: target.collectedData.name ?? target.collectedData.address ?? '점포',
      })

      const analysis = analyzeStore(store)
      await persistStore(store)
      await persistAnalysis(analysis)

      const analysisCardMsg: ChatMessage = {
        id: generateId(),
        role: 'bot',
        type: 'analysis-card',
        text: `**${store.name}** 분석이 완료되었습니다.`,
        timestamp: new Date().toISOString(),
        analysisId: analysis.id,
        storeId: store.id,
      }

      const followUpMsg: ChatMessage = {
        id: generateId(),
        role: 'bot',
        type: 'text',
        text: '더 궁금한 점이 있으시면 질문해주세요.',
        timestamp: new Date().toISOString(),
        options: [
          { label: '상세 분석 보기', value: `/analysis/${analysis.id}` },
          { label: '고객 리포트', value: `/report/${analysis.id}` },
        ],
      }

      const updated: Conversation = {
        ...target,
        step: 'results',
        messages: [
          ...target.messages.filter(m => m.type !== 'loading'),
          analysisCardMsg,
          followUpMsg,
        ],
        analysisId: analysis.id,
        title: store.name,
        updatedAt: new Date().toISOString(),
      }

      saveConversation(updated)
      setConv(updated)

      const targetId = conversationId ?? updated.id
      if (!conversationId) {
        router.replace(`/chat/${targetId}`)
      }
    },
    [conversationId, router],
  )

  // REPORT_CREATE handler: build store/analysis from current context, navigate to report
  async function handleReportCreate(currentConv: Conversation, userInput: string): Promise<void> {
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      type: 'text',
      text: userInput,
      timestamp: new Date().toISOString(),
    }
    const loadingMsg: ChatMessage = {
      id: generateId(),
      role: 'bot',
      type: 'loading',
      text: '',
      timestamp: new Date().toISOString(),
    }
    setConv({ ...currentConv, messages: [...currentConv.messages, userMessage, loadingMsg] })

    // Build store from whatever data we have collected so far
    const store = buildStoreFromCollectedData(currentConv.collectedData)
    const analysis = analyzeStore(store)
    await persistStore(store)
    await persistAnalysis(analysis)

    const botMessage: ChatMessage = {
      id: generateId(),
      role: 'bot',
      type: 'text',
      text: '고객용 분석 리포트를 생성했습니다. 아래 버튼을 눌러 확인하세요.',
      timestamp: new Date().toISOString(),
      options: [{ label: '고객 리포트 보기', value: `/report/${analysis.id}` }],
    }

    const updatedConv: Conversation = {
      ...currentConv,
      messages: [...currentConv.messages, userMessage, botMessage],
      analysisId: analysis.id,
      updatedAt: new Date().toISOString(),
    }
    saveConversation(updatedConv)
    setConv(updatedConv)
    if (!conversationId) router.replace(`/chat/${updatedConv.id}`)
  }

  async function handleWithOpenAI(input: string, attachments?: Attachment[]) {
    if (!conv) return

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      type: 'text',
      text: input,
      timestamp: new Date().toISOString(),
      attachments,
    }
    const loadingMsg: ChatMessage = {
      id: generateId(),
      role: 'bot',
      type: 'loading',
      text: '',
      timestamp: new Date().toISOString(),
    }
    setConv({ ...conv, messages: [...conv.messages, userMessage, loadingMsg] })

    const history: { role: 'user' | 'assistant'; content: string }[] = conv.messages
      .filter(m => m.type === 'text')
      .slice(-10)
      .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }))
    history.push({ role: 'user', content: input })

    const currentContext = Object.fromEntries(
      Object.entries(conv.collectedData).filter(([, v]) => v !== undefined && v !== null),
    )

    let reply = '죄송합니다. 잠시 후 다시 시도해주세요.'
    let extractedContext: Partial<CollectedData> = {}
    let readyForAnalysis = false

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, currentContext }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as {
        success: boolean
        reply?: string
        extractedContext?: Partial<CollectedData>
        readyForAnalysis?: boolean
      }
      if (data.success) {
        reply = data.reply ?? reply
        extractedContext = (data.extractedContext as Partial<CollectedData>) ?? {}
        readyForAnalysis = data.readyForAnalysis ?? false
      }
    } catch {
      reply = '연결 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    }

    const mergedData: CollectedData = { ...conv.collectedData, ...extractedContext }

    if (readyForAnalysis) {
      const analysisData: CollectedData = {
        ...mergedData,
        name: mergedData.name ?? mergedData.address ?? '점포',
      }
      const botMessage: ChatMessage = {
        id: generateId(),
        role: 'bot',
        type: 'text',
        text: reply,
        timestamp: new Date().toISOString(),
      }
      const analyzeMsg: ChatMessage = {
        id: generateId(),
        role: 'bot',
        type: 'loading',
        text: '',
        timestamp: new Date().toISOString(),
      }
      const preAnalysisConv: Conversation = {
        ...conv,
        step: 'analyzing',
        messages: [...conv.messages, userMessage, botMessage, analyzeMsg],
        collectedData: analysisData,
        title: analysisData.name ?? conv.title,
        updatedAt: new Date().toISOString(),
      }
      const toSave = {
        ...preAnalysisConv,
        messages: preAnalysisConv.messages.filter(m => m.type !== 'loading'),
      }
      saveConversation(toSave)
      setConv(preAnalysisConv)
      if (!conversationId) router.replace(`/chat/${preAnalysisConv.id}`)
      await new Promise(r => setTimeout(r, 700))
      await runAnalysis(preAnalysisConv)
    } else {
      const newTitle = mergedData.address
        ? mergedData.address.slice(0, 20)
        : conv.title === '새 분석'
        ? input.length > 20 ? input.slice(0, 20) + '…' : input
        : conv.title

      const botMessage: ChatMessage = {
        id: generateId(),
        role: 'bot',
        type: 'text',
        text: reply,
        timestamp: new Date().toISOString(),
      }
      const updatedConv: Conversation = {
        ...conv,
        messages: [...conv.messages, userMessage, botMessage],
        collectedData: mergedData,
        title: newTitle,
        updatedAt: new Date().toISOString(),
      }
      saveConversation(updatedConv)
      setConv(updatedConv)
      if (!conversationId) router.replace(`/chat/${updatedConv.id}`)
    }
  }

  async function handleInput(input: string, attachments?: Attachment[]) {
    if (!conv || isProcessing) return

    const trimmed = input.trim()

    // Navigation shortcuts (e.g. /compare)
    if (trimmed.startsWith('/') && !attachments?.length) {
      router.push(trimmed)
      return
    }

    setIsProcessing(true)

    // Test data shortcut
    if (trimmed === '__test__') {
      const { updatedConversation, analysisReady } = processUserInput(conv, trimmed)
      if (analysisReady) {
        const toSave = {
          ...updatedConversation,
          messages: updatedConversation.messages.filter(m => m.type !== 'loading'),
        }
        saveConversation(toSave)
        setConv(updatedConversation)
        await new Promise(r => setTimeout(r, 700))
        await runAnalysis(updatedConversation)
      } else {
        saveConversation(updatedConversation)
        setConv(updatedConversation)
        if (!conversationId) router.replace(`/chat/${updatedConversation.id}`)
      }
      setIsProcessing(false)
      return
    }

    // "새 점포 분석 시작" → form page
    if (trimmed === '__start__') {
      router.push('/store/new')
      setIsProcessing(false)
      return
    }

    // ── Intent detection: REPORT_CREATE ──────────────────────────────────────
    const { intent } = detectUserIntent(trimmed)
    if (intent === 'REPORT_CREATE') {
      await handleReportCreate(conv, input)
      setIsProcessing(false)
      return
    }

    // Default: send to OpenAI
    await handleWithOpenAI(input, attachments)
    setIsProcessing(false)
  }

  if (!conv) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 bg-[#0f172a] rounded-full flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-white animate-pulse" />
        </div>
      </div>
    )
  }

  const hasUserMessages = conv.messages.some(m => m.role === 'user')

  const AI_QUICK_OPTIONS = [
    { label: '테스트 데이터로 바로 분석', value: '__test__' },
    { label: '후보지 A/B 비교', value: '/compare' },
  ]

  if (!hasUserMessages) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-12 bg-white">
        <div className="w-16 h-16 bg-[#0f172a] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
          <BarChart3 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">상권연구소 AI PRO</h1>
        <p className="text-slate-500 text-base mb-8">점포 계약 전 입지·상권·임대조건을 분석합니다</p>

        <div className="w-full max-w-2xl space-y-5">
          <div className="border border-slate-200 rounded-2xl p-5 hover:border-blue-200 hover:shadow-sm transition-all">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#0f172a] rounded-xl flex items-center justify-center shrink-0">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-slate-800 mb-1">점포 분석 시작</h2>
                <p className="text-sm text-slate-500 mb-3">주소·업종·임대조건을 입력하면 입지·가시성·업종적합도를 분석합니다</p>
                <Link
                  href="/store/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0f172a] text-white text-sm font-medium rounded-full hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  새 점포 분석 시작
                </Link>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-xs text-slate-400">또는 AI에게 직접 질문하기</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            <div className="flex flex-wrap gap-2 justify-center mb-3">
              {AI_QUICK_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleInput(opt.value)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <InputBar onSubmit={handleInput} disabled={isProcessing} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative bg-white">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-28">
        {conv.messages.map(msg => {
          if (msg.type === 'analysis-card' && msg.analysisId && msg.storeId) {
            const analysis = getAnalysis(msg.analysisId)
            const store = getStore(msg.storeId)
            if (analysis && store) {
              return (
                <div key={msg.id} className="flex gap-3 py-2.5">
                  <div className="w-8 h-8 bg-[#0f172a] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 leading-relaxed">{msg.text}</p>
                    <AnalysisCard analysis={analysis} store={store} />
                  </div>
                </div>
              )
            }
          }
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              onOptionClick={handleInput}
            />
          )
        })}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-100">
        <InputBar onSubmit={handleInput} disabled={isProcessing} />
      </div>
    </div>
  )
}
