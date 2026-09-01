'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MockupCard } from '@/components/landing/MockupCard'

// ─── Design tokens ────────────────────────────────────────────────────────────
const TOKENS = {
  '--ink':          '#0A0A0A',
  '--accent':       '#C24A2C',
  '--accent-light': '#F4EBE7',
  '--gray':         '#F4F3F0',
  '--gray-mid':     '#E0DED9',
  '--muted':        '#6B6B6B',
  '--white':        '#FFFFFF',
} as React.CSSProperties

// ─── Static data ──────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  '임대료 적정성 분석', '권리금 회수기간 계산', '업종 적합성 평가',
  '상권 유동인구 분석', '경쟁업소 밀도 파악', '계약 전 체크리스트',
  '위험요인 자동 감지', '투자 회수 시뮬레이션', 'AI 전문가 채팅',
  '후보지 비교 분석', 'PDF · PPT 리포트',
]

const CHAT_DEMOS = [
  {
    user: '권리금 3,000만원이라는데, 낼 만한 건지 어떻게 알아요?',
    ai: '월 예상 순이익 기준으로 회수기간을 계산해드립니다. 일반적으로 24개월 이내가 적정 수준입니다. 점포 정보를 입력하시면 바로 계산해드릴게요.',
  },
  {
    user: '월세 800만원인데 이 업종으로 감당이 될까요?',
    ai: '업종별 적정 임대료 비율(매출 대비 10~12%)로 목표 매출과 손익분기점을 자동 계산합니다. 주류업은 12%, 카페는 10% 기준이 적용돼요.',
  },
  {
    user: '주변에 카페가 너무 많은데, 그래도 들어가도 될까요?',
    ai: '경쟁 밀도뿐 아니라 해당 지역 유동인구 특성, 시간대별 수요 패턴, 성공한 점포의 입지 조건까지 분석해드립니다.',
  },
]

const VS_ROWS = [
  { label: '분석 소요 시간',   alone: '수 일',    broker: '수 시간',    ai: '5분' },
  { label: '임대료 적정성',    alone: '✕',       broker: '△',         ai: '✓' },
  { label: '권리금 회수 계산', alone: '✕',       broker: '✕',         ai: '✓' },
  { label: '업종 적합성',      alone: '✕',       broker: '△',         ai: '✓' },
  { label: '위험요인 감지',    alone: '✕',       broker: '△',         ai: '✓' },
  { label: '계약 체크리스트',  alone: '✕',       broker: '✕',         ai: '✓' },
  { label: 'PDF · PPT 리포트', alone: '✕',       broker: '✕',         ai: '✓' },
  { label: '비용',             alone: '무료',     broker: '계약 수수료', ai: '무료~₩5만' },
]

