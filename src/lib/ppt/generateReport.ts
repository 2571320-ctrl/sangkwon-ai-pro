/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * generateReport.ts — Premium Consulting PPT Report
 * A4 Portrait 8.27" × 11.69" — 10 slides
 */

import type { AnalysisResult, Store } from '@/types'
import {
  FLOOR_LABELS, VISIBILITY_LABELS, ACCESS_LABELS,
  RECOMMENDATION_LABELS, BIZ_CATEGORY_LABELS,
} from '@/types'
import { formatMoney } from '@/lib/utils'

// ─── Color System ─────────────────────────────────────────────
const C = {
  NAVY:    '0B1120',
  NAVY2:   '1E293B',
  NAVY3:   '334155',
  WHITE:   'FFFFFF',
  G100:    'F8FAFC',
  G200:    'F1F5F9',
  G300:    'E2E8F0',
  G500:    '94A3B8',
  G700:    '64748B',
  DARK:    '0F172A',
  GREEN:   '0D7B4A',
  GREEN_L: 'DCFCE7',
  AMBER:   'A0540A',
  AMBER_L: 'FEF3C7',
  RED:     'B91C1C',
  RED_L:   'FEE2E2',
  BLUE:    '1558A7',
  BLUE_M:  '2563EB',
  BLUE_L:  'DBEAFE',
}

// ─── Layout ───────────────────────────────────────────────────
const W    = 8.27
const H    = 11.69
const HDR  = 0.50
const FTR  = 0.26
const FTRY = H - FTR   // 11.43
const PX   = 0.45
const CW   = W - PX * 2   // 7.37
const CY   = HDR + 0.22   // 0.72
const FF   = 'Malgun Gothic'
const TOTAL = 10

// ─── Helpers ──────────────────────────────────────────────────

function accLbl(v?: string) {
  return (ACCESS_LABELS as Record<string, string>)[v ?? ''] ?? '미확인'
}

function gradeColor(score: number): string {
  if (score >= 80) return C.GREEN
  if (score >= 65) return C.BLUE
  if (score >= 50) return C.AMBER
  return C.RED
}

function addHeader(s: any, pptx: any, title: string, num: number) {
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: HDR, fill: { color: C.NAVY }, line: { color: C.NAVY } })
  s.addShape(pptx.ShapeType.rect, { x: PX, y: 0.13, w: 0.032, h: 0.24, fill: { color: C.BLUE_M }, line: { color: C.BLUE_M } })
  s.addText(title, { x: PX + 0.10, y: 0, w: 5.8, h: HDR, fontSize: 13, bold: true, color: C.WHITE, valign: 'middle', fontFace: FF })
  s.addText(`${String(num).padStart(2, '0')} / ${String(TOTAL).padStart(2, '0')}`, {
    x: 7.0, y: 0, w: 1.0, h: HDR, fontSize: 10, color: C.G500, align: 'right', valign: 'middle', fontFace: FF,
  })
}

function addFooter(s: any, pptx: any, num: number) {
  s.addShape(pptx.ShapeType.rect, { x: 0, y: FTRY, w: W, h: FTR, fill: { color: C.NAVY }, line: { color: C.NAVY } })
  s.addText('상권연구소 AI PRO  ·  점포 입지 분석 리포트', {
    x: PX, y: FTRY, w: 5.8, h: FTR, fontSize: 7.5, color: 'CBD5E1', valign: 'middle', fontFace: FF,
  })
  s.addText(`${String(num).padStart(2, '0')} / ${String(TOTAL).padStart(2, '0')}`, {
    x: 6.9, y: FTRY, w: 1.1, h: FTR, fontSize: 8, color: C.WHITE, align: 'right', valign: 'middle', fontFace: FF,
  })
}

// Section header: thick left accent + bold uppercase label + gray underline
function secHdr(s: any, pptx: any, x: number, y: number, label: string, w?: number): number {
  const sw = w ?? (CW - (x - PX))
  s.addShape(pptx.ShapeType.rect, { x, y: y + 0.02, w: 0.06, h: 0.24, fill: { color: C.BLUE }, line: { color: C.BLUE } })
  s.addText(label.toUpperCase(), { x: x + 0.12, y, w: sw - 0.12, h: 0.28, fontSize: 9.5, bold: true, color: C.NAVY, fontFace: FF, charSpacing: 1.0 })
  s.addShape(pptx.ShapeType.rect, { x, y: y + 0.30, w: sw, h: 0.012, fill: { color: C.G300 }, line: { color: C.G300 } })
  return y + 0.42
}

// Premium horizontal score bar (thick, color-coded)
function scoreBar(s: any, pptx: any, x: number, y: number, w: number, label: string, score: number, grade: string, color: string) {
  const LW = 1.65
  const bx = x + LW + 0.10
  const bw = w - LW - 0.96
  const bh = 0.22
  const by = y + 0.07

  s.addText(label, { x, y, w: LW, h: 0.36, fontSize: 11, color: C.NAVY2, fontFace: FF, valign: 'middle' })
  // Track
  s.addShape(pptx.ShapeType.rect, { x: bx, y: by, w: bw, h: bh, fill: { color: C.G300 }, line: { color: C.G300 } })
  // Fill
  const fw = Math.max(0.10, Math.min(1, score / 100) * bw)
  s.addShape(pptx.ShapeType.rect, { x: bx, y: by, w: fw, h: bh, fill: { color }, line: { color } })
  // Score + grade tag
  s.addShape(pptx.ShapeType.rect, { x: bx + bw + 0.08, y: by - 0.02, w: 0.84, h: bh + 0.04, fill: { color: C.G200 }, line: { color: C.G300, pt: 0.6 } })
  s.addText(`${score}점`, { x: bx + bw + 0.08, y, w: 0.52, h: 0.36, fontSize: 11, bold: true, color, fontFace: FF, valign: 'middle', align: 'center' })
  s.addText(grade, { x: bx + bw + 0.60, y, w: 0.32, h: 0.36, fontSize: 11, bold: true, color: C.G700, fontFace: FF, valign: 'middle' })
}

// Large metric card with top accent bar and big number
function bigCard(s: any, pptx: any, x: number, y: number, w: number, h: number, label: string, value: string, sub?: string, accent = C.NAVY) {
  s.addShape(pptx.ShapeType.rect, { x, y, w, h, fill: { color: C.WHITE }, line: { color: C.G300, pt: 0.8 } })
  s.addShape(pptx.ShapeType.rect, { x, y, w, h: 0.048, fill: { color: accent }, line: { color: accent } })
  s.addText(label, { x: x + 0.15, y: y + 0.10, w: w - 0.30, h: 0.24, fontSize: 9, color: C.G700, fontFace: FF })
  const valFontSize = value.length > 8 ? 16 : value.length > 5 ? 20 : 24
  s.addText(value, { x: x + 0.15, y: y + 0.30, w: w - 0.30, h: h - 0.60, fontSize: valFontSize, bold: true, color: C.DARK, fontFace: FF, wrap: true, valign: 'middle' })
  if (sub) s.addText(sub, { x: x + 0.15, y: y + h - 0.26, w: w - 0.30, h: 0.22, fontSize: 8.5, color: C.G700, fontFace: FF })
}

// Row in a data table
function tRow(s: any, pptx: any, x: number, y: number, w: number, h: number, lbl: string, val: string, bg: string, lw = 1.55) {
  s.addShape(pptx.ShapeType.rect, { x, y, w, h, fill: { color: bg }, line: { color: C.G300, pt: 0.45 } })
  s.addText(lbl, { x: x + 0.10, y, w: lw, h, fontSize: 10, color: C.G700, fontFace: FF, valign: 'middle' })
  s.addText(val, { x: x + lw + 0.08, y, w: w - lw - 0.16, h, fontSize: 11, bold: true, color: C.NAVY2, fontFace: FF, valign: 'middle', wrap: true })
}

// ─── SLIDE 01: 표지 + Executive Summary ─────────────────────

