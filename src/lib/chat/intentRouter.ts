/**
 * intentRouter.ts
 * 사용자 메시지 → 11가지 인텐트 분류 + 웹 검색 필요 여부 판단
 */

export type Intent =
  | 'GENERAL'             // A. 일반 대화·인사·사용법
  | 'AREA_RESEARCH'       // B. 지역 상권 질문
  | 'STORE_ANALYSIS'      // C. 특정 점포 종합 분석
  | 'BUSINESS_FIT'        // D. 업종 적합성 분석
  | 'RENT_ANALYSIS'       // E. 임대료·고정비·수익성 분석
  | 'COMPARE'             // F. 후보지 비교
  | 'CONTRACT_RISK'       // G. 권리금·계약 위험 문의
  | 'INVESTMENT_ANALYSIS' // H. 투자 분석·ROI
  | 'LATEST_INFO'         // I. 최신 지역정보·개발계획
  | 'REPORT'              // J. 리포트·PPT 생성
  | 'FOLLOW_UP'           // K. 기존 분석 후속 질문

export interface IntentResult {
  intent: Intent
  confidence: 'high' | 'medium' | 'low'
  analysisRequested: boolean   // 명시적 분석 키워드 포함 여부
  needsWebSearch: boolean      // 웹 검색이 필요한 질문인지
  modelTier: 'chat' | 'analysis'  // 사용할 모델 등급
}

// ─── 인텐트별 키워드 ─────────────────────────────────────────────────────────

const INTENT_KEYWORDS: Record<Intent, string[]> = {
  STORE_ANALYSIS: [
    '분석해', '분석해줘', '분석해주세요', '분석 시작', '분석 부탁',
    '검토해줘', '검토해주세요', '어떤지 봐줘', '봐줘', '평가해줘', '판단해줘',
    '적합한지', '괜찮은지', '좋은지 봐', '어때', '어떨까', '볼까요', '봐줄게',
    '1층', '2층', '3층', '지하', '평에', '전면폭', '보증금', '월세',
  ],
  RENT_ANALYSIS: [
    '임대료', '월세 부담', '보증금 비율', '권리금 회수', '수익성', '손익', '손익분기',
    '매출 얼마', '몇 퍼센트', '임대료 비율', '투자 회수', '회수 기간',
    '관리비', '고정비', '원가율', '인건비 구조',
    '월세가 많아', '월세가 높아', '부담스러워', '감당',
  ],
  AREA_RESEARCH: [
    '상권', '유동인구', '먹자골목', '상권 어때', '상권이 어떤',
    '어떤 동네', '어떤 상권', '좋은 상권', '상권 특성',
    '경쟁 점포', '경쟁 업체', '폐업률', '공실률', '상권 변화',
    '뜨는 곳', '뜨는 동네', '핫플', '핫플레이스',
  ],
  BUSINESS_FIT: [
    '업종이', '어떤 업종', '무슨 업종', '잘 되는 업종', '트렌드', '유행',
    '음식점이', '카페가', '주점이', '무인점포', '미용실', '학원',
    '어울리는', '맞는 업종', '적합한 업종', '추천 업종',
    '고깃집', '술집', '분식', '치킨', '카페',
    '창업', '장사', '어때',
  ],
  CONTRACT_RISK: [
    '계약서', '특약', '원상복구', '임대차', '임대인', '건물주',
    '위험', '조심', '사기', '분쟁', '법적', '임차인',
    '보증금 반환', '계약 해지', '해지', '명도',
    '등기', '근저당', '압류', '가처분', '권리금 계약',
  ],
  COMPARE: [
    '비교', '비교해줘', '두 곳', '어디가 더', 'vs', '대비',
    'A점', 'B점', '후보', '후보지', '선택', '어디로',
    '어디가 나아', '어느 게 나아', '둘 중',
  ],
  INVESTMENT_ANALYSIS: [
    '투자', '투자금', '투자회수', 'ROI', '수익률', '수익 분석',
    '얼마 벌어', '순이익', '월 순수익', '연 수익',
    '초기 비용', '초기 투자', '총 투자',
  ],
  LATEST_INFO: [
    '요즘', '최근', '현재', '지금', '최신',
    '개발', '개발계획', '재개발', '재건축', '교통계획', '지하철',
    '뉴스', '기사', '변화', '트렌드',
    '검색해줘', '찾아봐', '알아봐줘',
    '이번 달', '이번 년도', '올해',
  ],
  REPORT: [
    '리포트', 'ppt', 'PPT', '발표자료', '보고서', '고객용',
    '인쇄', '출력', '파일', '다운로드', '저장',
    '리포트 만들어', '보고서 만들어',
  ],
  FOLLOW_UP: [
    '그래서', '그럼', '그렇다면', '아까', '방금', '이전에',
    '더 자세히', '추가로', '그 부분', '조금 더', '또',
    '위험요인', '강점', '약점', '체크리스트', '현장 확인',
    '어떻게 해', '어떻게 하면', '해결',
  ],
  GENERAL: [
    '안녕', '안녕하세요', '사용법', '도움말', '뭐 할 수 있어', '어떻게 사용',
    '처음', '시작', '무엇을 할 수 있', '어떤 서비스', '소개',
    '고마워', '감사', '수고',
  ],
}