const FAQS = [
  { q: '무료로 어디까지 사용할 수 있나요?', a: 'AI 채팅 질문과 기본 점포 진단은 무료로 제공됩니다. PDF·PPT 전문 리포트와 무제한 점포 분석은 유료 플랜을 통해 이용하실 수 있습니다.' },
  { q: '공인중개사 없이도 계약할 수 있나요?', a: '상권연구소 AI는 계약 판단을 돕는 분석 도구입니다. 법적 계약은 공인중개사와 함께 진행하시되, 계약 전에 AI 분석으로 조건을 먼저 검토하세요.' },
  { q: '분석 결과를 믿어도 되나요?', a: '임대료 부담·권리금 회수기간 등 수치 분석은 입력 데이터 기반으로 정확하게 계산됩니다. 상권 특성 분석은 AI 추정을 포함하므로 최종 판단은 현장 확인과 병행하시기를 권장합니다.' },
  { q: '상가 투자(임차가 아닌 매입)도 분석 가능한가요?', a: '현재는 점포 임차 창업자를 위한 분석에 최적화되어 있습니다. 상가 매입 투자 분석은 추후 업데이트 예정입니다.' },
  { q: '입력한 점포 정보는 안전한가요?', a: '모든 데이터는 암호화되어 처리되며 제3자에게 공유되지 않습니다. 브라우저 로컬 저장소에만 보관되며 언제든 삭제 가능합니다.' },
]

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ ...TOKENS, fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif', color: 'var(--ink)', background: 'var(--white)', overflowX: 'hidden' } as React.CSSProperties}>
      <style>{`
        @keyframes ticker-slide {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .l-ticker-track {
          display: flex;
          width: max-content;
          animation: ticker-slide 36s linear infinite;
        }
        .l-ticker-track:hover { animation-play-state: paused; }
        .l-serif {
          font-family: 'Noto Serif KR', 'Nanum Myeongjo', Georgia, 'Times New Roman', serif;
        }
        .l-nav-link {
          font-size: 14px; color: #6B6B6B; text-decoration: none;
          transition: color 0.15s;
        }
        .l-nav-link:hover { color: #0A0A0A; }
        .l-btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          background: #C24A2C; color: white;
          padding: 14px 28px; border-radius: 10px;
          font-size: 15px; font-weight: 700; text-decoration: none;
          transition: background 0.15s, transform 0.1s;
        }
        .l-btn-primary:hover { background: #A83D23; transform: translateY(-1px); }
        .l-btn-secondary {
          display: inline-flex; align-items: center; gap: 6px;
          background: #F4F3F0; color: #0A0A0A;
          padding: 14px 24px; border-radius: 10px;
          font-size: 15px; font-weight: 600; text-decoration: none;
          transition: background 0.15s;
        }
        .l-btn-secondary:hover { background: #E0DED9; }
        .l-faq-toggle {
          display: inline-block; transition: transform 0.2s;
        }
        /* VS table cell coloring */
        .vs-check { color: #27AE60; font-weight: 700; }
        .vs-cross { color: #BDC3C7; }
        .vs-half  { color: #E67E22; }
        /* Nav links: desktop only */
        .l-nav-links { display: none; }
        @media (min-width: 768px) {
          .l-nav-links { display: flex !important; }
        }
        /* Nav login button: desktop only */
        .l-nav-login { display: none; }
        @media (min-width: 768px) {
          .l-nav-login { display: inline-flex !important; }
        }
        /* Sticky CTA bar: mobile only */
        .l-mobile-cta { display: block; }
        @media (min-width: 768px) {
          .l-mobile-cta { display: none !important; }
        }
        /* Responsive overrides */
        @media (max-width: 820px) {
          .l-hero-grid    { grid-template-columns: 1fr !important; gap: 32px !important; }
          .l-hero-visual  { display: none !important; }
          .l-process-main { grid-template-columns: 1fr !important; gap: 32px !important; }
          .l-process-grid { grid-template-columns: 1fr 1fr !important; }
          .l-pricing-grid { grid-template-columns: 1fr !important; }
          .l-founder-grid { grid-template-columns: 1fr !important; text-align: center; }
          .l-founder-photo { margin: 0 auto !important; }
          .l-footer-inner { flex-direction: column !important; gap: 20px !important; }
        }
        @media (max-width: 640px) {
          .l-process-grid  { grid-template-columns: 1fr !important; }
          .l-hero-cta      { flex-direction: column !important; align-items: stretch !important; }
          .l-btn-primary   { width: 100% !important; justify-content: center !important; box-sizing: border-box !important; }
          .l-btn-secondary { width: 100% !important; justify-content: center !important; box-sizing: border-box !important; }
          .l-pricing-grid  { gap: 12px !important; }
        }
        /* Mobile bottom padding for sticky bars */
        @media (max-width: 767px) {
          .l-page-bottom { padding-bottom: 80px; }
        }
      `}</style>

      {/* ══ NAV ══════════════════════════════════════════════════════════════ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: scrolled ? 'rgba(255,255,255,0.96)' : 'white',
        borderBottom: `1px solid ${scrolled ? '#E0DED9' : 'transparent'}`,
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(10px)' : 'none',
        transition: 'all 0.2s ease',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(16px, 4vw, 40px)', display: 'flex', alignItems: 'center', height: 62, gap: 32 }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)' }}>상권연구소 AI</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', borderRadius: 4, padding: '2px 7px', letterSpacing: '0.04em' }}>PRO</span>
          </Link>
          {/* Desktop nav links — hidden on mobile via l-nav-links class */}
          <div style={{ flex: 1, gap: 28, alignItems: 'center' }} className="l-nav-links">
            <a href="#process" className="l-nav-link">서비스 소개</a>
            <a href="#pricing" className="l-nav-link">가격</a>
            <a href="#faq" className="l-nav-link">FAQ</a>
          </div>
          {/* CTAs */}
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <Link href="/chat" className="l-nav-login" style={{
              fontSize: 13, fontWeight: 600, color: 'var(--ink)',
              textDecoration: 'none', padding: '7px 14px', borderRadius: 8,
              border: '1px solid var(--gray-mid)', transition: 'background 0.15s',
            }}>로그인</Link>
            <Link href="/store/new" style={{
              fontSize: 13, fontWeight: 700, color: 'white',
              textDecoration: 'none', padding: '7px 16px', borderRadius: 8,
              background: 'var(--accent)', whiteSpace: 'nowrap',
            }}>무료 진단 시작</Link>
          </div>
        </div>
      </nav>

      {/* ══ HERO ═════════════════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--white)', padding: 'clamp(48px, 8vw, 72px) 0 clamp(40px, 6vw, 64px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(20px, 4vw, 40px)' }}>
          <div className="l-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(40px, 6vw, 72px)', alignItems: 'center' }}>
            {/* Left: text */}
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'var(--accent-light)', borderRadius: 100,
                padding: '5px 14px', marginBottom: 28,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.02em' }}>점포 계약 전 AI 분석 서비스</span>
              </div>
              <h1 className="l-serif" style={{
                fontSize: 'clamp(34px, 5vw, 56px)',
                fontWeight: 900, lineHeight: 1.22,
                color: 'var(--ink)', marginBottom: 24, letterSpacing: '-0.01em',
              }}>
                계약 전 점포분석,<br />
                <span style={{ color: 'var(--accent)' }}>안 하셨죠?</span>
              </h1>
              <p style={{ fontSize: 17, lineHeight: 1.78, color: '#444', marginBottom: 36, maxWidth: 460 }}>
                임대료 적정성부터 권리금 회수기간, 업종 적합성까지<br />
                AI가 <strong>5분 안에</strong> 전문가 수준으로 분석합니다.
              </p>
              <div className="l-hero-cta" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
                <Link href="/store/new" className="l-btn-primary">무료 점포 진단 시작 →</Link>
                <Link href="/chat" className="l-btn-secondary">AI에게 바로 물어보기</Link>
              </div>
              <p style={{ fontSize: 13, color: '#aaa' }}>신용카드 불필요 · 회원가입 없이 시작</p>
            </div>
            {/* Right: mockup */}
            <div className="l-hero-visual" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
                <div style={{
                  position: 'absolute', inset: -24, background: 'var(--accent-light)',
                  borderRadius: 36, zIndex: 0,
                }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <MockupCard />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TICKER ═══════════════════════════════════════════════════════════ */}
      <div style={{ background: 'var(--ink)', padding: '13px 0', overflow: 'hidden' }} aria-hidden="true">
        <div className="l-ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} style={{
              whiteSpace: 'nowrap', fontSize: 13, fontWeight: 500,
              color: i % 4 === 1 ? 'var(--accent)' : 'rgba(255,255,255,0.85)',
              padding: '0 22px',
            }}>
              {item} ·
            </span>
          ))}
        </div>
      </div>

      {/* ══ PAIN POINTS (chat demo) ══════════════════════════════════════════ */}
      <section style={{ background: 'var(--gray)', padding: 'clamp(48px, 8vw, 80px) 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(20px, 4vw, 40px)' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: 12, textTransform: 'uppercase' }}>창업자의 고민</div>
            <h2 className="l-serif" style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.3 }}>
              이런 고민, 해보셨나요?
            </h2>
          </div>
          {CHAT_DEMOS.map((chat, i) => (
            <div key={i} style={{ marginBottom: 36 }}>
              {/* User message */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <div style={{
                  background: 'var(--ink)', color: 'white',
                  borderRadius: '18px 4px 18px 18px',
                  padding: '12px 18px', maxWidth: '78%',
                  fontSize: 14, lineHeight: 1.65,
                }}>{chat.user}</div>
              </div>
              {/* AI response */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--accent)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, flexShrink: 0, marginTop: 2,
                }}>AI</div>
                <div style={{
                  background: 'white', color: 'var(--ink)',
                  borderRadius: '4px 18px 18px 18px',
                  padding: '12px 18px', maxWidth: '78%',
                  fontSize: 14, lineHeight: 1.65,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}>{chat.ai}</div>
              </div>
            </div>
          ))}
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link href="/chat" className="l-btn-primary">AI에게 직접 물어보기 →</Link>
          </div>
        </div>
        </div>
      </section>

      {/* ══ FOUNDER ══════════════════════════════════════════════════════════ */}
      <section style={{ background: 'white', padding: 'clamp(48px, 8vw, 80px) 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(20px, 4vw, 40px)' }}>
        <div className="l-founder-grid" style={{ maxWidth: 880, margin: '0 auto', display: 'grid', gridTemplateColumns: '200px 1fr', gap: 56, alignItems: 'center' }}>
          <div className="l-founder-photo" style={{ width: 200, height: 200, borderRadius: 16, overflow: 'hidden', flexShrink: 0, margin: 0, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <img src="/contract.png" alt="부동산 임대차 계약서" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: 16, textTransform: 'uppercase' }}>왜 만들었나요</div>
            <blockquote className="l-serif" style={{
              fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: 700,
              color: 'var(--ink)', lineHeight: 1.65, margin: '0 0 20px',
              borderLeft: '3px solid var(--accent)', paddingLeft: 20,
            }}>
              &ldquo;계약서에 도장 찍고 나서야<br />알게 되는 것들이 너무 많았습니다.&rdquo;
            </blockquote>
            <p style={{ fontSize: 15, color: '#555', lineHeight: 1.85, margin: 0 }}>
              임대료 비율이 얼마나 높은지, 권리금을 회수할 수 있는지, 그 자리가 내 업종에 맞는지.
              계약 전에 알았더라면 달랐을 결정들을 AI로 5분 안에 확인할 수 있게 만들었습니다.
            </p>
          </div>
        </div>
        </div>
      </section>

      {/* ══ VS TABLE ═════════════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--gray)', padding: 'clamp(48px, 8vw, 80px) 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(20px, 4vw, 40px)' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: 12, textTransform: 'uppercase' }}>비교</div>
            <h2 className="l-serif" style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, color: 'var(--ink)' }}>
              다른 방법과 비교해보세요
            </h2>
          </div>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', minWidth: 480 }}>
              <thead>
                <tr>
                  <th style={{ padding: '15px 20px', textAlign: 'left', background: 'var(--gray)', fontSize: 12, fontWeight: 600, color: '#999' }}></th>
                  <th style={{ padding: '15px 16px', textAlign: 'center', background: 'var(--gray)', fontSize: 12, fontWeight: 600, color: '#777' }}>혼자 알아볼 때</th>
                  <th style={{ padding: '15px 16px', textAlign: 'center', background: 'var(--gray)', fontSize: 12, fontWeight: 600, color: '#777' }}>공인중개사 단독</th>
                  <th style={{ padding: '15px 16px', textAlign: 'center', background: 'var(--accent)', fontSize: 12, fontWeight: 800, color: 'white' }}>상권연구소 AI</th>
                </tr>
              </thead>
              <tbody>
                {VS_ROWS.map((row, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--gray)' }}>
                    <td style={{ padding: '13px 20px', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{row.label}</td>
                    <td style={{ padding: '13px 16px', textAlign: 'center', fontSize: 13 }}>
                      <span className={row.alone === '✓' ? 'vs-check' : row.alone === '✕' ? 'vs-cross' : row.alone === '△' ? 'vs-half' : ''}>{row.alone}</span>
                    </td>
                    <td style={{ padding: '13px 16px', textAlign: 'center', fontSize: 13 }}>
                      <span className={row.broker === '✓' ? 'vs-check' : row.broker === '✕' ? 'vs-cross' : row.broker === '△' ? 'vs-half' : ''}>{row.broker}</span>
                    </td>
                    <td style={{ padding: '13px 16px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--accent)', background: '#FFF8F6' }}>
                      <span className={row.ai === '✓' ? 'vs-check' : row.ai === '✕' ? 'vs-cross' : ''}>{row.ai}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </section>

      {/* ══ PROCESS ══════════════════════════════════════════════════════════ */}
      <section id="process" style={{ background: 'white', padding: 'clamp(48px, 8vw, 80px) 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(20px, 4vw, 40px)' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: 12, textTransform: 'uppercase' }}>이용 방법</div>
            <h2 className="l-serif" style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 800, color: 'var(--ink)' }}>
              4단계로 끝나는 점포 분석
            </h2>
          </div>
          {/* Steps + MockupCard side layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(32px, 5vw, 56px)', alignItems: 'stretch' }} className="l-process-main">
            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} className="l-process-grid">
              {[
                { step: '01', icon: '📋', title: '점포 정보 입력',   desc: '주소, 업종, 보증금·월세·권리금을 입력합니다. 알고 있는 정보만으로 시작 가능합니다.' },
                { step: '02', icon: '⚡', title: 'AI 실시간 분석',   desc: '임대료 비율, 권리금 회수기간, 업종 적합성을 즉시 계산합니다.', highlighted: true },
                { step: '03', icon: '🔍', title: '위험요인 파악',    desc: '계약 전 놓치기 쉬운 체크리스트와 위험요소를 자동으로 정리합니다.' },
                { step: '04', icon: '📊', title: '리포트 다운로드',  desc: '전문 컨설팅 수준의 PDF·PPT 리포트를 바로 받아 보실 수 있습니다.' },
              ].map((s) => (
                <div key={s.step} style={{
                  background: s.highlighted ? 'var(--ink)' : 'var(--gray)',
                  borderRadius: 14, padding: '20px 24px',
                  display: 'flex', gap: 16, alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: s.highlighted ? 'var(--accent)' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800,
                    color: s.highlighted ? 'white' : 'var(--ink)',
                  }}>{s.step}</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 18 }}>{s.icon}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: s.highlighted ? 'white' : 'var(--ink)' }}>{s.title}</span>
                    </div>
                    <p style={{ fontSize: 13, color: s.highlighted ? 'rgba(255,255,255,0.68)' : '#666', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 8 }}>
                <Link href="/store/new" className="l-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  지금 바로 시작하기 →
                </Link>
              </div>
            </div>
            {/* MockupCard showcase — panel fills full row height */}
            <div style={{
              background: 'var(--gray)', borderRadius: 20,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '28px 24px', gap: 16,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textAlign: 'center', letterSpacing: '0.06em', textTransform: 'uppercase' }}>분석 결과 미리보기</div>
              <MockupCard
                score={68}
                grade="B+"
                rentBurden={10.8}
                premiumMonths={22}
                bizFit="적합"
                address="천안시 서북구 두정동"
                category="한식 일반음식점"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══ PRICING ══════════════════════════════════════════════════════════ */}
      <section id="pricing" style={{ background: 'var(--gray)', padding: 'clamp(48px, 8vw, 80px) 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(20px, 4vw, 40px)' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: 12, textTransform: 'uppercase' }}>가격</div>
            <h2 className="l-serif" style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, color: 'var(--ink)' }}>
              합리적인 가격, 계약 실수 비용의 1%
            </h2>
          </div>
          <div className="l-pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              {
                name: '무료',
                price: '₩0',
                period: '영구 무료',
                features: ['AI 채팅 질문 (무제한)', '기본 점포 진단', '임대료·손익 계산기', '업종별 체크리스트'],
                cta: '무료로 시작',
                href: '/chat',
                highlighted: false,
              },
              {
                name: 'Standard',
                price: '₩30,000',
                period: '건당',
                badge: '인기',
                features: ['전문 점포 분석 리포트', 'PDF 다운로드 포함', '9페이지 컨설팅 리포트', '위험요인 상세 분석', '계약 전 체크리스트'],
                cta: '분석 리포트 신청',
                href: '/store/new',
                highlighted: true,
              },
              {
                name: 'Pro',
                price: '₩50,000',
                period: '/ 월',
                features: ['무제한 점포 분석', 'PPT 리포트 포함', '후보지 2개 비교 분석', 'AI 우선 응답', '월 상권 동향 업데이트'],
                cta: '프로 플랜 시작',
                href: '/store/new',
                highlighted: false,
              },
            ].map((plan) => (
              <div key={plan.name} style={{
                background: plan.highlighted ? 'var(--ink)' : 'white',
                borderRadius: 16, padding: '28px 24px',
                border: plan.highlighted ? '2px solid var(--accent)' : '1px solid var(--gray-mid)',
                display: 'flex', flexDirection: 'column', position: 'relative',
              }}>
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--accent)', color: 'white',
                    fontSize: 11, fontWeight: 800, padding: '3px 12px', borderRadius: 100,
                  }}>{plan.badge}</div>
                )}
                <div style={{ fontSize: 12, fontWeight: 700, color: plan.highlighted ? 'var(--accent)' : '#999', letterSpacing: '0.06em', marginBottom: 6 }}>{plan.name}</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: plan.highlighted ? 'white' : 'var(--ink)', marginBottom: 4 }}>{plan.price}</div>
                <div style={{ fontSize: 13, color: plan.highlighted ? 'rgba(255,255,255,0.45)' : '#aaa', marginBottom: 24 }}>{plan.period}</div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
                  {plan.features.map((f, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                      <span style={{ color: plan.highlighted ? 'var(--accent)' : '#27AE60', flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span style={{ fontSize: 13, color: plan.highlighted ? 'rgba(255,255,255,0.78)' : '#444', lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href={plan.href} style={{
                  display: 'block', textAlign: 'center',
                  background: plan.highlighted ? 'var(--accent)' : 'var(--ink)',
                  color: 'white', padding: '13px 0', borderRadius: 9,
                  fontSize: 14, fontWeight: 700, textDecoration: 'none',
                  transition: 'opacity 0.15s',
                }}>{plan.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ══════════════════════════════════════════════════════════════ */}
      <section id="faq" style={{ background: 'white', padding: 'clamp(48px, 8vw, 80px) 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(20px, 4vw, 40px)' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: 12, textTransform: 'uppercase' }}>FAQ</div>
            <h2 className="l-serif" style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, color: 'var(--ink)' }}>자주 묻는 질문</h2>
          </div>
          <div>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ borderBottom: '1px solid var(--gray)' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 16,
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{faq.q}</span>
                  <span className="l-faq-toggle" style={{ fontSize: 22, color: 'var(--accent)', flexShrink: 0, transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ paddingBottom: 20, fontSize: 14, color: '#555', lineHeight: 1.8 }}>{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
        </div>
      </section>

      {/* ══ CTA BAND ═════════════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--ink)', padding: 'clamp(52px, 8vw, 88px) 0', textAlign: 'center' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(20px, 4vw, 40px)' }}>
        <div style={{ maxWidth: 580, margin: '0 auto' }}>
          <h2 className="l-serif" style={{
            fontSize: 'clamp(28px, 4.5vw, 46px)', fontWeight: 900,
            color: 'white', marginBottom: 18, lineHeight: 1.3,
          }}>
            계약서에 도장 찍기 전,<br />
            <span style={{ color: 'var(--accent)' }}>5분 투자하세요.</span>
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 36, lineHeight: 1.75 }}>
            계약 후 후회하는 창업자가 되지 마세요.<br />
            무료로 지금 바로 분석을 시작할 수 있습니다.
          </p>
          <Link href="/store/new" className="l-btn-primary" style={{ fontSize: 16, padding: '16px 36px', borderRadius: 12 }}>
            지금 바로 무료 분석받기 →
          </Link>
        </div>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <footer className="l-page-bottom" style={{ background: '#111', padding: 'clamp(32px, 5vw, 44px) 0 clamp(24px, 4vw, 36px)', color: 'rgba(255,255,255,0.45)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(20px, 4vw, 40px)' }}>
        <div className="l-footer-inner" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 28 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 10 }}>상권연구소 AI PRO</div>
            <div style={{ fontSize: 12, lineHeight: 1.9 }}>
              상호: 상권연구소 AI<br />
              사업자등록번호: [사업자등록번호 입력]<br />
              이메일: 2571320@gmail.com
            </div>
          </div>
          <div style={{ display: 'flex', gap: 36 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>서비스</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <Link href="/store/new" style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>점포 분석</Link>
                <Link href="/chat"      style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>AI 채팅</Link>
                <Link href="/compare"   style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>후보지 비교</Link>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>법적 고지</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <a href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>이용약관</a>
                <a href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>개인정보처리방침</a>
              </div>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 24, paddingTop: 20, fontSize: 11 }}>
          © 2026 상권연구소 AI. 본 서비스는 투자·법률 자문이 아닙니다. 최종 계약 판단은 전문가와 함께하시기 바랍니다.
        </div>
        </div>
      </footer>

      {/* ══ STICKY CTA BAR (mobile only) ════════════════════════════════════ */}
      <div className="l-mobile-cta" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 90,
        background: 'white', borderTop: '1px solid var(--gray-mid)',
        padding: '10px 16px',
        paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
      }}>
        <Link href="/store/new" style={{
          display: 'block', textAlign: 'center',
          background: 'var(--accent)', color: 'white',
          padding: '14px 0', borderRadius: 10,
          fontSize: 15, fontWeight: 700, textDecoration: 'none',
        }}>
          무료 점포 진단 시작 →
        </Link>
      </div>
    </div>
  )
}