function slide01(pptx: any, analysis: AnalysisResult, store: Store, displayName: string) {
  const s = pptx.addSlide()

  const HERO = 5.30

  // Navy hero background
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: HERO, fill: { color: C.NAVY }, line: { color: C.NAVY } })
  // Top accent line (blue)
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.028, fill: { color: C.BLUE_M }, line: { color: C.BLUE_M } })

  // Brand label
  s.addText('상권연구소 AI PRO  ·  STORE LOCATION ANALYSIS REPORT', {
    x: PX, y: 0.36, w: 5.2, h: 0.24, fontSize: 8, color: '60A5FA', bold: true, fontFace: FF,
  })

  // Store address — large headline
  s.addText(displayName, {
    x: PX, y: 0.68, w: 5.10, h: 1.00, fontSize: 30, bold: true, color: C.WHITE, fontFace: FF, wrap: true,
  })

  // Business · Floor · Area
  s.addText(`${store.desiredBusiness}  ·  ${FLOOR_LABELS[store.floor]}  ·  ${store.areaPyeong}평`, {
    x: PX, y: 1.76, w: 5.10, h: 0.34, fontSize: 13, color: C.G500, fontFace: FF,
  })

  // Separator line
  s.addShape(pptx.ShapeType.rect, { x: PX, y: 2.24, w: 1.6, h: 0.020, fill: { color: C.BLUE_M }, line: { color: C.BLUE_M } })

  // Analysis date
  s.addText(`분석일  ${new Date(analysis.createdAt).toLocaleDateString('ko-KR')}`, {
    x: PX, y: 2.38, w: 5.10, h: 0.28, fontSize: 10.5, color: C.G500, fontFace: FF,
  })

  // Verdict label (large, prominent)
  const recLabel = RECOMMENDATION_LABELS[analysis.recommendation]
  s.addText(recLabel, {
    x: PX, y: 2.80, w: 5.10, h: 0.52, fontSize: 22, bold: true, color: '60A5FA', fontFace: FF,
  })

  // Summary text
  s.addText(analysis.summary.slice(0, 180), {
    x: PX, y: 3.42, w: 5.05, h: 1.65, fontSize: 10, color: 'CBD5E1', fontFace: FF, wrap: true, valign: 'top', lineSpacingMultiple: 1.45,
  })

  // ── Grade card (right panel) ──
  const GX = 5.68
  const GW = 2.18
  s.addShape(pptx.ShapeType.rect, { x: GX, y: 0.52, w: GW, h: 4.46, fill: { color: '0D1B2E' }, line: { color: C.NAVY3, pt: 1.2 } })

  // Grade letter
  s.addText(analysis.overallGrade, {
    x: GX, y: 0.75, w: GW, h: 1.80, fontSize: 82, bold: true, color: C.WHITE, align: 'center', fontFace: FF,
  })

  // Score
  s.addText(`${analysis.overallScore}`, {
    x: GX, y: 2.58, w: GW, h: 0.60, fontSize: 28, bold: true, color: '60A5FA', align: 'center', fontFace: FF,
  })
  s.addText('점', {
    x: GX, y: 3.10, w: GW, h: 0.28, fontSize: 12, color: C.G500, align: 'center', fontFace: FF,
  })

  // Gauge bar
  const gbx = GX + 0.20
  const gbw = GW - 0.40
  s.addShape(pptx.ShapeType.rect, { x: gbx, y: 3.48, w: gbw, h: 0.14, fill: { color: C.NAVY3 }, line: { color: C.NAVY3 } })
  s.addShape(pptx.ShapeType.rect, { x: gbx, y: 3.48, w: Math.max(0.10, (analysis.overallScore / 100) * gbw), h: 0.14, fill: { color: C.BLUE_M }, line: { color: C.BLUE_M } })

  // Verdict in grade card
  s.addText('종합 등급', { x: GX, y: 3.72, w: GW, h: 0.22, fontSize: 8.5, color: C.G500, align: 'center', fontFace: FF })
  s.addText(recLabel, {
    x: GX + 0.12, y: 4.02, w: GW - 0.24, h: 0.82, fontSize: 9.5, bold: true, color: '93C5FD', align: 'center', fontFace: FF, wrap: true,
  })

  // ── Bottom section (white) ──────────────
  const BY = HERO + 0.12
  const COL_W = (CW - 0.14) / 2
  const COL2X = PX + COL_W + 0.14

  // Strength header
  s.addShape(pptx.ShapeType.rect, { x: PX, y: BY, w: COL_W, h: 0.32, fill: { color: C.GREEN_L }, line: { color: C.G300, pt: 0.6 } })
  s.addShape(pptx.ShapeType.rect, { x: PX, y: BY, w: 0.04, h: 0.32, fill: { color: C.GREEN }, line: { color: C.GREEN } })
  s.addText('▲  핵심 강점  TOP 3', { x: PX + 0.12, y: BY, w: COL_W - 0.16, h: 0.32, fontSize: 9.5, bold: true, color: C.GREEN, valign: 'middle', fontFace: FF })

  // Risk header
  s.addShape(pptx.ShapeType.rect, { x: COL2X, y: BY, w: COL_W, h: 0.32, fill: { color: C.RED_L }, line: { color: C.G300, pt: 0.6 } })
  s.addShape(pptx.ShapeType.rect, { x: COL2X, y: BY, w: 0.04, h: 0.32, fill: { color: C.RED }, line: { color: C.RED } })
  s.addText('▼  핵심 위험  TOP 3', { x: COL2X + 0.12, y: BY, w: COL_W - 0.16, h: 0.32, fontSize: 9.5, bold: true, color: C.RED, valign: 'middle', fontFace: FF })

  const itemStart = BY + 0.32
  const MAX = 3
  const ITEM_H = Math.min(0.90, (FTRY - itemStart - 0.10) / MAX)

  analysis.strengths.slice(0, MAX).forEach((item, i) => {
    const iy = itemStart + i * ITEM_H
    s.addShape(pptx.ShapeType.rect, { x: PX, y: iy, w: COL_W, h: ITEM_H - 0.01, fill: { color: i % 2 === 0 ? C.WHITE : C.G100 }, line: { color: C.G300, pt: 0.45 } })
    s.addShape(pptx.ShapeType.rect, { x: PX, y: iy, w: 0.04, h: ITEM_H - 0.01, fill: { color: C.GREEN }, line: { color: C.GREEN } })
    s.addText(
      [
        { text: item.title, options: { bold: true, fontSize: 10.5, color: C.DARK } },
        { text: '\n' + item.interpretation.slice(0, 110), options: { fontSize: 9.5, color: C.G700 } },
      ],
      { x: PX + 0.14, y: iy + 0.08, w: COL_W - 0.22, h: ITEM_H - 0.14, fontFace: FF, wrap: true, valign: 'top', lineSpacingMultiple: 1.35 }
    )
  })

  analysis.risks.slice(0, MAX).forEach((item, i) => {
    const iy = itemStart + i * ITEM_H
    s.addShape(pptx.ShapeType.rect, { x: COL2X, y: iy, w: COL_W, h: ITEM_H - 0.01, fill: { color: i % 2 === 0 ? C.WHITE : C.G100 }, line: { color: C.G300, pt: 0.45 } })
    s.addShape(pptx.ShapeType.rect, { x: COL2X, y: iy, w: 0.04, h: ITEM_H - 0.01, fill: { color: C.RED }, line: { color: C.RED } })
    s.addText(
      [
        { text: item.title, options: { bold: true, fontSize: 10.5, color: C.DARK } },
        { text: '\n' + item.interpretation.slice(0, 110), options: { fontSize: 9.5, color: C.G700 } },
      ],
      { x: COL2X + 0.14, y: iy + 0.08, w: COL_W - 0.22, h: ITEM_H - 0.14, fontFace: FF, wrap: true, valign: 'top', lineSpacingMultiple: 1.35 }
    )
  })

  addFooter(s, pptx, 1)
}

// ─── SLIDE 02: 점포 기본조건 ──────────────────────────────────

