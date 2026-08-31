export function MockupCard({
  score = 72,
  grade = 'B',
  rentBurden = 11.2,
  premiumMonths = 28,
  bizFit = '적합',
  address = '천안시 서북구 두정동',
  category = '일반음식점',
}: {
  score?: number
  grade?: string
  rentBurden?: number
  premiumMonths?: number
  bizFit?: string
  address?: string
  category?: string
}) {
  const gradeColor = score >= 80 ? '#27AE60' : score >= 60 ? '#C24A2C' : '#E74C3C'
  return (
    <div style={{
      background: '#fff', border: '1px solid #E0DED9', borderRadius: 16,
      padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.10)', maxWidth: 320,
      fontFamily: 'Pretendard, sans-serif',
    }}>
      <div style={{ fontSize: 10, color: '#999', marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        상권연구소 AI · 점포 분석 결과
      </div>
      <div style={{ fontSize: 12, color: '#555', marginBottom: 16, fontWeight: 500 }}>
        {address} · {category}
      </div>
      {/* Score ring */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #F4F3F0' }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: `conic-gradient(${gradeColor} ${score}%, #F4F3F0 0)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', position: 'absolute',
          }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#0A0A0A', lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: 8, color: '#999' }}>/ 100</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0A0A0A' }}>{grade}등급</div>
          <div style={{ fontSize: 11, color: '#6B6B6B' }}>계약 검토 권장</div>
        </div>
      </div>
      {/* Metrics */}
      {[
        { label: '임대료 비율',    value: `${rentBurden}%`,    badge: '주의', badgeColor: '#E67E22' },
        { label: '권리금 회수기간', value: `${premiumMonths}개월`, badge: '보통', badgeColor: '#2980B9' },
        { label: '업종 적합성',    value: bizFit,              badge: '적합', badgeColor: '#27AE60' },
      ].map(m => (
        <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #F4F3F0' }}>
          <span style={{ fontSize: 12, color: '#6B6B6B' }}>{m.label}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A' }}>{m.value}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: m.badgeColor, background: m.badgeColor + '18', borderRadius: 4, padding: '2px 6px' }}>{m.badge}</span>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 14, fontSize: 11, color: '#C24A2C', fontWeight: 600 }}>
        → 계약 전 확인 필요 항목 5개 있음
      </div>
    </div>
  )
}
