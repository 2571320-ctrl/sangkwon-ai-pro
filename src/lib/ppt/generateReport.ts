/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * generateReport.ts — Browser-only PPT export
 * A4 Portrait 8.27" × 11.69" — mirrors /report/[id] web design
 * Dynamically imported from click handlers only (never SSR).
 */

import type { AnalysisResult, Store } from '@/types'
import {
  FLOOR_LABELS, VISIBILITY_LABELS, ACCESS_LABELS,
  RECOMMENDATION_LABELS, BIZ_CATEGORY_LABELS,
} from '@/types'
import { formatMoney } from '@/lib/utils'

// ─── Design tokens (matches web Tailwind classes) ─────────────
const C = {
  NAVY:    '0B1120',   // bg-[#0b1120]
  NAVY2:   '1E293B',   // bg-slate-800
  NAVY3:   '334155',   // bg-slate-700
  WHITE:   'FFFFFF',
  G_BG:    'F8F9FB',   // bg-[#f8f9fb]
  G_BD:    'E2E8F0',   // border-slate-200
  G_TX:    '64748B',   // text-slate-500
  DARK:    '0F172A',   // text-slate-900
  EM:      '059669',   // text-emerald-600
  EM_BG:   'D1FAE5',   // bg-emerald-100
  AM:      'B45309',   // text-amber-600
  AM_BG:   'FEF3C7',   // bg-amber-100
  RED:     'DC2626',   // text-red-600
  RED_BG:  'FEE2E2',   // bg-red-100
  BLUE:    '3B82F6',   // blue-400
  BLUE2:   '1D4ED8',   // blue-700
  BLUE_BG: 'DBEAFE',   // bg-blue-100
  NAVY_DK: '1E3A5F',   // must-check bar
}

// ─── A4 Portrait layout ───────────────────────────────────────
const W    = 8.27     // slide width (inches)
const H    = 11.69    // slide height
const HDR  = 0.45     // header bar height
const FTR  = 0.22     // footer bar height
const FTRY = H - FTR  // 11.47 — footer Y
const PX   = 0.40     // horizontal padding
const CW   = W - PX * 2   // 7.47 — content width
const CY   = HDR + 0.18   // 0.63 — content start Y
const FF   = 'Malgun Gothic'
const TOTAL = 9        // fixed slide count

// ─── Helpers ──────────────────────────────────────────────────

function accLbl(v?: string) {
  return ACCESS_LABELS[(v as keyof typeof ACCESS_LABELS)] ?? '미입력'
}

function addHeader(s: any, pptx: any, title: string, num: number) {
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: W, h: HDR,
    fill: { color: C.NAVY }, line: { color: C.NAVY },
  })
  s.addText(title, {
    x: PX, y: 0, w: 6.5, h: HDR,
    fontSize: 11, bold: true, color: C.WHITE, valign: 'middle', fontFace: FF,
  })
  s.addText(`${String(num).padStart(2, '0')} / ${String(TOTAL).padStart(2, '0')}`, {
    x: 7.0, y: 0, w: 1.0, h: HDR,
    fontSize: 9, color: '94A3B8', align: 'right', valign: 'middle', fontFace: FF,
  })
}

function addFooter(s: any, pptx: any, num: number) {
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: FTRY, w: W, h: FTR,
    fill: { color: C.NAVY }, line: { color: C.NAVY },
  })
  s.addText('상권연구소 AI PRO · AI + 현장판단 엔진', {
    x: PX, y: FTRY, w: 5.5, h: FTR,
    fontSize: 6.5, color: C.WHITE, valign: 'middle', fontFace: FF,
  })
  s.addText(`${String(num).padStart(2, '0')} / ${String(TOTAL).padStart(2, '0')}`, {
    x: 6.9, y: FTRY, w: 1.1, h: FTR,
    fontSize: 7, color: C.WHITE, align: 'right', valign: 'middle', fontFace: FF,
  })
}

// Section heading — matches web PageSection (border-b-2 border-[#0b1120])
function secHdr(s: any, pptx: any, x: number, y: number, title: string): number {
  s.addText(title.toUpperCase(), {
    x, y, w: CW - (x - PX), h: 0.24,
    fontSize: 8.5, bold: true, color: C.NAVY, fontFace: FF, charSpacing: 0.3,
  })
  s.addShape(pptx.ShapeType.rect, {
    x, y: y + 0.22, w: CW - (x - PX), h: 0.016,
    fill: { color: C.NAVY }, line: { color: C.NAVY },
  })
  return y + 0.34
}

// Label/value table using pptxgenjs addTable
function dataTable(
  s: any,
  rows: { label: string; value: string; bold?: boolean }[],
  x: number, y: number, w: number, labelW = 2.0
) {
  const valW = w - labelW
  const tRows = rows.map((r, i) => [
    {
      text: r.label,
      options: {
        fontSize: 8.5, color: C.G_TX, fontFace: FF,
        fill: { color: i % 2 === 0 ? C.WHITE : C.G_BG },
        valign: 'middle' as const, margin: [0, 6, 0, 6],
      },
    },
    {
      text: r.value,
      options: {
        fontSize: 9, color: r.bold ? C.DARK : C.NAVY2,
        bold: r.bold ?? false, fontFace: FF,
        fill: { color: i % 2 === 0 ? C.WHITE : C.G_BG },
        valign: 'middle' as const, margin: [0, 6, 0, 6],
      },
    },
  ])
  s.addTable(tRows, {
    x, y, w, colW: [labelW, valW], rowH: 0.3,
    border: { type: 'solid', color: C.G_BD, pt: 0.5 },
  })
  return y + rows.length * 0.3
}

// ─── SLIDE 01: 표지 + Executive Summary ──────────────────────