function slide02(pptx: any, analysis: AnalysisResult, store: Store, _displayName: string) {
  const s = pptx.addSlide()
  addHeader(s, pptx, '점포 기본조건', 2)
  addFooter(s, pptx, 2)

  let cy = CY

  // ── Row 1: 4 large metric cards ──
  const CARD4_W = (CW - 0.15 * 3) / 4
  const CARD4_H = 1.18

  const totalFixed = store.monthlyRent + store.maintenanceFee
  const cards4 = [
    { label: '면 적', value: `${store.areaPyeong}평`, sub: store.areaSqm ? `${store.areaSqm}㎡` : '', accent: C.NAVY },
    { label: '층 수', value: FLOOR_LABELS[store.floor], sub: store.isCorner ? '코너 점포' : '일반', accent: C.NAVY },
    { label: '보 증 금', value: formatMoney(store.deposit), sub: '', accent: C.BLUE },
    { label: '월   세', value: formatMoney(store.monthlyRent), sub: '고정비 합계 ' + formatMoney(totalFixed), accent: C.BLUE },
  ]
  cards4.forEach((c, i) => {
    bigCard(s, pptx, PX + i * (CARD4_W + 0.15), cy, CARD4_W, CARD4_H, c.label, c.value, c.sub, c.accent)
  })
  cy += CARD4_H + 0.20

  // ── Row 2: Facility status (2×3 grid) ──
  cy = secHdr(s, pptx, PX, cy, '시설·설비 현황')

  const facilities = [
    { label: '닥트(환기)', value: store.duct === undefined ? '미확인' : store.duct ? '설치 가능' : '불가', ok: store.duct },
    { label: '도시가스',   value: store.cityGas === undefined ? '미확인' : store.cityGas ? '인입' : '미인입', ok: store.cityGas },
    { label: '전용 화장실', value: store.restroom === undefined ? '미확인' : store.restroom ? '있음' : '없음', ok: store.restroom },
    { label: '배 수',     value: store.drainage === undefined ? '미확인' : store.drainage ? '양호' : '불량', ok: store.drainage },
    { label: '소 방',     value: store.fireSafety === undefined ? '미확인' : store.fireSafety ? '적합' : '미확인', ok: store.fireSafety },
    { label: '전기 용량', value: store.electricCapacity ?? '미확인', ok: !!store.electricCapacity },
  ]

  const FC = 3
  const FW = (CW - 0.12 * (FC - 1)) / FC
  const FH = 0.64

  facilities.forEach((f, i) => {
    const col = i % FC
    const row = Math.floor(i / FC)
    const fx = PX + col * (FW + 0.12)
    const fy = cy + row * (FH + 0.10)
    const sc = f.ok === undefined ? C.G500 : f.ok ? C.GREEN : C.AMBER

    s.addShape(pptx.ShapeType.rect, { x: fx, y: fy, w: FW, h: FH, fill: { color: C.WHITE }, line: { color: C.G300, pt: 0.8 } })
    s.addShape(pptx.ShapeType.rect, { x: fx, y: fy, w: FW, h: 0.042, fill: { color: sc }, line: { color: sc } })
    s.addText(f.label, { x: fx + 0.14, y: fy + 0.09, w: FW - 0.28, h: 0.22, fontSize: 9, color: C.G700, fontFace: FF })
    s.addText(f.value, { x: fx + 0.14, y: fy + 0.30, w: FW - 0.28, h: 0.28, fontSize: 14, bold: true, color: sc, fontFace: FF })
  })
  cy += 2 * (FH + 0.10) + 0.18

  // ── Row 3: Business info (2-column compact) ──
  cy = secHdr(s, pptx, PX, cy, '업종 및 계약 정보')

  const info2 = [
    ['희망 업종', store.desiredBusiness],
    ['업종 분류', analysis.bizAnalysis ? BIZ_CATEGORY_LABELS[analysis.bizAnalysis.category] : '기타'],
    ['현재 운영 업종', store.currentBusiness || '미입력'],
    ['이전 운영 업종', store.previousBusiness || '미입력'],
    ['계약 기간', store.contractPeriod || '미입력'],
    ['전면폭 / 주차', `${store.frontageMeters}m  /  ${store.parkingCount > 0 ? `${store.parkingCount}대` : '없음'}`],
  ]

  const IW = (CW - 0.10) / 2
  const IH = 0.34

  info2.forEach((row, i) => {
    const col = i % 2
    const ri  = Math.floor(i / 2)
    const ix  = PX + col * (IW + 0.10)
    const iy  = cy + ri * IH
    tRow(s, pptx, ix, iy, IW, IH, row[0], row[1], ri % 2 === 0 ? C.WHITE : C.G100)
  })
}

// ─── SLIDE 03: 입지 분석 ──────────────────────────────────────

function slide03(pptx: any, analysis: AnalysisResult, store: Store, _displayName: string) {
  const s = pptx.addSlide()
  addHeader(s, pptx, '입지 분석', 3)
  addFooter(s, pptx, 3)

  let cy = CY
  const locSc = analysis.scores.location
  const visSc = analysis.scores.visibility

  // Summary card (full-width, prominent)
  const SC_H = 0.82
  s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW, h: SC_H, fill: { color: C.G100 }, line: { color: C.G300, pt: 0.8 } })
  s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: 0.08, h: SC_H, fill: { color: gradeColor(locSc.score) }, line: { color: gradeColor(locSc.score) } })
  s.addText(`입지  ${locSc.grade}등급`, { x: PX + 0.20, y: cy + 0.10, w: 2.2, h: 0.30, fontSize: 15, bold: true, color: C.NAVY, fontFace: FF })
  s.addText(`${locSc.score}점`, { x: PX + 0.20, y: cy + 0.44, w: 2.2, h: 0.28, fontSize: 13, color: gradeColor(locSc.score), bold: true, fontFace: FF })
  s.addText(locSc.interpretation, { x: PX + 2.60, y: cy + 0.14, w: CW - 2.80, h: SC_H - 0.26, fontSize: 11, color: C.NAVY2, fontFace: FF, wrap: true, valign: 'top', lineSpacingMultiple: 1.40 })
  cy += SC_H + 0.18

  // ── Score bars (6 dimensions) ──
  cy = secHdr(s, pptx, PX, cy, '항목별 입지 점수')

  function qualScore(v?: string): number {
    const m: Record<string, number> = { excellent: 90, good: 75, average: 57, poor: 33 }
    return m[v ?? ''] ?? 55
  }
  function qualGrade(sc: number): string {
    if (sc >= 80) return 'A'
    if (sc >= 65) return 'B'
    if (sc >= 50) return 'C'
    return 'D'
  }

  const pedAcc = store.pedestrianAccess ?? store.walkAccess
  const carAcc = store.vehicleAccess ?? store.carAccess
  const pubAcc = store.publicTransportAccess
  const visScore  = qualScore(store.visibility)
  const pedScore  = qualScore(pedAcc)
  const carScore  = qualScore(carAcc)
  const pubScore  = qualScore(pubAcc)
  const floorSc   = store.floor === '1f' ? 86 : store.floor === 'basement' ? 42 : 64
  const pkScore   = store.parkingCount >= 5 ? 82 : store.parkingCount >= 2 ? 65 : store.parkingCount >= 1 ? 52 : 38

  const bars = [
    { label: '도보 접근성', score: pedScore,  grade: qualGrade(pedScore) },
    { label: '가  시  성', score: visScore,  grade: qualGrade(visScore) },
    { label: '차량 접근성', score: carScore,  grade: qualGrade(carScore) },
    { label: '대중교통',   score: pubScore,  grade: qualGrade(pubScore) },
    { label: '층수 적합도', score: floorSc,  grade: qualGrade(floorSc) },
    { label: '주차 여건',  score: pkScore,   grade: qualGrade(pkScore) },
  ]

  bars.forEach((b, i) => {
    scoreBar(s, pptx, PX, cy + i * 0.42, CW, b.label, b.score, b.grade, gradeColor(b.score))
  })
  cy += bars.length * 0.42 + 0.20

  // ── Detail table (2-column) ──
  cy = secHdr(s, pptx, PX, cy, '세부 조건')

  const details: [string, string][] = [
    ['도보 접근성', accLbl(pedAcc)],
    ['가  시  성', VISIBILITY_LABELS[store.visibility] ?? '미확인'],
    ['차량 접근성', accLbl(carAcc)],
    ['대중교통',   accLbl(pubAcc)],
    ['층수',      FLOOR_LABELS[store.floor]],
    ['전면폭',    `${store.frontageMeters}m`],
    ['코너 점포', store.isCorner ? '해당' : '일반'],
    ['주차',      store.parkingCount > 0 ? `${store.parkingCount}대` : '없음'],
  ]

  const DW = (CW - 0.10) / 2
  const DH = 0.32

  details.forEach((row, i) => {
    const col = i % 2
    const ri  = Math.floor(i / 2)
    const dx  = PX + col * (DW + 0.10)
    const dy  = cy + ri * DH
    tRow(s, pptx, dx, dy, DW, DH, row[0], row[1], ri % 2 === 0 ? C.WHITE : C.G100, 1.20)
  })

  // Visibility interpretation note
  const nY = cy + 4 * DH + 0.14
  if (nY < FTRY - 0.60) {
    s.addShape(pptx.ShapeType.rect, { x: PX, y: nY, w: CW, h: 0.52, fill: { color: C.BLUE_L }, line: { color: C.G300, pt: 0.6 } })
    s.addText(`가시성 해석:  ${visSc.interpretation}`, {
      x: PX + 0.16, y: nY + 0.09, w: CW - 0.32, h: 0.36, fontSize: 10.5, color: C.NAVY2, fontFace: FF, wrap: true,
    })
  }
}

