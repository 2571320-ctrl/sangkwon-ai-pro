import { Conversation } from './types'

const KEY = 'sai_conversations'

function load(): Conversation[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Conversation[]
  } catch {
    return []
  }
}

export function saveConversation(conv: Conversation): void {
  if (typeof window === 'undefined') return
  const all = load()
  const idx = all.findIndex(c => c.id === conv.id)
  if (idx >= 0) all[idx] = conv
  else all.unshift(conv)
  localStorage.setItem(KEY, JSON.stringify(all))
}

export function getConversations(): Conversation[] {
  return load()
}

export function getConversation(id: string): Conversation | null {
  return load().find(c => c.id === id) ?? null
}

export function deleteConversation(id: string): void {
  if (typeof window === 'undefined') return
  const all = load().filter(c => c.id !== id)
  localStorage.setItem(KEY, JSON.stringify(all))
}