function slide01(pptx: any, analysis: AnalysisResult, store: Store, displayName: string) {
  const s = pptx.addSlide()

  // ── Hero: navy 배경 0"→4.6" ──
  const HERO_H = 4.6
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: W, h: HERO_H,
    fill: { color: C.NAVY }, line: { color: C.NAVY },
  })
  // Blue accent strip (top)
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: W, h: 0.028,
    fill: { color: C.BLUE }, line: { color: C.BLUE },
  })

  s.addText('상권연구소 AI PRO  ·  STORE LOCATION ANALYSIS REPORT', {
    x: PX, y: 0.38, w: 5.5, h: 0.26,
    fontSize: 7, color: '60A5FA', bold: true, fontFace: FF,
  })
  s.addText('점포 · 입지 분석 리포트', {
    x: PX, y: 0.78, w: 5.3, h: 0.72,
    fontSize: 26, bold: true, color: C.WHITE, fontFace: FF,
  })
  s.addText(displayName, {
    x: PX, y: 1.6, w: 5.3, h: 0.42,
    fontSize: 16, color: 'CBD5E1', fontFace: FF,
  })
  s.addText(
    `${store.desiredBusiness}   ·   ${FLOOR_LABELS[store.floor]}   ·   ${store.areaPyeong}평`,
    { x: PX, y: 2.08, w: 5.3, h: 0.3, fontSize: 11, color: '94A3B8', fontFace: FF }
  )
  s.addShape(pptx.ShapeType.rect, {
    x: PX, y: 2.55, w: 1.8, h: 0.022,
    fill: { color: C.BLUE }, line: { color: C.BLUE },
  })
  s.addText(
    `분석일   ${new Date(analysis.createdAt).toLocaleDateString('ko-KR')}`,
    { x: PX, y: 2.72, w: 5.2, h: 0.28, fontSize: 10, color: '94A3B8', fontFace: FF }
  )
  s.addText(RECOMMENDATION_LABELS[analysis.recommendation], {
    x: PX, y: 3.1, w: 5.2, h: 0.38,
    fontSize: 14, bold: true, color: '60A5FA', fontFace: FF,
  })

  // Grade box (right)
  s.addShape(pptx.ShapeType.rect, {
    x: 5.95, y: 0.6, w: 2.06, h: 3.7,
    fill: { color: C.NAVY2 }, line: { color: C.NAVY3, pt: 1.5 },
  })
  s.addText(analysis.overallGrade, {
    x: 5.95, y: 1.05, w: 2.06, h: 1.55,
    fontSize: 64, bold: true, color: C.WHITE, align: 'center', fontFace: FF,
  })
  s.addText(`${analysis.overallScore}점`, {
    x: 5.95, y: 2.62, w: 2.06, h: 0.38,
    fontSize: 15, color: '94A3B8', align: 'center', fontFace: FF,
  })
  s.addText('종합 등급', {
    x: 5.95, y: 3.08, w: 2.06, h: 0.27,
    fontSize: 9, color: '64748B', align: 'center', fontFace: FF,
  })
  s.addText(RECOMMENDATION_LABELS[analysis.recommendation], {
    x: 5.95, y: 3.5, w: 2.06, h: 0.55,
    fontSize: 7.5, bold: true, color: '60A5FA', align: 'center', fontFace: FF, wrap: true,
  })

  // ── Executive Summary: 4.6"→11.47" ──
  let cy = HERO_H + 0.08

  // Section header bar
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: cy, w: W, h: 0.32,
    fill: { color: C.G_BG }, line: { color: C.G_BD, pt: 0.4 },
  })
  s.addShape(pptx.ShapeType.rect, {
    x: PX, y: cy + 0.05, w: 0.2, h: 0.2,
    fill: { color: C.NAVY }, line: { color: C.NAVY },
  })
  s.addText('01', {
    x: PX, y: cy + 0.05, w: 0.2, h: 0.2,
    fontSize: 6.5, bold: true, color: C.WHITE, align: 'center', valign: 'middle', fontFace: FF,
  })
  s.addText('EXECUTIVE SUMMARY — 핵심 요약', {
    x: PX + 0.26, y: cy, w: CW - 0.26, h: 0.32,
    fontSize: 9, bold: true, color: C.NAVY, valign: 'middle', fontFace: FF,
  })
  cy += 0.4

  // Summary card
  const SUM_H = 0.86
  s.addShape(pptx.ShapeType.rect, {
    x: PX, y: cy, w: CW, h: SUM_H,
    fill: { color: C.G_BG }, line: { color: C.G_BD, pt: 0.75 },
  })
  s.addText(
    [
      { text: `[${RECOMMENDATION_LABELS[analysis.recommendation]}]  `, options: { bold: true, color: C.NAVY, fontSize: 9.5 } },
      { text: analysis.summary, options: { color: C.NAVY2, fontSize: 9 } },
    ],
    { x: PX + 0.12, y: cy + 0.1, w: CW - 0.24, h: SUM_H - 0.15, fontFace: FF, wrap: true, valign: 'top', lineSpacingMultiple: 1.3 }
  )
  cy += SUM_H + 0.14

  // Strengths | Risks 2-column
  const COL_W = (CW - 0.1) / 2
  const COL2X = PX + COL_W + 0.1
  const maxItems = Math.max(analysis.strengths.length, analysis.risks.length, 1)
  const ITEM_H = Math.min(0.63, (FTRY - cy - 0.68) / maxItems)

  // Column headers
  s.addShape(pptx.ShapeType.rect, { x: PX,    y: cy, w: COL_W, h: 0.26, fill: { color: C.EM_BG }, line: { color: C.G_BD, pt: 0.4 } })
  s.addText('▲  핵심 강점', { x: PX + 0.1,    y: cy, w: COL_W, h: 0.26, fontSize: 8.5, bold: true, color: C.EM, valign: 'middle', fontFace: FF })
  s.addShape(pptx.ShapeType.rect, { x: COL2X, y: cy, w: COL_W, h: 0.26, fill: { color: C.AM_BG }, line: { color: C.G_BD, pt: 0.4 } })
  s.addText('▲  핵심 위험', { x: COL2X + 0.1, y: cy, w: COL_W, h: 0.26, fontSize: 8.5, bold: true, color: C.AM, valign: 'middle', fontFace: FF })
  cy += 0.26

  // Strength items
  analysis.strengths.slice(0, 5).forEach((item, i) => {
    const iy = cy + i * ITEM_H
    s.addShape(pptx.ShapeType.rect, { x: PX, y: iy, w: COL_W, h: ITEM_H - 0.01, fill: { color: i % 2 === 0 ? C.WHITE : C.G_BG }, line: { color: C.G_BD, pt: 0.4 } })
    s.addText(
      [
        { text: item.title, options: { bold: true, fontSize: 8.5, color: C.DARK } },
        { text: '\n' + item.interpretation.slice(0, 85), options: { fontSize: 7.5, color: C.G_TX } },
      ],
      { x: PX + 0.1, y: iy + 0.04, w: COL_W - 0.18, h: ITEM_H - 0.07, fontFace: FF, wrap: true, valign: 'top' }
    )
  })
  // Risk items
  analysis.risks.slice(0, 5).forEach((item, i) => {
    const iy = cy + i * ITEM_H
    s.addShape(pptx.ShapeType.rect, { x: COL2X, y: iy, w: COL_W, h: ITEM_H - 0.01, fill: { color: i % 2 === 0 ? C.WHITE : C.G_BG }, line: { color: C.G_BD, pt: 0.4 } })
    s.addText(
      [
        { text: item.title, options: { bold: true, fontSize: 8.5, color: C.DARK } },
        { text: '\n' + item.interpretation.slice(0, 85), options: { fontSize: 7.5, color: C.G_TX } },
      ],
      { x: COL2X + 0.1, y: iy + 0.04, w: COL_W - 0.18, h: ITEM_H - 0.07, fontFace: FF, wrap: true, valign: 'top' }
    )
  })
  cy += maxItems * ITEM_H + 0.1

  // Must-check bar
  if (analysis.bizAnalysis?.mustCheckFactors?.length && cy < FTRY - 0.48) {
    s.addShape(pptx.ShapeType.rect, {
      x: PX, y: cy, w: CW, h: 0.26,
      fill: { color: C.NAVY_DK }, line: { color: C.NAVY_DK },
    })
    s.addText('계약 전 핵심 확인사항', { x: PX + 0.1, y: cy, w: 2.2, h: 0.26, fontSize: 8, bold: true, color: C.WHITE, valign: 'middle', fontFace: FF })
    const chips = analysis.bizAnalysis.mustCheckFactors.slice(0, 5)
      .map(f => f.split('—')[0].trim()).join('  /  ')
    s.addText(chips, { x: PX + 2.35, y: cy, w: CW - 2.45, h: 0.26, fontSize: 8, color: '93C5FD', valign: 'middle', fontFace: FF, wrap: true })
  }

  addFooter(s, pptx, 1)
}

