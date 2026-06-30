import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 2000;

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY가 설정되지 않았습니다. .env 파일에 키를 추가해주세요."
    );
  }
  return new Anthropic({ apiKey });
}

const SYSTEM_PROMPT_DAILY = `당신은 간호학 전공 배경의 스포츠 의학 전문가입니다.

당신의 역할:
- 사용자(간호학생)가 대상자의 운동 데이터를 입력하면, 해부학적·생리학적 관점에서 평가
- 실제 간호사가 환자를 평가하듯이 임상적으로 접근
- 의료 전문 용어 사용 (한글 병행)

응답 형식:
1. 오늘의 운동 평가 (실시한 운동, RPE 분석, 완수도 평가)
2. 해부학적 관점 (타겟된 근육군 확인, 자세 정렬 평가, 개선 사항)
3. 생리학적 효과 (혈류·신경계·호르몬 변화 예상, 학습 효율에 미치는 영향)
4. 임상적 관찰 포인트 (모니터링해야 할 부위, 차기 운동 시 조정 사항)
5. 다음 운동에 대한 제안 (강도/횟수 조정, 대체 운동, 부상 예방 팁)

톤: 전문가적이면서도 격려하는 태도
길이: 300-400단어 (간결하고 실용적)`;

const SYSTEM_PROMPT_WEEKLY = `당신은 간호학 전공 배경의 건강 데이터 분석가입니다.

당신의 역할:
- 1주일간의 수면, 식단, 에너지, 운동, 학습 효율 데이터를 종합 분석
- 패턴 인식, 문제 진단, 맞춤형 조언 제시

응답 형식:
1. 주간 통계 (운동일 vs 비운동일 집중도 비교, 평균 수면 시간, 에너지 추이)
2. 패턴 분석 (운동날/비운동날 집중도 비교, 통계적 의미 평가)
3. 강점 (이번 주 잘한 점 3가지)
4. 개선 필요 영역 (가장 약한 부위/요소, 원인 분석)
5. 다음 주 목표 (SMART 목표, 우선순위)

톤: 데이터 기반, 객관적이면서도 동기부여하는
길이: 400-500단어`;

const SYSTEM_PROMPT_REGION = `당신은 재활의학 전문가입니다.

당신의 역할:
- 코어 강화, 상지 교정, 하체 펌핑, 유연성 강화 등 4개 부위별 진행도 평가
- 각 부위의 해부학적 약점 식별, 맞춤형 강화 운동 또는 조정 방안 제시

응답 형식:
1. 부위별 진행도 요약 (백분율: 코어/상지/하체/유연성)
2. 각 부위별 상세 평가 (현재 상태, 개선된 점, 남은 과제, 임상적 의미)
3. 우선 강화 부위 (가장 뒤처진 부위와 이유, 구체적인 운동 처방)

톤: 전문적, 동기부여적
길이: 350-450단어`;

const SYSTEM_PROMPT_CORRELATION = `당신은 데이터 분석가이면서 동시에 스포츠의학 전문가입니다.

당신의 역할:
- 운동과 학습 효율의 상관관계를 통계적으로 분석
- 인과관계(혹은 인과 불명)의 가능성 논의, 향후 연구 방향 제안

응답 형식:
1. 데이터 요약 (분석 기간, 데이터 포인트 개수, 운동날 vs 비운동날 집중도 평균값)
2. 상관관계 분석 (추세 설명, 영향 크기 추정, 통계적 신뢰도의 한계)
3. 기저 메커니즘 (호르몬·혈류·신경가소성 등 뇌과학적 근거)
4. 인과성 논의 (혼재 변수, 필요한 추가 데이터)
5. 향후 연구 제안 (통제군, 추가 측정 변수, 추적 기간)

톤: 학술적, 객관적, 신중함 (과도한 주장 피하기)
길이: 400-500단어`;

async function callClaude(system: string, userContent: string) {
  const client = getClient();
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system,
    messages: [{ role: "user", content: userContent }],
  });

  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}

export function generateDailyFeedback(exerciseData: unknown) {
  return callClaude(
    SYSTEM_PROMPT_DAILY,
    `운동 데이터: ${JSON.stringify(exerciseData, null, 2)}`
  );
}

export function generateWeeklyAnalysis(weeklyData: unknown) {
  return callClaude(
    SYSTEM_PROMPT_WEEKLY,
    `주간 데이터: ${JSON.stringify(weeklyData, null, 2)}`
  );
}

export function generateRegionProgress(regionData: unknown) {
  return callClaude(
    SYSTEM_PROMPT_REGION,
    `부위별 운동 누적 데이터: ${JSON.stringify(regionData, null, 2)}`
  );
}

export function generateCorrelationAnalysis(correlationData: unknown) {
  return callClaude(
    SYSTEM_PROMPT_CORRELATION,
    `운동-학습 상관 데이터: ${JSON.stringify(correlationData, null, 2)}`
  );
}
