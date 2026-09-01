'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { analyzeStore, compareStores } from '@/lib/analysis/engine'
import { saveStore, saveAnalysis, saveComparison } from '@/lib/storage'
import { generateId, formatMoney, gradeColor } from '@/lib/utils'
import { Store, ComparisonResult, FLOOR_LABELS } from '@/types'
import { GitCompare, ChevronRight, Trophy, AlertTriangle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

const miniSchema = z.object({
  address: z.string().min(1, '주소를 입력하세요'),
  desiredBusiness: z.string().min(1, '희망 업종을 입력하세요'),
  floor: z.enum(['basement', '1f', '2f', '3f', '4f_plus']).default('1f'),
  areaPyeong: z.coerce.number().min(1, '면적 입력'),
  frontageMeters: z.coerce.number().min(0.1, '전면폭 입력'),
  isCorner: z.boolean().default(false),
  visibility: z.enum(['excellent', 'good', 'average', 'poor']).default('average'),
  parkingCount: z.coerce.number().min(0).default(0),
  walkAccess: z.enum(['excellent', 'good', 'average', 'poor']).default('good'),
  carAccess: z.enum(['excellent', 'good', 'average', 'poor']).default('good'),
  depositMan: z.coerce.number().min(0).default(0),
  monthlyRentMan: z.coerce.number().min(0).default(0),
  maintenanceFeeMan: z.coerce.number().min(0).default(0),
  premiumMan: z.coerce.number().min(0).default(0),
})

type MiniForm = z.infer<typeof miniSchema>

const inputClass = `w-full px-3 py-2 text-sm border border-[#E0DED9] rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C24A2C]/30 focus:border-[#C24A2C] transition-colors`
const selectClass = `${inputClass} cursor-pointer`

function formToStore(data: MiniForm): Store {
  return {
    id: generateId(),
    name: data.address,
    address: data.address,
    desiredBusiness: data.desiredBusiness,
    currentBusiness: '',
    previousBusiness: '',
    floor: data.floor,
    areaPyeong: data.areaPyeong,
    frontageMeters: data.frontageMeters,
    isCorner: data.isCorner,
    visibility: data.visibility,
    parkingCount: data.parkingCount,
    walkAccess: data.walkAccess,
    carAccess: data.carAccess,
    deposit: data.depositMan * 10000,
    monthlyRent: data.monthlyRentMan * 10000,
    maintenanceFee: data.maintenanceFeeMan * 10000,
    premium: data.premiumMan * 10000,
    vatIncluded: false,
    imageUrl: '',
    memo: '',
    createdAt: new Date().toISOString(),
  }
}

function MiniStoreForm({ label, form }: { label: 'A' | 'B'; form: ReturnType<typeof useForm<MiniForm>> }) {
  const { register, formState: { errors }, watch, setValue } = form
  const isCorner = watch('isCorner')
  const accessOpts = [
    { value: 'excellent', label: '우수' },
    { value: 'good', label: '양호' },
    { value: 'average', label: '보통' },
    { value: 'poor', label: '불량' },
  ]
  const labelColor = label === 'A' ? 'bg-blue-600' : 'bg-emerald-600'

  return (
    <div className="bg-white border border-[#E0DED9] rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E0DED9] flex items-center gap-2.5">
        <div className={`w-6 h-6 ${labelColor} rounded-full flex items-center justify-center shrink-0`}>
          <span className="text-white text-xs font-black">{label}</span>
        </div>
        <h3 className="text-sm font-bold text-[#0A0A0A]">후보 {label}</h3>
      </div>
      <div className="p-5 space-y-3">
        <div>
          <label className="block text-[11px] font-bold text-[#555] tracking-wide uppercase mb-1.5">주소 <span className="text-red-500">*</span></label>
          <input {...register('address')} placeholder="예: 천안시 서북구 두정동 877" className={inputClass} />
          {errors.address && <p className="text-xs text-red-500 mt-0.5">{errors.address.message}</p>}
        </div>
        <div>
          <label className="block text-[11px] font-bold text-[#555] tracking-wide uppercase mb-1.5">희망 업종 <span className="text-red-500">*</span></label>
          <input {...register('desiredBusiness')} placeholder="주점, 카페, 음식점 등" className={inputClass} />
          {errors.desiredBusiness && <p className="text-xs text-red-500 mt-0.5">{errors.desiredBusiness.message}</p>}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[11px] font-bold text-[#555] tracking-wide uppercase mb-1.5">층수</label>
            <select {...register('floor')} className={selectClass}>
              <option value="basement">지하</option>
              <option value="1f">1층</option>
              <option value="2f">2층</option>
              <option value="3f">3층</option>
              <option value="4f_plus">4층+</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#555] tracking-wide uppercase mb-1.5">면적(평)</label>
            <input {...register('areaPyeong')} type="number" min="1" placeholder="45" className={inputClass} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#555] tracking-wide uppercase mb-1.5">전면폭(m)</label>
            <input {...register('frontageMeters')} type="number" step="0.5" placeholder="8" className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[11px] font-bold text-[#555] tracking-wide uppercase mb-1.5">가시성</label>
            <select {...register('visibility')} className={selectClass}>
              {accessOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#555] tracking-wide uppercase mb-1.5">주차(대)</label>
            <input {...register('parkingCount')} type="number" min="0" placeholder="3" className={inputClass} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#555] tracking-wide uppercase mb-1.5">코너여부</label>
            <button
              type="button"
              onClick={() => setValue('isCorner', !isCorner)}
              className={`w-full px-3 py-2 text-xs border rounded-lg font-medium transition-colors ${isCorner ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-300 text-slate-500'}`}
            >
              {isCorner ? '✓ 코너' : '코너 아님'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-bold text-[#555] tracking-wide uppercase mb-1.5">보증금(만원)</label>
            <input {...register('depositMan')} type="number" min="0" placeholder="5000" className={inputClass} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#555] tracking-wide uppercase mb-1.5">월세(만원)</label>
            <input {...register('monthlyRentMan')} type="number" min="0" placeholder="350" className={inputClass} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#555] tracking-wide uppercase mb-1.5">관리비(만원)</label>
            <input {...register('maintenanceFeeMan')} type="number" min="0" placeholder="0" className={inputClass} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#555] tracking-wide uppercase mb-1.5">권리금(만원)</label>
            <input {...register('premiumMan')} type="number" min="0" placeholder="0" className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#555] tracking-wide uppercase mb-1.5">도보 접근성</label>
          <select {...register('walkAccess')} className={selectClass}>
            {accessOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}

function CompareResultView({ result }: { result: ComparisonResult }) {
  const { storeA, storeB, comparisonItems, summary, recommendation, analysisA, analysisB } = result
  const gcA = gradeColor(analysisA.overallGrade)
  const gcB = gradeColor(analysisB.overallGrade)
  const addrA = storeA.address || storeA.name
  const addrB = storeB.address || storeB.name
  const aAdvCount = comparisonItems.filter(i => i.advantageFor === 'A').length
  const bAdvCount = comparisonItems.filter(i => i.advantageFor === 'B').length
  const winner = aAdvCount > bAdvCount ? 'A' : bAdvCount > aAdvCount ? 'B' : null

  return (
    <div className="space-y-5 mt-8">
      {/* AI Judgment — shown FIRST */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2.5">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-slate-800 text-sm">종합 판단</h3>
        </div>
        <div className="p-6 space-y-4">
          {/* Winner banner */}
          {winner ? (
            <div className={`rounded-xl p-4 border flex items-start gap-3 ${winner === 'A' ? 'bg-blue-50 border-blue-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <Trophy className={`w-5 h-5 mt-0.5 shrink-0 ${winner === 'A' ? 'text-blue-500' : 'text-emerald-500'}`} />
              <div>
                <p className={`text-sm font-bold mb-1 ${winner === 'A' ? 'text-blue-700' : 'text-emerald-700'}`}>
                  후보 {winner} 우위 ({Math.max(aAdvCount, bAdvCount)}/{comparisonItems.length}개 항목)
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">{recommendation}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl p-4 border bg-slate-50 border-slate-200 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-600 leading-relaxed">{recommendation}</p>
            </div>
          )}

          {/* Summary text */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">비교 요약</p>
            <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
          </div>

          {/* Advisory note */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
              이 비교는 입력된 데이터 기준입니다. 보수적인 매출을 예상한다면 고정비 부담이 낮은 후보의 고객동선과 가시성을 현장에서 추가 확인한 후 비교하는 것이 적절합니다.
            </p>
          </div>
        </div>
      </div>

      {/* Score comparison */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">종합 평가 비교</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              { store: storeA, analysis: analysisA, gc: gcA, label: 'A', addr: addrA, advCount: aAdvCount },
              { store: storeB, analysis: analysisB, gc: gcB, label: 'B', addr: addrB, advCount: bAdvCount },
            ].map(({ store, analysis, gc, label, addr, advCount }) => (
              <div key={store.id} className={`rounded-xl p-5 border ${gc.border} ${gc.bg}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-5 h-5 ${label === 'A' ? 'bg-blue-600' : 'bg-emerald-600'} rounded-full flex items-center justify-center`}>
                    <span className="text-white text-[10px] font-black">{label}</span>
                  </div>
                  <span className="font-semibold text-slate-800 text-xs truncate">{addr}</span>
                </div>
                <div className="flex items-end gap-2 mb-1">
                  <span className={`text-4xl font-black ${gc.text}`}>{analysis.overallGrade}</span>
                  <span className={`text-lg font-bold ${gc.text} opacity-70 mb-1`}>{analysis.overallScore}점</span>
                </div>
                <p className="text-xs text-slate-600">{FLOOR_LABELS[store.floor]} · {store.areaPyeong}평 · 월세 {formatMoney(store.monthlyRent)}</p>
                <p className="text-[10px] text-slate-400 mt-1">{advCount}개 항목 우위</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">항목별 상세 비교</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 w-28">항목</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-blue-600 w-32">
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-[8px] font-black">A</span>
                    </div>
                    후보 A
                  </div>
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-emerald-600 w-32">
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-4 h-4 bg-emerald-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-[8px] font-black">B</span>
                    </div>
                    후보 B
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">해석</th>
              </tr>
            </thead>
            <tbody>
              {comparisonItems.map((item, i) => {
                const advA = item.advantageFor === 'A'
                const advB = item.advantageFor === 'B'
                return (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 text-xs font-semibold text-slate-600">{item.category}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-bold ${advA ? 'text-blue-700' : 'text-slate-600'}`}>{item.labelA}</span>
                      {advA && <Trophy className="w-3 h-3 text-amber-400 inline ml-1" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-bold ${advB ? 'text-emerald-700' : 'text-slate-600'}`}>{item.labelB}</span>
                      {advB && <Trophy className="w-3 h-3 text-amber-400 inline ml-1" />}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 leading-relaxed">{item.interpretation}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/analysis" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors">
          새 분석하기
        </Link>
      </div>
    </div>
  )
}

export default function ComparePage() {
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [loading, setLoading] = useState(false)

  const formA = useForm<MiniForm>({
    resolver: zodResolver(miniSchema),
    defaultValues: { floor: '1f', visibility: 'excellent', walkAccess: 'good', carAccess: 'good', isCorner: false },
  })
  const formB = useForm<MiniForm>({
    resolver: zodResolver(miniSchema),
    defaultValues: { floor: '1f', visibility: 'average', walkAccess: 'good', carAccess: 'average', isCorner: false },
  })

  function fillTest() {
    formA.reset({
      address: '천안시 서북구 두정동 877',
      desiredBusiness: '주점',
      floor: '1f',
      areaPyeong: 45,
      frontageMeters: 8,
      isCorner: false,
      visibility: 'excellent',
      parkingCount: 5,
      walkAccess: 'good',
      carAccess: 'good',
      depositMan: 5000,
      monthlyRentMan: 350,
      maintenanceFeeMan: 0,
      premiumMan: 0,
    })
    formB.reset({
      address: '천안시 서북구 불당동 123',
      desiredBusiness: '주점',
      floor: '1f',
      areaPyeong: 38,
      frontageMeters: 6,
      isCorner: false,
      visibility: 'average',
      parkingCount: 2,
      walkAccess: 'good',
      carAccess: 'average',
      depositMan: 4000,
      monthlyRentMan: 270,
      maintenanceFeeMan: 0,
      premiumMan: 0,
    })
  }

  async function onCompare() {
    const validA = await formA.trigger()
    const validB = await formB.trigger()
    if (!validA || !validB) return

    setLoading(true)
    const storeA = formToStore(formA.getValues())
    const storeB = formToStore(formB.getValues())
    const analysisA = analyzeStore(storeA)
    const analysisB = analyzeStore(storeB)
    const comparison = compareStores(storeA, storeB, analysisA, analysisB)

    saveStore(storeA); saveStore(storeB)
    saveAnalysis(analysisA); saveAnalysis(analysisB)
    saveComparison(comparison)

    setResult(comparison)
    setLoading(false)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-10">
        <p className="text-[11px] font-black text-[#C24A2C] tracking-[0.2em] uppercase mb-3">후보지 비교 분석</p>
        <h1 className="text-[1.85rem] font-bold text-[#0A0A0A] leading-tight mb-3">
          어느 점포가 더 적합할까요?
        </h1>
        <p className="text-[#666] text-sm">두 후보 점포를 동일한 기준으로 비교합니다. 주소와 조건을 입력하세요.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <MiniStoreForm label="A" form={formA} />
        <MiniStoreForm label="B" form={formB} />
      </div>

      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={fillTest}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-300 bg-white hover:bg-slate-50 transition-colors"
        >
          테스트 데이터 채우기
        </button>
        <button
          onClick={onCompare}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#C24A2C] text-white text-sm font-semibold hover:bg-[#A83D23] transition-colors disabled:opacity-60"
        >
          {loading ? '분석 중…' : '비교 분석 시작'}
          {!loading && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {result && <CompareResultView result={result} />}
    </div>
  )
}
