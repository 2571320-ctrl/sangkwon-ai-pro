/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * generateReport.ts — Browser-only PPT export
 * Imported via dynamic import from click handlers only.
 */

import type { AnalysisResult, Store } from '@/types'
import {
  FLOOR_LABELS, VISIBILITY_LABELS, ACCESS_LABELS,
  RECOMMENDATION_LABELS, BIZ_CATEGORY_LABELS,
} from '@/types'
import { formatMoney } from '@/lib/utils'

// ─── Color tokens (pptxgenjs: no '#' prefix) ──────────────────
const C = {
  navy:    '0B1120',
  navy2:   '1E293B',
  navy3:   '334155',
  white:   'FFFFFF',
  gBg:     'F8F9FB',
  gBd:     'CBD5E1',
  gTx:     '64748B',
  dark:    '0F172A',
  em:      '059669',   // emerald
  emBg:    'D1FAE5',
  am:      'B45309',   // amber
  amBg:    'FEF3C7',
  red:     'DC2626',
  redBg:   'FEE2E2',
  blue:    '1D4ED8',
  blueBg:  'DBEAFE',
}

// ─── Layout (LAYOUT_WIDE: 13.33" × 7.5") ─────────────────────
const W  = 13.33
const H  = 7.5
const HDR = 0.6
const FTR = 0.2
const FTRY = H - FTR
const CY  = HDR + 0.18
const CH  = FTRY - CY - 0.08
const PX  = 0.45
const CW  = W - PX * 2
const FF  = 'Malgun Gothic'

// ─── Helpers ──────────────────────────────────────────────────

function accLbl(v?: string) {
  return ACCESS_LABELS[(v as keyof typeof ACCESS_LABELS)] ?? '미입력'
}

function hdr(s: any, pptx: any, title: string) {
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: HDR, fill: { color: C.navy }, line: { color: C.navy } })
  s.addText(title, { x: PX, y: 0, w: 9.8, h: HDR, fontSize: 13, bold: true, color: C.white, valign: 'middle', fontFace: FF })
  s.addText('상권연구소 AI PRO', { x: 10.2, y: 0, w: 2.9, h: HDR, fontSize: 8, color: '94A3B8', align: 'right', valign: 'middle', fontFace: FF })
}

function ftr(s: any, pptx: any, label: string) {
  s.addShape(pptx.ShapeType.rect, { x: 0, y: FTRY, w: W, h: FTR, fill: { color: C.navy }, line: { color: C.navy } })
  s.addText(label, { x: PX, y: FTRY, w: CW, h: FTR, fontSize: 7, color: C.white, valign: 'middle', fontFace: FF })
}

// Section label inside a slide
function secLabel(s: any, y: number, text: string) {
  s.addText(text, { x: PX, y, w: CW, h: 0.24, fontSize: 9, bold: true, color: C.gTx, fontFace: FF })
  return y + 0.27
}

// Simple two-column label/value table
function dataTable(
  s: any,
  rows: { label: string; value: string; bold?: boolean }[],
  x: number, y: number, w: number, labelW = 3.0
) {
  const valW = w - labelW
  const tRows = rows.map((r, i) => [
    {
      text: r.label,
      options: { fontSize: 9.5, color: C.gTx, fontFace: FF, fill: { color: i % 2 === 0 ? C.white : C.gBg }, valign: 'middle' as const, margin: [0, 6, 0, 6] },
    },
    {
      text: r.value,
      options: { fontSize: 10, color: r.bold ? C.dark : C.navy2, bold: r.bold ?? false, fontFace: FF, fill: { color: i % 2 === 0 ? C.white : C.gBg }, valign: 'middle' as const, margin: [0, 6, 0, 6] },
    },
  ])
  s.addTable(tRows, { x, y, w, colW: [labelW, valW], rowH: 0.3, border: { type: 'solid', color: C.gBd, pt: 0.5 } })
  return y + rows.length * 0.3
}

// ─── SLIDE 1: Cover ───────────────────────────────────────────

function slideCover(pptx: any, analysis: AnalysisResult, store: Store, displayName: string) {
  const s = pptx.addSlide()

  // Full navy bg
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: C.navy }, line: { color: C.navy } })
  // Blue accent strip
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.04, fill: { color: '3B82F6' }, line: { color: '3B82F6' } })

  // Brand text
  s.addText('상권연구소 AI PRO  ·  STORE LOCATION ANALYSIS REPORT', {
    x: 0.8, y: 0.5, w: 11, h: 0.28, fontSize: 8.5, color: '60A5FA', bold: true, fontFace: FF,
  })

  // Main title
  s.addText('점포 · 입지 분석 리포트', {
    x: 0.8, y: 1.1, w: 9.5, h: 1.0, fontSize: 36, bold: true, color: C.white, fontFace: FF,
  })

  // Store info
  s.addText(displayName, { x: 0.8, y: 2.3, w: 9, h: 0.5, fontSize: 18, color: 'CBD5E1', fontFace: FF })
  s.addText(`${store.desiredBusiness}   ·   ${FLOOR_LABELS[store.floor]}   ·   ${store.areaPyeong}평`, {
    x: 0.8, y: 2.9, w: 9, h: 0.35, fontSize: 13, color: '94A3B8', fontFace: FF,
  })

  // Divider
  s.addShape(pptx.ShapeType.rect, { x: 0.8, y: 3.5, w: 2.5, h: 0.03, fill: { color: '3B82F6' }, line: { color: '3B82F6' } })

  s.addText(`분석일  ${new Date(analysis.createdAt).toLocaleDateString('ko-KR')}`, {
    x: 0.8, y: 3.7, w: 7, h: 0.32, fontSize: 11, color: '94A3B8', fontFace: FF,
  })
  s.addText(RECOMMENDATION_LABELS[analysis.recommendation], {
    x: 0.8, y: 4.1, w: 6, h: 0.4, fontSize: 14, bold: true, color: '60A5FA', fontFace: FF,
  })

  // Grade badge (right)
  s.addShape(pptx.ShapeType.rect, { x: 9.7, y: 1.6, w: 3.1, h: 3.0, fill: { color: C.navy2 }, line: { color: C.navy3, pt: 2 } })
  s.addText(analysis.overallGrade, { x: 9.7, y: 2.0, w: 3.1, h: 1.6, fontSize: 70, bold: true, color: C.white, align: 'center', fontFace: FF })
  s.addText(`${analysis.overallScore}점`, { x: 9.7, y: 3.6, w: 3.1, h: 0.45, fontSize: 16, color: '94A3B8', align: 'center', fontFace: FF })
  s.addText('종합 등급', { x: 9.7, y: 4.1, w: 3.1, h: 0.3, fontSize: 9, color: '64748B', align: 'center', fontFace: FF })

  s.addText(
    '본 리포트는 입력 데이터 기반 분석 참고자료입니다. 최종 계약 결정 전 현장 방문 및 전문가 검토를 권장합니다.',
    { x: 0.8, y: 6.85, w: 11.7, h: 0.35, fontSize: 8, color: '475569', fontFace: FF, wrap: true }
  )
}