// ─── SLIDE 02: 점포 기본조건 ──────────────────────────────────

function slide02(pptx: any, analysis: AnalysisResult, store: Store, displayName: string) {
  const s = pptx.addSlide()
  addHeader(s, pptx, '점포 기본조건', 2)
  addFooter(s, pptx, 2)

  const LW  = (CW - 0.1) / 2        // 3.685" per column
  const RX  = PX + LW + 0.1         // right column start X
  const TW  = LW                     // table width per column
  const LBL = 1.8                    // label column width

  // ── Left: 기본 정보 + 물리적 조건 ──
  let cy = CY
  cy = secHdr(s, pptx, PX, cy, '기본 정보')
  dataTable(s, [
    { label: '주소 / 지역명',    value: displayName,                                               bold: true },
    { label: '희망 업종',        value: store.desiredBusiness,                                     bold: true },
    { label: '업종 분류',        value: analysis.bizAnalysis ? BIZ_CATEGORY_LABELS[analysis.bizAnalysis.category] : '기타' },
    { label: '현재 운영 업종',   value: store.currentBusiness  || '미입력' },
    { label: '이전 운영 업종',   value: store.previousBusiness || '미입력' },
    { label: '계약 기간',        value: store.contractPeriod   || '미입력' },
  ], PX, cy, TW, LBL)
  cy += 6 * 0.3 + 0.3

  cy = secHdr(s, pptx, PX, cy, '물리적 조건')
  dataTable(s, [
    { label: '층수',        value: FLOOR_LABELS[store.floor] },
    { label: '면적',        value: `${store.areaPyeong}평${store.areaSqm ? ` (${store.areaSqm}㎡)` : ''}` },
    { label: '전면폭',      value: `${store.frontageMeters}m` },
    { label: '코너 점포',   value: store.isCorner ? '해당' : '해당 없음' },
    { label: '주차',        value: store.parkingCount > 0 ? `${store.parkingCount}대` : '없음' },
    { label: '엘리베이터',  value: store.elevator === undefined ? '미확인' : store.elevator ? '있음' : '없음' },
  ], PX, cy, TW, LBL)

  // ── Right: 임대 조건 + 시설·설비 ──
  let rcy = CY
  const totalMonthly = store.monthlyRent + store.maintenanceFee

  rcy = secHdr(s, pptx, RX, rcy, '임대 조건')
  dataTable(s, [
    { label: '보증금',       value: formatMoney(store.deposit),     bold: true },
    { label: '월세',         value: formatMoney(store.monthlyRent), bold: true },
    { label: '관리비',       value: store.maintenanceFee > 0 ? formatMoney(store.maintenanceFee) : '없음' },
    { label: '월 고정비 합계', value: formatMoney(totalMonthly),    bold: true },
    { label: '권리금',       value: store.premium > 0 ? formatMoney(store.premium) : '없음' },
    { label: 'VAT',          value: store.vatIncluded ? '포함' : '별도' },
  ], RX, rcy, TW, LBL)
  rcy += 6 * 0.3 + 0.3

  rcy = secHdr(s, pptx, RX, rcy, '시설·설비')
  const facRows: { label: string; value: string }[] = [
    { label: '닥트(환기)',   value: store.duct       === undefined ? '미입력' : store.duct       ? '설치 가능' : '불가' },
    { label: '도시가스',     value: store.cityGas    === undefined ? '미입력' : store.cityGas    ? '인입'      : '미확인' },
    { label: '전용 화장실',  value: store.restroom   === undefined ? '미입력' : store.restroom   ? '있음'      : '없음' },
    { label: '배수',         value: store.drainage   === undefined ? '미입력' : store.drainage   ? '양호'      : '불량' },
    { label: '소방',         value: store.fireSafety === undefined ? '미입력' : store.fireSafety ? '적합'      : '미확인' },
  ]
  if (store.electricCapacity) facRows.push({ label: '전기 용량', value: store.electricCapacity })
  dataTable(s, facRows, RX, rcy, TW, LBL)

  // Score bar at bottom
  const barY = FTRY - 1.28
  s.addShape(pptx.ShapeType.rect, {
    x: PX, y: barY, w: CW, h: 0.3,
    fill: { color: C.G_BG }, line: { color: C.G_BD, pt: 0.5 },
  })
  s.addText('종합 점수', { x: PX + 0.12, y: barY, w: 1.1, h: 0.3, fontSize: 8, color: C.G_TX, valign: 'middle', fontFace: FF })
  s.addText(
    `${analysis.overallScore}점 (${analysis.overallGrade}등급)  ·  ${RECOMMENDATION_LABELS[analysis.recommendation]}`,
    { x: PX + 1.3, y: barY, w: CW - 1.4, h: 0.3, fontSize: 9, bold: true, color: C.NAVY, valign: 'middle', fontFace: FF }
  )
}

// ─── SLIDE 03: 입지 분석 ──────────────────────────────────────

