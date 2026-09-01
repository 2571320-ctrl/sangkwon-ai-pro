'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { analyzeStore } from '@/lib/analysis/engine'
import { persistStore, persistAnalysis } from '@/lib/supabase/repository'
import { generateId } from '@/lib/utils'
import { Store, FloorType, Visibility, AccessLevel } from '@/types'
import { ChevronRight, ChevronLeft } from 'lucide-react'

// ─── Styles ───────────────────────────────────────────────────────
const inputCls = `w-full px-4 py-3 text-sm border border-[#E0DED9] rounded-xl bg-white text-[#0A0A0A] placeholder-[#bbb]
  focus:outline-none focus:ring-2 focus:ring-[#C24A2C]/25 focus:border-[#C24A2C] transition-colors`
const selectCls = `${inputCls} cursor-pointer`

const ACCESS_OPTS = [
  { value: 'excellent', label: '우수' },
  { value: 'good', label: '양호' },
  { value: 'average', label: '보통' },
  { value: 'poor', label: '불량' },
]

const BIZ_PILLS = ['카페', '음식점', '주점', '편의점', '치킨', '미용실', '무인매장', '의류', '헬스장', '학원', '약국', '부동산']

// ─── Sub-components ───────────────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[11px] font-black text-[#888] tracking-[0.15em] uppercase mb-2">
      {children}{required && <span className="text-[#C24A2C] ml-0.5"> *</span>}
    </label>
  )
}

