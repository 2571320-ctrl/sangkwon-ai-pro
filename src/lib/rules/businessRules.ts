/**
 * businessRules.ts
 * 업종별 핵심 판단 요소, 가중치, 체크리스트 정의
 * Rule Engine과 AI Prompt가 동일한 규칙을 참조하여 일관성 유지
 */

export type BusinessCategory = 'food' | 'bar' | 'unmanned' | 'cafe' | 'retail' | 'service' | 'general'

export interface BusinessRule {
  category: BusinessCategory
  label: string
  keywords: string[]
  /** HIGH: 계약 성패를 결정하는 핵심 요소 */
  highFactors: string[]
  /** MEDIUM: 중요하지만 보완 가능한 요소 */
  mediumFactors: string[]
  /** LOW: 있으면 좋지만 없어도 운영 가능 */
  lowFactors: string[]
  /** 업종별 필수 시설·설비 체크리스트 */
  facilityChecks: string[]
  /** 업종별 행정·인허가 체크리스트 */
  regulatoryChecks: string[]
  /** 임대료 위험 기준 (매출 대비 %) */
  rentRatioWarning: number  // % — 이 이상이면 주의
  rentRatioDanger: number   // % — 이 이상이면 위험
  /** 적정 면적 범위 (평) */
  minAreaPyeong: number
  recommendedAreaPyeong: number
  /** 임대료 대비 최소 전면폭 (m) */
  minFrontageMeters: number
  /** 업종별 실패 위험 요인 */
  specificRisks: string[]
  /** 업종별 성공 조건 설명 */
  successCondition: string
}