function slide03(pptx: any, analysis: AnalysisResult, store: Store, displayName: string) {
  const s = pptx.addSlide()
  addHeader(s, pptx, '입지 분석', 3)
  addFooter(s, pptx, 3)

  let cy = CY

  // Score summary (3 cards)
  const locSc = analysis.scores.location
  const visSc = analysis.scores.visibility
  const cards3 = [
    { label: '입지 점수',   score: locSc.score, grade: locSc.grade, interp: locSc.interpretation.slice(0, 28) },
    { label: '가시성 점수', score: visSc.score, grade: visSc.grade, interp: visSc.interpretation.slice(0, 28) },
    { label: '종합 등급',   score: analysis.overallScore, grade: analysis.overallGrade, interp: `${store.areaPyeong}평 · ${FLOOR_LABELS[store.floor]}` },
  ]
  const cW3 = (CW - 0.12) / 3
  cards3.forEach((c, i) => {
    const cx = PX + i * (cW3 + 0.06)
    s.addShape(pptx.ShapeType.rect, { x: cx, y: cy, w: cW3, h: 0.72, fill: { color: C.G_BG }, line: { color: C.G_BD, pt: 0.75 } })
    s.addText(c.label, { x: cx + 0.1, y: cy + 0.05, w: cW3 - 0.2, h: 0.18, fontSize: 7.5, color: C.G_TX, align: 'center', fontFace: FF })
    s.addText(`${c.grade}  ${c.score}점`, { x: cx + 0.08, y: cy + 0.24, w: cW3 - 0.16, h: 0.3, fontSize: 14, bold: true, color: C.NAVY, align: 'center', fontFace: FF })
    s.addText(c.interp, { x: cx + 0.08, y: cy + 0.55, w: cW3 - 0.16, h: 0.15, fontSize: 7, color: C.G_TX, align: 'center', fontFace: FF, wrap: true })
  })
  cy += 0.82

  cy = secHdr(s, pptx, PX, cy, '항목별 입지 분석')

  // Table header
  const colW = [1.5, 1.72, 2.12, 2.13]   // sum = 7.47 = CW
  const hdrs = ['분석 항목', '현재 조건', '의미 · 업종 영향', '현장 확인 사항']
  s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW, h: 0.28, fill: { color: C.NAVY }, line: { color: C.NAVY } })
  hdrs.forEach((h, i) => {
    const hx = PX + colW.slice(0, i).reduce((a, b) => a + b, 0)
    s.addText(h, { x: hx + 0.07, y: cy, w: colW[i] - 0.07, h: 0.28, fontSize: 8, bold: true, color: C.WHITE, valign: 'middle', fontFace: FF })
  })
  cy += 0.28

  const biz    = store.desiredBusiness
  const pedAcc = accLbl(store.pedestrianAccess ?? store.walkAccess)
  const carAcc = accLbl(store.vehicleAccess    ?? store.carAccess)
  const pubAcc = accLbl(store.publicTransportAccess)
  const vis    = VISIBILITY_LABELS[store.visibility]
  const flr    = FLOOR_LABELS[store.floor]

  const locRows = [
    {
      item: '도보 접근성',
      cond: `도보 ${pedAcc} · 차량 ${carAcc} · 대중교통 ${pubAcc}`,
      meaning: pedAcc === '우수' || pedAcc === '양호'
        ? `배후 도보 유동인구가 풍부합니다. ${biz} 업종 자연 유입 가능성이 높습니다.`
        : '도보 접근성이 제한적입니다. 간판·유도사인 전략이 더 중요합니다.',
      check: '피크타임 도보 유동량 실측, 정류장→점포 도보 시간 확인',
    },
    {
      item: '가시성',
      cond: `가시성 ${vis} · 전면폭 ${store.frontageMeters}m · 코너 ${store.isCorner ? '해당' : '일반'}`,
      meaning: store.visibility === 'excellent' || store.visibility === 'good'
        ? '도로·보행동선에서 점포가 잘 보입니다. 충동 방문 유도에 유리합니다.'
        : '가시성이 제한됩니다. 신호등·구조물 차폐 여부를 현장에서 확인하십시오.',
      check: '맞은편 50m·100m에서 식별 여부, 야간 간판 가시성 확인',
    },
    {
      item: '층수·전면폭',
      cond: `${flr} · 전면폭 ${store.frontageMeters}m · 엘리베이터 ${store.elevator !== undefined ? (store.elevator ? '있음' : '없음') : '미확인'}`,
      meaning: store.floor === '1f'
        ? '1층은 자연 유입률 최고입니다. 간판 노출과 충동 방문 유도에 최적입니다.'
        : `${flr}는 자연 유입이 감소합니다. 엘리베이터·계단 상태가 중요합니다.`,
      check: `실측 전면폭·입구 위치${store.floor !== '1f' ? ', 계단 조명·청결도' : ''}, 간판 허가 위치 확인`,
    },
    {
      item: '주차',
      cond: `전용 주차 ${store.parkingCount > 0 ? `${store.parkingCount}대` : '없음'}`,
      meaning: store.parkingCount > 0
        ? `${store.parkingCount}대 전용 주차가 차량 고객 편의를 제공합니다.`
        : '전용 주차 없음. 인근 공영주차장·노상주차 가능 여부를 확인하십시오.',
      check: '주차장 위치·진입로 폭·야간 이용 가능 여부 확인',
    },
    {
      item: '차량 접근성',
      cond: `차량 ${carAcc} · 코너 ${store.isCorner ? '해당' : '비해당'}`,
      meaning: carAcc === '우수' || carAcc === '양호'
        ? '차량 접근이 원활합니다. 승하차 공간 확보 가능합니다.'
        : '차량 접근 제한. 일방통행·진입금지 여부를 현장에서 확인하십시오.',
      check: '진입 가능 방향, 유턴·좌회전 가능 여부, 단속 카메라 확인',
    },
    {
      item: '대중교통',
      cond: `대중교통 ${pubAcc} · 배후세대: 미연결`,
      meaning: pubAcc === '우수' || pubAcc === '양호'
        ? '역·버스정류장 근접성이 높아 대중교통 이용 고객 유입이 기대됩니다.'
        : '대중교통 접근이 다소 불편합니다. 배후세대 도보 유입 중심으로 평가하십시오.',
      check: '가장 가까운 역·버스정류장 도보 시간, 출퇴근 피크 직접 방문',
    },
  ]

  const ROW_H = (FTRY - cy - 0.06) / locRows.length

  locRows.forEach((row, i) => {
    const ry  = cy + i * ROW_H
    const bg  = i % 2 === 0 ? C.WHITE : C.G_BG
    const cells = [row.item, row.cond, row.meaning, row.check]

    s.addShape(pptx.ShapeType.rect, { x: PX, y: ry, w: CW, h: ROW_H, fill: { color: bg }, line: { color: C.G_BD, pt: 0.3 } })

    cells.forEach((txt, ci) => {
      const cx = PX + colW.slice(0, ci).reduce((a, b) => a + b, 0)
      s.addText(txt, {
        x: cx + 0.07, y: ry + 0.04,
        w: colW[ci] - 0.12, h: ROW_H - 0.06,
        fontSize: ci === 0 ? 8.5 : 8,
        bold: ci === 0,
        color: ci === 0 ? C.NAVY : C.NAVY2,
        fontFace: FF, wrap: true,
        valign: ci === 0 ? 'middle' : 'top',
        lineSpacingMultiple: 1.25,
      })
    })
    // Divider after first column
    s.addShape(pptx.ShapeType.rect, {
      x: PX + colW[0], y: ry, w: 0.008, h: ROW_H,
      fill: { color: C.G_BD }, line: { color: C.G_BD },
    })
  })
}

// ─── SLIDE 04: 업종 적합성 ────────────────────────────────────

