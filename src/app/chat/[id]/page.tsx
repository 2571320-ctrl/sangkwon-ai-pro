'use client'

import { useParams } from 'next/navigation'
import { ChatWindow } from '@/components/chat/ChatWindow'

export default function ChatIdPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : undefined
  return <ChatWindow conversationId={id} />
}