// ─── SLIDE 2: Executive Summary ───────────────────────────────

function slideExecSummary(pptx: any, analysis: AnalysisResult, store: Store, displayName: string, num: string) {
  const s = pptx.addSlide()
  hdr(s, pptx, `${num}  Executive Summary — 핵심 요약`)
  ftr(s, pptx, `${displayName}  ·  ${store.desiredBusiness}  ·  Slide ${num}`)

  let cy = CY

  // Summary box
  s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW, h: 0.85, fill: { color: C.gBg }, line: { color: C.gBd, pt: 1 } })
  s.addText([
    { text: `[${RECOMMENDATION_LABELS[analysis.recommendation]}]  `, options: { bold: true, color: C.navy, fontSize: 10.5 } },
    { text: analysis.summary, options: { color: C.navy2, fontSize: 10 } },
  ], { x: PX + 0.15, y: cy + 0.08, w: CW - 0.3, h: 0.7, fontFace: FF, wrap: true, valign: 'top', lineSpacingMultiple: 1.35 })
  cy += 1.0

  const colW = (CW - 0.25) / 2

  // Strengths column
  s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: colW, h: 0.28, fill: { color: C.emBg }, line: { color: C.gBd, pt: 0.5 } })
  s.addText('● 핵심 강점', { x: PX + 0.1, y: cy, w: colW, h: 0.28, fontSize: 9.5, bold: true, color: C.em, valign: 'middle', fontFace: FF })

  // Risks column
  s.addShape(pptx.ShapeType.rect, { x: PX + colW + 0.25, y: cy, w: colW, h: 0.28, fill: { color: C.amBg }, line: { color: C.gBd, pt: 0.5 } })
  s.addText('● 핵심 위험', { x: PX + colW + 0.35, y: cy, w: colW, h: 0.28, fontSize: 9.5, bold: true, color: C.am, valign: 'middle', fontFace: FF })
  cy += 0.28

  const maxItems = Math.max(analysis.strengths.length, analysis.risks.length, 1)
  const itemH = Math.min(0.72, (CH - 1.5) / maxItems)

  analysis.strengths.slice(0, 5).forEach((item, i) => {
    s.addShape(pptx.ShapeType.rect, { x: PX, y: cy + i * itemH, w: colW, h: itemH - 0.02, fill: { color: i % 2 === 0 ? C.white : C.gBg }, line: { color: C.gBd, pt: 0.5 } })
    s.addText([
      { text: item.title + '\n', options: { bold: true, fontSize: 9.5, color: C.dark } },
      { text: item.interpretation.slice(0, 90), options: { fontSize: 8.5, color: C.gTx } },
    ], { x: PX + 0.1, y: cy + i * itemH + 0.04, w: colW - 0.2, h: itemH - 0.08, fontFace: FF, wrap: true, valign: 'top' })
  })

  analysis.risks.slice(0, 5).forEach((item, i) => {
    s.addShape(pptx.ShapeType.rect, { x: PX + colW + 0.25, y: cy + i * itemH, w: colW, h: itemH - 0.02, fill: { color: i % 2 === 0 ? C.white : C.gBg }, line: { color: C.gBd, pt: 0.5 } })
    s.addText([
      { text: item.title + '\n', options: { bold: true, fontSize: 9.5, color: C.dark } },
      { text: item.interpretation.slice(0, 90), options: { fontSize: 8.5, color: C.gTx } },
    ], { x: PX + colW + 0.35, y: cy + i * itemH + 0.04, w: colW - 0.2, h: itemH - 0.08, fontFace: FF, wrap: true, valign: 'top' })
  })

  cy += maxItems * itemH + 0.12

  // Must-check bar
  if (analysis.bizAnalysis?.mustCheckFactors?.length) {
    s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW, h: 0.28, fill: { color: '1E3A5F' }, line: { color: '1E3A5F' } })
    s.addText('계약 전 핵심 확인사항', { x: PX + 0.1, y: cy, w: 3, h: 0.28, fontSize: 9, bold: true, color: C.white, valign: 'middle', fontFace: FF })
    const chips = analysis.bizAnalysis.mustCheckFactors.slice(0, 5).map(f => f.split('—')[0].trim()).join('   /   ')
    s.addText(chips, { x: PX + 3.3, y: cy, w: CW - 3.5, h: 0.28, fontSize: 9, color: '93C5FD', valign: 'middle', fontFace: FF })
  }
}

// ─── SLIDE 3: 점포 기본조건 ───────────────────────────────────