// ─── SLIDE 04: 업종 적합성 ────────────────────────────────────

function slide04(pptx: any, analysis: AnalysisResult, store: Store, _displayName: string) {
  const s = pptx.addSlide()
  addHeader(s, pptx, '업종 적합성', 4)
  addFooter(s, pptx, 4)

  let cy = CY
  const ba    = analysis.bizAnalysis
  const fitSc = analysis.scores.businessFit

  // Score summary card
  const SC_H = 0.82
  s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW, h: SC_H, fill: { color: C.G100 }, line: { color: C.G300, pt: 0.8 } })
  s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: 0.08, h: SC_H, fill: { color: gradeColor(fitSc.score) }, line: { color: gradeColor(fitSc.score) } })
  s.addText(`업종 적합도  ${fitSc.grade}등급`, { x: PX + 0.20, y: cy + 0.10, w: 2.5, h: 0.30, fontSize: 15, bold: true, color: C.NAVY, fontFace: FF })
  s.addText(`${fitSc.score}점`, { x: PX + 0.20, y: cy + 0.44, w: 2.5, h: 0.28, fontSize: 13, color: gradeColor(fitSc.score), bold: true, fontFace: FF })
  s.addText(fitSc.interpretation, { x: PX + 2.80, y: cy + 0.14, w: CW - 3.00, h: SC_H - 0.26, fontSize: 11, color: C.NAVY2, fontFace: FF, wrap: true, valign: 'top', lineSpacingMultiple: 1.40 })
  cy += SC_H + 0.18

  // Score bars (5 dimensions)
  cy = secHdr(s, pptx, PX, cy, '차원별 점수')

  const rentSc = analysis.scores.rent
  const riskSc = analysis.scores.totalRisk
  const visQ = store.visibility === 'excellent' ? 90 : store.visibility === 'good' ? 75 : store.visibility === 'poor' ? 33 : 57

  const dimBars = [
    { label: '업종 적합성',  score: fitSc.score,  grade: fitSc.grade },
    { label: '임대료 부담',  score: rentSc.score, grade: rentSc.grade },
    { label: '위험 관리',   score: riskSc.score, grade: riskSc.grade },
    { label: '도보 접근성', score: store.walkAccess === 'excellent' ? 90 : store.walkAccess === 'good' ? 75 : store.walkAccess === 'poor' ? 33 : 57,
      grade: store.walkAccess === 'excellent' ? 'A' : store.walkAccess === 'good' ? 'B' : store.walkAccess === 'poor' ? 'D' : 'C' },
    { label: '가  시  성',  score: visQ, grade: visQ >= 80 ? 'A' : visQ >= 65 ? 'B' : visQ >= 50 ? 'C' : 'D' },
  ]

  dimBars.forEach((b, i) => {
    scoreBar(s, pptx, PX, cy + i * 0.42, CW, b.label, b.score, b.grade, gradeColor(b.score))
  })
  cy += dimBars.length * 0.42 + 0.20

  if (!ba) {
    s.addText('업종 분석 데이터가 없습니다.', { x: PX, y: cy, w: CW, h: 0.4, fontSize: 12, color: C.G700, fontFace: FF })
    return
  }

  // Factor table
  cy = secHdr(s, pptx, PX, cy, '항목별 평가')

  type BizRow = { item: string; status: string; reason: string; sc: string; sbg: string }
  const rows: BizRow[] = []
  ba.favorableFactors.forEach(f => {
    const [item, reason] = f.split('—').map(x => x.trim())
    rows.push({ item: item ?? f, status: '유리', reason: reason ?? '', sc: C.GREEN, sbg: C.GREEN_L })
  })
  ba.unfavorableFactors.forEach(f => {
    const [item, reason] = f.split('—').map(x => x.trim())
    rows.push({ item: item ?? f, status: '주의', reason: reason ?? '', sc: C.AMBER, sbg: C.AMBER_L })
  })
  ba.mustCheckFactors.forEach(f => {
    const [item, reason] = f.split('—').map(x => x.trim())
    rows.push({ item: item ?? f, status: '미확인', reason: reason ?? '', sc: C.G700, sbg: C.G200 })
  })
  ba.specificRisks.forEach(f => {
    const [item, reason] = f.split('—').map(x => x.trim())
    rows.push({ item: item ?? f, status: '리스크', reason: reason ?? '', sc: C.RED, sbg: C.RED_L })
  })

  const COL = [3.00, 0.92, 3.45]
  ;['항  목', '판  정', '설명 · 근거'].forEach((h, i) => {
    const hx = PX + COL.slice(0, i).reduce((a, b) => a + b, 0)
    s.addShape(pptx.ShapeType.rect, { x: hx, y: cy, w: COL[i], h: 0.32, fill: { color: C.NAVY }, line: { color: C.NAVY } })
    s.addText(h, { x: hx + 0.10, y: cy, w: COL[i] - 0.12, h: 0.32, fontSize: 9.5, bold: true, color: C.WHITE, valign: 'middle', fontFace: FF })
  })
  cy += 0.32

  const maxR = Math.floor((FTRY - cy - 0.08) / 0.34)
  const RH   = Math.min(0.36, (FTRY - cy - 0.08) / Math.min(rows.length || 1, maxR))

  rows.slice(0, maxR).forEach((row, i) => {
    const ry = cy + i * RH
    const bg = i % 2 === 0 ? C.WHITE : C.G100
    const cells: [string, number, string, string, boolean][] = [
      [row.item,   COL[0], bg,     C.NAVY2, false],
      [row.status, COL[1], row.sbg, row.sc,  true],
      [row.reason, COL[2], bg,     C.NAVY2, false],
    ]
    cells.forEach(([txt, cw, cellBg, color, bold], ci) => {
      const cx = PX + COL.slice(0, ci).reduce((a, b) => a + b, 0)
      s.addShape(pptx.ShapeType.rect, { x: cx, y: ry, w: cw, h: RH, fill: { color: cellBg }, line: { color: C.G300, pt: 0.4 } })
      s.addText(txt, { x: cx + 0.10, y: ry, w: cw - 0.14, h: RH, fontSize: 10, color, bold, fontFace: FF, valign: 'middle', wrap: true })
    })
  })

  void store
}

// ─── SLIDE 05: 임대조건 및 수익성 ────────────────────────────