function ToggleChip({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
        value
          ? 'bg-[#F4EBE7] border-[#C24A2C] text-[#C24A2C]'
          : 'bg-white border-[#E0DED9] text-[#555] hover:border-[#C24A2C]/40'
      }`}
    >
      <span>{label}</span>
      <span className={`text-xs px-2 py-0.5 rounded-full ${value ? 'bg-[#C24A2C] text-white' : 'bg-[#E0DED9] text-[#888]'}`}>
        {value ? '예' : '아니오'}
      </span>
    </button>
  )
}

function AccessSelect({ value, onChange }: { value: AccessLevel; onChange: (v: AccessLevel) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value as AccessLevel)} className={selectCls}>
      {ACCESS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

// ─── Main Page ────────────────────────────────────────────────────
export default function StoreNewPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Step 1 — 기본정보
  const [address, setAddress] = useState('')
  const [desiredBusiness, setDesiredBusiness] = useState('')
  const [currentBusiness, setCurrentBusiness] = useState('')
  const [previousBusiness, setPreviousBusiness] = useState('')
  const [floor, setFloor] = useState<FloorType>('1f')
  const [areaPyeong, setAreaPyeong] = useState('')
  const [frontageMeters, setFrontageMeters] = useState('')
  const [isCorner, setIsCorner] = useState(false)
  const [dualExposure, setDualExposure] = useState(false)

  // Step 2 — 임대조건
  const [depositMan, setDepositMan] = useState('')
  const [monthlyRentMan, setMonthlyRentMan] = useState('')
  const [maintenanceFeeMan, setMaintenanceFeeMan] = useState('')
  const [premiumMan, setPremiumMan] = useState('')
  const [vatIncluded, setVatIncluded] = useState(false)
  const [contractPeriod, setContractPeriod] = useState('')
  const [estimatedInteriorCostMan, setEstimatedInteriorCostMan] = useState('')
  const [expectedMonthlySalesMan, setExpectedMonthlySalesMan] = useState('')

  // Step 3 — 현장·시설
  const [visibility, setVisibility] = useState<Visibility>('average')
  const [parkingCount, setParkingCount] = useState('')
  const [pedestrianAccess, setPedestrianAccess] = useState<AccessLevel>('average')
  const [vehicleAccess, setVehicleAccess] = useState<AccessLevel>('average')
  const [publicTransportAccess, setPublicTransportAccess] = useState<AccessLevel>('average')
  const [elevator, setElevator] = useState(false)
  const [restroom, setRestroom] = useState(false)
  const [duct, setDuct] = useState(false)
  const [cityGas, setCityGas] = useState(false)
  const [electricCapacity, setElectricCapacity] = useState('')
  const [drainage, setDrainage] = useState(false)
  const [sewer, setSewer] = useState(false)
  const [fireSafety, setFireSafety] = useState(false)
  const [fieldMemo, setFieldMemo] = useState('')

  // ─── Navigation ───────────────────────────────────────────────
  function goNext() {
    const errs: Record<string, string> = {}
    if (step === 0) {
      if (!address.trim()) errs.address = '주소를 입력해주세요'
      if (!desiredBusiness.trim()) errs.desiredBusiness = '희망 업종을 선택하거나 입력해주세요'
    }
    if (step === 1) {
      if (!depositMan && !monthlyRentMan) errs.rent = '보증금 또는 월세 중 하나는 입력해주세요'
    }
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setStep(s => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    setSubmitting(true)
    const store: Store = {
      id: generateId(),
      name: address.trim(),
      address: address.trim(),
      desiredBusiness: desiredBusiness.trim(),
      currentBusiness: currentBusiness.trim(),
      previousBusiness: previousBusiness.trim(),
      floor,
      areaPyeong: Number(areaPyeong) || 30,
      areaSqm: areaPyeong ? Math.round(Number(areaPyeong) * 3.305785) : undefined,
      frontageMeters: Number(frontageMeters) || 5,
      isCorner,
      dualExposure,
      visibility,
      parkingCount: Number(parkingCount) || 0,
      walkAccess: pedestrianAccess,
      carAccess: vehicleAccess,
      pedestrianAccess,
      vehicleAccess,
      publicTransportAccess,
      elevator,
      restroom,
      duct,
      cityGas,
      electricCapacity: electricCapacity.trim() || undefined,
      drainage,
      sewer,
      fireSafety,
      deposit: (Number(depositMan) || 0) * 10_000,
      monthlyRent: (Number(monthlyRentMan) || 0) * 10_000,
      maintenanceFee: (Number(maintenanceFeeMan) || 0) * 10_000,
      premium: (Number(premiumMan) || 0) * 10_000,
      vatIncluded,
      estimatedInteriorCost: (Number(estimatedInteriorCostMan) || 0) * 10_000,
      expectedMonthlySales: (Number(expectedMonthlySalesMan) || 0) * 10_000,
      contractPeriod: contractPeriod.trim() || undefined,
      imageUrl: '',
      memo: '',
      fieldMemo: fieldMemo.trim() || undefined,
      createdAt: new Date().toISOString(),
    }
    const analysis = analyzeStore(store)
    await persistStore(store)
    await persistAnalysis(analysis)
    router.push(`/analysis/${analysis.id}`)
  }

  // ─── Step meta ────────────────────────────────────────────────
  const STEPS = [
    { label: '기본 정보', sub: '위치 · 업종' },
    { label: '임대 조건', sub: '보증금 · 월세' },
    { label: '현장 조건', sub: '시설 · 접근성' },
  ]

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="min-h-full px-4 pt-10 pb-20">
      <div className="max-w-[560px] mx-auto">

        {/* ── Step indicator ── */}
        <div className="mb-12">
          <div className="flex items-center gap-0 mb-3">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black transition-all shrink-0 ${
                  i < step ? 'bg-[#C24A2C] text-white' :
                  i === step ? 'bg-[#0A0A0A] text-white' :
                  'bg-[#E0DED9] text-[#999]'
                }`}>
                  {i < step ? '✓' : String(i + 1).padStart(2, '0')}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-[2px] mx-1 rounded-full transition-all ${i < step ? 'bg-[#C24A2C]' : 'bg-[#E0DED9]'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            {STEPS.map((s, i) => (
              <div key={i} className={`text-center transition-all ${i === step ? 'opacity-100' : 'opacity-40'}`}
                style={{ width: i < STEPS.length - 1 ? undefined : undefined }}>
                <p className={`text-xs font-bold ${i === step ? 'text-[#0A0A0A]' : 'text-[#999]'}`}>{s.label}</p>
                <p className="text-[10px] text-[#bbb]">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Step 01: 기본 정보 ── */}
        {step === 0 && (
          <div className="space-y-8">
            <div>
              <p className="text-[11px] font-black text-[#C24A2C] tracking-[0.2em] uppercase mb-3">01 / 03</p>
              <h2 className="text-[1.7rem] font-bold text-[#0A0A0A] leading-tight mb-2">어디에 있는 점포인가요?</h2>
              <p className="text-[#888] text-sm">주소와 하려는 업종만 알면 바로 분석을 시작할 수 있어요.</p>
            </div>

            {/* 주소 */}
            <div>
              <Label required>점포 주소</Label>
              <input
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="예: 천안시 서북구 두정동 929"
                className={`${inputCls} text-base`}
                autoFocus
              />
              {errors.address && <p className="text-xs text-red-500 mt-1.5">{errors.address}</p>}
            </div>

            {/* 희망 업종 */}
            <div>
              <Label required>희망 업종</Label>
              <input
                value={desiredBusiness}
                onChange={e => setDesiredBusiness(e.target.value)}
                placeholder="예: 카페, 주점, 무인매장"
                className={`${inputCls} text-base mb-3`}
              />
              {errors.desiredBusiness && <p className="text-xs text-red-500 mb-2">{errors.desiredBusiness}</p>}
              <div className="flex flex-wrap gap-2">
                {BIZ_PILLS.map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setDesiredBusiness(b)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      desiredBusiness === b
                        ? 'bg-[#C24A2C] border-[#C24A2C] text-white'
                        : 'bg-white border-[#E0DED9] text-[#555] hover:border-[#C24A2C]/50 hover:text-[#C24A2C]'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* 현재·이전 업종 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>현재 운영 업종</Label>
                <input value={currentBusiness} onChange={e => setCurrentBusiness(e.target.value)} placeholder="공실이면 비워두세요" className={inputCls} />
              </div>
              <div>
                <Label>이전 운영 업종</Label>
                <input value={previousBusiness} onChange={e => setPreviousBusiness(e.target.value)} placeholder="이전 용도" className={inputCls} />
              </div>
            </div>

            {/* 층수·면적·전면 */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>층수</Label>
                <select value={floor} onChange={e => setFloor(e.target.value as FloorType)} className={selectCls}>
                  <option value="basement">지하</option>
                  <option value="1f">1층</option>
                  <option value="2f">2층</option>
                  <option value="3f">3층</option>
                  <option value="4f_plus">4층+</option>
                </select>
              </div>
              <div>
                <Label>면적 (평)</Label>
                <input type="number" min="1" value={areaPyeong} onChange={e => setAreaPyeong(e.target.value)} placeholder="30" className={inputCls} />
              </div>
              <div>
                <Label>전면폭 (m)</Label>
                <input type="number" step="0.5" min="0" value={frontageMeters} onChange={e => setFrontageMeters(e.target.value)} placeholder="5" className={inputCls} />
              </div>
            </div>

            {/* 코너·양면 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>코너 여부</Label>
                <ToggleChip label="코너 점포" value={isCorner} onChange={setIsCorner} />
              </div>
              <div>
                <Label>양면 노출</Label>
                <ToggleChip label="양면 노출" value={dualExposure} onChange={setDualExposure} />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 02: 임대 조건 ── */}
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <p className="text-[11px] font-black text-[#C24A2C] tracking-[0.2em] uppercase mb-3">02 / 03</p>
              <h2 className="text-[1.7rem] font-bold text-[#0A0A0A] leading-tight mb-2">임대 조건을 알려주세요</h2>
              <p className="text-[#888] text-sm">보증금·월세 정보로 임대료 적정성을 판단합니다.</p>
            </div>

            {/* 핵심 임대료 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>보증금</Label>
                <div className="relative">
                  <input type="number" min="0" value={depositMan} onChange={e => setDepositMan(e.target.value)} placeholder="5000" className={`${inputCls} pr-10`} />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#bbb] font-semibold">만원</span>
                </div>
              </div>
              <div>
                <Label required>월세</Label>
                <div className="relative">
                  <input type="number" min="0" value={monthlyRentMan} onChange={e => setMonthlyRentMan(e.target.value)} placeholder="250" className={`${inputCls} pr-10`} />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#bbb] font-semibold">만원</span>
                </div>
              </div>
            </div>
            {errors.rent && <p className="text-xs text-red-500 -mt-4">{errors.rent}</p>}

            {/* 추가 비용 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>관리비</Label>
                <div className="relative">
                  <input type="number" min="0" value={maintenanceFeeMan} onChange={e => setMaintenanceFeeMan(e.target.value)} placeholder="0" className={`${inputCls} pr-10`} />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#bbb] font-semibold">만원</span>
                </div>
              </div>
              <div>
                <Label>권리금</Label>
                <div className="relative">
                  <input type="number" min="0" value={premiumMan} onChange={e => setPremiumMan(e.target.value)} placeholder="0" className={`${inputCls} pr-10`} />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#bbb] font-semibold">만원</span>
                </div>
              </div>
            </div>

            {/* VAT·계약기간 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>VAT 포함 여부</Label>
                <ToggleChip label="VAT 포함 금액" value={vatIncluded} onChange={setVatIncluded} />
              </div>
              <div>
                <Label>계약 기간</Label>
                <input value={contractPeriod} onChange={e => setContractPeriod(e.target.value)} placeholder="2년" className={inputCls} />
              </div>
            </div>

            {/* 예상 비용 */}
            <div>
              <p className="text-[11px] font-black text-[#bbb] tracking-[0.15em] uppercase mb-4">예상 비용 (선택)</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>예상 인테리어</Label>
                  <div className="relative">
                    <input type="number" min="0" value={estimatedInteriorCostMan} onChange={e => setEstimatedInteriorCostMan(e.target.value)} placeholder="3000" className={`${inputCls} pr-10`} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#bbb] font-semibold">만원</span>
                  </div>
                </div>
                <div>
                  <Label>예상 월매출</Label>
                  <div className="relative">
                    <input type="number" min="0" value={expectedMonthlySalesMan} onChange={e => setExpectedMonthlySalesMan(e.target.value)} placeholder="1500" className={`${inputCls} pr-10`} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#bbb] font-semibold">만원</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 03: 현장 조건 ── */}
        {step === 2 && (
          <div className="space-y-8">
            <div>
              <p className="text-[11px] font-black text-[#C24A2C] tracking-[0.2em] uppercase mb-3">03 / 03</p>
              <h2 className="text-[1.7rem] font-bold text-[#0A0A0A] leading-tight mb-2">현장 상태를 알려주세요</h2>
              <p className="text-[#888] text-sm">선택 사항이지만 입력할수록 분석이 정확해져요.</p>
            </div>

            {/* 접근성 */}
            <div>
              <p className="text-[11px] font-black text-[#bbb] tracking-[0.15em] uppercase mb-4">접근성 · 가시성</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>가시성</Label>
                  <select value={visibility} onChange={e => setVisibility(e.target.value as Visibility)} className={selectCls}>
                    {ACCESS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label>주차 가능 대수</Label>
                  <div className="relative">
                    <input type="number" min="0" value={parkingCount} onChange={e => setParkingCount(e.target.value)} placeholder="0" className={`${inputCls} pr-8`} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#bbb] font-semibold">대</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div>
                  <Label>도보 접근</Label>
                  <AccessSelect value={pedestrianAccess} onChange={setPedestrianAccess} />
                </div>
                <div>
                  <Label>차량 접근</Label>
                  <AccessSelect value={vehicleAccess} onChange={setVehicleAccess} />
                </div>
                <div>
                  <Label>대중교통</Label>
                  <AccessSelect value={publicTransportAccess} onChange={setPublicTransportAccess} />
                </div>
              </div>
            </div>

            {/* 편의시설 */}
            <div>
              <p className="text-[11px] font-black text-[#bbb] tracking-[0.15em] uppercase mb-4">편의시설</p>
              <div className="grid grid-cols-2 gap-3">
                <ToggleChip label="엘리베이터" value={elevator} onChange={setElevator} />
                <ToggleChip label="전용 화장실" value={restroom} onChange={setRestroom} />
              </div>
            </div>

            {/* 설비 */}
            <div>
              <p className="text-[11px] font-black text-[#bbb] tracking-[0.15em] uppercase mb-4">시설 · 설비</p>
              <div className="grid grid-cols-2 gap-3">
                <ToggleChip label="닥트 (환기)" value={duct} onChange={setDuct} />
                <ToggleChip label="도시가스 인입" value={cityGas} onChange={setCityGas} />
                <ToggleChip label="배수 이상 없음" value={drainage} onChange={setDrainage} />
                <ToggleChip label="하수 역류 없음" value={sewer} onChange={setSewer} />
                <ToggleChip label="소방 기준 충족" value={fireSafety} onChange={setFireSafety} />
                <div>
                  <input value={electricCapacity} onChange={e => setElectricCapacity(e.target.value)} placeholder="전기 용량 (예: 10kW)" className={inputCls} />
                </div>
              </div>
            </div>

            {/* 메모 */}
            <div>
              <Label>현장 메모 (선택)</Label>
              <textarea
                value={fieldMemo}
                onChange={e => setFieldMemo(e.target.value)}
                rows={3}
                placeholder="현장 방문 시 특이사항, 추가 확인 필요 사항 등"
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="mt-12 flex items-center justify-between gap-4">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => { setErrors({}); setStep(s => s - 1) }}
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl border border-[#E0DED9] bg-white text-sm font-semibold text-[#555] hover:border-[#C24A2C]/40 hover:text-[#C24A2C] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              이전
            </button>
          ) : (
            <div />
          )}

          {step < 2 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-[#0A0A0A] text-white text-sm font-bold hover:bg-[#222] transition-colors"
            >
              다음 단계
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-[#C24A2C] text-white text-sm font-bold hover:bg-[#A83D23] transition-colors disabled:opacity-60 shadow-sm"
            >
              {submitting ? '분석 중…' : '상권·입지 분석 시작'}
              {!submitting && <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Step hint */}
        <p className="text-center text-[11px] text-[#bbb] mt-6">
          {step === 0 && '주소와 업종만 입력하면 바로 분석할 수 있어요'}
          {step === 1 && '보증금 또는 월세 중 하나는 꼭 입력해주세요'}
          {step === 2 && '모두 선택 사항이에요 — 건너뛰어도 됩니다'}
        </p>
      </div>
    </div>
  )
}