function slideStoreBasics(pptx: any, analysis: AnalysisResult, store: Store, displayName: string, num: string) {
  const s = pptx.addSlide()
  hdr(s, pptx, `${num}  점포 기본조건`)
  ftr(s, pptx, `${displayName}  ·  ${store.desiredBusiness}  ·  Slide ${num}`)

  let cy = CY
  const totalMonthly = store.monthlyRent + store.maintenanceFee

  // Left column (basic + physical)
  const LW = 5.9
  cy = secLabel(s, cy, '기본 정보')
  dataTable(s, [
    { label: '주소 / 지역명', value: displayName, bold: true },
    { label: '희망 업종', value: store.desiredBusiness, bold: true },
    { label: '업종 분류', value: analysis.bizAnalysis ? BIZ_CATEGORY_LABELS[analysis.bizAnalysis.category] : '기타' },
    { label: '현재 운영 업종', value: store.currentBusiness || '미입력' },
    { label: '이전 운영 업종', value: store.previousBusiness || '미입력' },
    { label: '계약 기간', value: store.contractPeriod || '미입력' },
  ], PX, cy, LW, 2.3)
  cy += 6 * 0.3 + 0.25

  cy = secLabel(s, cy, '물리적 조건')
  dataTable(s, [
    { label: '층수', value: FLOOR_LABELS[store.floor] },
    { label: '면적', value: `${store.areaPyeong}평${store.areaSqm ? ` (${store.areaSqm}㎡)` : ''}` },
    { label: '전면폭', value: `${store.frontageMeters}m` },
    { label: '코너 점포', value: store.isCorner ? '해당' : '해당 없음' },
    { label: '주차', value: store.parkingCount > 0 ? `${store.parkingCount}대` : '없음 또는 미입력' },
  ], PX, cy, LW, 2.3)

  // Right column (rent + facilities)
  const RX = PX + LW + 0.25
  const RW = CW - LW - 0.25
  let rcy = CY

  rcy = secLabel(s, rcy, '임대 조건')
  dataTable(s, [
    { label: '보증금', value: formatMoney(store.deposit), bold: true },
    { label: '월세', value: formatMoney(store.monthlyRent), bold: true },
    { label: '관리비', value: store.maintenanceFee > 0 ? formatMoney(store.maintenanceFee) : '없음' },
    { label: '월 고정비 합계', value: formatMoney(totalMonthly), bold: true },
    { label: '권리금', value: store.premium > 0 ? formatMoney(store.premium) : '없음' },
    { label: 'VAT', value: store.vatIncluded ? '포함' : '별도 또는 미입력' },
  ], RX, rcy, RW, 2.1)
  rcy += 6 * 0.3 + 0.25

  rcy = secLabel(s, rcy, '시설·설비')
  const facRows: { label: string; value: string }[] = [
    { label: '닥트(환기)', value: store.duct === undefined ? '미입력' : store.duct ? '설치 가능' : '불가' },
    { label: '도시가스', value: store.cityGas === undefined ? '미입력' : store.cityGas ? '인입' : '미확인' },
    { label: '전용 화장실', value: store.restroom === undefined ? '미입력' : store.restroom ? '있음' : '없음' },
    { label: '배수', value: store.drainage === undefined ? '미입력' : store.drainage ? '양호' : '불량' },
    { label: '소방', value: store.fireSafety === undefined ? '미입력' : store.fireSafety ? '적합' : '미확인' },
  ]
  if (store.electricCapacity) facRows.push({ label: '전기 용량', value: store.electricCapacity })
  dataTable(s, facRows, RX, rcy, RW, 2.1)
}

// ─── SLIDES 4-5: 입지 분석 ───────────────────────────────────

interface LocBlock { title: string; items: { tag: string; text: string }[] }

function buildLocBlocks(store: Store): LocBlock[] {
  const biz = store.desiredBusiness
  const pedAcc = accLbl(store.pedestrianAccess ?? store.walkAccess)
  const carAcc = accLbl(store.vehicleAccess ?? store.carAccess)
  const pubAcc = accLbl(store.publicTransportAccess)
  const vis = VISIBILITY_LABELS[store.visibility]
  const flr = FLOOR_LABELS[store.floor]

  return [
    {
      title: '도보 접근성',
      items: [
        { tag: '현재 조건', text: `도보 ${pedAcc} · 차량 ${carAcc} · 대중교통 ${pubAcc}` },
        { tag: '의미', text: pedAcc === '우수' || pedAcc === '양호' ? '배후 도보 유동인구가 풍부하여 자연 유입 가능성이 높습니다.' : '도보 접근성이 제한적이며 간판·유도사인 전략이 더 중요합니다.' },
        { tag: '업종 영향', text: `${biz} 업종은 도보 접근이 ${pedAcc === '우수' || pedAcc === '양호' ? '유리하여 자연 유입 기대 가능' : '제한되어 마케팅 채널 보완 필요'}합니다.` },
        { tag: '현장 확인', text: '피크타임 도보 유동량 실측, 대중교통 정류장→점포 실측 도보 시간 확인' },
      ],
    },
    {
      title: '가시성',
      items: [
        { tag: '현재 조건', text: `가시성 ${vis} · 전면폭 ${store.frontageMeters}m · 코너 ${store.isCorner ? '해당' : '일반'}` },
        { tag: '의미', text: store.visibility === 'excellent' || store.visibility === 'good' ? '도로·보행동선에서 점포가 잘 보이는 조건입니다.' : '가시성이 제한되어 신호등·인접 구조물의 차폐 여부를 현장에서 확인해야 합니다.' },
        { tag: '업종 영향', text: `${biz}는 충동 방문 비중이 높아 가시성이 매출에 직접 영향을 미칩니다.` },
        { tag: '현장 확인', text: '도로 맞은편 50m·100m 지점에서 식별 여부, 야간 간판 가시성(주점 필수)' },
      ],
    },
    {
      title: '전면폭 및 층수',
      items: [
        { tag: '현재 조건', text: `${flr} · 전면폭 ${store.frontageMeters}m · 엘리베이터 ${store.elevator !== undefined ? (store.elevator ? '있음' : '없음') : '미확인'}` },
        { tag: '의미', text: store.floor === '1f' ? '1층은 자연 유입률이 가장 높으며 간판 노출과 충동 방문 유도에 최적입니다.' : `${flr}는 계단/엘리베이터 이동이 필요하여 자연 유입이 감소합니다.` },
        { tag: '업종 영향', text: `전면폭 ${store.frontageMeters}m는 ${store.frontageMeters >= 6 ? '간판 설치와 쇼윈도우 구성에 충분합니다.' : '협소하여 간판 가독성 확보에 노력이 필요합니다.'}` },
        { tag: '현장 확인', text: `실측 전면폭·입구 위치 확인, ${store.floor !== '1f' ? '계단 폭·조명·청결도 확인,' : ''} 간판 허가 가능 위치 확인` },
      ],
    },
    {
      title: '주차',
      items: [
        { tag: '현재 조건', text: `전용 주차 ${store.parkingCount > 0 ? `${store.parkingCount}대` : '없음 또는 미입력'}` },
        { tag: '의미', text: store.parkingCount > 0 ? `${store.parkingCount}대 주차 공간은 차량 방문 고객에게 직접적 편의를 제공합니다.` : '전용 주차가 없습니다. 인근 공영주차장 및 노상주차 가능 여부를 확인하십시오.' },
        { tag: '업종 영향', text: `${biz} 업종에서 ${store.parkingCount === 0 ? '주차 미확보 시 차량 고객 이탈 가능성이 있습니다.' : '주차 확보는 단가·체류시간 증가에 기여합니다.'}` },
        { tag: '현장 확인', text: '주차장 위치·진입로 폭·야간 이용 가능 여부, 인근 공영주차장 위치·요금' },
      ],
    },
    {
      title: '차량 접근성',
      items: [
        { tag: '현재 조건', text: `차량 접근성 ${carAcc} · 코너 ${store.isCorner ? '해당' : '비해당'}` },
        { tag: '의미', text: carAcc === '우수' || carAcc === '양호' ? '차량 접근이 원활하며 승하차 공간 확보가 가능한 조건입니다.' : '차량 접근이 제한적입니다. 일방통행·진입금지 여부를 현장에서 확인하십시오.' },
        { tag: '업종 영향', text: `코너 점포${store.isCorner ? '(해당) — 두 방향 간판 노출 가능, 마케팅 효율 높음' : '(비해당) — 단일 방향 노출 최대화 전략 수립 필요'}` },
        { tag: '현장 확인', text: '차량 진입 가능 방향, 유턴·좌회전 가능 여부, 단속 카메라 위치 확인' },
      ],
    },
    {
      title: '대중교통 및 고객 동선',
      items: [
        { tag: '현재 조건', text: `대중교통 ${pubAcc} · 배후세대·유동인구: 데이터 미연결` },
        { tag: '의미', text: pubAcc === '우수' || pubAcc === '양호' ? '지하철·버스 정류장과의 근접성이 높아 대중교통 이용 고객 유입이 기대됩니다.' : '대중교통 접근이 다소 불편합니다. 배후세대 도보 유입 중심으로 수요를 평가하십시오.' },
        { tag: '업종 영향', text: `${biz} 업종의 고객 동선은 ${pubAcc === '우수' || pubAcc === '양호' ? '대중교통 이용 고객까지 포함하여 폭넓은 수요 접근 가능' : '배후 주거·업무 세대 중심으로 구성될 가능성 높음'}합니다.` },
        { tag: '현장 확인', text: '가장 가까운 지하철역·버스정류장까지 실측 도보 시간, 출퇴근 피크 직접 방문 확인' },
      ],
    },
  ]
}

