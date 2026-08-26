/**
 * intentRouter.ts
 * 사용자 메시지를 9가지 인텐트로 분류
 * 서버(route.ts)에서만 호출 — AI 응답 품질 향상용
 */

export type Intent =
  | 'GENERAL'        // 일반 대화·인사·사용법
  | 'AREA_RESEARCH'  // 특정 지역 상권 정보 조회
  | 'BUSINESS_FIT'   // 업종 선택·적합성 문의
  | 'STORE_ANALYSIS' // 점포 분석 요청 (실제 데이터 필요)
  | 'RENT_ANALYSIS'  // 임대조건·수익성 계산 요청
  | 'CONTRACT_RISK'  // 계약서·법적 위험 문의
  | 'COMPARE'        // 두 점포 비교
  | 'REPORT'         // 리포트·PPT 생성 요청
  | 'FOLLOW_UP'      // 이전 분석 결과에 대한 추가 질문

export interface IntentResult {
  intent: Intent
  confidence: 'high' | 'medium' | 'low'
  analysisRequested: boolean  // 명시적 분석 요청 키워드 포함 여부
}

// 키워드 맵 — 각 인텐트별 우선순위 높은 키워드
const INTENT_KEYWORDS: Record<Intent, string[]> = {
  STORE_ANALYSIS: [
    '분석해', '분석해줘', '분석해주세요', '분석 시작', '분석 부탁',
    '검토해줘', '검토해주세요', '어떤지 봐줘', '봐줘', '평가해줘', '판단해줘',
    '적합한지', '괜찮은지', '좋은지', '어때', '어떨까', '어떨것 같아',
  ],
  RENT_ANALYSIS: [
    '임대료', '월세', '보증금', '권리금', '수익성', '손익', '손익분기',
    '매출 얼마', '몇 퍼센트', '임대료 비율', '투자 회수', '회수 기간',
    '관리비', '공실', '유지비', '고정비',
  ],
  AREA_RESEARCH: [
    '상권', '유동인구', '핫플', '핫플레이스', '뜨는 곳', '뜨는 동네',
    '상권 분석', '입지', '어떤 동네', '어떤 상권', '좋은 상권',
    '경쟁 점포', '경쟁 업체', '폐업률', '공실률',
    '홍대', '강남', '성수', '신촌', '이태원', '건대', '합정', '망원',
  ],
  BUSINESS_FIT: [
    '업종', '어떤 업종', '무슨 업종', '잘 되는 업종', '트렌드', '유행',
    '음식점이', '카페가', '주점이', '무인점포', '미용실', '학원',
    '어울리는', '맞는 업종', '적합한 업종', '추천 업종',
  ],
  CONTRACT_RISK: [
    '계약서', '특약', '원상복구', '임대차', '임대인', '건물주',
    '위험', '주의', '조심', '사기', '분쟁', '법적', '임차인',
    '보증금 반환', '계약 해지', '해지', '명도',
    '등기', '근저당', '압류', '가처분',
  ],
  COMPARE: [
    '비교', '비교해줘', '두 곳', '어디가 더', 'vs', '대비',
    'A점', 'B점', '후보', '후보지', '선택', '어디로',
  ],
  REPORT: [
    '리포트', 'ppt', 'PPT', '발표자료', '보고서', '고객용',
    '인쇄', '출력', '파일', '다운로드', '저장',
  ],
  FOLLOW_UP: [
    '그래서', '그럼', '그렇다면', '아까', '방금', '이전에',
    '더 자세히', '추가로', '그 부분', '조금 더', '또', '근데',
    '위험요인', '강점', '약점', '체크리스트', '현장 확인',
  ],
  GENERAL: [
    '안녕', '안녕하세요', '사용법', '도움말', '뭐 할 수 있어', '어떻게',
    '처음', '시작', '무엇', '어떤 서비스',
  ],
}

// STORE_ANALYSIS 전용 명시적 분석 키워드
const ANALYSIS_TRIGGER_KEYWORDS = [
  '분석해', '분석해줘', '분석해주세요', '분석 시작', '분석 부탁',
  '검토해줘', '검토해주세요', '어떤지 봐줘', '봐줘', '평가해줘', '판단해줘',
]

export function routeIntent(userMessage: string): IntentResult {
  const msg = userMessage.trim()

  // 명시적 분석 요청 여부
  const analysisRequested = ANALYSIS_TRIGGER_KEYWORDS.some(kw => msg.includes(kw))

  // 각 인텐트 점수 계산
  const scores = new Map<Intent, number>()
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [Intent, string[]][]) {
    const matched = keywords.filter(kw => msg.includes(kw)).length
    if (matched > 0) scores.set(intent, matched)
  }

  if (scores.size === 0) {
    return { intent: 'GENERAL', confidence: 'low', analysisRequested }
  }

  // 가장 높은 점수 인텐트 선택
  let best: Intent = 'GENERAL'
  let bestScore = 0
  for (const [intent, score] of scores) {
    if (score > bestScore) { best = intent; bestScore = score }
  }

  // 분석 요청 키워드가 있으면 STORE_ANALYSIS 우선
  if (analysisRequested && best !== 'REPORT' && best !== 'COMPARE') {
    best = 'STORE_ANALYSIS'
  }

  const confidence: IntentResult['confidence'] = bestScore >= 2 ? 'high' : bestScore === 1 ? 'medium' : 'low'

  return { intent: best, confidence, analysisRequested }
}
