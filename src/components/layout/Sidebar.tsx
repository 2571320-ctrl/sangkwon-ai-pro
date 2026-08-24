'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Plus,
  MapPin,
  GitCompare,
  Clock,
  FileText,
  Settings,
  BarChart3,
} from 'lucide-react'

const navItems = [
  { href: '/analysis', label: '새 분석', icon: Plus, exact: true },
  { href: '/analysis', label: '점포 분석', icon: MapPin, exact: false },
  { href: '/compare', label: '후보지 비교', icon: GitCompare, exact: false },
  { href: '/history', label: '분석 기록', icon: Clock, exact: false },
  { href: '/report', label: '고객 리포트', icon: FileText, exact: false },
  { href: '/settings', label: '설정', icon: Settings, exact: false },
]

export function Sidebar() {
  const pathname = usePathname()

  function isActive(href: string, exact: boolean): boolean {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-60 shrink-0 flex flex-col h-full bg-[#0b1120] border-r border-slate-800">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-white text-sm font-bold leading-tight">상권연구소</div>
            <div className="text-blue-400 text-xs font-semibold leading-tight">AI PRO</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact)
          const Icon = item.icon
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${active
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}
              `}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-400' : ''}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-800">
        <p className="text-slate-600 text-xs font-medium">상권연구소 AI PRO V0.1</p>
        <p className="text-slate-700 text-xs mt-0.5">의사결정 지원 서비스</p>
      </div>
    </aside>
  )
}