function slideLocationBlocks(
  pptx: any, blocks: LocBlock[], startIdx: number, endIdx: number,
  slideLabel: string, displayName: string, store: Store
) {
  const s = pptx.addSlide()
  hdr(s, pptx, `${slideLabel}  입지 분석`)
  ftr(s, pptx, `${displayName}  ·  ${store.desiredBusiness}  ·  Slide ${slideLabel}`)

  const subset = blocks.slice(startIdx, endIdx)
  const blockH = CH / subset.length - 0.06

  subset.forEach((block, bi) => {
    const by = CY + bi * (blockH + 0.06)

    // Block header
    s.addShape(pptx.ShapeType.rect, { x: PX, y: by, w: CW, h: 0.26, fill: { color: C.navy2 }, line: { color: C.navy2 } })
    s.addText(block.title, { x: PX + 0.15, y: by, w: CW, h: 0.26, fontSize: 10, bold: true, color: C.white, valign: 'middle', fontFace: FF })

    // 4 columns for items
    const colW = CW / block.items.length
    block.items.forEach((item, ii) => {
      const ix = PX + ii * colW
      s.addShape(pptx.ShapeType.rect, { x: ix, y: by + 0.26, w: colW - 0.03, h: blockH - 0.26, fill: { color: ii % 2 === 0 ? C.white : C.gBg }, line: { color: C.gBd, pt: 0.5 } })
      s.addText(item.tag.toUpperCase(), { x: ix + 0.1, y: by + 0.32, w: colW - 0.2, h: 0.2, fontSize: 7.5, bold: true, color: C.gTx, fontFace: FF })
      s.addText(item.text, { x: ix + 0.1, y: by + 0.53, w: colW - 0.2, h: blockH - 0.65, fontSize: 9, color: C.navy2, fontFace: FF, wrap: true, valign: 'top', lineSpacingMultiple: 1.3 })
    })
  })
}

// ─── SLIDE 6: 업종 적합성 ─────────────────────────────────────

