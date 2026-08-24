import { BarChart3, FileText } from 'lucide-react'
import { ChatMessage } from '@/lib/chat/types'

interface Props {
  message: ChatMessage
  onOptionClick?: (value: string) => void
}

export function MessageBubble({ message, onOptionClick }: Props) {
  if (message.type === 'loading') {
    return (
      <div className="flex gap-3 py-4">
        <BotAvatar />
        <div className="flex items-center gap-1.5 bg-slate-100 px-4 py-3 rounded-2xl">
          {[0, 150, 300].map(delay => (
            <div
              key={delay}
              className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (message.role === 'user') {
    const atts = message.attachments ?? []
    return (
      <div className="flex justify-end py-2.5">
        <div className="max-w-[72%] flex flex-col items-end gap-2">
          {/* Attachments */}
          {atts.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-end">
              {atts.map(att =>
                att.type.startsWith('image/') ? (
                  <a key={att.id} href={att.dataUrl} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      className="max-w-[220px] max-h-52 rounded-2xl border border-slate-200 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  </a>
                ) : (
                  <div key={att.id} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 rounded-xl border border-slate-200">
                    <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-xs text-slate-700">{att.name}</span>
                  </div>
                )
              )}
            </div>
          )}
          {/* Text bubble (hidden for attachment-only messages) */}
          {message.text && message.text !== '[파일 첨부]' && (
            <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-tr-md">
              <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{message.text}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 py-2.5">
      <BotAvatar />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
          {renderText(message.text)}
        </p>
        {message.options && message.options.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {message.options.map(opt => (
              <button
                key={opt.value}
                onClick={() => onOptionClick?.(opt.value)}
                className="px-4 py-2 rounded-full border border-slate-300 text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function BotAvatar() {
  return (
    <div className="w-8 h-8 bg-[#0f172a] rounded-full flex items-center justify-center shrink-0 mt-0.5">
      <BarChart3 className="w-4 h-4 text-white" />
    </div>
  )
}

function renderText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[13px] font-mono">
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}