function slide05(pptx: any, analysis: AnalysisResult, store: Store, _displayName: string) {
  const s = pptx.addSlide()
  addHeader(s, pptx, '임대조건 및 수익성 부담', 5)
  addFooter(s, pptx, 5)

  let cy = CY
  const ra        = analysis.rentAnalysis
  const rentSc    = analysis.scores.rent
  const totalFixed = store.monthlyRent + store.maintenanceFee

  // ── Top 3 hero metric cards ──
  const CARD3_W = (CW - 0.16 * 2) / 3
  const CARD3_H = 1.10

  bigCard(s, pptx, PX,                              cy, CARD3_W, CARD3_H, '보 증 금',     formatMoney(store.deposit),      '',                              C.NAVY)
  bigCard(s, pptx, PX + CARD3_W + 0.16,             cy, CARD3_W, CARD3_H, '월   세',      formatMoney(store.monthlyRent),  '',                              C.BLUE)
  bigCard(s, pptx, PX + (CARD3_W + 0.16) * 2,       cy, CARD3_W, CARD3_H, '월 고정비 합계', formatMoney(totalFixed),         store.premium > 0 ? '권리금 ' + formatMoney(store.premium) : '권리금 없음', C.AMBER)
  cy += CARD3_H + 0.20

  if (ra) {
    // Rent score card
    const rlCfg = {
      low:     { label: '관리 가능', color: C.GREEN, bg: C.GREEN_L },
      caution: { label: '주의 구간', color: C.AMBER, bg: C.AMBER_L },
      high:    { label: '고 부 담',  color: C.RED,   bg: C.RED_L },
      unknown: { label: '계산 불가', color: C.G700,  bg: C.G200 },
    }[ra.riskLevel] ?? { label: '미확인', color: C.G700, bg: C.G200 }

    s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW, h: 0.62, fill: { color: C.G100 }, line: { color: C.G300, pt: 0.8 } })
    s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: 0.08, h: 0.62, fill: { color: gradeColor(rentSc.score) }, line: { color: gradeColor(rentSc.score) } })
    s.addShape(pptx.ShapeType.rect, { x: PX + 0.18, y: cy + 0.14, w: 1.30, h: 0.34, fill: { color: rlCfg.bg }, line: { color: C.G300, pt: 0.5 } })
    s.addText(rlCfg.label, { x: PX + 0.18, y: cy + 0.14, w: 1.30, h: 0.34, fontSize: 11, bold: true, color: rlCfg.color, align: 'center', valign: 'middle', fontFace: FF })
    s.addText(`임대조건 ${rentSc.grade}등급 (${rentSc.score}점)  —  ${ra.interpretation}`, {
      x: PX + 1.60, y: cy + 0.10, w: CW - 1.78, h: 0.44, fontSize: 11, color: C.NAVY2, fontFace: FF, wrap: true, valign: 'middle',
    })
    cy += 0.74

    // ── Bar chart: Rent vs Reference Sales ──
    cy = secHdr(s, pptx, PX, cy, '임대료 부담 비교 그래프')

    const chartW = CW
    const chartH = 3.20

    const chartData = [
      {
        name: '금액 (만원)',
        labels: ['월   세', '10% 기준 필요매출', '12% 기준 필요매출'],
        values: [
          Math.round(store.monthlyRent / 10000),
          Math.round(ra.referenceSalesAt10pct / 10000),
          Math.round(ra.referenceSalesAt12pct / 10000),
        ],
      },
    ]

    s.addChart('bar', chartData, {
      x: PX, y: cy, w: chartW, h: chartH,
      chartColors: ['1558A7', '0D7B4A', 'A0540A'],
      showLegend: false,
      showValue: true,
      dataLabelFontSize: 11,
      dataLabelColor: C.DARK,
      catAxisLabelFontSize: 11,
      catAxisLabelColor: C.NAVY2,
      valAxisLabelFontSize: 9,
      valAxisLabelColor: C.G700,
      barGapWidthPct: 60,
      plotAreaBorderColor: 'FFFFFF',
      plotAreaBorderSize: 0,
    })

    cy += chartH + 0.18

    // Reference note
    if (cy < FTRY - 0.50) {
      s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW, h: 0.44, fill: { color: C.BLUE_L }, line: { color: C.G300, pt: 0.6 } })
      s.addText(
        '※ 위 기준 매출은 월세를 10%·12%로 역산한 참고값입니다. 실제 예상 매출을 의미하지 않으며, 손익분기점 계산에는 인건비·재료비·변동비를 별도 산입해야 합니다.',
        { x: PX + 0.16, y: cy + 0.08, w: CW - 0.32, h: 0.30, fontSize: 10, color: C.NAVY2, fontFace: FF, wrap: true }
      )
    }
  } else {
    // No rentAnalysis data
    s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW, h: 0.60, fill: { color: C.G100 }, line: { color: C.G300, pt: 0.8 } })
    s.addText(`임대료 부담 분석: 월세 ${formatMoney(store.monthlyRent)} 입력됨. 예상 매출을 입력하면 임대료 비율을 자동 계산합니다.`, {
      x: PX + 0.16, y: cy + 0.12, w: CW - 0.32, h: 0.38, fontSize: 11, color: C.NAVY2, fontFace: FF, wrap: true,
    })
  }
}

// ─── SLIDE 06: 주요 위험요인 ──────────────────────────────────

function slide06(pptx: any, analysis: AnalysisResult, _store: Store, _displayName: string) {
  const s = pptx.addSlide()
  addHeader(s, pptx, '주요 위험요인', 6)
  addFooter(s, pptx, 6)

  let cy = CY
  const risks  = analysis.risks
  const riskSc = analysis.scores.totalRisk

  // Score card
  const SC_H = 0.72
  s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW, h: SC_H, fill: { color: C.G100 }, line: { color: C.G300, pt: 0.8 } })
  s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: 0.08, h: SC_H, fill: { color: gradeColor(riskSc.score) }, line: { color: gradeColor(riskSc.score) } })
  s.addText(`위험요인  ${riskSc.grade}등급`, { x: PX + 0.22, y: cy + 0.10, w: 2.2, h: 0.28, fontSize: 14, bold: true, color: C.NAVY, fontFace: FF })
  s.addText(`${riskSc.score}점`, { x: PX + 0.22, y: cy + 0.42, w: 2.2, h: 0.24, fontSize: 12, color: gradeColor(riskSc.score), bold: true, fontFace: FF })
  s.addText(riskSc.interpretation, { x: PX + 2.60, y: cy + 0.14, w: CW - 2.80, h: SC_H - 0.26, fontSize: 11, color: C.NAVY2, fontFace: FF, wrap: true, valign: 'top', lineSpacingMultiple: 1.40 })
  cy += SC_H + 0.18

  if (risks.length === 0) {
    s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW, h: 0.68, fill: { color: C.GREEN_L }, line: { color: C.G300, pt: 0.6 } })
    s.addText('주요 위험요인이 감지되지 않았습니다. 현장 방문을 통해 최종 확인하십시오.', {
      x: PX + 0.18, y: cy + 0.16, w: CW - 0.36, h: 0.38, fontSize: 12, color: C.GREEN, fontFace: FF, wrap: true,
    })
    return
  }

  // ── Risk matrix grid ──
  cy = secHdr(s, pptx, PX, cy, '영향도 × 확인필요성 매트릭스')

  const MX = PX
  const MW = CW * 0.44
  const MH = 3.30
  const CW3 = MW / 3
  const CH3 = MH / 3

  // Zone colors [row=0 top=HIGH urgency, col=0 left=LOW impact]
  const zoneFill = [
    [C.AMBER_L, C.RED_L,   C.RED_L  ],
    [C.GREEN_L, C.AMBER_L, C.RED_L  ],
    [C.GREEN_L, C.GREEN_L, C.AMBER_L],
  ]
  const zoneBdr = [
    ['FDE68A', 'FCA5A5', 'FCA5A5'],
    ['A7F3D0', 'FDE68A', 'FCA5A5'],
    ['A7F3D0', 'A7F3D0', 'FDE68A'],
  ]

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      s.addShape(pptx.ShapeType.rect, {
        x: MX + c * CW3, y: cy + r * CH3, w: CW3, h: CH3,
        fill: { color: zoneFill[r][c] }, line: { color: zoneBdr[r][c], pt: 0.8 },
      })
    }
  }

  // Axis labels
  ;['낮은 영향도', '중간 영향도', '높은 영향도'].forEach((lbl, c) => {
    s.addText(lbl, { x: MX + c * CW3, y: cy + MH + 0.06, w: CW3, h: 0.20, fontSize: 8, color: C.G700, align: 'center', fontFace: FF })
  })
  ;['높은\n확인필요', '중간\n확인필요', '낮은\n확인필요'].forEach((lbl, r) => {
    s.addText(lbl, { x: MX - 0.88, y: cy + r * CH3 + CH3 / 2 - 0.20, w: 0.82, h: 0.40, fontSize: 7.5, color: C.G700, align: 'right', fontFace: FF, valign: 'middle', wrap: true })
  })

  // Risk position mapping
  const riskPos: [number, number][] = [[2,0],[2,1],[1,0],[1,1],[0,0]]
  const dotColors = [C.RED, C.RED, C.AMBER, C.AMBER, C.BLUE]

  risks.slice(0, 5).forEach((_, i) => {
    const [col, row] = riskPos[i]
    const rx = MX + col * CW3 + CW3 / 2 - 0.18
    const ry = cy + row * CH3 + CH3 / 2 - 0.18
    const dc = dotColors[i] ?? C.G700
    s.addShape(pptx.ShapeType.rect, { x: rx, y: ry, w: 0.36, h: 0.36, fill: { color: dc }, line: { color: dc } })
    s.addText(`${i + 1}`, { x: rx, y: ry, w: 0.36, h: 0.36, fontSize: 12, bold: true, color: C.WHITE, align: 'center', valign: 'middle', fontFace: FF })
  })

  // ── Risk detail list (right panel) ──
  const RPX = MX + MW + 0.20
  const RPW = CW - MW - 0.20
  const colorPal = [C.RED, C.RED, C.AMBER, C.AMBER, C.BLUE]
  const maxD = Math.min(risks.length, 5)
  const DIH  = MH / maxD

  risks.slice(0, maxD).forEach((risk, i) => {
    const ry  = cy + i * DIH
    const dc  = colorPal[i] ?? C.G700
    const bg  = i % 2 === 0 ? C.WHITE : C.G100

    s.addShape(pptx.ShapeType.rect, { x: RPX, y: ry, w: RPW, h: DIH - 0.04, fill: { color: bg }, line: { color: C.G300, pt: 0.5 } })
    s.addShape(pptx.ShapeType.rect, { x: RPX, y: ry, w: 0.05, h: DIH - 0.04, fill: { color: dc }, line: { color: dc } })
    s.addShape(pptx.ShapeType.rect, { x: RPX + 0.08, y: ry + 0.06, w: 0.28, h: 0.28, fill: { color: dc }, line: { color: dc } })
    s.addText(`${i + 1}`, { x: RPX + 0.08, y: ry + 0.06, w: 0.28, h: 0.28, fontSize: 10, bold: true, color: C.WHITE, align: 'center', valign: 'middle', fontFace: FF })
    s.addText(risk.title, { x: RPX + 0.44, y: ry + 0.06, w: RPW - 0.52, h: 0.28, fontSize: 10, bold: true, color: C.DARK, fontFace: FF })
    s.addText(risk.interpretation.slice(0, 130), {
      x: RPX + 0.44, y: ry + 0.36, w: RPW - 0.52, h: DIH - 0.46, fontSize: 9, color: C.G700, fontFace: FF, wrap: true, valign: 'top',
    })
  })

  cy += MH + 0.44

  // Action summary
  if (cy < FTRY - 0.70 && risks.length > 0) {
    cy = secHdr(s, pptx, PX, cy, '위험요인 대응 방향')
    const AH = Math.min(0.38, (FTRY - cy - 0.06) / Math.min(risks.length, 3))
    risks.slice(0, 3).forEach((risk, i) => {
      const ry = cy + i * AH
      s.addShape(pptx.ShapeType.rect, { x: PX, y: ry, w: CW, h: AH, fill: { color: i % 2 === 0 ? C.WHITE : C.G100 }, line: { color: C.G300, pt: 0.4 } })
      s.addText(`${i + 1}.`, { x: PX + 0.10, y: ry, w: 0.28, h: AH, fontSize: 10, bold: true, color: colorPal[i], fontFace: FF, valign: 'middle' })
      s.addText(risk.title, { x: PX + 0.40, y: ry, w: 1.90, h: AH, fontSize: 10, bold: true, color: C.NAVY2, fontFace: FF, valign: 'middle' })
      s.addText(risk.action ?? '계약 전 현장 직접 확인 및 임대인 서면 확인 요청', {
        x: PX + 2.34, y: ry, w: CW - 2.42, h: AH, fontSize: 10, color: C.NAVY2, fontFace: FF, valign: 'middle', wrap: true,
      })
    })
  }
}