// 명시적 분석 요청 키워드
const ANALYSIS_TRIGGER = [
  '분석해', '분석해줘', '분석해주세요', '분석 시작', '분석 부탁',
  '검토해줘', '검토해주세요', '어떤지 봐줘', '봐줘', '평가해줘', '판단해줘',
]

// 웹 검색 필요성 판단 — 최신 정보가 필수인 키워드
const WEB_SEARCH_TRIGGERS = [
  '요즘', '최근', '현재', '지금', '최신', '올해', '이번 달',
  '개발', '개발계획', '재개발', '재건축', '교통계획', '지하철',
  '뉴스', '기사', '변화', '검색해줘', '찾아봐', '알아봐줘',
  '상권 변화', '경쟁 점포', '폐업률',
]

// 복잡한 분석이 필요한 인텐트 (고성능 모델 사용)
const HIGH_TIER_INTENTS: Set<Intent> = new Set([
  'STORE_ANALYSIS', 'RENT_ANALYSIS', 'COMPARE',
  'INVESTMENT_ANALYSIS', 'CONTRACT_RISK',
])

// 웹 검색을 항상 켜는 인텐트
const WEB_SEARCH_INTENTS: Set<Intent> = new Set(['AREA_RESEARCH', 'LATEST_INFO'])

export function routeIntent(userMessage: string): IntentResult {
  const msg = userMessage.trim()

  const analysisRequested = ANALYSIS_TRIGGER.some(kw => msg.includes(kw))
  const hasFreshKeyword = WEB_SEARCH_TRIGGERS.some(kw => msg.includes(kw))

  // 점수 계산
  const scores = new Map<Intent, number>()
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [Intent, string[]][]) {
    const matched = keywords.filter(kw => msg.includes(kw)).length
    if (matched > 0) scores.set(intent, matched)
  }

  // 아무것도 매칭 안 됨 → GENERAL
  if (scores.size === 0) {
    return {
      intent: 'GENERAL',
      confidence: 'low',
      analysisRequested,
      needsWebSearch: false,
      modelTier: 'chat',
    }
  }

  // 최고 점수 인텐트
  let best: Intent = 'GENERAL'
  let bestScore = 0
  for (const [intent, score] of scores) {
    if (score > bestScore) { best = intent; bestScore = score }
  }

  // 우선순위 보정
  // 1. 명시적 분석 요청 + 점포 조건 포함 → STORE_ANALYSIS
  if (analysisRequested && best !== 'REPORT' && best !== 'COMPARE') {
    best = 'STORE_ANALYSIS'
  }
  // 2. 최신 정보 키워드 + 지역 언급 → LATEST_INFO 또는 AREA_RESEARCH 강화
  if (hasFreshKeyword && best === 'AREA_RESEARCH') best = 'LATEST_INFO'

  // 웹 검색 필요 여부: 인텐트 기반 + 최신 키워드
  const needsWebSearch = WEB_SEARCH_INTENTS.has(best) || hasFreshKeyword

  const confidence: IntentResult['confidence'] =
    bestScore >= 3 ? 'high' : bestScore >= 2 ? 'medium' : 'low'

  const modelTier: IntentResult['modelTier'] =
    HIGH_TIER_INTENTS.has(best) ? 'analysis' : 'chat'

  return { intent: best, confidence, analysisRequested, needsWebSearch, modelTier }
}