function slide04(pptx: any, analysis: AnalysisResult, store: Store, displayName: string) {
  const s = pptx.addSlide()
  addHeader(s, pptx, '업종 적합성', 4)
  addFooter(s, pptx, 4)

  let cy = CY
  const ba       = analysis.bizAnalysis
  const fitScore = analysis.scores.businessFit

  // Fit score card
  s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW, h: 0.54, fill: { color: C.G_BG }, line: { color: C.G_BD, pt: 0.75 } })
  s.addText(
    [
      { text: `업종 적합도  ${fitScore.grade}등급  (${fitScore.score}점)    `, options: { bold: true, fontSize: 10.5, color: C.NAVY } },
      { text: fitScore.interpretation, options: { fontSize: 9.5, color: C.NAVY2 } },
    ],
    { x: PX + 0.15, y: cy + 0.07, w: CW - 0.3, h: 0.42, fontFace: FF, wrap: true, valign: 'top' }
  )
  cy += 0.64

  if (!ba) {
    s.addText('업종 분석 데이터가 없습니다.', { x: PX, y: cy, w: CW, h: 0.4, fontSize: 11, color: C.G_TX, fontFace: FF })
    return
  }

  // Table header
  const colW = [3.2, 0.9, 3.37]   // sum = 7.47
  const hdrs = ['항목', '판정', '설명 · 근거']
  s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW, h: 0.3, fill: { color: C.NAVY }, line: { color: C.NAVY } })
  hdrs.forEach((h, i) => {
    const hx = PX + colW.slice(0, i).reduce((a, b) => a + b, 0)
    s.addText(h, { x: hx + 0.07, y: cy, w: colW[i] - 0.07, h: 0.3, fontSize: 8.5, bold: true, color: C.WHITE, valign: 'middle', fontFace: FF })
  })
  cy += 0.3

  type BizRow = { item: string; status: string; reason: string; color: string; bg: string }
  const allRows: BizRow[] = []
  ba.favorableFactors.forEach(f => {
    const [item, reason] = f.split('—').map(x => x.trim())
    allRows.push({ item: item ?? f, status: '유리', reason: reason ?? '', color: C.EM, bg: C.EM_BG })
  })
  ba.unfavorableFactors.forEach(f => {
    const [item, reason] = f.split('—').map(x => x.trim())
    allRows.push({ item: item ?? f, status: '주의', reason: reason ?? '', color: C.AM, bg: C.AM_BG })
  })
  ba.mustCheckFactors.forEach(f => {
    const [item, reason] = f.split('—').map(x => x.trim())
    allRows.push({ item: item ?? f, status: '미확인', reason: reason ?? '', color: C.G_TX, bg: C.G_BG })
  })
  ba.specificRisks.forEach(f => {
    const [item, reason] = f.split('—').map(x => x.trim())
    allRows.push({ item: item ?? f, status: '리스크', reason: reason ?? '', color: C.RED, bg: C.RED_BG })
  })

  const maxRows = Math.floor((FTRY - cy - 0.08) / 0.3)
  const ROW_H   = Math.min(0.32, (FTRY - cy - 0.08) / Math.min(allRows.length, maxRows))

  allRows.slice(0, maxRows).forEach((row, i) => {
    const ry = cy + i * ROW_H
    const bg = i % 2 === 0 ? C.WHITE : C.G_BG
    const cells: [string, number, string, string, boolean][] = [
      [row.item,   colW[0], bg,     C.NAVY2,   false],
      [row.status, colW[1], row.bg, row.color, true],
      [row.reason, colW[2], bg,     C.NAVY2,   false],
    ]
    cells.forEach(([txt, cw, cellBg, color, bold], ci) => {
      const cx = PX + colW.slice(0, ci).reduce((a, b) => a + b, 0)
      s.addShape(pptx.ShapeType.rect, { x: cx, y: ry, w: cw, h: ROW_H, fill: { color: cellBg }, line: { color: C.G_BD, pt: 0.4 } })
      s.addText(txt, { x: cx + 0.07, y: ry, w: cw - 0.1, h: ROW_H, fontSize: 8.5, color, bold, fontFace: FF, valign: 'middle', wrap: true })
    })
  })
}

// ─── SLIDE 05: 임대조건 및 수익성 ────────────────────────────

function slide05(pptx: any, analysis: AnalysisResult, store: Store, displayName: string) {
  const s = pptx.addSlide()
  addHeader(s, pptx, '임대조건 및 수익성 부담', 5)
  addFooter(s, pptx, 5)

  let cy = CY
  const ra           = analysis.rentAnalysis
  const totalMonthly = store.monthlyRent + store.maintenanceFee
  const rentScore    = analysis.scores.rent

  // Score card
  s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW, h: 0.52, fill: { color: C.G_BG }, line: { color: C.G_BD, pt: 0.75 } })
  s.addText(
    [
      { text: `임대조건 ${rentScore.grade}등급 (${rentScore.score}점)    `, options: { bold: true, fontSize: 10.5, color: C.NAVY } },
      { text: rentScore.interpretation, options: { fontSize: 9.5, color: C.NAVY2 } },
    ],
    { x: PX + 0.15, y: cy + 0.07, w: CW - 0.3, h: 0.4, fontFace: FF, wrap: true, valign: 'top' }
  )
  cy += 0.62

  // Rent table (left half)
  const LEFT_W = CW * 0.48
  cy = secHdr(s, pptx, PX, cy, '임대 조건')
  dataTable(s, [
    { label: '보증금',         value: formatMoney(store.deposit),                                          bold: true },
    { label: '월세',           value: formatMoney(store.monthlyRent),                                      bold: true },
    { label: '관리비',         value: store.maintenanceFee > 0 ? formatMoney(store.maintenanceFee) : '없음' },
    { label: '월 고정비 합계', value: formatMoney(totalMonthly),                                           bold: true },
    { label: '권리금',         value: store.premium > 0 ? formatMoney(store.premium) : '없음' },
  ], PX, cy, LEFT_W, 1.85)
  cy += 5 * 0.3 + 0.38

  if (ra) {
    cy = secHdr(s, pptx, PX, cy, '임대료 부담 분석')

    const rlCfg = {
      low:     { label: '관리 가능', bg: C.EM_BG,  color: C.EM },
      caution: { label: '주의 구간', bg: C.AM_BG,  color: C.AM },
      high:    { label: '고부담',    bg: C.RED_BG, color: C.RED },
      unknown: { label: '계산 불가', bg: C.G_BG,   color: C.G_TX },
    }[ra.riskLevel]

    // 3 metric cards
    const cW3 = (CW - 0.12) / 3
    const metricCards = [
      { label: '임대료 비율',     value: ra.rentRatioPct !== null ? `${ra.rentRatioPct.toFixed(1)}%` : '—', sub: '월세 ÷ 예상매출' },
      { label: '10% 기준 필요매출', value: formatMoney(ra.referenceSalesAt10pct), sub: '참고값 (손익분기 아님)' },
      { label: '12% 기준 필요매출', value: formatMoney(ra.referenceSalesAt12pct), sub: '고부담 임계점' },
    ]
    metricCards.forEach((mc, i) => {
      const cx = PX + i * (cW3 + 0.06)
      s.addShape(pptx.ShapeType.rect, { x: cx, y: cy, w: cW3, h: 0.9, fill: { color: C.G_BG }, line: { color: C.G_BD, pt: 0.75 } })
      s.addText(mc.label, { x: cx + 0.08, y: cy + 0.06, w: cW3 - 0.16, h: 0.2, fontSize: 8, color: C.G_TX, align: 'center', fontFace: FF })
      s.addText(mc.value, { x: cx + 0.08, y: cy + 0.27, w: cW3 - 0.16, h: 0.38, fontSize: 18, bold: true, color: C.DARK, align: 'center', fontFace: FF })
      s.addText(mc.sub, { x: cx + 0.08, y: cy + 0.67, w: cW3 - 0.16, h: 0.18, fontSize: 7, color: C.G_TX, align: 'center', fontFace: FF })
    })
    cy += 1.0

    // Risk badge
    s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: 1.4, h: 0.3, fill: { color: rlCfg.bg }, line: { color: C.G_BD, pt: 0.5 } })
    s.addText(rlCfg.label, { x: PX, y: cy, w: 1.4, h: 0.3, fontSize: 9, bold: true, color: rlCfg.color, align: 'center', valign: 'middle', fontFace: FF })
    s.addText(ra.interpretation, { x: PX + 1.55, y: cy, w: CW - 1.55, h: 0.3, fontSize: 9, color: C.NAVY2, valign: 'middle', fontFace: FF, wrap: true })
    cy += 0.42
  }

  // Expected sales / hint
  if (store.expectedMonthlySales && store.expectedMonthlySales > 0) {
    cy = secHdr(s, pptx, PX, cy, '손익 시뮬레이션 (입력값 기준 참고)')
    dataTable(s, [
      { label: '입력된 예상 월매출',       value: formatMoney(store.expectedMonthlySales), bold: true },
      { label: '월 고정비 (월세+관리비)',   value: `− ${formatMoney(totalMonthly)}`,        bold: true },
      { label: '인건비·재료비·변동비',      value: '별도 계산 필요' },
    ], PX, cy, CW, 2.0)
  } else if (ra) {
    s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW, h: 0.42, fill: { color: C.NAVY_DK }, line: { color: C.NAVY_DK } })
    s.addText(
      `예상매출 미입력 — 월세 ${formatMoney(store.monthlyRent)}를 10% 기준으로 관리하려면 약 ${formatMoney(ra.referenceSalesAt10pct)}의 월매출이 필요합니다. (임대료 부담 판단용 참고값)`,
      { x: PX + 0.15, y: cy + 0.04, w: CW - 0.3, h: 0.34, fontSize: 9, color: '93C5FD', fontFace: FF, wrap: true }
    )
  }
}