// ─── SLIDE 07: 계약 전 현장 확인사항 ─────────────────────────

function slide07(pptx: any, analysis: AnalysisResult, _store: Store, _displayName: string) {
  const s = pptx.addSlide()
  addHeader(s, pptx, '계약 전 현장 확인사항', 7)
  addFooter(s, pptx, 7)

  let cy = CY
  const checks    = analysis.contractChecks
  const verified  = checks.filter(c => c.status === 'verified').length
  const concern   = checks.filter(c => c.status === 'concern').length
  const unchecked = checks.length - verified - concern

  // Stats row (4 big cards)
  const SC_W = (CW - 0.12 * 3) / 4
  const SC_H = 0.85
  const statItems = [
    { label: '전체 항목', value: String(checks.length), color: C.NAVY },
    { label: '확인 완료', value: String(verified),      color: C.GREEN },
    { label: '우려 사항', value: String(concern),       color: C.RED },
    { label: '미 확 인',  value: String(unchecked),     color: C.AMBER },
  ]
  statItems.forEach((sc, i) => {
    const sx = PX + i * (SC_W + 0.12)
    s.addShape(pptx.ShapeType.rect, { x: sx, y: cy, w: SC_W, h: SC_H, fill: { color: C.WHITE }, line: { color: C.G300, pt: 0.8 } })
    s.addShape(pptx.ShapeType.rect, { x: sx, y: cy, w: SC_W, h: 0.045, fill: { color: sc.color }, line: { color: sc.color } })
    s.addText(sc.value, { x: sx, y: cy + 0.10, w: SC_W, h: 0.46, fontSize: 28, bold: true, color: sc.color, align: 'center', fontFace: FF })
    s.addText(sc.label, { x: sx, y: cy + 0.60, w: SC_W, h: 0.20, fontSize: 9, color: C.G700, align: 'center', fontFace: FF })
  })
  cy += SC_H + 0.20

  // 5-column table
  cy = secHdr(s, pptx, PX, cy, '현장 확인 체크리스트')

  const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
    verified:  { label: '완  료', color: C.GREEN, bg: C.GREEN_L },
    concern:   { label: '우  려', color: C.RED,   bg: C.RED_L },
    unchecked: { label: '미확인', color: C.G700,  bg: C.G200 },
  }
  const urgencyMap: Record<string, string> = {
    '법적·등기': '상', '시설·설비': '중', '임대 조건': '상',
    '입지·환경': '중', '인허가': '상', '위생·소방': '중',
  }
  const methodMap: Record<string, string> = {
    '법적·등기': '등기부 열람, 건축물대장 확인',
    '시설·설비': '현장 직접 확인, 작동 테스트',
    '임대 조건': '임대인 확인, 계약서 검토',
    '입지·환경': '피크타임 방문, 보행 동선 실측',
    '인허가':    '시·군·구청 영업신고 사전 확인',
    '위생·소방': '소방서·위생 부서 사전 확인',
  }

  // Header (5 cols)
  const COL5 = [1.60, 1.05, 0.92, 0.72, 3.08]
  const H5   = ['확인 항목', '카테고리', '현재 상태', '위험도', '현장 확인 방법']
  H5.forEach((h, i) => {
    const hx = PX + COL5.slice(0, i).reduce((a, b) => a + b, 0)
    s.addShape(pptx.ShapeType.rect, { x: hx, y: cy, w: COL5[i], h: 0.36, fill: { color: C.NAVY }, line: { color: C.NAVY } })
    s.addText(h, { x: hx + 0.08, y: cy, w: COL5[i] - 0.10, h: 0.36, fontSize: 10, bold: true, color: C.WHITE, valign: 'middle', fontFace: FF })
  })
  cy += 0.36

  const maxR = Math.floor((FTRY - cy - 0.06) / 0.36)
  const RH   = Math.min(0.38, (FTRY - cy - 0.06) / Math.min(checks.length || 1, maxR))

  checks.slice(0, maxR).forEach((chk, i) => {
    const ry = cy + i * RH
    const bg = i % 2 === 0 ? C.WHITE : C.G100
    const sc = statusCfg[chk.status] ?? statusCfg.unchecked
    const urg = urgencyMap[chk.category] ?? '중'
    const urgColor = urg === '상' ? C.RED : urg === '중' ? C.AMBER : C.G700
    const meth = methodMap[chk.category] ?? '현장 직접 확인'

    const cells: [string, number, string, string, boolean][] = [
      [chk.item,     COL5[0], bg,     C.NAVY2,  false],
      [chk.category, COL5[1], bg,     C.G700,   false],
      [sc.label,     COL5[2], sc.bg,  sc.color, true],
      [urg,          COL5[3], bg,     urgColor, true],
      [meth,         COL5[4], bg,     C.NAVY2,  false],
    ]
    cells.forEach(([txt, cw, cellBg, color, bold], ci) => {
      const cx = PX + COL5.slice(0, ci).reduce((a, b) => a + b, 0)
      s.addShape(pptx.ShapeType.rect, { x: cx, y: ry, w: cw, h: RH, fill: { color: cellBg }, line: { color: C.G300, pt: 0.4 } })
      s.addText(txt, { x: cx + 0.08, y: ry, w: cw - 0.12, h: RH, fontSize: 10, color, bold, fontFace: FF, valign: 'middle', wrap: true })
    })
  })
}

// ─── SLIDE 08: 상권데이터 현황 ────────────────────────────────