function slideBizFit(pptx: any, analysis: AnalysisResult, store: Store, displayName: string, num: string) {
  const s = pptx.addSlide()
  hdr(s, pptx, `${num}  업종 적합성`)
  ftr(s, pptx, `${displayName}  ·  ${store.desiredBusiness}  ·  Slide ${num}`)

  let cy = CY
  const ba = analysis.bizAnalysis

  // Fit score
  const fitScore = analysis.scores.businessFit
  s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW, h: 0.55, fill: { color: C.gBg }, line: { color: C.gBd, pt: 1 } })
  s.addText([
    { text: `업종 적합도 ${fitScore.grade}등급 (${fitScore.score}점)  `, options: { bold: true, fontSize: 11, color: C.navy } },
    { text: fitScore.interpretation, options: { fontSize: 10, color: C.navy2 } },
  ], { x: PX + 0.15, y: cy + 0.06, w: CW - 0.3, h: 0.44, fontFace: FF, wrap: true, valign: 'top' })
  cy += 0.65

  if (!ba) {
    s.addText('업종 분석 데이터가 생성되지 않았습니다.', { x: PX, y: cy, w: CW, h: 0.4, fontSize: 11, color: C.gTx, fontFace: FF })
    return
  }

  // Table header
  const colW = [5.0, 1.5, 6.43]
  s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW, h: 0.3, fill: { color: C.navy }, line: { color: C.navy } })
  ;['항목', '판정', '설명 / 근거'].forEach((h, i) => {
    const x = PX + colW.slice(0, i).reduce((a, b) => a + b, 0)
    s.addText(h, { x, y: cy, w: colW[i], h: 0.3, fontSize: 9.5, bold: true, color: C.white, valign: 'middle', align: 'center', fontFace: FF })
  })
  cy += 0.3

  const allRows: { item: string; status: string; reason: string; color: string; bg: string }[] = []
  ba.favorableFactors.forEach(f => {
    const [item, reason] = f.split('—').map(s => s.trim())
    allRows.push({ item: item ?? f, status: '유리', reason: reason ?? f, color: C.em, bg: C.emBg })
  })
  ba.unfavorableFactors.forEach(f => {
    const [item, reason] = f.split('—').map(s => s.trim())
    allRows.push({ item: item ?? f, status: '주의', reason: reason ?? f, color: C.am, bg: C.amBg })
  })
  ba.mustCheckFactors.forEach(f => {
    const [item, reason] = f.split('—').map(s => s.trim())
    allRows.push({ item: item ?? f, status: '미확인', reason: reason ?? f, color: C.gTx, bg: C.gBg })
  })
  ba.specificRisks.forEach(f => {
    const [item, reason] = f.split('—').map(s => s.trim())
    allRows.push({ item: item ?? f, status: '주의', reason: reason ?? f, color: C.red, bg: C.redBg })
  })

  const rowH = 0.3
  const maxRows = Math.floor((FTRY - cy - 0.1) / rowH)
  allRows.slice(0, maxRows).forEach((row, i) => {
    const ry = cy + i * rowH
    const bg = i % 2 === 0 ? C.white : C.gBg
    const cols: [string, number][] = [[row.item, colW[0]], [row.status, colW[1]], [row.reason, colW[2]]]
    cols.forEach(([txt, cw], ci) => {
      const cx = PX + colW.slice(0, ci).reduce((a, b) => a + b, 0)
      s.addShape(pptx.ShapeType.rect, { x: cx, y: ry, w: cw, h: rowH, fill: { color: ci === 1 ? row.bg : bg }, line: { color: C.gBd, pt: 0.5 } })
      s.addText(txt, { x: cx + 0.08, y: ry, w: cw - 0.12, h: rowH, fontSize: 9, color: ci === 1 ? row.color : C.navy2, bold: ci === 1, fontFace: FF, valign: 'middle', wrap: true })
    })
  })
}

// ─── SLIDE 7: 임대조건 및 수익성 ─────────────────────────────

function slideRent(pptx: any, analysis: AnalysisResult, store: Store, displayName: string, num: string) {
  const s = pptx.addSlide()
  hdr(s, pptx, `${num}  임대조건 및 수익성 부담`)
  ftr(s, pptx, `${displayName}  ·  ${store.desiredBusiness}  ·  Slide ${num}`)

  let cy = CY
  const ra = analysis.rentAnalysis
  const totalMonthly = store.monthlyRent + store.maintenanceFee

  // Rent table
  cy = secLabel(s, cy, '임대 조건')
  dataTable(s, [
    { label: '보증금', value: formatMoney(store.deposit), bold: true },
    { label: '월세', value: formatMoney(store.monthlyRent), bold: true },
    { label: '관리비', value: store.maintenanceFee > 0 ? formatMoney(store.maintenanceFee) : '없음' },
    { label: '월 고정비 합계', value: formatMoney(totalMonthly), bold: true },
    { label: '권리금', value: store.premium > 0 ? formatMoney(store.premium) : '없음' },
  ], PX, cy, CW * 0.45, 2.8)
  cy += 5 * 0.3 + 0.35

  if (ra) {
    cy = secLabel(s, cy, '임대료 부담 분석')

    // Risk level label
    const rlCfg = {
      low: { label: '관리 가능', bg: C.emBg, color: C.em },
      caution: { label: '주의 구간', bg: C.amBg, color: C.am },
      high: { label: '고부담', bg: C.redBg, color: C.red },
      unknown: { label: '계산 불가', bg: C.gBg, color: C.gTx },
    }[ra.riskLevel]

    // 3-card row
    const cards = [
      { label: '임대료 비율', value: ra.rentRatioPct !== null ? `${ra.rentRatioPct.toFixed(1)}%` : '—', sub: '월세 ÷ 예상매출' },
      { label: '10% 기준 필요매출', value: formatMoney(ra.referenceSalesAt10pct), sub: '참고값 (손익분기점 아님)' },
      { label: '12% 기준 필요매출', value: formatMoney(ra.referenceSalesAt12pct), sub: '고부담 임계점' },
    ]
    const cardW = (CW - 0.4) / 3
    cards.forEach((card, i) => {
      const cx = PX + i * (cardW + 0.2)
      s.addShape(pptx.ShapeType.rect, { x: cx, y: cy, w: cardW, h: 0.85, fill: { color: C.gBg }, line: { color: C.gBd, pt: 1 } })
      s.addText(card.label, { x: cx + 0.1, y: cy + 0.05, w: cardW - 0.2, h: 0.22, fontSize: 8.5, color: C.gTx, align: 'center', fontFace: FF })
      s.addText(card.value, { x: cx + 0.1, y: cy + 0.28, w: cardW - 0.2, h: 0.32, fontSize: 18, bold: true, color: C.dark, align: 'center', fontFace: FF })
      s.addText(card.sub, { x: cx + 0.1, y: cy + 0.62, w: cardW - 0.2, h: 0.2, fontSize: 7.5, color: C.gTx, align: 'center', fontFace: FF })
    })
    cy += 1.0

    // Risk badge + interpretation
    s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: 1.5, h: 0.28, fill: { color: rlCfg.bg }, line: { color: C.gBd, pt: 0.5 } })
    s.addText(rlCfg.label, { x: PX, y: cy, w: 1.5, h: 0.28, fontSize: 9, bold: true, color: rlCfg.color, align: 'center', valign: 'middle', fontFace: FF })
    s.addText(ra.interpretation, { x: PX + 1.65, y: cy, w: CW - 1.65, h: 0.28, fontSize: 9.5, color: C.navy2, valign: 'middle', fontFace: FF, wrap: true })
    cy += 0.4
  }

  // Sales info if available
  if (store.expectedMonthlySales && store.expectedMonthlySales > 0) {
    cy = secLabel(s, cy, '손익 시뮬레이션 (입력값 기준 참고)')
    dataTable(s, [
      { label: '입력된 예상 월매출', value: formatMoney(store.expectedMonthlySales), bold: true },
      { label: '월 고정비 (월세+관리비)', value: `− ${formatMoney(totalMonthly)}`, bold: true },
      { label: '인건비·재료비·변동비', value: '별도 계산 필요' },
    ], PX, cy, CW, 2.8)
  } else {
    s.addText(
      `예상매출 미입력 — 월세 ${formatMoney(store.monthlyRent)}를 10% 기준으로 관리하려면 약 ${ra ? formatMoney(ra.referenceSalesAt10pct) : '—'}의 월매출이 필요합니다. (임대료 부담 판단용 참고값)`,
      { x: PX, y: cy + 0.1, w: CW, h: 0.45, fontSize: 10, color: C.gTx, fontFace: FF, wrap: true }
    )
  }
}

