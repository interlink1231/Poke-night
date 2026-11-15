# 기술 아키텍처

## 전체 구성

```text
Browser
  └─ Next.js UI
      └─ Phaser Game Runtime
          └─ Game API Client
              └─ FastAPI Backend
                  └─ PostgreSQL
```

초기 단계에서는 프론트엔드 실행과 게임 화면 구현을 우선합니다. 백엔드는 게임 저장과 검증이 필요한 기능을 추가할 때 별도 서비스로 연결합니다.

## 프론트엔드

- Next.js: 페이지 구성과 라우팅
- React: 메뉴, 상태 패널, 설정 등 일반 UI
- TypeScript: 화면 및 게임 코드의 타입 안정성
- Phaser: 게임 월드 렌더링, 입력, 카메라, 충돌 및 장면 관리

React UI와 Phaser 캔버스는 역할을 분리합니다. 게임 루프에서 React 상태를 매 프레임 갱신하지 않습니다.

## 백엔드

Python FastAPI를 사용합니다.

- 인증과 사용자 프로필
- 플레이어 저장 데이터
- 포켓몬 개체와 파티
- 인벤토리와 퀘스트
- 전투 결과 및 보상 검증
- 관리자 기능

클라이언트가 보낸 보상 결과를 그대로 신뢰하지 않고 서버에서 검증합니다.

## 데이터베이스 초안

users, player_profiles, save_slots, regions, locations, map_objects, characters, quests, player_quests, pokemon_species, pokemon_instances, pokemon_moves, player_parties, pokemon_boxes, items, inventories, battles, achievements, player_achievements, player_progress 테이블을 후보로 둡니다.

실제 스키마는 기능 요구사항과 데이터 관계를 확정한 뒤 마이그레이션으로 관리합니다.

## 보안 및 저장

- 사용자별 데이터 접근 통제
- 입력값 검증 및 API 요청 제한
- 비밀 키 환경 변수 관리
- 중복 요청 및 중복 보상 방지
- 관리자 권한 분리
- 정기 백업과 복구 절차

지역 이동, 전투 종료, 포획, 진화, 아이템 획득, 퀘스트 완료 등 진행 상태가 바뀌는 시점에 저장합니다.

## 권장 디렉터리

```text
app/
components/
  game/
  layout/
  ui/
features/
  player/
  pokemon/
  world/
  battle/
game/
  scenes/
  systems/
  maps/
  types/
lib/
  api/
  utils/
public/
  assets/
docs/
```

권리가 확인되지 않은 공식 이미지·음악·효과음은 public/assets에 추가하지 않습니다.