function slide08(pptx: any, store: Store) {
  const s = pptx.addSlide()
  addHeader(s, pptx, '상권데이터 현황', 8)
  addFooter(s, pptx, 8)

  let cy = CY

  s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW, h: 0.66, fill: { color: C.RED_L }, line: { color: C.G300, pt: 0.8 } })
  s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: 0.08, h: 0.66, fill: { color: C.RED }, line: { color: C.RED } })
  s.addText('현재 6개 상권 데이터 항목 모두 미연결 — 데이터 연계 시 분석 정밀도가 크게 향상됩니다.', {
    x: PX + 0.20, y: cy + 0.14, w: CW - 0.30, h: 0.40, fontSize: 11, color: C.RED, fontFace: FF, wrap: true,
  })
  cy += 0.82

  cy = secHdr(s, pptx, PX, cy, '데이터 연결 현황')

  const items = [
    { title: '유동인구 데이터',    desc: '시간대별·요일별 보행 유동인구 분석', alt: '피크타임 직접 방문 카운팅 권고' },
    { title: '생활인구 데이터',    desc: '배후 세대수·연령대별 거주 인구',    alt: '시·군·구청 통계 또는 플랫폼 참고' },
    { title: '상권 매출 데이터',   desc: '동종업종 평균 매출·매출 변화율',    alt: '소상공인진흥공단 상권분석 서비스' },
    { title: '경쟁 업종 현황',     desc: `반경 500m 내 ${store.desiredBusiness} 수·폐업`, alt: '현장 도보 조사 및 배달앱 검색' },
    { title: '폐업률 데이터',      desc: '해당 상권·업종 폐업률 및 3년 생존율', alt: '소상공인진흥공단 업종별 통계' },
    { title: '임대료 시세 데이터', desc: '동일 상권 동종 면적 평균 임대료',    alt: '인근 공인중개사 2~3곳 시세 조회' },
  ]

  const COLS = 3
  const CRD_W = (CW - 0.14 * (COLS - 1)) / COLS
  const CRD_H = (FTRY - cy - 0.06) / 2 - 0.10

  items.forEach((item, i) => {
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const dx  = PX + col * (CRD_W + 0.14)
    const dy  = cy + row * (CRD_H + 0.10)

    s.addShape(pptx.ShapeType.rect, { x: dx, y: dy, w: CRD_W, h: CRD_H, fill: { color: C.WHITE }, line: { color: C.G300, pt: 0.8 } })
    s.addShape(pptx.ShapeType.rect, { x: dx, y: dy, w: CRD_W, h: 0.34, fill: { color: C.NAVY2 }, line: { color: C.NAVY2 } })
    s.addText(item.title, { x: dx + 0.12, y: dy, w: CRD_W - 1.05, h: 0.34, fontSize: 10, bold: true, color: C.WHITE, valign: 'middle', fontFace: FF })
    s.addText('미연결', { x: dx + CRD_W - 0.92, y: dy, w: 0.82, h: 0.34, fontSize: 9, color: C.G500, align: 'right', valign: 'middle', fontFace: FF })
    s.addText(item.desc, { x: dx + 0.12, y: dy + 0.42, w: CRD_W - 0.24, h: 0.40, fontSize: 10, color: C.G700, fontFace: FF, wrap: true })
    s.addShape(pptx.ShapeType.rect, { x: dx + 0.10, y: dy + CRD_H - 0.58, w: CRD_W - 0.20, h: 0.48, fill: { color: C.AMBER_L }, line: { color: 'FDE68A', pt: 0.6 } })
    s.addText(`현장 대안:  ${item.alt}`, { x: dx + 0.18, y: dy + CRD_H - 0.52, w: CRD_W - 0.36, h: 0.40, fontSize: 9.5, color: C.AMBER, fontFace: FF, wrap: true })
  })
}

// ─── SLIDE 09: A/B 후보지 비교 ───────────────────────────────

function slide09(pptx: any, analysis: AnalysisResult, store: Store, displayName: string) {
  const s = pptx.addSlide()
  addHeader(s, pptx, 'A/B 후보지 비교', 9)
  addFooter(s, pptx, 9)

  let cy = CY

  // Notice
  s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW, h: 0.66, fill: { color: C.BLUE_L }, line: { color: C.G300, pt: 0.8 } })
  s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: 0.08, h: 0.66, fill: { color: C.BLUE }, line: { color: C.BLUE } })
  s.addText('비교 후보지 데이터 없음 — 현재 단일 점포 분석 결과만 존재합니다. 두 번째 점포 분석 완료 후 비교 가능합니다.', {
    x: PX + 0.20, y: cy + 0.14, w: CW - 0.30, h: 0.40, fontSize: 11, color: C.NAVY2, fontFace: FF, wrap: true,
  })
  cy += 0.82

  cy = secHdr(s, pptx, PX, cy, '비교 분석 프레임워크 (참고)')

  const COL_W = (CW - 0.12) / 2
  const COL2X = PX + COL_W + 0.12

  // Column headers
  ;[
    { label: '후보지 A (현재 분석)', sub: displayName, active: true },
    { label: '후보지 B (미입력)',    sub: '두 번째 점포 분석 후 자동 반영', active: false },
  ].forEach((h, i) => {
    const hx = i === 0 ? PX : COL2X
    s.addShape(pptx.ShapeType.rect, { x: hx, y: cy, w: COL_W, h: 0.58, fill: { color: h.active ? C.NAVY : C.G200 }, line: { color: h.active ? C.NAVY : C.G300, pt: 0.8 } })
    s.addText(h.label, { x: hx + 0.14, y: cy + 0.06, w: COL_W - 0.28, h: 0.24, fontSize: 10, bold: true, color: h.active ? C.WHITE : C.G700, fontFace: FF })
    s.addText(h.sub,   { x: hx + 0.14, y: cy + 0.32, w: COL_W - 0.28, h: 0.22, fontSize: 9, color: h.active ? '93C5FD' : C.G700, fontFace: FF, wrap: true })
  })
  cy += 0.68

  // Comparison rows
  const compareRows = [
    ['종합 점수',   `${analysis.overallScore}점 (${analysis.overallGrade})`, '—'],
    ['입지 점수',   `${analysis.scores.location.score}점 (${analysis.scores.location.grade})`, '—'],
    ['업종 적합성', `${analysis.scores.businessFit.score}점 (${analysis.scores.businessFit.grade})`, '—'],
    ['임대 부담',   `${analysis.scores.rent.score}점 (${analysis.scores.rent.grade})`, '—'],
    ['위험요인',    `${analysis.scores.totalRisk.score}점 (${analysis.scores.totalRisk.grade})`, '—'],
    ['월   세',     formatMoney(store.monthlyRent), '—'],
    ['면   적',     `${store.areaPyeong}평`, '—'],
    ['층   수',     FLOOR_LABELS[store.floor], '—'],
    ['최종 권고',   RECOMMENDATION_LABELS[analysis.recommendation], '—'],
  ]

  const DIM_W = 1.55
  const VAL_W = (COL_W - DIM_W) * 0.98
  const RH    = Math.min(0.36, (FTRY - cy - 0.08) / compareRows.length)

  compareRows.forEach((row, i) => {
    const ry  = cy + i * RH
    const bg  = i % 2 === 0 ? C.WHITE : C.G100

    ;[PX, COL2X].forEach((cx, ci) => {
      const val = ci === 0 ? row[1] : row[2]
      const vbg = ci === 0 ? bg : C.G100
      s.addShape(pptx.ShapeType.rect, { x: cx, y: ry, w: DIM_W, h: RH, fill: { color: C.G200 }, line: { color: C.G300, pt: 0.4 } })
      s.addText(row[0], { x: cx + 0.10, y: ry, w: DIM_W - 0.14, h: RH, fontSize: 10, bold: true, color: C.NAVY2, fontFace: FF, valign: 'middle' })
      s.addShape(pptx.ShapeType.rect, { x: cx + DIM_W, y: ry, w: VAL_W, h: RH, fill: { color: vbg }, line: { color: C.G300, pt: 0.4 } })
      s.addText(val, { x: cx + DIM_W + 0.10, y: ry, w: VAL_W - 0.14, h: RH, fontSize: ci === 0 ? 11 : 11, bold: ci === 0, color: ci === 0 ? C.NAVY2 : C.G500, fontFace: FF, valign: 'middle' })
    })
  })
}

// ─── SLIDE 10: 최종 종합의견 ──────────────────────────────────