const RULES: Record<BusinessCategory, BusinessRule> = {
  bar: {
    category: 'bar',
    label: '주점·술집',
    keywords: ['주점', '술집', '호프', '바 ', '포차', '이자카야', '선술집', '맥주집', '와인바', '칵테일', '요리주점'],
    highFactors: [
      '야간 보행동선 — 낮이 아닌 밤 10시 기준 유동인구가 핵심',
      '가시성 — 야간 조명·간판이 주요 동선에서 보이는지',
      '전면폭 — 최소 6m 이상이어야 입구 인지와 좌석 배치 가능',
      '경쟁환경 — 반경 200m 내 동종 주점 수와 가격대',
      '임대료 부담 — 주류비+인건비 구조에서 고정비 비중이 높음',
      '닥트(환기) — 음식 조리·주류 냄새 배기 필수',
      '소음·민원 — 건물 방음과 인근 주거 여부',
      '영업신고 가능 여부 — 건물 용도 및 행정구역 확인',
    ],
    mediumFactors: [
      '주차 — 야간 차량 고객 유입 영향',
      '화장실 — 전용 화장실 유무가 고객 만족도에 직결',
      '배후 주거 인구 — 단골 반경',
      '전기 용량 — 음향 설비·냉방 동시 가동',
    ],
    lowFactors: [
      '도시가스 인입 (LPG 대체 가능)',
      '엘리베이터 (2층 이상 시 유리)',
    ],
    facilityChecks: [
      '닥트(환기) 설치 가능 여부 — 건물주 사전 협의',
      '화장실 전용 여부 및 위치',
      '전기 용량 (음향·냉장·조명 동시 가동)',
      '소방 설비 적합 여부',
      '간판 야간 조명 설치 가능 위치·크기',
      '주방 배수 및 그리스 트랩',
    ],
    regulatoryChecks: [
      '건물 용도 확인 — 일반음식점·휴게음식점·단란주점 영업신고 가능 여부',
      '행정구역 — 학교·병원 주변 영업 제한 구역 여부',
      '소음 기준 — 심야 영업 적합 여부',
      '등기부등본 — 근저당·압류 확인',
    ],
    rentRatioWarning: 10,
    rentRatioDanger: 14,
    minAreaPyeong: 20,
    recommendedAreaPyeong: 35,
    minFrontageMeters: 5,
    specificRisks: [
      '주류비(원가 40~50%)+인건비(30%)+임대료 = 3중 고정비 구조로 손익분기 매출이 매우 높음',
      '날씨·요일·계절 매출 변동이 심해 평일 공실 발생 시 적자 전환 빠름',
      '소음·위생 민원 누적 시 행정처분(영업정지) 위험 — 위치 선정이 핵심',
      '야간 영업 특성상 주취 고객 관리, 직원 안전 비용 발생',
      '인허가 제한 구역(학교·병원 인근) 사전 미확인 시 영업신고 자체 불가',
    ],
    successCondition: '야간 보행 동선이 활성화된 먹자골목 또는 유흥가에서 1층 코너 위치, 가시성 우수, 닥트 가능, 경쟁 주점 3개 이하일 때 성공 확률 높음',
  },

  food: {
    category: 'food',
    label: '음식점',
    keywords: ['식당', '밥집', '음식', '분식', '치킨', '피자', '고기', '고깃집', '횟집', '한식', '중식', '일식', '양식',
               '국밥', '냉면', '삼겹살', '갈비', '순대', '곱창', '도시락', '김밥', '라멘', '파스타', '스테이크',
               '떡볶이', '순대국', '설렁탕', '찌개', '뚝배기', '백반'],
    highFactors: [
      '1층 접근성 — 음식점은 충동 방문과 점심 수요가 핵심, 계단은 장벽',
      '닥트(환기) — 없으면 영업신고 자체가 불가한 경우 있음',
      '도시가스 인입 — 주방 가스 조리 장비 운영 필수 (LPG 전환 비용 高)',
      '전면폭 — 외부 메뉴판·좌석 배치와 인지도 직결',
      '배수·하수 — 주방 역류는 위생 문제와 영업 중단으로 이어짐',
      '주차 — 가족·단체 고객 유입 여부 결정',
    ],
    mediumFactors: [
      '전기 용량 — 주방 기기 동시 가동 (튀김기·냉장고·에어컨)',
      '면적 — 주방+홀 구분 가능한 최소 25평 이상 권장',
      '화장실 — 홀 고객 동선과 위생',
      '그리스 트랩 — 없으면 설치 비용 발생',
    ],
    lowFactors: [
      '코너 위치 (있으면 유리)',
      '엘리베이터 (2층 이상 시)',
    ],
    facilityChecks: [
      '닥트(환기) 설치 가능 및 배기구 위치',
      '도시가스 인입 및 공급 용량',
      '주방 배수 구배·하수 역류 이력',
      '그리스 트랩 설치 여부 및 용량',
      '전기 용량 (주방 기기 동시 가동)',
      '화장실 위치·전용 여부',
      '소방 설비 및 적합 여부',
    ],
    regulatoryChecks: [
      '건물 용도 — 일반음식점 영업신고 가능 여부',
      '위생업 허가 사전 확인',
      '등기부등본 확인',
      '원상복구 범위 계약서 명시',
    ],
    rentRatioWarning: 10,
    rentRatioDanger: 13,
    minAreaPyeong: 15,
    recommendedAreaPyeong: 30,
    minFrontageMeters: 4,
    specificRisks: [
      '식재료 원가율 30~45% + 인건비 25~35% + 임대료 — 3중 구조에서 손익분기 매출이 높음',
      '위생관리·화재 안전 의무 점검 비용과 위반 시 행정처분 위험',
      '주방 인테리어 초기 투자가 크고 원상복구 범위가 넓음',
      '식재료 가격 상승 시 원가율 급등 — 단기 대응 어려움',
      '닥트 미설치 시 영업신고 제한 — 사전 확인 필수',
    ],
    successCondition: '1층 위치, 닥트·가스·배수 조건 충족, 점심 수요가 있는 오피스·주거 복합지역, 임대료 10% 이하 관리 시 안정적',
  },

  cafe: {
    category: 'cafe',
    label: '카페·음료',
    keywords: ['카페', '커피', '음료', '베이커리', '디저트', '케이크', '브런치', '티룸', '버블티', '스무디'],
    highFactors: [
      '가시성 — 보행자가 지나가다 발견하는 충동 방문이 핵심',
      '보행 동선 — 카페는 목적 방문보다 동선상 자연 유입 비중이 높음',
      '체류 수요 — 인근 오피스·학원·주거 인구의 "머물 이유" 존재 여부',
      '경쟁 밀도 — 동일 상권 내 대형 브랜드(스타벅스 등) 입점 여부',
      '브랜드 목적 방문성 — 독립 카페의 경우 인스타그램 등 SNS 노출 필수',
      '테이크아웃 동선 — 출퇴근 동선과 계산대 위치',
    ],
    mediumFactors: [
      '면적 — 체류형 좌석 수 (최소 15평 이상 권장)',
      '에스프레소 머신 전기 용량 (380V 필요 여부)',
      '주차 — 목적형 방문 카페는 주차 필수',
      '전면폭 — 외부 테이블·간판 노출',
    ],
    lowFactors: [
      '도시가스 (전기 장비로 대체 가능)',
      '배달 수요 (카페 배달은 보조 채널)',
    ],
    facilityChecks: [
      '에스프레소 머신 전기 용량 (220V/380V)',
      '정수 필터·급수 조건',
      '배수 (원두·우유 세척)',
      '에어컨 용량 — 여름 체류 고객 쾌적성',
      '화장실 — 체류 고객 필수',
    ],
    regulatoryChecks: [
      '건물 용도 — 휴게음식점 또는 일반음식점 신고',
      '식품위생법 준수',
      '간판 설치 제한 (역사문화지구 등)',
    ],
    rentRatioWarning: 10,
    rentRatioDanger: 13,
    minAreaPyeong: 12,
    recommendedAreaPyeong: 20,
    minFrontageMeters: 4,
    specificRisks: [
      '카페 포화 시장 — 대형 브랜드 진입 시 독립 카페 고객 이탈 빠름',
      '바리스타 인건비 + 원두·재료비 + 임대료 구조에서 낮은 객단가로 손익 맞추기 어려움',
      '계절 매출 편차 — 여름 아이스 음료 수요 급증, 겨울 감소',
      'SNS 노출 없이는 신규 고객 유입이 어려운 업종',
    ],
    successCondition: '유동인구가 많은 보행 동선, 가시성 우수, 인근 오피스·학원 밀집, 독창적 컨셉 또는 대형 브랜드 없는 틈새 입지',
  },

  unmanned: {
    category: 'unmanned',
    label: '무인점포',
    keywords: ['무인', '뽑기', '가챠', '셀프', '코인', '인형뽑기', '캡슐', '무인아이스크림', '무인편의점'],
    highFactors: [
      '1층 위치 — 무인점포는 즉흥 방문이 핵심, 계단은 치명적 장벽',
      '가시성 — 외부에서 점포 내부와 기기가 보여야 충동 방문 유발',
      '10~30대 보행 유동인구 — 핵심 소비층 동선 직결',
      '학원가·오락시설 인접 여부 — 청소년 수요와 직결',
      '전기 용량 — 기기 다수 동시 운영',
    ],
    mediumFactors: [
      '야간 보안 — CCTV와 방범 환경',
      '면적 효율 — 기기 배치와 회전율',
      '주변 경쟁 무인점포',
    ],
    lowFactors: [
      '주차',
      '닥트',
    ],
    facilityChecks: [
      '전기 용량 — 기기 동시 가동 가능 여부',
      'CCTV 및 방범 설비',
      '조명 — 야간 기기 노출',
      '인터넷 — 결제 단말기 연동',
    ],
    regulatoryChecks: [
      '건물 용도 확인',
      '무인점포 업종별 신고 필요 여부',
    ],
    rentRatioWarning: 8,
    rentRatioDanger: 12,
    minAreaPyeong: 8,
    recommendedAreaPyeong: 20,
    minFrontageMeters: 3,
    specificRisks: [
      '유동인구에 매우 민감 — 인구 감소 시 즉각 매출 타격',
      '기기 고장 시 무인 운영 구조상 대응 지연',
      '낮은 객단가로 회전율 극대화 필수',
      '경쟁 진입 장벽 낮아 동종 업종 급증 위험',
      '기기 감가상각 및 콘텐츠 교체 비용 지속 발생',
    ],
    successCondition: '1층 코너, 학원가 또는 10~20대 보행 밀집 지역, 가시성 우수, 50m 이내 경쟁 무인점포 없음',
  },

  retail: {
    category: 'retail',
    label: '소매·유통',
    keywords: ['쇼핑', '편의점', '마트', '슈퍼', '소매', '의류', '패션', '잡화', '문구', '팬시', '생활용품'],
    highFactors: [
      '1층 접근성 — 소매는 충동 구매가 핵심',
      '전면폭 — 상품 진열과 외부 인지도',
      '배후 주거·오피스 수요 — 고정 수요층',
      '주차 — 부피 있는 상품 구매 시 차량 필수',
    ],
    mediumFactors: [
      '물류·납품 동선',
      '경쟁 유사 업종 위치',
      '온라인과의 차별화 포인트',
    ],
    lowFactors: [
      '닥트',
      '가시성 (이미 아는 고객이 오는 경우)',
    ],
    facilityChecks: [
      '전기 용량 — 냉장·냉동·조명',
      '물류 동선 — 납품 차량 접근 가능',
      '진열대 설치 가능 공간',
    ],
    regulatoryChecks: [
      '판매업 신고·허가 여부',
      '건물 용도 확인',
    ],
    rentRatioWarning: 8,
    rentRatioDanger: 12,
    minAreaPyeong: 10,
    recommendedAreaPyeong: 20,
    minFrontageMeters: 5,
    specificRisks: [
      '온라인 채널과의 경쟁 심화',
      '재고 관리 비용과 상품 회전율',
      '계절 상품 편중 시 비수기 매출 급감',
    ],
    successCondition: '배후 수요가 명확한 주거 밀집 지역, 1층 전면 노출, 온라인 차별화 가능 전문 품목',
  },

  service: {
    category: 'service',
    label: '서비스업',
    keywords: ['학원', '미용실', '미용', '세탁', '부동산', '병원', '의원', '약국', '여행사', '보험', '헬스', '필라테스', '요가'],
    highFactors: [
      '목적 방문 비중 — 서비스업은 인지도와 소개로 오는 고객',
      '배후 인구 반경 — 단골 기반 구역',
      '업종별 전용 시설 — 미용실·학원·병원마다 다름',
    ],
    mediumFactors: [
      '주차 — 서비스 이용 시간이 길어 주차 중요',
      '층수 — 2층도 운영 가능하나 가시성 확보 필요',
      '접근성 — 대중교통 이용 고객 비중',
    ],
    lowFactors: [
      '전면폭',
      '야간 유동인구',
    ],
    facilityChecks: [
      '업종별 전용 설비 (미용실: 급배수, 학원: 교실 구조)',
      '인허가별 면적 요건 (의원: 33㎡ 이상 등)',
      '방음 (학원·음악·스포츠)',
    ],
    regulatoryChecks: [
      '업종별 인허가 — 의원·학원·미용업 각각 다름',
      '건물 용도 확인',
      '주차 기준 충족 여부 (의원 등)',
    ],
    rentRatioWarning: 10,
    rentRatioDanger: 15,
    minAreaPyeong: 10,
    recommendedAreaPyeong: 20,
    minFrontageMeters: 3,
    specificRisks: [
      '초기 고객 확보까지 시간이 걸려 손익분기 기간이 길어질 수 있음',
      '업종별 인허가 취득 전 영업 불가',
    ],
    successCondition: '배후 인구 풍부, 인허가 조건 충족, 경쟁 없는 틈새 지역',
  },

  general: {
    category: 'general',
    label: '기타',
    keywords: [],
    highFactors: [
      '업종 특성에 맞는 위치 선정',
      '임대료 대비 매출 가능성',
    ],
    mediumFactors: [
      '시설 조건',
      '인허가 여부',
    ],
    lowFactors: [],
    facilityChecks: [
      '건물 용도 확인',
      '기본 시설 상태',
    ],
    regulatoryChecks: [
      '업종별 인허가 사전 확인',
      '등기부등본',
    ],
    rentRatioWarning: 10,
    rentRatioDanger: 13,
    minAreaPyeong: 10,
    recommendedAreaPyeong: 20,
    minFrontageMeters: 3,
    specificRisks: [
      '업종별 특성에 맞는 추가 현장 확인 필요',
    ],
    successCondition: '업종 특성에 맞는 입지와 시설 조건 충족',
  },
}

export function getBusinessRule(category: BusinessCategory): BusinessRule {
  return RULES[category]
}

export function detectCategory(business: string): BusinessCategory {
  const b = business.toLowerCase()
  for (const [cat, rule] of Object.entries(RULES)) {
    if (cat === 'general') continue
    if (rule.keywords.some(kw => b.includes(kw))) return cat as BusinessCategory
  }
  return 'general'
}

export function getRentRiskLevel(category: BusinessCategory, rentRatioPct: number): 'low' | 'caution' | 'high' {
  const rule = RULES[category]
  if (rentRatioPct >= rule.rentRatioDanger) return 'high'
  if (rentRatioPct >= rule.rentRatioWarning) return 'caution'
  return 'low'
}

export function buildContextSummary(rule: BusinessRule): string {
  return `[${rule.label} 핵심 판단 요소]
HIGH: ${rule.highFactors.slice(0, 3).join(' / ')}
임대료 위험: ${rule.rentRatioWarning}% 이상 주의, ${rule.rentRatioDanger}% 이상 위험
최소 면적: ${rule.minAreaPyeong}평, 권장: ${rule.recommendedAreaPyeong}평
성공 조건: ${rule.successCondition}`
}
