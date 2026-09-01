'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { analyzeStore } from '@/lib/analysis/engine'
import { persistStore, persistAnalysis } from '@/lib/supabase/repository'
import { generateId } from '@/lib/utils'
import { Store, FloorType, Visibility, AccessLevel } from '@/types'
import { MapPin, Building2, Banknote, BarChart3, ChevronRight, Wrench } from 'lucide-react'

const inputClass = `w-full px-3 py-2 text-sm border border-[#E0DED9] rounded-lg bg-white text-[#0A0A0A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C24A2C]/30 focus:border-[#C24A2C] transition-colors`
const selectClass = `${inputClass} cursor-pointer`

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
        value ? 'bg-[#F4EBE7] border-[#C24A2C] text-[#C24A2C]' : 'bg-white border-[#E0DED9] text-slate-500'
      }`}
    >
      <span>{label}</span>
      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${value ? 'bg-[#F4EBE7] text-[#C24A2C]' : 'bg-slate-100 text-slate-500'}`}>
        {value ? '예' : '아니오'}
      </span>
    </button>
  )
}

function Card({ title, icon: Icon, iconColor, children }: { title: string; icon: React.ElementType; iconColor: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E0DED9] rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-[#E0DED9] flex items-center gap-3">
        <div className="w-[3px] h-5 rounded-full bg-[#C24A2C] shrink-0" />
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h3 className="text-sm font-bold text-[#0A0A0A]">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-[#555] tracking-wide uppercase mb-1.5">
        {label}{required && <span className="text-[#C24A2C] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const accessOpts = [
  { value: 'excellent', label: '우수' },
  { value: 'good', label: '양호' },
  { value: 'average', label: '보통' },
  { value: 'poor', label: '불량' },
]

export default function StoreNewPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Card 1: 기본정보
  const [address, setAddress] = useState('')
  const [desiredBusiness, setDesiredBusiness] = useState('')
  const [currentBusiness, setCurrentBusiness] = useState('')
  const [previousBusiness, setPreviousBusiness] = useState('')
  const [floor, setFloor] = useState<FloorType>('1f')
  const [areaPyeong, setAreaPyeong] = useState('')
  const [frontageMeters, setFrontageMeters] = useState('')
  const [isCorner, setIsCorner] = useState(false)
  const [dualExposure, setDualExposure] = useState(false)

  // Card 2: 임대조건
  const [depositMan, setDepositMan] = useState('')
  const [monthlyRentMan, setMonthlyRentMan] = useState('')
  const [maintenanceFeeMan, setMaintenanceFeeMan] = useState('')
  const [premiumMan, setPremiumMan] = useState('')
  const [vatIncluded, setVatIncluded] = useState(false)
  const [contractPeriod, setContractPeriod] = useState('')
  const [estimatedInteriorCostMan, setEstimatedInteriorCostMan] = useState('')
  const [expectedMonthlySalesMan, setExpectedMonthlySalesMan] = useState('')

  // Card 3: 현장조건
  const [visibility, setVisibility] = useState<Visibility>('average')
  const [parkingCount, setParkingCount] = useState('')
  const [pedestrianAccess, setPedestrianAccess] = useState<AccessLevel>('average')
  const [vehicleAccess, setVehicleAccess] = useState<AccessLevel>('average')
  const [publicTransportAccess, setPublicTransportAccess] = useState<AccessLevel>('average')
  const [elevator, setElevator] = useState(false)
  const [restroom, setRestroom] = useState(false)

  // Card 4: 시설·설비
  const [duct, setDuct] = useState(false)
  const [cityGas, setCityGas] = useState(false)
  const [electricCapacity, setElectricCapacity] = useState('')
  const [drainage, setDrainage] = useState(false)
  const [sewer, setSewer] = useState(false)
  const [fireSafety, setFireSafety] = useState(false)
  const [fieldMemo, setFieldMemo] = useState('')

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!address.trim()) errs.address = '주소를 입력하세요'
    if (!desiredBusiness.trim()) errs.desiredBusiness = '희망 업종을 입력하세요'
    if (!depositMan && !monthlyRentMan) errs.rent = '보증금 또는 월세 중 하나를 입력하세요'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
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

  return (
    <div className="max-w-4xl mx-auto px-4 pt-10 pb-12">
      <div className="mb-10">
        <p className="text-[11px] font-black text-[#C24A2C] tracking-[0.2em] uppercase mb-3">점포 입지 분석 시스템</p>
        <h1 className="text-[1.85rem] font-bold text-[#0A0A0A] leading-tight mb-3">점포 정보 입력</h1>
        <p className="text-[#666] text-sm leading-relaxed max-w-lg">분석할 점포의 정보를 입력하면 즉시 상권·입지 분석을 시작합니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1 */}
        <Card title="기본정보" icon={MapPin} iconColor="text-[#C24A2C]">
          <Field label="주소" required>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="예: 천안시 서북구 두정동 929"
              className={inputClass}
            />
            {errors.address && <p className="text-xs text-red-500 mt-0.5">{errors.address}</p>}
          </Field>
          <Field label="희망 업종" required>
            <input
              value={desiredBusiness}
              onChange={e => setDesiredBusiness(e.target.value)}
              placeholder="예: 무인 뽑기방, 주점, 카페"
              className={inputClass}
            />
            {errors.desiredBusiness && <p className="text-xs text-red-500 mt-0.5">{errors.desiredBusiness}</p>}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="현재 운영 업종">
              <input value={currentBusiness} onChange={e => setCurrentBusiness(e.target.value)} placeholder="공실이면 비워두세요" className={inputClass} />
            </Field>
            <Field label="이전 운영 업종">
              <input value={previousBusiness} onChange={e => setPreviousBusiness(e.target.value)} placeholder="이전 용도" className={inputClass} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="층수">
              <select value={floor} onChange={e => setFloor(e.target.value as FloorType)} className={selectClass}>
                <option value="basement">지하</option>
                <option value="1f">1층</option>
                <option value="2f">2층</option>
                <option value="3f">3층</option>
                <option value="4f_plus">4층+</option>
              </select>
            </Field>
            <Field label="면적(평)">
              <input type="number" min="1" value={areaPyeong} onChange={e => setAreaPyeong(e.target.value)} placeholder="30" className={inputClass} />
            </Field>
            <Field label="전면폭(m)">
              <input type="number" step="0.5" min="0" value={frontageMeters} onChange={e => setFrontageMeters(e.target.value)} placeholder="5" className={inputClass} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="코너 여부">
              <Toggle label="코너 점포" value={isCorner} onChange={setIsCorner} />
            </Field>
            <Field label="양면노출">
              <Toggle label="양면 노출" value={dualExposure} onChange={setDualExposure} />
            </Field>
          </div>
        </Card>

        {/* Card 2 */}
        <Card title="임대조건" icon={Banknote} iconColor="text-emerald-500">
          <div className="grid grid-cols-2 gap-3">
            <Field label="보증금(만원)">
              <input type="number" min="0" value={depositMan} onChange={e => setDepositMan(e.target.value)} placeholder="5000" className={inputClass} />
            </Field>
            <Field label="월세(만원)">
              <input type="number" min="0" value={monthlyRentMan} onChange={e => setMonthlyRentMan(e.target.value)} placeholder="250" className={inputClass} />
            </Field>
            <Field label="관리비(만원)">
              <input type="number" min="0" value={maintenanceFeeMan} onChange={e => setMaintenanceFeeMan(e.target.value)} placeholder="0" className={inputClass} />
            </Field>
            <Field label="권리금(만원)">
              <input type="number" min="0" value={premiumMan} onChange={e => setPremiumMan(e.target.value)} placeholder="0" className={inputClass} />
            </Field>
          </div>
          {errors.rent && <p className="text-xs text-red-500">{errors.rent}</p>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="VAT 포함 여부">
              <Toggle label="VAT 포함" value={vatIncluded} onChange={setVatIncluded} />
            </Field>
            <Field label="계약기간">
              <input value={contractPeriod} onChange={e => setContractPeriod(e.target.value)} placeholder="2년" className={inputClass} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="예상 인테리어(만원)">
              <input type="number" min="0" value={estimatedInteriorCostMan} onChange={e => setEstimatedInteriorCostMan(e.target.value)} placeholder="3000" className={inputClass} />
            </Field>
            <Field label="예상 월매출(만원)">
              <input type="number" min="0" value={expectedMonthlySalesMan} onChange={e => setExpectedMonthlySalesMan(e.target.value)} placeholder="1500" className={inputClass} />
            </Field>
          </div>
        </Card>

        {/* Card 3 */}
        <Card title="현장조건" icon={Building2} iconColor="text-violet-500">
          <div className="grid grid-cols-2 gap-3">
            <Field label="가시성">
              <select value={visibility} onChange={e => setVisibility(e.target.value as Visibility)} className={selectClass}>
                {accessOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="주차(대)">
              <input type="number" min="0" value={parkingCount} onChange={e => setParkingCount(e.target.value)} placeholder="0" className={inputClass} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="도보 접근성">
              <select value={pedestrianAccess} onChange={e => setPedestrianAccess(e.target.value as AccessLevel)} className={selectClass}>
                {accessOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="차량 접근성">
              <select value={vehicleAccess} onChange={e => setVehicleAccess(e.target.value as AccessLevel)} className={selectClass}>
                {accessOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="대중교통">
              <select value={publicTransportAccess} onChange={e => setPublicTransportAccess(e.target.value as AccessLevel)} className={selectClass}>
                {accessOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="엘리베이터">
              <Toggle label="엘리베이터 있음" value={elevator} onChange={setElevator} />
            </Field>
            <Field label="전용 화장실">
              <Toggle label="전용 화장실 있음" value={restroom} onChange={setRestroom} />
            </Field>
          </div>
        </Card>

        {/* Card 4 */}
        <Card title="시설·설비" icon={Wrench} iconColor="text-amber-500">
          <div className="grid grid-cols-2 gap-3">
            <Field label="닥트(환기)">
              <Toggle label="설치 가능" value={duct} onChange={setDuct} />
            </Field>
            <Field label="도시가스">
              <Toggle label="도시가스 인입" value={cityGas} onChange={setCityGas} />
            </Field>
            <Field label="배수 양호">
              <Toggle label="배수 이상 없음" value={drainage} onChange={setDrainage} />
            </Field>
            <Field label="하수 역류 없음">
              <Toggle label="역류 이력 없음" value={sewer} onChange={setSewer} />
            </Field>
            <Field label="소방 적합">
              <Toggle label="소방 기준 충족" value={fireSafety} onChange={setFireSafety} />
            </Field>
            <Field label="전기 용량">
              <input value={electricCapacity} onChange={e => setElectricCapacity(e.target.value)} placeholder="예: 3kW, 10kW" className={inputClass} />
            </Field>
          </div>
          <Field label="현장 메모">
            <textarea
              value={fieldMemo}
              onChange={e => setFieldMemo(e.target.value)}
              rows={3}
              placeholder="현장 방문 시 특이사항, 추가 확인 필요 사항 등"
              className={`${inputClass} resize-none`}
            />
          </Field>
        </Card>
      </div>

      {/* Submit */}
      <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-[#E0DED9]">
        <p className="text-xs text-[#999] leading-relaxed max-w-xs">
          <span className="text-[#C24A2C] font-bold">*</span> 표시 항목은 필수입니다. 나머지는 선택 사항이며 입력할수록 분석 정확도가 높아집니다.
        </p>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-[#C24A2C] text-white text-sm font-bold hover:bg-[#A83D23] transition-colors disabled:opacity-60 shadow-sm shrink-0"
        >
          {submitting ? '분석 중…' : '상권·입지 분석 시작'}
          {!submitting && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
