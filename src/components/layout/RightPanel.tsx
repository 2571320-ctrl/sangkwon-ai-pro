'use client'

import { useAppContext } from '@/lib/context/AppContext'
import { formatMoney, gradeColor } from '@/lib/utils'
import { FLOOR_LABELS, RECOMMENDATION_LABELS } from '@/types'
import {
  MapPin,
  Layers,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react'

export function RightPanel() {
  const { currentStore, currentAnalysis } = useAppContext()

  if (!currentStore) {
    return (
      <aside className="w-72 shrink-0 hidden xl:flex flex-col h-full bg-white border-l border-slate-200">
        <div className="p-5 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">현재 분석</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <MapPin className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-500">분석 중인 점포 없음</p>
          <p className="text-xs text-slate-400 mt-1">점포 정보를 입력하면<br />여기에 요약이 표시됩니다.</p>
        </div>
      </aside>
    )
  }

  const analysis = currentAnalysis
  const gc = analysis ? gradeColor(analysis.overallGrade) : null

  return (
    <aside className="w-72 shrink-0 hidden xl:flex flex-col h-full bg-white border-l border-slate-200 overflow-y-auto">
      <div className="p-5 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">현재 분석</p>
        <h3 className="font-bold text-slate-900 text-sm leading-tight">{currentStore.name}</h3>
        <p className="text-xs text-slate-500 mt-0.5 flex items-start gap-1">
          <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
          {currentStore.address}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
            {FLOOR_LABELS[currentStore.floor]}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
            {currentStore.areaPyeong}평
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
            {currentStore.desiredBusiness}
          </span>
        </div>
      </div>

      {/* Key metrics */}
      <div className="p-5 border-b border-slate-100 space-y-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">임대조건</p>

        <div className="space-y-2">
          <MetricRow icon={DollarSign} label="보증금" value={formatMoney(currentStore.deposit)} />
          <MetricRow icon={Clock} label="월세" value={formatMoney(currentStore.monthlyRent)} />
          {currentStore.maintenanceFee > 0 && (
            <MetricRow icon={Clock} label="관리비" value={formatMoney(currentStore.maintenanceFee)} />
          )}
          {currentStore.premium > 0 && (
            <MetricRow icon={AlertCircle} label="권리금" value={formatMoney(currentStore.premium)} color="text-amber-600" />
          )}
          {currentStore.premium === 0 && (
            <MetricRow icon={CheckCircle2} label="권리금" value="없음" color="text-emerald-600" />
          )}
        </div>
      </div>

      {/* Analysis summary */}
      {analysis && gc && (
        <div className="p-5 space-y-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">분석 결과 요약</p>

          <div className={`rounded-xl p-4 border ${gc.border} ${gc.bg}`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-2xl font-black ${gc.text}`}>{analysis.overallGrade}</span>
              <span className={`text-sm font-bold ${gc.text}`}>{analysis.overallScore}점</span>
            </div>
            <p className={`text-xs font-semibold ${gc.text}`}>
              {RECOMMENDATION_LABELS[analysis.recommendation]}
            </p>
          </div>

          <div className="space-y-2">
            {(
              [
                ['입지', analysis.scores.location],
                ['가시성', analysis.scores.visibility],
                ['임대조건', analysis.scores.rent],
                ['업종적합도', analysis.scores.businessFit],
              ] as const
            ).map(([, detail]) => (
              <div key={detail.label} className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{detail.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${detail.score}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-6 text-right">
                    {detail.grade}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-600 leading-relaxed">{analysis.summary.slice(0, 100)}…</p>
          </div>
        </div>
      )}

      {!analysis && (
        <div className="p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">점포 현황</p>
          <div className="space-y-2">
            <MetricRow icon={Layers} label="전면폭" value={`${currentStore.frontageMeters}m`} />
            <MetricRow icon={TrendingUp} label="가시성" value={currentStore.visibility === 'excellent' ? '우수' : currentStore.visibility === 'good' ? '양호' : '보통'} />
            <MetricRow icon={MapPin} label="주차" value={`${currentStore.parkingCount}대`} />
          </div>
        </div>
      )}
    </aside>
  )
}

function MetricRow({
  icon: Icon,
  label,
  value,
  color = 'text-slate-800',
}: {
  icon: React.ElementType
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <span className={`text-xs font-semibold ${color}`}>{value}</span>
    </div>
  )
}