// ─── SLIDE 06: 주요 위험요인 ──────────────────────────────────

function slide06(pptx: any, analysis: AnalysisResult, _store: Store, _displayName: string) {
  const s = pptx.addSlide()
  addHeader(s, pptx, '주요 위험요인', 6)
  addFooter(s, pptx, 6)

  let cy = CY
  const risks     = analysis.risks
  const riskScore = analysis.scores.totalRisk

  // Risk score card
  s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW, h: 0.46, fill: { color: C.G_BG }, line: { color: C.G_BD, pt: 0.75 } })
  s.addText(
    [
      { text: `위험요인 점수  ${riskScore.grade}등급  (${riskScore.score}점)    `, options: { bold: true, fontSize: 10, color: C.NAVY } },
      { text: riskScore.interpretation, options: { fontSize: 9, color: C.NAVY2 } },
    ],
    { x: PX + 0.15, y: cy + 0.06, w: CW - 0.3, h: 0.36, fontFace: FF, wrap: true, valign: 'top' }
  )
  cy += 0.56

  if (risks.length === 0) {
    s.addText('주요 위험요인이 감지되지 않았습니다.', { x: PX, y: cy, w: CW, h: 0.4, fontSize: 11, color: C.EM, fontFace: FF })
    return
  }

  const palette = [
    { hBg: 'DC2626', body: C.RED_BG },
    { hBg: 'B45309', body: C.AM_BG },
    { hBg: '92400E', body: 'FEF9C3' },
    { hBg: '7C3AED', body: 'EDE9FE' },
    { hBg: '0369A1', body: 'E0F2FE' },
  ]
  const BLOCK_H = Math.min(1.85, (FTRY - cy) / risks.length - 0.06)
  const col3W   = (CW - 0.26) / 3

  risks.forEach((risk, i) => {
    const by  = cy + i * (BLOCK_H + 0.06)
    const pal = palette[i % palette.length]
    const bodyH = BLOCK_H - 0.3

    s.addShape(pptx.ShapeType.rect, { x: PX, y: by, w: CW, h: 0.3, fill: { color: pal.hBg }, line: { color: pal.hBg } })
    s.addText(`${i + 1}.  ${risk.title}`, { x: PX + 0.12, y: by, w: 6.2, h: 0.3, fontSize: 10, bold: true, color: C.WHITE, valign: 'middle', fontFace: FF })
    s.addText(risk.data, { x: PX + 6.3, y: by, w: CW - 6.3, h: 0.3, fontSize: 8.5, color: 'FCA5A5', align: 'right', valign: 'middle', fontFace: FF })

    s.addShape(pptx.ShapeType.rect, { x: PX, y: by + 0.3, w: CW, h: bodyH, fill: { color: pal.body }, line: { color: C.G_BD, pt: 0.4 } })
    ;[
      { label: '의미',      text: risk.interpretation },
      { label: '업종 영향', text: risk.impact },
      { label: '대응 방법', text: risk.action ?? '계약 전 현장 직접 확인 및 임대인 서면 확인 요청' },
    ].forEach((col3, ci) => {
      const cx = PX + 0.1 + ci * (col3W + 0.03)
      s.addText(col3.label, { x: cx, y: by + 0.36, w: col3W, h: 0.18, fontSize: 7.5, bold: true, color: C.G_TX, fontFace: FF })
      s.addText(col3.text, { x: cx, y: by + 0.55, w: col3W - 0.06, h: bodyH - 0.3, fontSize: 8.5, color: C.DARK, fontFace: FF, wrap: true, valign: 'top', lineSpacingMultiple: 1.25 })
    })
  })
}

// ─── SLIDE 07: 계약 전 현장 확인사항 ─────────────────────────

