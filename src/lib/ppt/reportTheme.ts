/**
 * reportTheme.ts — 웹 리포트와 PPT 공통 디자인 토큰
 * 웹: Tailwind 클래스 → PPT: pptxgenjs 6자리 HEX (# 없음)
 */

// ─── Colors (web bg-[#0b1120] → NAVY 등) ──────────────────────
export const C = {
  NAVY:     '0B1120',   // bg-[#0b1120]
  NAVY2:    '1E293B',   // bg-slate-800
  NAVY3:    '334155',   // bg-slate-700
  WHITE:    'FFFFFF',
  G_BG:     'F8F9FB',   // bg-[#f8f9fb]
  G_BD:     'E2E8F0',   // border-slate-200
  G_TX:     '64748B',   // text-slate-500
  DARK:     '0F172A',   // text-slate-900
  EM:       '059669',   // text-emerald-600
  EM_BG:    'D1FAE5',   // bg-emerald-100
  AM:       'B45309',   // text-amber-600
  AM_BG:    'FEF3C7',   // bg-amber-100
  RED:      'DC2626',   // text-red-600
  RED_BG:   'FEE2E2',   // bg-red-100
  BLUE:     '3B82F6',   // blue-400 accent
  BLUE_DK:  '1D4ED8',   // blue-700
  BLUE_BG:  'DBEAFE',   // bg-blue-100
  NAVY_DK2: '1E3A5F',   // 계약전확인 배경
} as const

// ─── Font ─────────────────────────────────────────────────────
// Malgun Gothic: Windows/Office 기본 한글 폰트, PPT 열람 보장
export const FF = 'Malgun Gothic'

// ─── A4 Portrait layout (8.27" × 11.69") ────────────────────
export const PAGE = {
  W:    8.27,   // slide width
  H:    11.69,  // slide height
  HDR:  0.45,   // header bar height
  FTR:  0.22,   // footer bar height
  PX:   0.40,   // horizontal padding
} as const

export const FTRY = PAGE.H - PAGE.FTR   // 11.47
export const CX   = PAGE.PX
export const CW   = PAGE.W - PAGE.PX * 2  // 7.47
export const CY   = PAGE.HDR + 0.18       // 0.63 (content start)
export const CH   = FTRY - CY - 0.08      // 10.76 (content height)