// ─── SLIDES 8-N: 주요 위험요인 ───────────────────────────────

function slideRisks(pptx: any, analysis: AnalysisResult, store: Store, displayName: string, numStart: number): number {
  const risks = analysis.risks
  const PER_SLIDE = 4
  let slideNum = numStart

  for (let start = 0; start < risks.length; start += PER_SLIDE) {
    const chunk = risks.slice(start, start + PER_SLIDE)
    const label = risks.length > PER_SLIDE
      ? `${slideNum}-${Math.floor(start / PER_SLIDE) + 1}`
      : `${slideNum}`

    const s = pptx.addSlide()
    hdr(s, pptx, `${label}  주요 위험요인`)
    ftr(s, pptx, `${displayName}  ·  ${store.desiredBusiness}  ·  Slide ${label}`)

    const blockH = CH / chunk.length - 0.06

    chunk.forEach((risk, i) => {
      const by = CY + i * (blockH + 0.06)
      const colors = [
        { hBg: 'DC2626', hFg: C.white, body: C.redBg },
        { hBg: 'B45309', hFg: C.white, body: C.amBg },
        { hBg: '92400E', hFg: C.white, body: 'FEF9C3' },
        { hBg: '7C3AED', hFg: C.white, body: 'EDE9FE' },
      ]
      const col = colors[i % colors.length]

      s.addShape(pptx.ShapeType.rect, { x: PX, y: by, w: CW, h: 0.3, fill: { color: col.hBg }, line: { color: col.hBg } })
      s.addText(`${i + start + 1}.  ${risk.title}`, { x: PX + 0.15, y: by, w: 9, h: 0.3, fontSize: 10.5, bold: true, color: col.hFg, valign: 'middle', fontFace: FF })
      s.addText(risk.data, { x: PX + 9.3, y: by, w: 3.5, h: 0.3, fontSize: 9, color: 'FCA5A5', align: 'right', valign: 'middle', fontFace: FF })

      const contentH = blockH - 0.3
      s.addShape(pptx.ShapeType.rect, { x: PX, y: by + 0.3, w: CW, h: contentH, fill: { color: col.body }, line: { color: C.gBd, pt: 0.5 } })

      const colW3 = (CW - 0.3) / 3
      ;[
        { label: '의미', text: risk.interpretation },
        { label: '업종 영향', text: risk.impact },
        { label: '대응 방법', text: risk.action ?? '계약 전 현장 직접 확인 및 임대인 서면 확인 요청' },
      ].forEach((col3, ci) => {
        const cx = PX + 0.1 + ci * (colW3 + 0.05)
        s.addText(col3.label, { x: cx, y: by + 0.36, w: colW3, h: 0.2, fontSize: 8.5, bold: true, color: C.gTx, fontFace: FF })
        s.addText(col3.text, { x: cx, y: by + 0.57, w: colW3, h: contentH - 0.35, fontSize: 9, color: C.dark, fontFace: FF, wrap: true, valign: 'top', lineSpacingMultiple: 1.3 })
      })
    })

    slideNum++
  }
  return slideNum
}

// ─── SLIDES N+1: 계약 전 현장 확인사항 ───────────────────────

function slideChecklists(pptx: any, analysis: AnalysisResult, store: Store, displayName: string, numStart: number): number {
  const checks = analysis.contractChecks
  const PER_SLIDE = 14
  let slideNum = numStart

  for (let start = 0; start < checks.length; start += PER_SLIDE) {
    const chunk = checks.slice(start, start + PER_SLIDE)
    const label = checks.length > PER_SLIDE
      ? `${slideNum}-${Math.floor(start / PER_SLIDE) + 1}`
      : `${slideNum}`

    const s = pptx.addSlide()
    hdr(s, pptx, `${label}  계약 전 현장 확인사항`)

    const verified = checks.filter(c => c.status === 'verified').length
    const concern = checks.filter(c => c.status === 'concern').length
    ftr(s, pptx, `${displayName}  ·  전체 ${checks.length}항목 (확인완료 ${verified}  /  우려사항 ${concern}  /  미확인 ${checks.length - verified - concern})  ·  Slide ${label}`)

    // Table header
    let cy = CY
    const colW = [1.8, 5.5, 1.6, 4.33]
    const cols = ['카테고리', '확인 항목', '상태', '비고']
    s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW, h: 0.3, fill: { color: C.navy }, line: { color: C.navy } })
    cols.forEach((col, i) => {
      const cx = PX + colW.slice(0, i).reduce((a, b) => a + b, 0)
      s.addText(col, { x: cx + 0.05, y: cy, w: colW[i], h: 0.3, fontSize: 9.5, bold: true, color: C.white, valign: 'middle', fontFace: FF })
    })
    cy += 0.3

    const rowH = Math.min(0.32, (FTRY - cy - 0.1) / chunk.length)
    chunk.forEach((check, i) => {
      const ry = cy + i * rowH
      const bg = i % 2 === 0 ? C.white : C.gBg
      const statusCfg = {
        verified: { label: '확인완료', bg: C.emBg, color: C.em },
        concern: { label: '우려사항', bg: C.redBg, color: C.red },
        unchecked: { label: '미확인', bg: C.gBg, color: C.gTx },
      }[check.status]

      const cells: [string, number, string, boolean][] = [
        [check.category, colW[0], bg, false],
        [check.item, colW[1], bg, false],
        [statusCfg.label, colW[2], statusCfg.bg, true],
        [check.note || '—', colW[3], bg, false],
      ]
      cells.forEach(([txt, cw, cellBg, bold], ci) => {
        const cx = PX + colW.slice(0, ci).reduce((a, b) => a + b, 0)
        s.addShape(pptx.ShapeType.rect, { x: cx, y: ry, w: cw, h: rowH, fill: { color: cellBg }, line: { color: C.gBd, pt: 0.5 } })
        const color = ci === 2 ? statusCfg.color : C.navy2
        s.addText(txt, { x: cx + 0.06, y: ry, w: cw - 0.1, h: rowH, fontSize: 8.5, color, bold, fontFace: FF, valign: 'middle', wrap: true })
      })
    })
    slideNum++
  }
  return slideNum
}

