'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, Plus, MessageSquare, Trash2, Settings, GitCompare, History, X, FileInput } from 'lucide-react'
import { getConversations, deleteConversation } from '@/lib/chat/storage'
import { Conversation } from '@/lib/chat/types'

interface ChatSidebarProps {
  onClose?: () => void
}

export function ChatSidebar({ onClose }: ChatSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setConversations(getConversations())
  }, [pathname])

  function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    deleteConversation(id)
    setConversations(getConversations())
    if (pathname === `/chat/${id}`) router.push('/chat')
  }

  const activeId = pathname.startsWith('/chat/') ? pathname.slice(6) : undefined

  return (
    <aside className="w-64 shrink-0 flex flex-col h-full bg-[#F4F3F0] border-r border-[#E0DED9]">
      {/* Logo + new chat */}
      <div className="px-3 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4 px-2">
          <Link href="/" prefetch={false} className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#0A0A0A] rounded-xl flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-[#0f172a] text-sm font-bold">상권연구소</div>
              <div className="text-slate-400 text-[11px]">AI PRO V0.1</div>
            </div>
          </Link>
          {/* 닫기 버튼 — 모바일에서만 표시 */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <Link
          href="/store/new"
          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-full bg-[#C24A2C] text-white text-sm font-medium hover:bg-[#A83D23] transition-colors"
        >
          <FileInput className="w-4 h-4" />
          새 점포 분석 시작
        </Link>
        <Link
          href="/chat"
          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-full bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#1a1a1a] transition-colors mt-2"
        >
          <Plus className="w-4 h-4" />
          AI에게 질문하기
        </Link>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-3">
        {conversations.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-2">
              최근 분석
            </p>
            {conversations.map(conv => {
              const isActive = conv.id === activeId
              return (
                <Link
                  key={conv.id}
                  href={`/chat/${conv.id}`}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl mb-0.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-white shadow-sm text-[#0A0A0A]'
                      : 'text-[#555] hover:bg-white/80 hover:text-[#0A0A0A]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate text-[13px]">{conv.title}</span>
                  </div>
                  <button
                    onClick={e => handleDelete(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all rounded shrink-0"
                    aria-label="삭제"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="px-3 pb-4 border-t border-slate-200/60 pt-2 mt-2">
        <Link
          href="/store/new"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-600 hover:bg-white/70 transition-colors"
        >
          <FileInput className="w-4 h-4 text-slate-400" />
          점포 입력 (폼)
        </Link>
        <Link
          href="/compare"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-600 hover:bg-white/70 transition-colors"
        >
          <GitCompare className="w-4 h-4 text-slate-400" />
          후보지 비교
        </Link>
        <Link
          href="/history"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-600 hover:bg-white/70 transition-colors"
        >
          <History className="w-4 h-4 text-slate-400" />
          분석 기록
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-600 hover:bg-white/70 transition-colors"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          설정
        </Link>
      </div>
    </aside>
  )
}
