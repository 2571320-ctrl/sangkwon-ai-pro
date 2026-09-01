'use client'

import { Settings, Database, BrainCircuit, Info } from 'lucide-react'

function SettingRow({ label, description, children }: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between py-4 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5 max-w-xs leading-relaxed">{description}</p>}
      </div>
      <div className="ml-8 shrink-0">{children}</div>
    </div>
  )
}

export default function SettingsPage() {
  const hasSupabase =
    typeof process !== 'undefined' &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-10">
        <p className="text-[11px] font-black text-[#C24A2C] tracking-[0.2em] uppercase mb-3">시스템 설정</p>
        <h1 className="text-[1.85rem] font-bold text-[#0A0A0A] leading-tight mb-3">설정</h1>
        <p className="text-[#666] text-sm">상권연구소 AI PRO V0.1 설정 페이지입니다.</p>
      </div>

      <div className="space-y-6">
        {/* Service status */}
        <div className="bg-white border border-[#E0DED9] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E0DED9] flex items-center gap-3">
            <div className="w-[3px] h-5 rounded-full bg-[#C24A2C] shrink-0" />
            <Info className="w-4 h-4 text-[#C24A2C]" />
            <h3 className="text-sm font-bold text-[#0A0A0A]">서비스 상태</h3>
          </div>
          <div className="px-6">
            <SettingRow
              label="현재 버전"
              description="상권연구소 AI PRO MVP"
            >
              <span className="text-sm font-mono font-bold text-[#C24A2C] bg-[#F4EBE7] px-2 py-1 rounded">V0.1</span>
            </SettingRow>
            <SettingRow
              label="데이터 분석 모드"
              description="V0.1은 더미 데이터 + 로컬 규칙 엔진으로 분석합니다."
            >
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                테스트 모드
              </span>
            </SettingRow>
          </div>
        </div>

        {/* Database */}
        <div className="bg-white border border-[#E0DED9] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E0DED9] flex items-center gap-3">
            <div className="w-[3px] h-5 rounded-full bg-[#C24A2C] shrink-0" />
            <Database className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-[#0A0A0A]">데이터 저장</h3>
          </div>
          <div className="px-6">
            <SettingRow
              label="Supabase 연결"
              description=".env.local에 NEXT_PUBLIC_SUPABASE_URL을 설정하면 클라우드에 분석 결과가 저장됩니다."
            >
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                hasSupabase
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-slate-500 bg-slate-100 border-slate-200'
              }`}>
                {hasSupabase ? '연결됨' : '미연결 (로컬 저장)'}
              </span>
            </SettingRow>
            <SettingRow
              label="로컬 데이터"
              description="분석 결과는 브라우저 localStorage에 저장됩니다."
            >
              <button
                onClick={() => {
                  if (confirm('저장된 모든 분석 기록을 삭제하시겠습니까?')) {
                    ['sai_stores', 'sai_analyses', 'sai_comparisons'].forEach(
                      k => localStorage.removeItem(k),
                    )
                    alert('삭제되었습니다.')
                  }
                }}
                className="text-xs font-semibold text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                데이터 초기화
              </button>
            </SettingRow>
          </div>
        </div>

        {/* AI */}
        <div className="bg-white border border-[#E0DED9] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E0DED9] flex items-center gap-3">
            <div className="w-[3px] h-5 rounded-full bg-[#C24A2C] shrink-0" />
            <BrainCircuit className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-[#0A0A0A]">AI 분석 엔진</h3>
          </div>
          <div className="px-6">
            <SettingRow
              label="OpenAI 연동"
              description=".env.local에 OPENAI_API_KEY를 설정하면 판단 문장 생성에 AI를 활용할 수 있습니다. V0.1에서는 규칙 기반 엔진을 사용합니다."
            >
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                V1.0 예정
              </span>
            </SettingRow>
            <SettingRow
              label="분석 엔진 모드"
              description="입력 → 규칙 → 점수 → 해석 → 결과 구조로 동작합니다."
            >
              <span className="text-xs font-semibold text-[#C24A2C] bg-[#F4EBE7] border border-[#C24A2C]/20 px-2.5 py-1 rounded-full">
                규칙 기반
              </span>
            </SettingRow>
          </div>
        </div>

        {/* Info */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500 leading-relaxed">
            <span className="font-semibold text-slate-700">상권연구소 AI PRO V0.1</span>은 MVP(최소기능제품) 단계로,
            실제 공공데이터 API 연동 없이 더미 데이터와 규칙 기반 엔진으로 전체 흐름을 검증합니다.
            이후 버전에서 소상공인시장진흥공단, 행정안전부 공공데이터, OpenAI API가 순차적으로 연동될 예정입니다.
          </p>
        </div>
      </div>
    </div>
  )
}