function slide07(pptx: any, analysis: AnalysisResult, _store: Store, _displayName: string) {
  const s = pptx.addSlide()
  addHeader(s, pptx, '계약 전 현장 확인사항', 7)
  addFooter(s, pptx, 7)

  let cy = CY
  const checks   = analysis.contractChecks
  const verified = checks.filter(c => c.status === 'verified').length
  const concern  = checks.filter(c => c.status === 'concern').length

  // Stats bar
  s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW, h: 0.3, fill: { color: C.G_BG }, line: { color: C.G_BD, pt: 0.5 } })
  s.addText(
    `전체 ${checks.length}항목   확인완료 ${verified}   우려사항 ${concern}   미확인 ${checks.length - verified - concern}`,
    { x: PX + 0.15, y: cy, w: CW - 0.3, h: 0.3, fontSize: 9, bold: true, color: C.NAVY, valign: 'middle', fontFace: FF }
  )
  cy += 0.38

  const statusCfg = {
    verified:  { label: '완료',  bg: C.EM_BG,  color: C.EM },
    concern:   { label: '우려',  bg: C.RED_BG, color: C.RED },
    unchecked: { label: '미확인', bg: C.G_BG,  color: C.G_TX },
  }

  const MID   = Math.ceil(checks.length / 2)
  const left  = checks.slice(0, MID)
  const right = checks.slice(MID)
  const COL_W = (CW - 0.08) / 2
  const COL2X = PX + COL_W + 0.08
  const ROW_H = Math.min(0.32, (FTRY - cy - 1.1) / MID)

  // Headers (both columns)
  ;[PX, COL2X].forEach(cxN => {
    s.addShape(pptx.ShapeType.rect, { x: cxN, y: cy, w: COL_W, h: 0.26, fill: { color: C.NAVY }, line: { color: C.NAVY } })
    s.addText('카테고리', { x: cxN + 0.06, y: cy, w: 0.82, h: 0.26, fontSize: 8, bold: true, color: C.WHITE, valign: 'middle', fontFace: FF })
    s.addText('확인 항목', { x: cxN + 0.92, y: cy, w: COL_W - 1.4, h: 0.26, fontSize: 8, bold: true, color: C.WHITE, valign: 'middle', fontFace: FF })
    s.addText('상태', { x: cxN + COL_W - 0.44, y: cy, w: 0.38, h: 0.26, fontSize: 8, bold: true, color: C.WHITE, valign: 'middle', fontFace: FF })
  })
  cy += 0.26

  const renderItems = (items: typeof checks, cxN: number) => {
    items.forEach((chk, i) => {
      const ry  = cy + i * ROW_H
      const bg  = i % 2 === 0 ? C.WHITE : C.G_BG
      const sc  = statusCfg[chk.status] ?? statusCfg.unchecked

      s.addShape(pptx.ShapeType.rect, { x: cxN, y: ry, w: COL_W, h: ROW_H, fill: { color: bg }, line: { color: C.G_BD, pt: 0.35 } })
      s.addText(chk.category, { x: cxN + 0.06, y: ry, w: 0.82, h: ROW_H, fontSize: 7.5, color: C.G_TX, valign: 'middle', fontFace: FF, wrap: true })
      s.addText(chk.item,     { x: cxN + 0.92, y: ry, w: COL_W - 1.44, h: ROW_H, fontSize: 8, color: C.NAVY2, valign: 'middle', fontFace: FF, wrap: true })
      s.addShape(pptx.ShapeType.rect, { x: cxN + COL_W - 0.44, y: ry + 0.04, w: 0.38, h: ROW_H - 0.08, fill: { color: sc.bg }, line: { color: C.G_BD, pt: 0.3 } })
      s.addText(sc.label, { x: cxN + COL_W - 0.44, y: ry + 0.04, w: 0.38, h: ROW_H - 0.08, fontSize: 6.5, bold: true, color: sc.color, align: 'center', valign: 'middle', fontFace: FF })
    })
  }

  renderItems(left, PX)
  renderItems(right, COL2X)
  cy += MID * ROW_H + 0.15

  // Additional must-check items
  const mustCheck = analysis.bizAnalysis?.mustCheckFactors ?? []
  if (mustCheck.length && cy < FTRY - 0.75) {
    cy = secHdr(s, pptx, PX, cy, '현장 방문 시 추가 확인 권고사항')
    const ITEM_H = Math.min(0.28, (FTRY - cy - 0.06) / mustCheck.length)
    mustCheck.forEach((item, i) => {
      const iy = cy + i * ITEM_H
      s.addShape(pptx.ShapeType.rect, { x: PX, y: iy, w: CW, h: ITEM_H, fill: { color: i % 2 === 0 ? C.WHITE : C.G_BG }, line: { color: C.G_BD, pt: 0.3 } })
      s.addText(`·  ${item}`, { x: PX + 0.1, y: iy, w: CW - 0.2, h: ITEM_H, fontSize: 8.5, color: C.NAVY2, valign: 'middle', fontFace: FF, wrap: true })
    })
  }
}

// ─── SLIDE 08: 상권데이터 현황 ────────────────────────────────

function slide08(pptx: any, store: Store) {
  const s = pptx.addSlide()
  addHeader(s, pptx, '상권데이터 현황', 8)
  addFooter(s, pptx, 8)

  let cy = CY

  s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW, h: 0.5, fill: { color: C.G_BG }, line: { color: C.G_BD, pt: 0.75 } })
  s.addText(
    '현재 모든 상권 데이터 항목이 미연결 상태입니다. 향후 데이터 연계 시 분석 정밀도가 크게 향상됩니다.',
    { x: PX + 0.15, y: cy + 0.06, w: CW - 0.3, h: 0.38, fontSize: 9.5, color: C.NAVY2, fontFace: FF, wrap: true }
  )
  cy += 0.62

  const dataItems = [
    { title: '유동인구 데이터',   desc: '시간대별·요일별 보행 유동인구 분석',                   alt: '피크타임 직접 방문 실측 카운팅 권고' },
    { title: '생활인구 데이터',   desc: '배후 세대수·연령대별 거주 인구 분석',                  alt: '부동산 플랫폼 또는 시·군·구청 통계 참고' },
    { title: '상권 매출 데이터',  desc: '동종업종 평균 매출·매출 변화율',                       alt: '소상공인진흥공단 상권분석 서비스 활용 가능' },
    { title: '경쟁 업종 현황',    desc: `반경 500m 내 ${store.desiredBusiness} 업종 수·신규/폐업`, alt: '현장 직접 도보 조사 및 배달앱 검색 병행' },
    { title: '폐업률 데이터',     desc: '해당 상권·업종 폐업률 및 생존율',                      alt: '소상공인진흥공단 통계 (업종별 3년 생존율)' },
    { title: '임대료 시세 데이터', desc: '동일 상권 내 동종 면적 평균 임대료',                  alt: '인근 부동산 중개소 2~3곳 방문 시세 확인' },
  ]

  const COLS  = 3
  const CRD_W = (CW - 0.12 * (COLS - 1)) / COLS
  const CRD_H = (FTRY - cy - 0.06) / 2 - 0.08

  dataItems.forEach((item, i) => {
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const cx  = PX + col * (CRD_W + 0.12)
    const iy  = cy + row * (CRD_H + 0.08)

    s.addShape(pptx.ShapeType.rect, { x: cx, y: iy, w: CRD_W, h: CRD_H, fill: { color: C.WHITE }, line: { color: C.G_BD, pt: 0.75 } })
    s.addShape(pptx.ShapeType.rect, { x: cx, y: iy, w: CRD_W, h: 0.28, fill: { color: C.NAVY2 }, line: { color: C.NAVY2 } })
    s.addText(item.title, { x: cx + 0.1, y: iy, w: CRD_W - 1.0, h: 0.28, fontSize: 9, bold: true, color: C.WHITE, valign: 'middle', fontFace: FF })
    s.addText('미연결', { x: cx + CRD_W - 0.9, y: iy, w: 0.8, h: 0.28, fontSize: 8, color: '94A3B8', align: 'right', valign: 'middle', fontFace: FF })
    s.addText(item.desc, { x: cx + 0.1, y: iy + 0.34, w: CRD_W - 0.2, h: 0.36, fontSize: 8.5, color: C.G_TX, fontFace: FF, wrap: true })
    s.addShape(pptx.ShapeType.rect, { x: cx + 0.08, y: iy + CRD_H - 0.52, w: CRD_W - 0.16, h: 0.42, fill: { color: C.AM_BG }, line: { color: 'FDE68A', pt: 0.4 } })
    s.addText(`현장 대안: ${item.alt}`, { x: cx + 0.16, y: iy + CRD_H - 0.47, w: CRD_W - 0.32, h: 0.36, fontSize: 8, color: C.AM, fontFace: FF, wrap: true })
  })
}

// ─── SLIDE 09: 최종 종합의견 ──────────────────────────────────

