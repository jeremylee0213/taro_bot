# Context Template - 세션별 주입 변수

> 이 템플릿의 `{{변수}}`를 애플리케이션 레벨에서 채워 시스템 프롬프트 뒤에 주입합니다.

---

## User Profile

```
사용자: {{user_age}}세 남성 (IT/비즈니스 종사)
배우자: {{spouse_age}}세
자녀: 유아기 아들 ({{child_age}}세, 이름: {{child_name}})
핵심 가치: 비즈니스 성공과 가정의 행복(육아) 균형
```

> 주의: 생년월일 원본(1986-02-13, 1988-01-19, 2020-11-06)은 나이 계산에만 사용하며, 프롬프트에 직접 포함하지 않습니다.

---

## Session State

```
현재 시간대: {{time_period}}  # morning | midday | evening
세션 횟수: {{session_count}}  # 1이면 온보딩 트리거
연속 사용 일수: {{consecutive_days}}  # 5일 이상이면 의존성 방지 메시지
사용 단계: {{user_stage}}  # explorer(1-7일) | adapter(8-30일) | deep(31일~)
이번 달 총 사용 횟수: {{monthly_count}}  # 30이면 월간 리포트 트리거
```

---

## History (중복 방지용)

```
최근 7일 카드: {{recent_cards_7d}}
# 예: ["The Star", "The Emperor", "The Fool_R"]  (_R = 역방향)

최근 5회 게스트: {{recent_guests}}
# 예: ["비전가 스티브", "투자자 워렌", "설계자 빌"]

이번 달 주요 고민 주제: {{monthly_themes}}
# 예: ["채용", "투자자 관리", "육아 시간 부족"]

이번 달 카드 빈도: {{monthly_card_freq}}
# 예: {"The Star": 3, "The Emperor": 2}
```

---

## User Feedback History (선택적)

```
최근 피드백: {{recent_feedback}}
# 예: "투자자 미팅 잘 됐어, 로켓의 조언이 도움됐어"

선호 페르소나: {{preferred_persona}}
# 예: "로켓" (피드백에서 가장 자주 언급된 페르소나)
```

---

## 주입 예시

```
[Context Injection]
사용자: 39세 남성 (IT/비즈니스 종사)
배우자: 37세
자녀: 유아기 아들 (5세, 이름: 서진)
핵심 가치: 비즈니스 성공과 가정의 행복(육아) 균형

현재 시간대: morning
세션 횟수: 15
연속 사용 일수: 3
사용 단계: adapter
이번 달 총 사용 횟수: 15

최근 7일 카드: ["The Star", "Strength", "The Hermit"]
최근 5회 게스트: ["비전가 스티브", "투자자 워렌", "멘토 오프라"]
이번 달 주요 고민 주제: ["채용", "투자자 관리"]
이번 달 카드 빈도: {"The Star": 2, "Strength": 1, "The Hermit": 1}

최근 피드백: "어제 닥터P 조언대로 데이터 정리했더니 미팅 잘 됐어"
선호 페르소나: "닥터P"
```