// ─── SLIDE: 상권데이터 연결 현황 ──────────────────────────────

function slideMarketData(pptx: any, store: Store, displayName: string, num: string) {
  const s = pptx.addSlide()
  hdr(s, pptx, `${num}  상권데이터 연결 현황`)
  ftr(s, pptx, `${displayName}  ·  ${store.desiredBusiness}  ·  Slide ${num}`)

  let cy = CY

  s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW, h: 0.55, fill: { color: C.gBg }, line: { color: C.gBd, pt: 1 } })
  s.addText('현재 모든 상권 데이터 항목이 미연결 상태입니다. 향후 데이터 연계 시 분석 정밀도가 크게 향상됩니다.', {
    x: PX + 0.15, y: cy + 0.07, w: CW - 0.3, h: 0.42, fontSize: 10.5, color: C.navy2, fontFace: FF, wrap: true,
  })
  cy += 0.7

  const items = [
    { title: '유동인구 데이터', desc: '시간대별·요일별 보행 유동인구 분석', alt: '피크타임 직접 방문 실측 카운팅 권고' },
    { title: '생활인구 데이터', desc: '배후 세대수·연령대별 거주 인구 분석', alt: '부동산 플랫폼 또는 시·군·구청 통계 참고' },
    { title: '상권 매출 데이터', desc: '동종업종 평균 매출·매출 변화율', alt: '소상공인진흥공단 상권분석 서비스 활용 가능' },
    { title: '경쟁 업종 현황', desc: `반경 500m 내 ${store.desiredBusiness} 업종 수·신규/폐업`, alt: '현장 직접 도보 조사 및 배달앱 검색 병행' },
    { title: '폐업률 데이터', desc: '해당 상권·업종 폐업률 및 생존율', alt: '소상공인진흥공단 통계 (업종별 3년 생존율)' },
    { title: '임대료 시세 데이터', desc: '동일 상권 내 동종 면적 평균 임대료', alt: '인근 부동산 중개소 2~3곳 방문 시세 확인' },
  ]

  const colNum = 3
  const cardW = (CW - 0.2 * (colNum - 1)) / colNum
  const cardH = (FTRY - cy - 0.1) / 2 - 0.1

  items.forEach((item, i) => {
    const col = i % colNum
    const row = Math.floor(i / colNum)
    const cx = PX + col * (cardW + 0.2)
    const iy = cy + row * (cardH + 0.12)

    s.addShape(pptx.ShapeType.rect, { x: cx, y: iy, w: cardW, h: cardH, fill: { color: C.white }, line: { color: C.gBd, pt: 1 } })
    s.addShape(pptx.ShapeType.rect, { x: cx, y: iy, w: cardW, h: 0.28, fill: { color: C.navy2 }, line: { color: C.navy2 } })
    s.addText(item.title, { x: cx + 0.12, y: iy, w: cardW - 1.2, h: 0.28, fontSize: 9.5, bold: true, color: C.white, valign: 'middle', fontFace: FF })
    s.addText('미연결', { x: cx + cardW - 1.1, y: iy, w: 0.95, h: 0.28, fontSize: 8.5, color: '94A3B8', align: 'right', valign: 'middle', fontFace: FF })
    s.addText(item.desc, { x: cx + 0.12, y: iy + 0.35, w: cardW - 0.24, h: 0.4, fontSize: 9, color: C.gTx, fontFace: FF, wrap: true })
    s.addShape(pptx.ShapeType.rect, { x: cx + 0.1, y: iy + cardH - 0.55, w: cardW - 0.2, h: 0.42, fill: { color: C.amBg }, line: { color: 'FDE68A', pt: 0.5 } })
    s.addText(`현장 대안: ${item.alt}`, { x: cx + 0.18, y: iy + cardH - 0.5, w: cardW - 0.36, h: 0.35, fontSize: 8.5, color: C.am, fontFace: FF, wrap: true })
  })
}

// ─── SLIDE: 최종 종합의견 ─────────────────────────────────────

