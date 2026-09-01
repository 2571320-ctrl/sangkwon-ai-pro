'use client'

import { useState, useRef, useCallback } from 'react'
import { Send, Paperclip, X, FileText, ImageIcon } from 'lucide-react'
import { Attachment } from '@/lib/chat/types'
import { generateId } from '@/lib/utils'

interface InputBarProps {
  onSubmit: (text: string, attachments?: Attachment[]) => void
  disabled?: boolean
}

const ACCEPT = 'image/*,application/pdf,.doc,.docx,.xlsx,.xls,.csv,.txt,.hwp'
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

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

async function fileToAttachment(file: File): Promise<Attachment> {
  if (file.size > MAX_SIZE) throw new Error(`${file.name}: 파일 크기가 10MB를 초과합니다.`)
  const isImage = file.type.startsWith('image/')
  const dataUrl = isImage ? await compressImage(file) : await readAsDataUrl(file)
  return { id: generateId(), name: file.name, type: file.type, dataUrl, size: file.size }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('파일 읽기 실패'))
    reader.readAsDataURL(file)
  })
}

export function InputBar({ onSubmit, disabled }: InputBarProps) {
  const [text, setText] = useState('')
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
    <div className="px-4 py-3">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPT}
        onChange={onFileChange}
        className="hidden"
      />
      <div className="max-w-2xl mx-auto">
        <div
          className={`bg-white border rounded-2xl shadow-sm transition-all ${
            isDragging
              ? 'border-[#C24A2C] ring-2 ring-[#F4EBE7]'
              : 'border-[#E0DED9] focus-within:border-[#C24A2C]/50'
          }`}
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={e => { e.preventDefault(); setIsDragging(false) }}
          onDrop={onDrop}
        >
          {/* Drag-over overlay */}
          {isDragging && (
            <div className="flex items-center justify-center gap-2 px-4 py-4 text-sm text-[#C24A2C]">
              <ImageIcon className="w-4 h-4" />
              파일을 여기에 놓으세요
            </div>
          )}

          {/* Attachment previews */}
          {!isDragging && attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 pt-3 pb-1">
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
            <div className="flex items-end gap-2 px-3 py-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                title="사진·파일 첨부 (PNG, JPG, PDF 등 · 최대 10MB)"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40 shrink-0"
                aria-label="파일 첨부"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <textarea
                ref={textareaRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={onKeyDown}
                onInput={onInput}
                onPaste={onPaste}
                rows={1}
                placeholder="점포 정보를 입력하거나 질문해주세요…"
                disabled={disabled}
                className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none leading-relaxed disabled:opacity-50"
                style={{ minHeight: '24px', maxHeight: '200px' }}
              />

              <button
                onClick={submit}
                disabled={!canSubmit}
                className="w-8 h-8 rounded-xl bg-[#C24A2C] text-white flex items-center justify-center hover:bg-[#A83D23] transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                aria-label="전송"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-1.5">
          상권연구소 AI PRO V0.1 · AI + 현장판단 엔진
        </p>
      </div>
    </div>
  )
}
