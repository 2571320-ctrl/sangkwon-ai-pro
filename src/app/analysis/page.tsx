'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { analyzeStore } from '@/lib/analysis/engine'
import { persistStore, persistAnalysis } from '@/lib/supabase/repository'
import { generateId } from '@/lib/utils'
import { Store, StoreFormValues, FloorType, Visibility, AccessLevel } from '@/types'
import { ChevronRight, Zap, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const schema = z.object({
  name: z.string().min(1, '점포명을 입력하세요'),
  address: z.string().min(1, '주소를 입력하세요'),
  desiredBusiness: z.string().min(1, '희망 업종을 입력하세요'),
  currentBusiness: z.string().default(''),
  previousBusiness: z.string().default(''),
  floor: z.enum(['basement', '1f', '2f', '3f', '4f_plus']).default('1f'),
  areaPyeong: z.coerce.number({ invalid_type_error: '숫자를 입력하세요' }).min(1, '면적을 입력하세요'),
  frontageMeters: z.coerce.number({ invalid_type_error: '숫자를 입력하세요' }).min(0.1, '전면폭을 입력하세요'),
  isCorner: z.boolean().default(false),
  visibility: z.enum(['excellent', 'good', 'average', 'poor']).default('average'),
  parkingCount: z.coerce.number().min(0).default(0),
  walkAccess: z.enum(['excellent', 'good', 'average', 'poor']).default('average'),
  carAccess: z.enum(['excellent', 'good', 'average', 'poor']).default('average'),
  depositMan: z.coerce.number().min(0).default(0),
  monthlyRentMan: z.coerce.number().min(0).default(0),
  maintenanceFeeMan: z.coerce.number().min(0).default(0),
  premiumMan: z.coerce.number().min(0).default(0),
  vatIncluded: z.boolean().default(false),
  imageUrl: z.string().default(''),
  memo: z.string().default(''),
})

const TEST_DEFAULTS: StoreFormValues = {
  name: '두정동 877 테스트점포',
  address: '천안시 서북구 두정동 877',
  desiredBusiness: '주점',
  currentBusiness: '음식점',
  previousBusiness: '',
  floor: '1f',
  areaPyeong: 45,
  frontageMeters: 8,
  isCorner: false,
  visibility: 'excellent',
  parkingCount: 3,
  walkAccess: 'good',
  carAccess: 'good',
  depositMan: 5000,
  monthlyRentMan: 350,
  maintenanceFeeMan: 0,
  premiumMan: 0,
  vatIncluded: false,
  imageUrl: '',
  memo: '',
}

const selectClass = `w-full px-3 py-2 text-sm border border-[#E0DED9] rounded-lg
  bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C24A2C]/30
  focus:border-[#C24A2C] transition-colors cursor-pointer`

const inputClass = `w-full px-3 py-2 text-sm border border-[#E0DED9] rounded-lg
  bg-white text-slate-900 placeholder-slate-400
  focus:outline-none focus:ring-2 focus:ring-[#C24A2C]/30 focus:border-[#C24A2C]
  transition-colors`

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E0DED9] rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E0DED9] flex items-center gap-3">
        <div className="w-[3px] h-5 rounded-full bg-[#C24A2C] shrink-0" />
        <h3 className="text-sm font-bold text-[#0A0A0A]">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function FieldWrapper({
  label,
  error,
  suffix,
  children,
}: {
  label: string
  error?: string
  suffix?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      {suffix ? (
        <div className="relative">
          {children}
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
            {suffix}
          </span>
        </div>
      ) : (
        children
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default function AnalysisPage() {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StoreFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      floor: '1f',
      visibility: 'average',
      walkAccess: 'average',
      carAccess: 'average',
      isCorner: false,
      vatIncluded: false,
    },
  })

  const isCorner = watch('isCorner')
  const vatIncluded = watch('vatIncluded')

  function fillTestData() {
    Object.entries(TEST_DEFAULTS).forEach(([key, value]) => {
      setValue(key as keyof StoreFormValues, value as never)
    })
  }

  async function onSubmit(data: StoreFormValues) {
    const store: Store = {
      id: generateId(),
      name: data.name,
      address: data.address,
      desiredBusiness: data.desiredBusiness,
      currentBusiness: data.currentBusiness,
      previousBusiness: data.previousBusiness,
      floor: data.floor as FloorType,
      areaPyeong: data.areaPyeong,
      frontageMeters: data.frontageMeters,
      isCorner: data.isCorner,
      visibility: data.visibility as Visibility,
      parkingCount: data.parkingCount,
      walkAccess: data.walkAccess as AccessLevel,
      carAccess: data.carAccess as AccessLevel,
      deposit: data.depositMan * 10000,
      monthlyRent: data.monthlyRentMan * 10000,
      maintenanceFee: data.maintenanceFeeMan * 10000,
      premium: data.premiumMan * 10000,
      vatIncluded: data.vatIncluded,
      imageUrl: data.imageUrl,
      memo: data.memo,
      createdAt: new Date().toISOString(),
    }

    const analysis = analyzeStore(store)

    await persistStore(store)
    await persistAnalysis(analysis)

    router.push(`/analysis/${analysis.id}`)
  }

  const accessOptions = [
    { value: 'excellent', label: '우수' },
    { value: 'good', label: '양호' },
    { value: 'average', label: '보통' },
    { value: 'poor', label: '불량' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Back */}
      <div className="mb-6">
        <Link href="/chat" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          채팅으로 돌아가기
        </Link>
      </div>

      {/* Header */}
      <div className="mb-10">
        <p className="text-[11px] font-black text-[#C24A2C] tracking-[0.2em] uppercase mb-3">점포 입지 분석</p>
        <h1 className="text-[1.85rem] font-bold text-[#0A0A0A] leading-tight mb-3">
          이 점포에서 이 업종, 괜찮을까요?
        </h1>
        <p className="text-[#666] text-sm leading-relaxed max-w-lg">
          검토 중인 점포와 희망 업종을 입력하면 상권데이터와 점포조건을 함께 분석합니다.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 기본정보 */}
        <SectionCard title="기본정보">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FieldWrapper label="점포명" error={errors.name?.message}>
                <input {...register('name')} placeholder="예: 두정동 877 테스트점포" className={inputClass} />
              </FieldWrapper>
            </div>
            <div className="col-span-2">
              <FieldWrapper label="주소" error={errors.address?.message}>
                <input {...register('address')} placeholder="예: 천안시 서북구 두정동 877" className={inputClass} />
              </FieldWrapper>
            </div>
            <FieldWrapper label="희망 업종" error={errors.desiredBusiness?.message}>
              <input {...register('desiredBusiness')} placeholder="예: 주점, 카페, 치킨" className={inputClass} />
            </FieldWrapper>
            <FieldWrapper label="현재 업종 (선택)">
              <input {...register('currentBusiness')} placeholder="현재 입점 업종" className={inputClass} />
            </FieldWrapper>
            <div className="col-span-2">
              <FieldWrapper label="이전 업종 (선택)">
                <input {...register('previousBusiness')} placeholder="이전 입점 업종" className={inputClass} />
              </FieldWrapper>
            </div>
          </div>
        </SectionCard>

        {/* 점포조건 */}
        <SectionCard title="점포조건">
          <div className="grid grid-cols-3 gap-4">
            <FieldWrapper label="층수">
              <select {...register('floor')} className={selectClass}>
                <option value="basement">지하</option>
                <option value="1f">1층</option>
                <option value="2f">2층</option>
                <option value="3f">3층</option>
                <option value="4f_plus">4층 이상</option>
              </select>
            </FieldWrapper>
            <FieldWrapper label="전용면적" suffix="평" error={errors.areaPyeong?.message}>
              <input
                {...register('areaPyeong')}
                type="number"
                min="1"
                placeholder="45"
                className={`${inputClass} pr-8`}
              />
            </FieldWrapper>
            <FieldWrapper label="전면폭" suffix="m" error={errors.frontageMeters?.message}>
              <input
                {...register('frontageMeters')}
                type="number"
                step="0.5"
                min="0"
                placeholder="8"
                className={`${inputClass} pr-8`}
              />
            </FieldWrapper>

            <FieldWrapper label="가시성">
              <select {...register('visibility')} className={selectClass}>
                {accessOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </FieldWrapper>
            <FieldWrapper label="주차 가능 대수" suffix="대">
              <input
                {...register('parkingCount')}
                type="number"
                min="0"
                placeholder="3"
                className={`${inputClass} pr-8`}
              />
            </FieldWrapper>
            <FieldWrapper label="코너 여부">
              <button
                type="button"
                onClick={() => setValue('isCorner', !isCorner)}
                className={`w-full px-3 py-2 text-sm border rounded-lg font-medium transition-colors ${
                  isCorner
                    ? 'bg-[#F4EBE7] border-[#C24A2C] text-[#C24A2C]'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {isCorner ? '✓ 코너 점포' : '코너 아님'}
              </button>
            </FieldWrapper>

            <FieldWrapper label="도보 접근성">
              <select {...register('walkAccess')} className={selectClass}>
                {accessOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </FieldWrapper>
            <FieldWrapper label="차량 접근성">
              <select {...register('carAccess')} className={selectClass}>
                {accessOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </FieldWrapper>
          </div>
        </SectionCard>

        {/* 임대조건 */}
        <SectionCard title="임대조건">
          <div className="grid grid-cols-2 gap-4">
            <FieldWrapper label="보증금" suffix="만원">
              <input
                {...register('depositMan')}
                type="number"
                min="0"
                placeholder="5000"
                className={`${inputClass} pr-10`}
              />
            </FieldWrapper>
            <FieldWrapper label="월세" suffix="만원">
              <input
                {...register('monthlyRentMan')}
                type="number"
                min="0"
                placeholder="350"
                className={`${inputClass} pr-10`}
              />
            </FieldWrapper>
            <FieldWrapper label="관리비 (선택)" suffix="만원">
              <input
                {...register('maintenanceFeeMan')}
                type="number"
                min="0"
                placeholder="0"
                className={`${inputClass} pr-10`}
              />
            </FieldWrapper>
            <FieldWrapper label="권리금 (선택)" suffix="만원">
              <input
                {...register('premiumMan')}
                type="number"
                min="0"
                placeholder="0"
                className={`${inputClass} pr-10`}
              />
            </FieldWrapper>
            <div className="col-span-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <button
                  type="button"
                  onClick={() => setValue('vatIncluded', !vatIncluded)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    vatIncluded ? 'bg-[#C24A2C] border-[#C24A2C]' : 'border-slate-300 bg-white'
                  }`}
                >
                  {vatIncluded && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className="text-sm text-slate-700">부가세 포함 금액</span>
              </label>
            </div>
          </div>
        </SectionCard>

        {/* 추가정보 */}
        <SectionCard title="추가정보">
          <div className="space-y-4">
            <FieldWrapper label="점포 이미지 URL (선택)">
              <input
                {...register('imageUrl')}
                type="url"
                placeholder="https://..."
                className={inputClass}
              />
            </FieldWrapper>
            <FieldWrapper label="현장 메모 (선택)">
              <textarea
                {...register('memo')}
                rows={3}
                placeholder="현장에서 확인한 특이사항, 주변 환경, 건물 상태 등을 자유롭게 기록하세요."
                className={`${inputClass} resize-none`}
              />
            </FieldWrapper>
          </div>
        </SectionCard>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={fillTestData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-300 bg-white hover:bg-slate-50 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            테스트 기본값 채우기
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#C24A2C] text-white text-sm font-semibold hover:bg-[#A83D23] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '분석 중…' : '상권분석 시작'}
            {!isSubmitting && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  )
}