function slideFinalOpinion(pptx: any, analysis: AnalysisResult, store: Store, displayName: string, num: string) {
  const s = pptx.addSlide()
  hdr(s, pptx, `${num}  최종 종합의견`)
  ftr(s, pptx, `${displayName}  ·  ${store.desiredBusiness}  ·  Slide ${num}`)

  let cy = CY

  // Verdict card
  s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW - 3.5, h: 0.9, fill: { color: C.gBg }, line: { color: C.gBd, pt: 1.5 } })
  s.addText(RECOMMENDATION_LABELS[analysis.recommendation], { x: PX + 0.2, y: cy + 0.08, w: CW - 3.9, h: 0.35, fontSize: 14, bold: true, color: C.navy, fontFace: FF })
  s.addText(`종합 점수: ${analysis.overallScore}점 (${analysis.overallGrade}등급)`, { x: PX + 0.2, y: cy + 0.5, w: CW - 3.9, h: 0.28, fontSize: 10, color: C.gTx, fontFace: FF })

  // Grade box
  s.addShape(pptx.ShapeType.rect, { x: W - 3.6, y: cy, w: 3.1, h: 0.9, fill: { color: C.navy }, line: { color: C.navy3, pt: 1.5 } })
  s.addText(analysis.overallGrade, { x: W - 3.6, y: cy, w: 1.8, h: 0.9, fontSize: 42, bold: true, color: C.white, align: 'center', valign: 'middle', fontFace: FF })
  s.addText(`${analysis.overallScore}점`, { x: W - 1.8, y: cy, w: 1.3, h: 0.9, fontSize: 14, color: '94A3B8', align: 'center', valign: 'middle', fontFace: FF })
  cy += 1.05

  // Opinion paragraphs
  const grade = analysis.overallGrade
  const biz = store.desiredBusiness
  const ra = analysis.rentAnalysis

  const p1 = grade === 'A+' || grade === 'A'
    ? `${displayName} 점포는 종합 분석 결과 ${grade}등급(${analysis.overallScore}점)으로 ${biz} 출점을 우선 검토할 수 있는 조건을 갖추고 있습니다. 입력된 점포 조건을 종합하면 해당 업종 운영에 필요한 기본 요건을 충족하며, 반드시 현장 방문을 통해 실제 환경을 확인하십시오.`
    : grade === 'B+' || grade === 'B'
      ? `${displayName} 점포는 종합 분석 결과 ${grade}등급(${analysis.overallScore}점)으로 ${biz} 출점을 조건부로 검토할 수 있는 수준입니다. 일부 유리한 요소가 확인되지만 리스크도 병존하므로 계약 전 추가 검토와 현장 재확인이 필수입니다.`
      : `${displayName} 점포는 종합 분석 결과 ${grade}등급(${analysis.overallScore}점)으로 ${biz} 출점에 앞서 위험요인과 임대조건을 보수적으로 재검토할 필요가 있습니다. 임대인과의 조건 협상 및 현장 점검을 철저히 진행할 것을 권고합니다.`

  const p2 = ra
    ? ra.rentRatioPct !== null
      ? `임대료 측면에서 월세 ${formatMoney(ra.monthlyRent)}는 예상매출 기준 ${ra.rentRatioPct.toFixed(1)}% 수준입니다. ${ra.interpretation}`
      : `월세 ${formatMoney(ra.monthlyRent)}를 10% 기준으로 관리하려면 약 ${formatMoney(ra.referenceSalesAt10pct)}의 월매출이 필요합니다. 이는 손익분기점이 아닌 임대료 부담 판단을 위한 참고값입니다.`
    : `임대조건과 예상매출을 함께 검토하여 임대료 부담률을 사전에 계산하십시오.`

  const p3 = `경쟁환경 데이터는 현재 연결되지 않아 반경 300~500m 내 동종업종 수와 최근 폐업 현황을 현장에서 직접 확인해야 합니다. 계약서 작성 전 건물 용도·영업 가능 업종·원상복구 범위·재계약 우선권을 법률 전문가와 함께 검토할 것을 강력히 권고합니다.`

  const paragraphs = [p1, p2, p3]
  const parH = (FTRY - cy - 0.35) / paragraphs.length - 0.1

  paragraphs.forEach((p, i) => {
    s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW, h: parH, fill: { color: i % 2 === 0 ? C.white : C.gBg }, line: { color: C.gBd, pt: 0.5 } })
    s.addText(p, { x: PX + 0.15, y: cy + 0.07, w: CW - 0.3, h: parH - 0.1, fontSize: 10, color: C.navy2, fontFace: FF, wrap: true, valign: 'top', lineSpacingMultiple: 1.4 })
    cy += parH + 0.08
  })

  // Disclaimer
  s.addText('본 리포트는 입력 데이터 기반 참고자료입니다. 최종 계약 결정은 현장 방문·법률·세무 전문가 검토를 병행하십시오. 상권연구소 AI PRO V0.1은 의사결정 지원 서비스이며 투자 성과를 보장하지 않습니다.', {
    x: PX, y: FTRY - 0.35, w: CW, h: 0.28, fontSize: 7.5, color: C.gTx, fontFace: FF, wrap: true,
  })
}

// ─── Main export ──────────────────────────────────────────────

export async function generateReportPpt(analysis: AnalysisResult, store: Store): Promise<void> {
  const { default: PptxGenJS } = await import('pptxgenjs')
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.author = '상권연구소 AI PRO'
  pptx.company = '상권연구소 AI PRO'
  pptx.subject = '점포 입지 분석 리포트'

  const displayName = store.address || store.name

  let slideNum = 1

  // 1. Cover
  slideCover(pptx, analysis, store, displayName)
  slideNum++

  // 2. Executive Summary
  slideExecSummary(pptx, analysis, store, displayName, String(slideNum))
  slideNum++

  // 3. 점포 기본조건
  slideStoreBasics(pptx, analysis, store, displayName, String(slideNum))
  slideNum++

  // 4-5. 입지 분석 (split 3+3)
  const locBlocks = buildLocBlocks(store)
  slideLocationBlocks(pptx, locBlocks, 0, 3, `${slideNum}-1`, displayName, store)
  slideLocationBlocks(pptx, locBlocks, 3, 6, `${slideNum}-2`, displayName, store)
  slideNum++

  // 6. 업종 적합성
  slideBizFit(pptx, analysis, store, displayName, String(slideNum))
  slideNum++

  // 7. 임대조건 및 수익성
  slideRent(pptx, analysis, store, displayName, String(slideNum))
  slideNum++

  // 8. 주요 위험요인 (auto-split at 4)
  slideNum = slideRisks(pptx, analysis, store, displayName, slideNum)

  // 9. 계약 전 현장 확인사항 (auto-split at 14)
  slideNum = slideChecklists(pptx, analysis, store, displayName, slideNum)

  // 10. 상권데이터
  slideMarketData(pptx, store, displayName, String(slideNum))
  slideNum++

  // 11. 최종 종합의견
  slideFinalOpinion(pptx, analysis, store, displayName, String(slideNum))

  // File name: 상권연구소AI_점포입지분석_두정동871_술집.pptx
  const addrClean = store.address
    .replace(/\s+/g, '')
    .replace(/번지$/, '')
    .slice(0, 12)
  const bizClean = store.desiredBusiness.replace(/\s+/g, '').slice(0, 6)
  const fileName = `상권연구소AI_점포입지분석_${addrClean}_${bizClean}.pptx`

  await pptx.writeFile({ fileName })
}
