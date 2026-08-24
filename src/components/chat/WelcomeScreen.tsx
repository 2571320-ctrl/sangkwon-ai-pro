import { BarChart3 } from 'lucide-react'

export function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 pb-8">
      <div className="w-16 h-16 bg-[#0f172a] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
        <BarChart3 className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">
        상권연구소 AI PRO
      </h1>
      <p className="text-slate-500 text-base mb-1">무엇을 분석해드릴까요?</p>
      <p className="text-slate-400 text-sm">
        점포명, 주소, 업종을 알려주시면 바로 시작합니다.
      </p>
    </div>
  )
}
