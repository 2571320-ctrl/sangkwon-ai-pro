'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3 } from 'lucide-react'
import { Attachment, Conversation } from '@/lib/chat/types'
import { createNewConversation, processUserInput } from '@/lib/chat/engine'
import { getConversation, saveConversation } from '@/lib/chat/storage'
import { analyzeStore } from '@/lib/analysis/engine'
import { persistStore, persistAnalysis } from '@/lib/supabase/repository'
import { Store } from '@/types'
import { generateId } from '@/lib/utils'
import { getAnalysis, getStore } from '@/lib/storage'
import { MessageBubble } from './MessageBubble'
import { AnalysisCard } from './AnalysisCard'
import { InputBar } from './InputBar'

interface Props {
  conversationId?: string
}

export function ChatWindow({ conversationId }: Props) {
  const [conv, setConv] = useState<Conversation | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Initialize conversation
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

  // Auto-scroll to latest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conv?.messages.length])

  const runAnalysis = useCallback(
    async (target: Conversation) => {
      const d = target.collectedData

      const store: Store = {
        id: generateId(),
        name: d.name ?? '점포',
        address: d.address ?? '',
        desiredBusiness: d.desiredBusiness ?? '',
        currentBusiness: d.currentBusiness ?? '',
        previousBusiness: '',
        floor: (d.floor as Store['floor']) ?? '1f',
        areaPyeong: d.areaPyeong ?? 30,
        frontageMeters: d.frontageMeters ?? 5,
        isCorner: d.isCorner ?? false,
        visibility: (d.visibility as Store['visibility']) ?? 'average',
        parkingCount: d.parkingCount ?? 0,
        walkAccess: (d.walkAccess as Store['walkAccess']) ?? 'average',
        carAccess: (d.carAccess as Store['carAccess']) ?? 'average',
        deposit: (d.depositMan ?? 0) * 10_000,
        monthlyRent: (d.monthlyRentMan ?? 0) * 10_000,
        maintenanceFee: (d.maintenanceFeeMan ?? 0) * 10_000,
        premium: (d.premiumMan ?? 0) * 10_000,
        vatIncluded: false,
        imageUrl: '',
        memo: '',
        createdAt: new Date().toISOString(),
      }

      const analysis = analyzeStore(store)
      await persistStore(store)
      await persistAnalysis(analysis)

      const analysisCardMsg = {
        id: generateId(),
        role: 'bot' as const,
        type: 'analysis-card' as const,
        text: `**${store.name}** 분석이 완료되었습니다.`,
        timestamp: new Date().toISOString(),
        analysisId: analysis.id,
        storeId: store.id,
      }

      const followUpMsg = {
        id: generateId(),
        role: 'bot' as const,
        type: 'text' as const,
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

      // Navigate to the conversation URL
      const targetId = conversationId ?? updated.id
      if (!conversationId) {
        router.replace(`/chat/${targetId}`)
      }
    },
    [conversationId, router],
  )

  async function handleInput(input: string, attachments?: Attachment[]) {
    if (!conv || isProcessing) return

    // Handle navigation shortcuts (only when no attachments)
    if (input.startsWith('/') && !attachments?.length) {
      router.push(input)
      return
    }

    setIsProcessing(true)

    const { updatedConversation, analysisReady } = processUserInput(conv, input)

    // Inject attachments into the newly added user message
    let finalConv = updatedConversation
    if (attachments && attachments.length > 0) {
      const msgs = [...updatedConversation.messages]
      const newUserIdx = conv.messages.length // index right after existing messages
      if (msgs[newUserIdx]?.role === 'user') {
        msgs[newUserIdx] = { ...msgs[newUserIdx], attachments }
      }
      finalConv = { ...updatedConversation, messages: msgs }
    }

    if (analysisReady) {
      // Save without loading message (localStorage stays clean if interrupted)
      const toSave = {
        ...finalConv,
        messages: finalConv.messages.filter(m => m.type !== 'loading'),
      }
      saveConversation(toSave)
      setConv(finalConv) // Show loading bubble in UI only
      // Navigation happens inside runAnalysis AFTER saving the result
      await new Promise(r => setTimeout(r, 700))
      await runAnalysis(finalConv)
    } else {
      saveConversation(finalConv)
      setConv(finalConv)
      if (!conversationId) {
        router.replace(`/chat/${finalConv.id}`)
      }
    }

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

  const QUICK_OPTIONS = [
    { label: '새 점포 분석 시작', value: '__start__' },
    { label: '테스트 데이터로 바로 분석', value: '__test__' },
    { label: '후보지 A/B 비교', value: '/compare' },
  ]

  // ── 웰컴 모드: 로고 + 제목 + 칩 + 입력창 중앙 집중 ────────────────────────
  if (!hasUserMessages) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-12 bg-white">
        {/* Logo + heading */}
        <div className="w-16 h-16 bg-[#0f172a] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
          <BarChart3 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">상권연구소 AI PRO</h1>
        <p className="text-slate-500 text-base mb-1">무엇을 분석해드릴까요?</p>
        <p className="text-slate-400 text-sm mb-8">점포명, 주소, 업종을 알려주시면 바로 시작합니다.</p>

        {/* Quick chips + input in one block */}
        <div className="w-full max-w-2xl">
          <div className="flex flex-wrap gap-2 justify-center mb-3">
            {QUICK_OPTIONS.map(opt => (
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
    )
  }

  // ── 채팅 모드: 메시지 자연 흐름 + sticky 입력창 ──────────────────────────
  return (
    <div className="relative bg-white">
      {/* Messages area */}
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

      {/* Sticky input bar */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-100">
        <InputBar onSubmit={handleInput} disabled={isProcessing} />
      </div>
    </div>
  )
}