function slide10(pptx: any, analysis: AnalysisResult, store: Store, displayName: string) {
  const s = pptx.addSlide()
  addHeader(s, pptx, '최종 종합의견', 10)
  addFooter(s, pptx, 10)

  let cy = CY
  const ra    = analysis.rentAnalysis
  const grade = analysis.overallGrade
  const biz   = store.desiredBusiness

  // ── Verdict card + grade box ──
  const VERD_W = CW - 2.26
  const VERD_H = 1.10

  s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: VERD_W, h: VERD_H, fill: { color: C.G100 }, line: { color: C.G300, pt: 1.2 } })
  s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: 0.08, h: VERD_H, fill: { color: gradeColor(analysis.overallScore) }, line: { color: gradeColor(analysis.overallScore) } })
  s.addText(RECOMMENDATION_LABELS[analysis.recommendation], {
    x: PX + 0.20, y: cy + 0.12, w: VERD_W - 0.30, h: 0.44, fontSize: 18, bold: true, color: C.NAVY, fontFace: FF,
  })
  s.addText(`종합 점수  ${analysis.overallScore}점  ·  ${analysis.overallGrade}등급`, {
    x: PX + 0.20, y: cy + 0.62, w: VERD_W - 0.30, h: 0.26, fontSize: 11, color: C.G700, fontFace: FF,
  })
  // Score gauge in verdict card
  const gbx = PX + 0.20
  const gbw = VERD_W - 0.40
  s.addShape(pptx.ShapeType.rect, { x: gbx, y: cy + 0.92, w: gbw, h: 0.12, fill: { color: C.G300 }, line: { color: C.G300 } })
  s.addShape(pptx.ShapeType.rect, { x: gbx, y: cy + 0.92, w: Math.max(0.10, (analysis.overallScore / 100) * gbw), h: 0.12, fill: { color: gradeColor(analysis.overallScore) }, line: { color: gradeColor(analysis.overallScore) } })

  const GX = PX + VERD_W + 0.14
  const GW = CW - VERD_W - 0.14
  s.addShape(pptx.ShapeType.rect, { x: GX, y: cy, w: GW, h: VERD_H, fill: { color: C.NAVY }, line: { color: C.NAVY3, pt: 1.2 } })
  s.addText(analysis.overallGrade, { x: GX, y: cy, w: GW * 0.55, h: VERD_H, fontSize: 50, bold: true, color: C.WHITE, align: 'center', valign: 'middle', fontFace: FF })
  s.addText(`${analysis.overallScore}점`, { x: GX + GW * 0.55, y: cy, w: GW * 0.45, h: VERD_H, fontSize: 16, color: C.G500, align: 'center', valign: 'middle', fontFace: FF })
  cy += VERD_H + 0.20

  // ── Opinion paragraphs ──
  cy = secHdr(s, pptx, PX, cy, '종합 의견')

  const p1 = grade === 'A+' || grade === 'A'
    ? `${displayName} 점포는 종합 분석 결과 ${grade}등급(${analysis.overallScore}점)으로 ${biz} 출점을 우선 검토할 수 있는 조건을 갖추고 있습니다. 해당 업종 운영에 필요한 기본 요건을 충족하며, 반드시 현장 방문을 통해 실제 환경을 최종 확인하십시오.`
    : grade === 'B+' || grade === 'B'
      ? `${displayName} 점포는 종합 분석 결과 ${grade}등급(${analysis.overallScore}점)으로 ${biz} 출점을 조건부로 검토할 수 있는 수준입니다. 유리한 요소와 리스크가 병존하므로 계약 전 추가 검토와 현장 재확인이 필수입니다.`
      : `${displayName} 점포는 종합 분석 결과 ${grade}등급(${analysis.overallScore}점)으로 ${biz} 출점에 앞서 위험요인과 임대조건을 보수적으로 재검토할 필요가 있습니다.`

  const p2 = ra
    ? ra.rentRatioPct !== null
      ? `임대료 측면에서 월세 ${formatMoney(ra.monthlyRent)}는 예상매출 기준 ${ra.rentRatioPct.toFixed(1)}% 수준입니다. ${ra.interpretation} 임대료 부담률이 ${ra.riskLevel === 'high' ? '기준치를 초과하므로 임대 협상 또는 초기 매출 계획을 보수적으로 수립하십시오.' : ra.riskLevel === 'caution' ? '주의 구간에 진입하였으므로 매출 안정화 전략이 필요합니다.' : '관리 가능한 수준입니다.'}`
      : `월세 ${formatMoney(ra.monthlyRent)}를 10% 기준으로 관리하려면 약 ${formatMoney(ra.referenceSalesAt10pct)}의 월매출이 필요합니다. 이는 임대료 부담 판단용 역산 참고값이며 실제 예상 매출을 의미하지 않습니다.`
    : '임대조건과 예상매출을 함께 검토하여 임대료 부담률을 사전에 계산하십시오.'

  const p3 = analysis.risks.length > 0
    ? `주요 위험요인 ${analysis.risks.length}건이 감지되었습니다: ${analysis.risks.slice(0, 3).map(r => r.title).join(' / ')}. 이에 대한 사전 대응 계획을 임대 협상 시 반드시 반영하십시오.`
    : '주요 위험요인이 감지되지 않았습니다. 다만 현장 방문을 통해 최종 실물 확인을 진행하십시오.'

  const p4 = '계약서 작성 전 건물 용도·영업 가능 업종·원상복구 범위·재계약 우선권을 법률 전문가와 함께 검토할 것을 강력히 권고합니다.'

  const p5 = analysis.strengths.length > 0
    ? `핵심 강점(${analysis.strengths.slice(0, 3).map(x => x.title).join(' / ')})을 최대한 활용하는 운영 전략을 수립하고, 확인된 위험요인에 대한 사전 대응 계획을 마련하십시오.`
    : '확인된 위험요인에 대한 사전 대응 계획을 마련하고, 초기 운영 비용을 보수적으로 계획하십시오.'

  const paragraphs = [p1, p2, p3, p4, p5]
  const parH = Math.min(1.14, (FTRY - cy - 0.40) / paragraphs.length - 0.04)

  paragraphs.forEach((p, i) => {
    const bg = i % 2 === 0 ? C.WHITE : C.G100
    s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: CW, h: parH, fill: { color: bg }, line: { color: C.G300, pt: 0.45 } })
    s.addShape(pptx.ShapeType.rect, { x: PX, y: cy, w: 0.04, h: parH, fill: { color: gradeColor(analysis.overallScore) }, line: { color: gradeColor(analysis.overallScore) } })
    s.addShape(pptx.ShapeType.rect, { x: PX + 0.10, y: cy + 0.06, w: 0.26, h: 0.26, fill: { color: C.NAVY }, line: { color: C.NAVY } })
    s.addText(`${i + 1}`, { x: PX + 0.10, y: cy + 0.06, w: 0.26, h: 0.26, fontSize: 9, bold: true, color: C.WHITE, align: 'center', valign: 'middle', fontFace: FF })
    s.addText(p, { x: PX + 0.46, y: cy + 0.07, w: CW - 0.56, h: parH - 0.12, fontSize: 10.5, color: C.NAVY2, fontFace: FF, wrap: true, valign: 'top', lineSpacingMultiple: 1.40 })
    cy += parH + 0.04
  })

  // Disclaimer
  const disY = Math.min(cy + 0.08, FTRY - 0.28)
  s.addText(
    '본 리포트는 입력 데이터 기반 참고자료입니다. 최종 계약 결정은 현장 방문·법률·세무 전문가 검토를 병행하십시오. 상권연구소 AI PRO는 의사결정 지원 서비스이며 투자 성과를 보장하지 않습니다.',
    { x: PX, y: disY, w: CW, h: 0.24, fontSize: 8, color: C.G700, fontFace: FF, wrap: true }
  )
}

// ─── Main export ──────────────────────────────────────────────

export async function generateReportPpt(analysis: AnalysisResult, store: Store): Promise<void> {
  const { default: PptxGenJS } = await import('pptxgenjs')
  const pptx = new PptxGenJS()

  pptx.defineLayout({ name: 'A4_PORTRAIT', width: 8.27, height: 11.69 })
  pptx.layout  = 'A4_PORTRAIT'
  pptx.author  = '상권연구소 AI PRO'
  pptx.company = '상권연구소 AI PRO'
  pptx.subject = '점포 입지 분석 리포트'

  const displayName = store.address || store.name

  slide01(pptx, analysis, store, displayName)
  slide02(pptx, analysis, store, displayName)
  slide03(pptx, analysis, store, displayName)
  slide04(pptx, analysis, store, displayName)
  slide05(pptx, analysis, store, displayName)
  slide06(pptx, analysis, store, displayName)
  slide07(pptx, analysis, store, displayName)
  slide08(pptx, store)
  slide09(pptx, analysis, store, displayName)
  slide10(pptx, analysis, store, displayName)

  const addrClean = (store.address || store.name).replace(/\s+/g, '').replace(/번지$/, '').slice(0, 12)
  const bizClean  = store.desiredBusiness.replace(/\s+/g, '').slice(0, 6)
  const fileName  = `상권연구소AI_점포입지분석_${addrClean}_${bizClean}.pptx`

  await pptx.writeFile({ fileName })
}
