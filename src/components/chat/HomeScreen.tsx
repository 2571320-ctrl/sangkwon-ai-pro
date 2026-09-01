'use client'

import { useState, useRef, useCallback } from 'react'
import { BarChart3, Paperclip, Send, X, FileText, ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { Attachment } from '@/lib/chat/types'
import { generateId } from '@/lib/utils'

// ─── File handling (mirrors InputBar logic) ───────────────────
const ACCEPT = 'image/*,application/pdf,.doc,.docx,.xlsx,.xls,.csv,.txt,.hwp'
const MAX_SIZE = 10 * 1024 * 1024

async function compressImage(file: File, maxDim = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        const r = Math.min(maxDim / width, maxDim / height)
        width = Math.round(width * r)
        height = Math.round(height * r)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이미지 로드 실패')) }
    img.src = url
  })
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('파일 읽기 실패'))
    reader.readAsDataURL(file)
  })
}

async function fileToAttachment(file: File): Promise<Attachment> {
  if (file.size > MAX_SIZE) throw new Error(`${file.name}: 파일 크기가 10MB를 초과합니다.`)
  const isImage = file.type.startsWith('image/')
  const dataUrl = isImage ? await compressImage(file) : await readAsDataUrl(file)
  return { id: generateId(), name: file.name, type: file.type, dataUrl, size: file.size }
}

// ─── Component ────────────────────────────────────────────────
interface HomeScreenProps {
  onSubmit: (text: string, attachments?: Attachment[]) => void
  disabled?: boolean
}

const QUICK_ACTIONS = [
  { label: '새 점포 분석',   href: '/store/new' },
  { label: '후보지 비교',    href: '/compare'   },
  { label: '내 분석 리포트', href: '/history'   },
]

export function HomeScreen({ onSubmit, disabled }: HomeScreenProps) {
  const [text, setText]             = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback(async (files: File[]) => {
    const results = await Promise.allSettled(files.map(fileToAttachment))
    const ok = results
      .filter((r): r is PromiseFulfilledResult<Attachment> => r.status === 'fulfilled')
      .map(r => r.value)
    setAttachments(prev => [...prev, ...ok])
  }, [])

  function submit() {
    const trimmed = text.trim()
    const finalText = trimmed || (attachments.length > 0 ? '[파일 첨부]' : '')
    if (!finalText || disabled) return
    onSubmit(finalText, attachments.length > 0 ? attachments : undefined)
    setText('')
    setAttachments([])
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  function onInput() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  async function onPaste(e: React.ClipboardEvent) {
    const items = Array.from(e.clipboardData.items)
    const imageFiles = items
      .filter(i => i.kind === 'file' && i.type.startsWith('image/'))
      .map(i => i.getAsFile())
      .filter((f): f is File => f !== null)
    if (imageFiles.length === 0) return
    e.preventDefault()
    await addFiles(imageFiles)
  }

  async function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    await addFiles(Array.from(e.dataTransfer.files))
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    await addFiles(Array.from(e.target.files ?? []))
    e.target.value = ''
  }

  const canSubmit = (text.trim() || attachments.length > 0) && !disabled

  return (
    <div
      className="flex flex-col items-center justify-center min-h-full px-4"
      style={{
        background:
          'radial-gradient(circle at 50% 42%, #F4EBE7 0%, #F4F3F0 25%, #F9F8F6 55%, #FDFCFB 80%, #FFFFFF 100%)',
        paddingTop:    'clamp(3rem, 10vh, 6rem)',
        paddingBottom: 'clamp(3rem, 8vh, 5rem)',
      }}
    >
      {/* Brand label */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-7 h-7 bg-[#0A0A0A] rounded-[9px] flex items-center justify-center shadow-sm">
          <BarChart3 className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-[#0B1120] tracking-wide">
          상권연구소 AI PRO
        </span>
      </div>

      {/* Main headline */}
      <h1 className="text-[1.75rem] sm:text-[2.1rem] md:text-[2.4rem] font-bold text-slate-900 text-center mb-3 tracking-tight leading-[1.2] px-2">
        어떤 점포를 분석해드릴까요?
      </h1>

      {/* Sub copy */}
      <p className="text-slate-500 text-sm sm:text-[0.95rem] text-center mb-10 max-w-[400px] leading-relaxed px-4">
        주소와 희망 업종을 입력하면 입지·임대조건·위험요인을 함께 분석합니다.
      </p>

      {/* ── Input box ── */}
      <div className="w-full max-w-[680px] px-1 sm:px-0">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT}
          onChange={onFileChange}
          className="hidden"
        />

        <div
          className={`bg-white transition-all duration-150 ${
            isDragging
              ? 'rounded-[26px] border-2 border-[#C24A2C] shadow-[0_0_0_4px_rgba(194,74,44,0.08)]'
              : 'rounded-[26px] border border-[#E0DED9] shadow-[0_2px_20px_rgba(10,10,10,0.07)] focus-within:border-[#C24A2C]/40 focus-within:shadow-[0_4px_28px_rgba(10,10,10,0.11)]'
          }`}
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={e => { e.preventDefault(); setIsDragging(false) }}
          onDrop={onDrop}
        >
          {/* Drag overlay */}
          {isDragging && (
            <div className="flex items-center justify-center gap-2 px-6 py-8 text-sm text-[#C24A2C]">
              <ImageIcon className="w-4 h-4" />
              파일을 여기에 놓으세요
            </div>
          )}

          {/* Attachment previews */}
          {!isDragging && attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-5 pt-4 pb-1">
              {attachments.map(att => (
                <div key={att.id} className="relative group">
                  {att.type.startsWith('image/') ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 rounded-xl border border-slate-200 max-w-[180px]">
                      <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="text-xs text-slate-600 truncate">{att.name}</span>
                    </div>
                  )}
                  <button
                    onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    aria-label="제거"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input row */}
          {!isDragging && (
            <div className="flex items-end gap-3 px-4 py-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                title="사진·파일 첨부 (PNG, JPG, PDF 등 · 최대 10MB)"
                className="w-9 h-9 rounded-[14px] flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40 shrink-0 mb-0.5"
                aria-label="파일 첨부"
              >
                <Paperclip className="w-[18px] h-[18px]" />
              </button>

              <textarea
                ref={textareaRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={onKeyDown}
                onInput={onInput}
                onPaste={onPaste}
                rows={1}
                placeholder="점포 주소, 업종 또는 궁금한 내용을 입력하세요"
                disabled={disabled}
                autoFocus
                className="flex-1 resize-none bg-transparent text-[0.95rem] text-slate-800 placeholder-slate-400 outline-none leading-relaxed disabled:opacity-50 py-1"
                style={{ minHeight: '28px', maxHeight: '200px' }}
              />

              <button
                onClick={submit}
                disabled={!canSubmit}
                className="w-10 h-10 rounded-[14px] bg-[#C24A2C] text-white flex items-center justify-center hover:bg-[#A83D23] transition-colors disabled:opacity-25 disabled:cursor-not-allowed shrink-0 mb-0.5"
                aria-label="전송"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Quick action chips */}
        <div className="flex flex-wrap gap-2 justify-center mt-5">
          {QUICK_ACTIONS.map(action => (
            <Link
              key={action.href}
              href={action.href}
              className="px-4 py-2 rounded-full border border-slate-200 bg-white/80 text-sm text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-800 transition-all shadow-sm"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