function slide09(pptx: any, analysis: AnalysisResult, store: Store, displayName: string) {
  const s = pptx.addSlide()
  addHeader(s, pptx, '최종 종합의견', 9)
  addFooter(s, pptx, 9)

  let cy = CY
  const ra    = analysis.rentAnalysis
  const grade = analysis.overallGrade
  const biz   = store.desiredBusiness

  // Verdict card + grade box
  const VERD_W = CW - 2.3
  s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: VERD_W, h: 0.9, fill: { color: C.G_BG }, line: { color: C.G_BD, pt: 1.5 } })
  s.addText(RECOMMENDATION_LABELS[analysis.recommendation], { x: PX + 0.18, y: cy + 0.08, w: VERD_W - 0.28, h: 0.38, fontSize: 15, bold: true, color: C.NAVY, fontFace: FF })
  s.addText(`종합 점수  ${analysis.overallScore}점  ·  ${analysis.overallGrade}등급`, { x: PX + 0.18, y: cy + 0.52, w: VERD_W - 0.28, h: 0.28, fontSize: 10, color: C.G_TX, fontFace: FF })

  const GX = PX + VERD_W + 0.12
  const GW = CW - VERD_W - 0.12
  s.addShape(pptx.ShapeType.rect, { x: GX, y: cy, w: GW, h: 0.9, fill: { color: C.NAVY }, line: { color: C.NAVY3, pt: 1.5 } })
  s.addText(analysis.overallGrade, { x: GX, y: cy, w: GW * 0.55, h: 0.9, fontSize: 44, bold: true, color: C.WHITE, align: 'center', valign: 'middle', fontFace: FF })
  s.addText(`${analysis.overallScore}점`, { x: GX + GW * 0.55, y: cy, w: GW * 0.45, h: 0.9, fontSize: 14, color: '94A3B8', align: 'center', valign: 'middle', fontFace: FF })
  cy += 1.04

  // Opinion paragraphs (5)
  const p1 = grade === 'A+' || grade === 'A'
    ? `${displayName} 점포는 종합 분석 결과 ${grade}등급(${analysis.overallScore}점)으로 ${biz} 출점을 우선 검토할 수 있는 조건을 갖추고 있습니다. 입력된 점포 조건을 종합하면 해당 업종 운영에 필요한 기본 요건을 충족하며, 반드시 현장 방문을 통해 실제 환경을 확인하십시오.`
    : grade === 'B+' || grade === 'B'
      ? `${displayName} 점포는 종합 분석 결과 ${grade}등급(${analysis.overallScore}점)으로 ${biz} 출점을 조건부로 검토할 수 있는 수준입니다. 일부 유리한 요소가 확인되지만 리스크도 병존하므로 계약 전 추가 검토와 현장 재확인이 필수입니다.`
      : `${displayName} 점포는 종합 분석 결과 ${grade}등급(${analysis.overallScore}점)으로 ${biz} 출점에 앞서 위험요인과 임대조건을 보수적으로 재검토할 필요가 있습니다. 임대인과의 조건 협상 및 현장 점검을 철저히 진행할 것을 권고합니다.`

  const p2 = ra
    ? ra.rentRatioPct !== null
      ? `임대료 측면에서 월세 ${formatMoney(ra.monthlyRent)}는 예상매출 기준 ${ra.rentRatioPct.toFixed(1)}% 수준입니다. ${ra.interpretation} 임대료 부담률이 ${ra.riskLevel === 'high' ? '기준치를 초과하므로 임대 협상 또는 초기 매출 계획을 보수적으로 수립하십시오.' : ra.riskLevel === 'caution' ? '주의 구간에 진입하였으므로 매출 안정화 전략을 수립하십시오.' : '관리 가능한 수준입니다.'}`
      : `월세 ${formatMoney(ra.monthlyRent)}를 10% 기준으로 관리하려면 약 ${formatMoney(ra.referenceSalesAt10pct)}의 월매출이 필요합니다. (임대료 부담 판단용 참고값)`
    : '임대조건과 예상매출을 함께 검토하여 임대료 부담률을 사전에 계산하십시오.'

  const p3 = '경쟁환경 데이터는 현재 미연결 상태입니다. 반경 300~500m 내 동종업종 수와 최근 폐업 현황을 현장에서 직접 확인해야 합니다.'
  const p4 = '계약서 작성 전 건물 용도·영업 가능 업종·원상복구 범위·재계약 우선권을 법률 전문가와 함께 검토할 것을 강력히 권고합니다.'
  const p5 = analysis.strengths.length > 0
    ? `핵심 강점(${analysis.strengths.slice(0, 3).map(x => x.title).join(' / ')})을 최대한 활용하는 운영 전략을 수립하고, 확인된 위험요인에 대한 사전 대응 계획을 마련하십시오.`
    : '확인된 위험요인에 대한 사전 대응 계획을 마련하고, 초기 운영 비용을 보수적으로 계획하십시오.'

  const paragraphs = [p1, p2, p3, p4, p5]
  const parH = Math.min(1.18, (FTRY - cy - 0.42) / paragraphs.length - 0.05)

  paragraphs.forEach((p, i) => {
    s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW, h: parH, fill: { color: i % 2 === 0 ? C.WHITE : C.G_BG }, line: { color: C.G_BD, pt: 0.4 } })
    s.addText(p, { x: PX + 0.15, y: cy + 0.07, w: CW - 0.3, h: parH - 0.1, fontSize: 9.5, color: C.NAVY2, fontFace: FF, wrap: true, valign: 'top', lineSpacingMultiple: 1.35 })
    cy += parH + 0.05
  })

  s.addText(
    '본 리포트는 입력 데이터 기반 참고자료입니다. 최종 계약 결정은 현장 방문·법률·세무 전문가 검토를 병행하십시오. 상권연구소 AI PRO V0.1은 의사결정 지원 서비스이며 투자 성과를 보장하지 않습니다.',
    { x: PX, y: Math.min(cy + 0.08, FTRY - 0.3), w: CW, h: 0.26, fontSize: 7.5, color: C.G_TX, fontFace: FF, wrap: true }
  )
}

// ─── Main export ──────────────────────────────────────────────

export async function generateReportPpt(analysis: AnalysisResult, store: Store): Promise<void> {
  const { default: PptxGenJS } = await import('pptxgenjs')
  const pptx = new PptxGenJS()

  // A4 Portrait (ISO A4)
  pptx.defineLayout({ name: 'A4_PORTRAIT', width: 8.27, height: 11.69 })
  pptx.layout  = 'A4_PORTRAIT'
  pptx.author  = '상권연구소 AI PRO'
  pptx.company = '상권연구소 AI PRO'
  pptx.subject = '점포 입지 분석 리포트'

  const displayName = store.address || store.name

  slide01(pptx, analysis, store, displayName)   // 01 표지 + Executive Summary
  slide02(pptx, analysis, store, displayName)   // 02 점포 기본조건
  slide03(pptx, analysis, store, displayName)   // 03 입지 분석
  slide04(pptx, analysis, store, displayName)   // 04 업종 적합성
  slide05(pptx, analysis, store, displayName)   // 05 임대조건 및 수익성
  slide06(pptx, analysis, store, displayName)   // 06 주요 위험요인
  slide07(pptx, analysis, store, displayName)   // 07 계약 전 현장 확인사항
  slide08(pptx, store)                          // 08 상권데이터 현황
  slide09(pptx, analysis, store, displayName)   // 09 최종 종합의견

  const addrClean = (store.address || store.name)
    .replace(/\s+/g, '').replace(/번지$/, '').slice(0, 12)
  const bizClean  = store.desiredBusiness.replace(/\s+/g, '').slice(0, 6)
  const fileName  = `상권연구소AI_점포입지분석_${addrClean}_${bizClean}.pptx`

  await pptx.writeFile({ fileName })
}
