'use client'

import { useState, useRef, useCallback } from 'react'
import { Paperclip, Send, X, FileText, ImageIcon, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Attachment } from '@/lib/chat/types'
import { generateId } from '@/lib/utils'

// ─── File handling ────────────────────────────────────────────
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

// ─── Static data ──────────────────────────────────────────────
const SUGGESTED = [
  { label: '권리금 3천만원, 회수 가능한가요?',    prefix: '권리금 3천만원인데' },
  { label: '월세 비율 어떻게 계산하나요?',         prefix: '월세 비율 계산법이 궁금합니다' },
  { label: '이 자리에 카페 들어가도 될까요?',      prefix: '카페를 생각 중인데' },
  { label: '임대차 계약 전 체크리스트 알려주세요',  prefix: '계약 전 확인할 사항이 궁금합니다' },
]

// ─── Component ────────────────────────────────────────────────
interface HomeScreenProps {
  onSubmit: (text: string, attachments?: Attachment[]) => void
  disabled?: boolean
}

export function HomeScreen({ onSubmit, disabled }: HomeScreenProps) {
  const [text, setText]               = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isDragging, setIsDragging]   = useState(false)
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

  function fillSuggestion(prefix: string) {
    setText(prefix)
    setTimeout(() => {
      textareaRef.current?.focus()
      onInput()
    }, 50)
  }

  const canSubmit = (text.trim() || attachments.length > 0) && !disabled

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div
      className="min-h-full overflow-y-auto"
      style={{
        background: '#FDFCFA',
        fontFamily: "Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@700;800;900&display=swap');
        .hs-serif { font-family: 'Noto Serif KR', 'Nanum Myeongjo', Georgia, serif; }
        .hs-card { transition: box-shadow 0.18s, transform 0.18s; }
        .hs-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.10); transform: translateY(-2px); }
        .hs-card-dark:hover { box-shadow: 0 8px 32px rgba(194,74,44,0.22); transform: translateY(-2px); }
        .hs-suggestion:hover { background: #F2EDE7; border-color: #C24A2C; color: #C24A2C; }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid #E8E3DC', background: '#FDFCFA' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 3, height: 18, background: '#C24A2C', borderRadius: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A', letterSpacing: '0.02em' }}>상권연구소 AI PRO</span>
          </div>
          <span style={{ fontSize: 12, color: '#9A8F84' }}>{today}</span>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────── */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 32px 60px' }}>

        {/* Headline */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#C24A2C', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
            점포 계약 의사결정 지원
          </div>
          <h1
            className="hs-serif"
            style={{ fontSize: 'clamp(24px, 3.5vw, 34px)', fontWeight: 800, color: '#0A0A0A', lineHeight: 1.3, margin: 0 }}
          >
            계약 전 점포, 무엇을<br />분석해드릴까요?
          </h1>
        </div>

        {/* ── 3 Pathway Cards ────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 40 }}>

          {/* Card 1 — 점포 정밀 분석 (Featured) */}
          <Link
            href="/store/new"
            className="hs-card hs-card-dark"
            style={{
              display: 'flex', flexDirection: 'column', textDecoration: 'none',
              background: '#0A0A0A', borderRadius: 16, padding: '24px 22px',
              border: '1.5px solid #C24A2C', position: 'relative', overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 3,
              background: 'linear-gradient(90deg, #C24A2C 0%, #E07050 100%)',
            }} />
            <div style={{ fontSize: 24, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#C24A2C', letterSpacing: '0.06em', marginBottom: 8, textTransform: 'uppercase' }}>
              추천
            </div>
            <div
              className="hs-serif"
              style={{ fontSize: 17, fontWeight: 800, color: 'white', marginBottom: 10, lineHeight: 1.3 }}
            >
              점포 정밀 분석
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.58)', lineHeight: 1.65, flex: 1, margin: '0 0 20px' }}>
              임대료·권리금·업종 적합성을 AI가 종합 분석해 9페이지 리포트로 정리합니다.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#C24A2C' }}>
              분석 시작하기 <ArrowRight size={14} />
            </div>
          </Link>

          {/* Card 2 — 후보지 비교 */}
          <Link
            href="/compare"
            className="hs-card"
            style={{
              display: 'flex', flexDirection: 'column', textDecoration: 'none',
              background: '#F7F4F0', borderRadius: 16, padding: '24px 22px',
              border: '1px solid #E8E3DC',
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 12 }}>⚖️</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#9A8F84', letterSpacing: '0.06em', marginBottom: 8, textTransform: 'uppercase' }}>
              비교 분석
            </div>
            <div
              className="hs-serif"
              style={{ fontSize: 17, fontWeight: 800, color: '#0A0A0A', marginBottom: 10, lineHeight: 1.3 }}
            >
              후보지 비교
            </div>
            <p style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.65, flex: 1, margin: '0 0 20px' }}>
              두 점포를 나란히 비교해 어떤 입지가 유리한지 한눈에 확인하세요.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#0A0A0A' }}>
              비교 시작하기 <ArrowRight size={14} />
            </div>
          </Link>

          {/* Card 3 — 자유 질문 */}
          <button
            className="hs-card"
            onClick={() => textareaRef.current?.focus()}
            style={{
              display: 'flex', flexDirection: 'column', textDecoration: 'none',
              background: '#F7F4F0', borderRadius: 16, padding: '24px 22px',
              border: '1px solid #E8E3DC', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 12 }}>💬</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#9A8F84', letterSpacing: '0.06em', marginBottom: 8, textTransform: 'uppercase' }}>
              자유 질문
            </div>
            <div
              className="hs-serif"
              style={{ fontSize: 17, fontWeight: 800, color: '#0A0A0A', marginBottom: 10, lineHeight: 1.3 }}
            >
              AI에게 물어보기
            </div>
            <p style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.65, flex: 1, margin: '0 0 20px' }}>
              상권, 임대차 계약, 권리금 등 궁금한 것을 자유롭게 질문하세요.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#0A0A0A' }}>
              아래 입력창 사용 <ArrowRight size={14} />
            </div>
          </button>
        </div>

        {/* ── Divider ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#E8E3DC' }} />
          <span style={{ fontSize: 12, color: '#9A8F84', fontWeight: 500, whiteSpace: 'nowrap' }}>또는 직접 질문하세요</span>
          <div style={{ flex: 1, height: 1, background: '#E8E3DC' }} />
        </div>

        {/* ── Chat Input ─────────────────────────────────────────── */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT}
          onChange={onFileChange}
          className="hidden"
        />

        <div
          style={{
            background: 'white',
            borderRadius: 14,
            border: isDragging ? '2px solid #C24A2C' : '1px solid #E0DED9',
            boxShadow: isDragging
              ? '0 0 0 4px rgba(194,74,44,0.08)'
              : '0 2px 12px rgba(10,10,10,0.06)',
            transition: 'all 0.15s',
            marginBottom: 24,
          }}
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={e => { e.preventDefault(); setIsDragging(false) }}
          onDrop={onDrop}
        >
          {isDragging ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '28px 24px', fontSize: 14, color: '#C24A2C' }}>
              <ImageIcon size={16} />
              파일을 여기에 놓으세요
            </div>
          ) : (
            <>
              {attachments.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '14px 16px 4px' }}>
                  {attachments.map(att => (
                    <div key={att.id} style={{ position: 'relative' }}>
                      {att.type.startsWith('image/') ? (
                        <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', border: '1px solid #E8E3DC', background: '#F4F3F0' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={att.dataUrl} alt={att.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: '#F4F3F0', borderRadius: 8, border: '1px solid #E8E3DC', maxWidth: 160 }}>
                          <FileText size={14} color="#6B6B6B" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</span>
                        </div>
                      )}
                      <button
                        onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}
                        style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, background: '#555', color: 'white', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        aria-label="제거"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, padding: '12px 14px' }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  title="사진·파일 첨부 (PNG, JPG, PDF 등 · 최대 10MB)"
                  style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9A8F84', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, marginBottom: 2, transition: 'background 0.15s' }}
                  aria-label="파일 첨부"
                >
                  <Paperclip size={17} />
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
                  style={{
                    flex: 1, resize: 'none', background: 'transparent',
                    fontSize: '0.95rem', color: '#0A0A0A',
                    border: 'none', outline: 'none', lineHeight: 1.6,
                    minHeight: 26, maxHeight: 200, padding: '4px 0',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={submit}
                  disabled={!canSubmit}
                  style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0, marginBottom: 2,
                    background: canSubmit ? '#C24A2C' : '#E8E3DC',
                    color: canSubmit ? 'white' : '#9A8F84',
                    border: 'none', cursor: canSubmit ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.15s',
                  }}
                  aria-label="전송"
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Suggested questions ────────────────────────────────── */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8F84', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
            자주 묻는 질문
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {SUGGESTED.map((s, i) => (
              <button
                key={i}
                className="hs-suggestion"
                onClick={() => fillSuggestion(s.prefix)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                  padding: '11px 14px', borderRadius: 10,
                  background: 'white', border: '1px solid #E8E3DC',
                  fontSize: 13, color: '#3D3730', cursor: 'pointer',
                  transition: 'all 0.15s', fontFamily: 'inherit',
                }}
              >
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#C24A2C', flexShrink: 0 }} />
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
