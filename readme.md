# 지역 공동물류 플랫폼 (MSA 기반)

> 소상공인과 지자체를 잇는 **지역 공동물류 플랫폼(B2G2B)** 을 마이크로서비스 아키텍처로 구현한 프로젝트입니다.
> 서비스 디스커버리(Eureka), API Gateway를 통한 OAuth2/JWT 인증 위임, Kafka 기반 이벤트 드리븐 통신,
> 분산 트랜잭션(Saga), 폴리글랏(Java + Python) 서비스, 컨테이너 오케스트레이션까지
> 백엔드·프론트엔드·인프라 전 영역의 패턴을 하나의 도메인 흐름 안에서 end-to-end로 다뤘습니다.

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [아키텍처](#2-아키텍처)
3. [기술 역량 — 채용공고 스택 대응표](#3-기술-역량--채용공고-스택-대응표)
4. [기술 스택 상세 & 프로젝트 내 사용처](#4-기술-스택-상세--프로젝트-내-사용처)
5. [아키텍처 패턴 카탈로그](#5-아키텍처-패턴-카탈로그)
6. [핵심 요청 흐름](#6-핵심-요청-흐름)
7. [설계 의사결정](#7-설계-의사결정)
8. [테스트 · 관측성 · 문서화](#8-테스트--관측성--문서화)
9. [한계와 개선 로드맵](#9-한계와-개선-로드맵)
10. [확장 시나리오](#10-확장-시나리오)
11. [실행 방법](#11-실행-방법)
12. [포트 맵 · 참고 문서](#12-포트-맵--참고-문서)

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 유형 | 팀 프로젝트 / MSA 레퍼런스 구현 |
| 도메인 | 지역 공동물류 플랫폼 — 지자체 담당자가 공동물류 프로그램을 개설하고, 소상공인이 참여를 신청·정산 |
| 규모 | 8개 컨테이너 (도메인 서비스 4 + 추천 서비스 1 + 인프라 3), 폴리글랏(Java 21 / Python 3) |
| 통신 | 동기 REST(WebClient) + 비동기 이벤트(Kafka) 혼합 |
| 배포 | Docker Compose 단일 커맨드로 전체 스택 기동, 서비스별 멀티스테이지 Dockerfile |
| 담당 역할 | *(본인 담당 파트 기입 — 예: 프론트엔드 도메인 재설계 / enrollment·payment Saga 흐름 / 추천 서비스)* |

### 이력서 한 줄 요약 (복사용)

> Java 21 · Spring Boot 3 · Spring Cloud(Eureka, Gateway) 기반 **MSA 8개 서비스**를 설계·구현.
> OAuth2/JWT 인증 위임, **Kafka 이벤트 기반 Saga**로 분산 트랜잭션(참여신청→정산→활성화) 처리.
> Spring Data JPA/MariaDB, Docker Compose 전체 스택 오케스트레이션, FastAPI(Python) 추천 서비스로 **폴리글랏 MSA** 구성.
> JUnit·spring-kafka-test 기반 테스트 작성, springdoc(OpenAPI)로 API 문서화.

### 도메인 리라벨링 전략 (표시 계층 분리)

강의 마켓플레이스 백엔드를 **코드 한 줄 바꾸지 않고** 공동물류 도메인으로 "표현"했습니다.
서비스명·REST 경로·DB 스키마·Kafka 토픽은 그대로 두고, 프론트엔드에서만 라벨을 매핑 —
**레거시/외부 시스템의 계약을 유지하면서 UI 도메인만 재정의하는 실무 패턴**을 적용했습니다.

| 백엔드 개념 (불변) | 화면 표시 |
|---|---|
| `User.role = INSTRUCTOR` | 지자체 담당자 (프로그램 개설) |
| `User.role = STUDENT` | 소상공인 (프로그램 참여 신청) |
| `Course` | 공동물류 프로그램 |
| `Enrollment` (PENDING→ACTIVE Saga) | 참여신청 |
| `Payment` | 정산 (배송비 + 지자체 지원금) |
| `recommend-service` 출력 | 추천 프로그램 |

---

## 2. 아키텍처

```
┌─────────────┐     MariaDB (lecture_db)  +  Kafka                 ← 인프라 계층
│  인프라 부팅 │            │
│   순서 강제  │     eureka-server  :8761                          ← 서비스 디스커버리
│(depends_on) │            │
└─────────────┘     auth-server  :9000  (OAuth2 Authorization Server, JWKS 발급)
                            │
                    api-gateway  :8080  (JWT 검증 → X-User-Id 헤더 릴레이)
                            │
        ┌───────────────────┼────────────────────┬───────────────────┐
   user-service       course-service      enrollment-service     payment-service
     :8081               :8082               :8083 (오케스트레이터)    :8084
                                               │  ▲                    │
                                        WebClient│  │Kafka        Kafka │
                                               ▼  │  payment.completed  │
                                          recommend-service  :8085  ◄───┘
                                          (FastAPI, enrollment.completed 소비)
                            │
                     vue-frontend  :3000 (dev) / Nginx (prod)
```

- **부팅 순서**를 `docker-compose.yml`의 `depends_on`으로 인프라 → 디스커버리 → 인증 → 게이트웨이 → 도메인 → 추천 순으로 강제.
- **인증 검증 집중** — 도메인 서비스는 JWT를 재검증하지 않고, 게이트웨이가 넘긴 `X-User-Id` 헤더만 신뢰. (recommend-service만 예외적으로 자체 JWT 검증)
- **enrollment-service가 오케스트레이터** — course/payment-service를 `WebClient`로 호출하고 Kafka 토픽 2개를 produce/consume.
- **폴리글랏** — 도메인 로직은 Spring Boot(Java 21), 추천 로직은 FastAPI(Python)로 분리, 동일한 Eureka·Kafka·JWKS 생태계에 참여.

---

## 3. 기술 역량 — 채용공고 스택 대응표

> 채용공고의 "자격요건 / 우대사항" 표현에 맞춰 정리했습니다.
> **직접 구현( ✅ ) / 설계·이해 수준( 🔶 ) / 미적용·로드맵( ⬜ )** 3단계로 구분해 이력서 수위 조절에 쓸 수 있습니다.

### 3-1. Backend

| 채용공고 키워드 | 수준 | 프로젝트 내 근거 |
|---|:---:|---|
| Java (11+/17+/21) | ✅ | Java 21 toolchain, 전 도메인 서비스 |
| Spring Boot / Spring Framework | ✅ | Spring Boot 3.4.5, 5개 서비스 |
| Spring MVC / RESTful API 설계 | ✅ | 리소스 중심 URI, 외부/내부(`/internal/*`) API 분리, DTO 계층 |
| JPA / Hibernate / ORM | ✅ | Spring Data JPA, 엔티티·연관관계 매핑, JPA Auditing |
| RDBMS (MySQL / MariaDB) | ✅ | MariaDB `lecture_db`, 스키마·유니크 제약 설계 |
| MSA (마이크로서비스 아키텍처) | ✅ | 도메인 기반 8개 서비스 분해, 서비스 간 계약 정의 |
| Spring Cloud | ✅ | Eureka(Service Discovery), API Gateway 연동, Cloud BOM |
| 인증/인가 (OAuth2 / JWT / Spring Security) | ✅ | OAuth2 Resource Server, JWKS 서명 검증, 게이트웨이 토큰 릴레이 |
| 메시지 큐 (Kafka / RabbitMQ) | ✅ | Apache Kafka — Producer/Consumer, 토픽·파티션 설계, Consumer Group |
| 이벤트 기반 아키텍처 / 비동기 처리 | ✅ | 도메인 이벤트 2종, 비동기 상태 전이 |
| 분산 트랜잭션 / Saga | ✅ | Choreography Saga (참여신청→정산→활성화) |
| 테스트 코드 (JUnit / 통합테스트) | ✅ | JUnit 5, Spring Boot Test, spring-security-test, spring-kafka-test |
| API 문서화 (Swagger / OpenAPI) | ✅ | springdoc-openapi 3, 서비스별 Swagger UI |
| 빌드 도구 (Gradle / Maven) | ✅ | Gradle Wrapper, 서비스별 독립 빌드 |
| 리액티브 / WebFlux | 🔶 | `WebClient`(WebFlux) 사용, 단 `.block()` 동기 호출 — 리액티브 스트림 전면 활용은 아님 |
| QueryDSL / 동적 쿼리 | ⬜ | 미사용 — Spring Data 메서드 쿼리 위주 |
| Redis / 캐시 | ⬜ | 미적용 — 추천 결과 캐시·게이트웨이 rate limit 적용 지점을 설계로 도출 |
| gRPC | ⬜ | 미사용 — 서비스 간 통신은 REST + Kafka |
| 대용량 트래픽 / 성능 튜닝 | 🔶 | 파티셔닝·컨슈머 그룹 수평 확장 구조 이해, 부하 테스트는 미수행 |

### 3-2. Infra / DevOps

| 채용공고 키워드 | 수준 | 프로젝트 내 근거 |
|---|:---:|---|
| Docker / 컨테이너 | ✅ | 서비스별 멀티스테이지 Dockerfile |
| Docker Compose | ✅ | 8개 컨테이너 오케스트레이션, 네트워크·볼륨·부팅 순서 |
| Nginx | ✅ | 프론트엔드 정적 서빙 + SPA 폴백 |
| Linux / 셸 환경 | ✅ | 컨테이너 기반 배포·로그 확인 |
| 환경변수 기반 설정 관리 (12-Factor) | ✅ | `application.yml` 기본값을 Compose env로 프로필 오버라이드 |
| CI/CD (GitHub Actions / Jenkins) | ⬜ | 수동 빌드 — 서비스별 빌드·테스트·이미지 푸시 매트릭스를 로드맵으로 정의 |
| Kubernetes / Helm | ⬜ | 미적용 — Compose 구조의 K8s 이관 시나리오(디스커버리 대체, HPA)를 설명 가능 |
| 모니터링 (Prometheus / Grafana / ELK) | 🔶 | Spring Actuator 헬스체크 적용, 메트릭·중앙 로깅·분산추적은 로드맵 |
| 클라우드 (AWS / GCP) | ⬜ | 로컬 Docker 기반 — 클라우드 배포 경험은 이 프로젝트에 없음 |

### 3-3. Frontend

| 채용공고 키워드 | 수준 | 프로젝트 내 근거 |
|---|:---:|---|
| Vue.js 3 (Composition API) | ✅ | `views/`·`components/` 전면 Composition API |
| SPA / 클라이언트 라우팅 | ✅ | Vue Router 4, 네비게이션 가드 기반 인가 |
| 상태 관리 (Pinia / Vuex) | ✅ | Pinia — `auth`·`course` 스토어 |
| 빌드 도구 (Vite / Webpack) | ✅ | Vite 8 (HMR / 프로덕션 번들) |
| HTTP 클라이언트 (Axios) | ✅ | 인터셉터로 Bearer 자동 첨부, 401 재로그인 |
| OAuth2 프론트 연동 | ✅ | Authorization Code flow 클라이언트 구현 (code 교환, 토큰 관리) |
| TypeScript | ⬜ | 현재 JS — TS 전환이 개선 항목 |

### 3-4. Language / 기타

| 채용공고 키워드 | 수준 | 프로젝트 내 근거 |
|---|:---:|---|
| Python 3 | ✅ | recommend-service 전체 |
| FastAPI | ✅ | 추천 API 라우터, 의존성 주입 기반 보안 |
| 비동기 프로그래밍 (async/await) | ✅ | httpx 비동기 클라이언트, ASGI |
| Pydantic / 스키마 검증 | ✅ | Pydantic v2 응답 스키마, pydantic-settings 계층 설정 |
| 폴리글랏 서비스 통합 | ✅ | Python 서비스를 Java 생태계(Eureka·Kafka·JWKS)에 편입 |

---

## 4. 기술 스택 상세 & 프로젝트 내 사용처

> 각 기술이 **어디서, 왜** 쓰였는지까지 매핑했습니다. 포트폴리오 스캔용 키워드는 각 표 아래 정리.

### 4-1. 백엔드 — Spring 생태계

| 기술 | 버전 | 프로젝트 내 사용처 |
|---|---|---|
| Java | 21 (toolchain) | 전 도메인 서비스 |
| Spring Boot | 3.4.5 | user / course / enrollment / payment / eureka-server |
| Spring Cloud | 2024.0.0 | BOM 관리, Netflix Eureka 통합 |
| Spring Cloud Netflix Eureka | — | 각 서비스가 Eureka Client로 자기 등록, `prefer-ip-address` 설정 |
| Spring Security + OAuth2 Resource Server | — | 각 서비스가 리소스 서버로 `jwk-set-uri` / `issuer-uri` 검증 설정 보유 (실습 단순화로 일부 `permitAll`) |
| Spring Data JPA + Hibernate | — | 엔티티 매핑, `AuditingEntityListener`로 `createdAt/updatedAt` 자동 기록, `ddl-auto: update` |
| Spring WebFlux (WebClient) | — | enrollment-service → course/payment-service 동기 서비스 간 호출 (`.block()`) |
| Spring for Apache Kafka | — | enrollment/payment-service의 Producer/Consumer, `@KafkaListener`, `NewTopic` 빈으로 토픽 자동 생성 |
| Spring Boot Validation (Jakarta) | — | 요청 DTO 유효성 검증 |
| Spring Boot Actuator | — | `/actuator/health`, `/actuator/info` 노출, health show-details |
| springdoc-openapi (Swagger UI) | 2.7.0 | 각 서비스 `/swagger-ui.html`, `/api-docs` API 명세 자동화 |
| Lombok | — | 보일러플레이트 제거 (`@Builder`, `@Getter` 등) |
| MariaDB JDBC | — | 공유 `lecture_db` 접속 |

`키워드`: Java 21, Spring Boot 3, Spring Cloud, Spring Security, OAuth2, JWT, Resource Server, JPA, Hibernate, JPA Auditing, WebClient, Spring Kafka, Bean Validation, Actuator, OpenAPI/Swagger, Gradle, 멀티모듈 빌드

### 4-2. 메시징 — Apache Kafka

| 요소 | 내용 |
|---|---|
| 토픽 | `payment.completed`, `enrollment.completed` (파티션 3 / 복제 1, 앱 기동 시 `NewTopic` 빈으로 자동 생성) |
| 메시지 키 | `userId` — 같은 사용자 이벤트의 순서 보장 + 파티션 분배 |
| 직렬화 | `JsonSerializer` + `spring.json.add.type.headers: false` (타입 헤더 미포함) |
| 역직렬화 | `ErrorHandlingDeserializer`로 감싼 `JsonDeserializer`, `default.type: HashMap` → `Map<String,Object>` 파싱 |
| 컨슈머 그룹 | `enrollment-service` (단일 그룹 → 인스턴스 다중 기동 시 파티션 단위 분산 소비) |
| 발행 방식 | payment는 `.get(10s)`로 브로커 ack 동기 대기(검증 편의), enrollment는 비동기 `whenComplete` |
| 오프셋 | `auto-offset-reset: earliest` |

`키워드`: Kafka, Event-Driven Architecture, Pub/Sub, Consumer Group, 파티셔닝, 메시지 키 기반 순서 보장, JSON 직렬화 계약, 에러 핸들링 역직렬화, at-least-once 전달 의미

### 4-3. 추천 서비스 — Python / FastAPI

| 기술 | 버전 | 사용처 |
|---|---|---|
| FastAPI | 0.115 | `GET /api/recommend/{userId}` 라우터, 의존성 주입 기반 보안 |
| Uvicorn (standard) | 0.32 | ASGI 서버 |
| Pydantic v2 + pydantic-settings | 2.10 / 2.6 | 응답 스키마, 계층적 설정 로딩(env > .env > 기본값) |
| httpx | 0.28 | course/enrollment-service 비동기 HTTP 클라이언트 |
| py-eureka-client | 0.11 | 기동 시 Eureka 자체 등록 (Java 생태계에 Python 서비스 편입) |
| kafka-python-ng | 2.2 | 백그라운드 스레드로 `enrollment.completed` 소비 |
| python-jose[cryptography] | 3.3 | 동일 JWKS로 JWT 서명 검증 (게이트웨이 헤더를 신뢰하지 않고 자체 검증) |
| python-dotenv | 1.0 | 로컬 개발 환경 변수 |

추천 로직: 참여 이력 없음 → 인기순(참여 건수 desc) 상위 5 / 있음 → `Counter.most_common` 최빈 카테고리 기반 추천.

`키워드`: Python, FastAPI, ASGI, Pydantic, 비동기 I/O(async/await), httpx, JWT 검증(JWKS), 폴리글랏 MSA, 규칙 기반 추천, 콘텐츠 기반 추천

### 4-4. 프론트엔드 — Vue 3 SPA

| 기술 | 버전 | 사용처 |
|---|---|---|
| Vue 3 (Composition API) | 3.4 | `src/views/*` 라우팅 페이지, `src/components/*` 재사용 컴포넌트 |
| Vite | 8 | 개발 서버(HMR) / 프로덕션 번들 |
| Pinia | 2 | `auth`(토큰·사용자), `course`(목록·라벨 맵) 상태 관리 |
| Vue Router | 4 | `requiresAuth` / `instructorOnly` 네비게이션 가드로 라우트 접근 제어 |
| Axios | 1.6 | 인터셉터로 `Authorization: Bearer` 자동 첨부, 401 재로그인 처리 |
| Pretendard | 1.3 | 한글 최적화 웹폰트 |

- **OAuth2 Authorization Code 클라이언트** 구현 (authorize 리다이렉트 → `/callback` code 교환 → 토큰 `sessionStorage` 저장).
- **도메인 라벨 맵** (`store/course.js`의 `categoryLabelMap`/`thumbnailMap` 패턴)으로 백엔드 필드를 공동물류 용어로 표시 계층에서만 변환.
- 배송 유형 축, 공통 사이드바, 정산 상태 폴링 등 도메인 특화 UI.

`키워드`: Vue 3, Composition API, Vite, Pinia, Vue Router, 라우트 가드, Axios 인터셉터, SPA, OAuth2 Authorization Code, 세션 스토리지 토큰 관리, 상태 폴링, 프론트엔드 도메인 모델링

### 4-5. 인프라 · DevOps

| 기술 | 사용처 |
|---|---|
| Docker | 서비스별 Dockerfile (Java: Gradle 빌드 → JRE 런타임 멀티스테이지 / Python: slim 이미지 / Vue: 빌드 → Nginx) |
| Docker Compose | 8개 컨테이너 오케스트레이션, `depends_on`으로 부팅 순서, 사용자 정의 네트워크(`lecture-net`), 볼륨 |
| Nginx | 프로덕션 프론트엔드 정적 서빙 + SPA 폴백 |
| MariaDB init script | `init-db/01_init.sql`이 첫 기동 시 자동 실행 (`/docker-entrypoint-initdb.d` 마운트) |
| Gradle Wrapper | 서비스별 독립 빌드 (`./gradlew build/test/bootRun`) |
| prebuilt 이미지 배포 | `infra-images.tar` → `docker load` (auth-server / api-gateway) |

`키워드`: Docker, 멀티스테이지 빌드, Docker Compose, 컨테이너 네트워킹, 서비스 의존성 관리, 12-Factor(환경변수 기반 설정 오버라이드), Nginx 리버스 프록시/정적 서빙, DB 초기화 자동화, 이미지 아티팩트 배포

---

## 5. 아키텍처 패턴 카탈로그

> 이 프로젝트를 근거로 **설명할 수 있는** MSA 패턴들. (△ = 의도적으로 미적용, 개선 로드맵에 존재)

| 패턴 | 이 프로젝트에서의 구현 |
|---|---|
| **Service Discovery** | Netflix Eureka. 모든 서비스가 애플리케이션 이름으로 등록 |
| **API Gateway** | Spring Cloud Gateway. 라우팅 + 인증 검증 단일 지점 |
| **Token Relay / 인증 위임** | 게이트웨이가 JWT 검증 후 `X-User-Id` 헤더로 신원 릴레이, 하위 서비스는 재검증 없음 |
| **OAuth2 Resource Server** | 각 서비스가 JWKS로 토큰 서명 검증 (Java + Python 공통) |
| **Choreography-based Saga** | 참여신청→정산→활성화를 Kafka 이벤트 체인으로 연결 (중앙 오케스트레이터 없이) |
| **Event-Driven Architecture** | `payment.completed` / `enrollment.completed` 도메인 이벤트 |
| **Asynchronous State Transition** | 신청 API는 즉시 `PENDING` 응답, `ACTIVE` 전이는 이벤트 소비 후 비동기 |
| **Transaction boundary 분리** | `@Transactional(REQUIRES_NEW)`로 PENDING 행을 독립 커밋 |
| **읽기 경로 분리 (CQRS 지향)** | "내 참여신청" 조회 시 enrollment 데이터 + course-service 조인을 read-time에 조립 |
| **Internal API (서비스 전용 엔드포인트)** | `/internal/*` — 게이트웨이 라우트 없음, 서비스 간 전용 계약 |
| **Polyglot Persistence/Runtime** | Java 도메인 서비스 + Python 추천 서비스 |
| **Idempotent Consumer** △ | 현재 미적용 — 중복 이벤트 재처리 가능, 멱등 키 도입이 개선점 |
| **Transactional Outbox** △ | 현재 미적용 — DB 커밋과 이벤트 발행이 원자적이지 않음 |
| **Circuit Breaker / Retry** △ | 현재 미적용 — Resilience4j 도입이 개선점 |
| **Dead Letter Queue** △ | 현재 컨슈머가 예외를 삼킴 — DLQ + 재시도가 개선점 |
| **Database per Service** △ | 현재 공유 `lecture_db` — 분리가 최우선 개선점 |

---

## 6. 핵심 요청 흐름

### 6-1. 로그인 (OAuth2 Authorization Code)

```
vue-frontend → auth-server /oauth2/authorize (전체 페이지 리다이렉트)
  → 사용자 인증 → /callback?code=...
  → POST /oauth2/token (Basic auth: base64(client_id:client_secret)) → { access_token }
  → sessionStorage 저장, Axios 인터셉터가 이후 모든 요청에 Bearer 토큰 첨부
  → GET /api/users/me
      → api-gateway가 JWKS로 JWT 검증 → subject 추출 → X-User-Id 헤더로 user-service에 전달
      → user-service는 헤더만 신뢰 → 프로필(id, role) 반환 → Pinia 저장
  → Vue Router 네비게이션 가드가 이 상태로 requiresAuth / instructorOnly 라우트 게이트
```

### 6-2. 참여신청 → 정산 Saga (분산 트랜잭션 예제)

```
POST /api/enrollments { courseId }
  → EnrollmentService.enroll():
      1. course 존재 확인            (동기 REST → course-service)
      2. 중복 신청 거부
      3. createPendingEnrollment()   [REQUIRES_NEW — PENDING 행 즉시 커밋]
      4. course-service에서 실제 가격 조회 → payment-service에 정산 요청 (동기 REST)
  ← 201 Created (이 시점 enrollment는 아직 PENDING — 호출자는 정산 결과를 모름)

payment-service:
  1. Payment 저장(PENDING) → 2. transactionId = UUID (PG 없이 항상 성공)
  → 3. status COMPLETED → 4. payment.completed 발행 (동기, ack 최대 10초 대기)
  ← { paymentId, COMPLETED } 동기 반환 (enrollment-service는 로그만, 사용 안 함)

──────── 여기서부터 비동기 ────────

enrollment-service @KafkaListener (topic: payment.completed):
  → activateEnrollment(): status PENDING → ACTIVE
  → course-service 참여 카운트 증가 (동기 REST)
  → enrollment.completed 발행

recommend-service Consumer (topic: enrollment.completed, 백그라운드 스레드):
  → enrollmentId/userId/courseId 로깅 (추천 캐시 재계산 확장 지점)
```

### 6-3. 추천

```
GET /api/recommend/{userId}   (recommend-service가 자체 JWKS 검증)
  → 참여 이력 조회 (GET enrollment-service /api/enrollments/internal/history/{userId})
      · 이력 없음 → 전체 프로그램 참여 건수 desc 정렬 → 상위 5
      · 이력 있음 → 참여 프로그램의 최빈 카테고리 → 해당 카테고리 추천(참여분 제외) → 상위 5
      · 이력 조회 실패 → "이력 없음"으로 폴백 (추천은 비핵심 기능)
```

---

## 7. 설계 의사결정

| 결정 | 이유 |
|---|---|
| 인증 검증을 게이트웨이에 집중 | 도메인 서비스마다 JWT 파싱 로직을 중복하지 않음. 서비스는 `X-User-Id`만 읽어 비즈니스 로직에 집중 |
| PENDING 행 분리 커밋 (`REQUIRES_NEW`) | "신청 기록은 먼저 남기고 활성화만 나중에" — 정산 실패가 신청 이력을 롤백하지 않도록 트랜잭션 경계 분리 |
| 동기 REST vs 비동기 이벤트 구분 | 즉시 응답이 필요한 조회/검증은 `WebClient` 동기, 결과를 기다릴 필요 없는 상태 전이는 이벤트 |
| Choreography Saga (오케스트레이터 없음) | 서비스 간 결합도 최소화 — payment는 enrollment의 존재를 모르고 이벤트만 발행 |
| 정산 금액을 course-service에서 조회 | 클라이언트가 금액을 조작하지 못하도록 서버 측에서 실제 가격을 확정해 payment로 전달 |
| 백엔드 불변 + 프론트 라벨 매핑 | 기존 API 계약을 유지하면서 도메인 표현만 교체 — 레거시 통합/멀티 브랜드 시나리오의 축소판 |

---

## 8. 테스트 · 관측성 · 문서화

| 영역 | 도구 / 방식 |
|---|---|
| 단위·통합 테스트 | JUnit 5 (`useJUnitPlatform`), `spring-boot-starter-test` |
| 보안 테스트 | `spring-security-test` (`@WithMockUser` 등으로 리소스 서버 검증) |
| Kafka 테스트 | `spring-kafka-test` (임베디드 브로커로 Producer/Consumer 검증) |
| API 문서 | springdoc-openapi → 서비스별 `/swagger-ui.html`, `/api-docs` |
| 헬스 체크 | Spring Actuator `/actuator/health` (`show-details: always`), Compose healthcheck 연동 가능 |
| 서비스 등록 확인 | Eureka 대시보드 `http://localhost:8761/` |
| SQL 로깅 | `show-sql: true` + `format_sql: true` (개발 시 쿼리 관찰) |

`키워드`: JUnit 5, Spring Boot Test, MockMvc, Testcontainers 적용 여지, spring-kafka-test 임베디드 브로커, OpenAPI 3, Actuator, 헬스 체크

---

## 9. 한계와 개선 로드맵

> 교육용 레퍼런스로서 **의도적으로 단순화**한 부분과, 실무화 시 보완 지점을 명시했습니다.
> (한계를 인지하고 우선순위를 매길 수 있다는 것 자체가 역량)

| 항목 | 현재 상태 | 개선 방향 | 우선순위 |
|---|---|---|---|
| DB 분리 | 4개 서비스가 하나의 `lecture_db` 공유 | Database per Service | 높음 |
| 서비스 디스커버리 활용 | Eureka 등록만 하고 호출은 컨테이너 DNS 하드코딩 | `@LoadBalanced` + `lb://` 클라이언트 사이드 LB | 높음 |
| 이벤트 발행 원자성 | DB 커밋과 Kafka 발행이 분리 → 유실 가능 | Transactional Outbox + CDC(Debezium) | 높음 |
| 컨슈머 오류 처리 | 예외를 삼키고 로깅만 → enrollment 영구 PENDING 가능 | 재시도 + DLQ + 알림 | 높음 |
| 멱등성 | 동일 이벤트 재전달 시 중복 처리 | 처리 이력 테이블 기반 멱등 키 | 중간 |
| 보상 트랜잭션 | 정산 실패 시 PENDING enrollment 잔존, 정리 없음 | 타임아웃 스케줄러 or 보상 이벤트 | 중간 |
| 회복탄력성 | 동기 호출에 circuit breaker/retry 없음 | Resilience4j (`@CircuitBreaker`, `@Retry`, bulkhead) | 중간 |
| 이벤트 스키마 계약 | 타입 헤더 없이 `Map` 파싱 → 필드 변경이 컴파일 타임에 안 걸림 | 공유 이벤트 DTO 모듈 or Schema Registry(Avro) | 중간 |
| 결제 | PG 연동 없는 시뮬레이션, 항상 성공 | 실제 PG 어댑터, 실패/부분취소/환불 시나리오 | 중간 |
| 보안 | 일부 서비스 `SecurityConfig`가 `permitAll` | `/internal/**`를 `SCOPE_service.read`로 제한, mTLS | 중간 |
| 관측성 | 로그 + Actuator 기본 | 분산 추적(OpenTelemetry/Zipkin), 메트릭(Prometheus/Grafana), 중앙 로깅(ELK) | 낮음 |
| CI/CD | 수동 빌드 | GitHub Actions로 서비스별 빌드·테스트·이미지 푸시 매트릭스 | 낮음 |

---

## 10. 확장 시나리오

이 프로젝트 구조를 기반으로 추가 구현/설명할 수 있는 것들:

- **분산 추적** — OpenTelemetry 에이전트를 각 서비스에 붙여 게이트웨이→enrollment→Kafka→recommend까지 하나의 trace로 시각화.
- **Saga 오케스트레이션 전환** — 현재 choreography를 Camunda/Temporal 기반 오케스트레이션으로 리팩터링해 두 방식 비교.
- **Kubernetes 이관** — Compose → Helm 차트, Eureka를 K8s Service Discovery로 대체, HPA로 컨슈머 오토스케일.
- **API 게이트웨이 레이트 리밋 / 서킷** — Spring Cloud Gateway 필터로 사용자별 rate limit(Redis), fallback 라우트.
- **읽기 모델 프리컴퓨트** — `enrollment.completed` 컨슈머에서 추천 결과를 캐시(Redis)에 미리 계산 (현재 no-op인 확장 지점).
- **이벤트 소싱** — enrollment 상태 전이를 이벤트 스트림으로 저장해 감사(audit)·리플레이 지원.
- **멀티 테넌시** — 지자체별 데이터 격리(스키마/행 수준), 라벨 맵을 테넌트 설정으로 확장.
- **BFF 계층** — 프론트 전용 집계 API를 별도 서비스로 분리해 클라이언트 라운드트립 감소.

---

## 11. 실행 방법

### 전체 스택 (Docker Compose)

```bash
docker load -i infra-images.tar                          # prebuilt auth-server / api-gateway (최초 1회)
docker compose build --no-cache && docker compose up -d  # 로컬 서비스 빌드 + 전체 기동
docker compose logs -f enrollment-service                # 특정 서비스 로그
docker compose down                                      # 종료
```

기동 후 `http://localhost:8761/` 에서 전 서비스 등록 상태 확인.

### 개별 백엔드 서비스

```bash
cd course-service
./gradlew test                                                       # 전체 테스트
./gradlew test --tests "com.lecture.course.CourseServiceApplicationTests"
./gradlew bootRun                                                    # 로컬 실행 (MariaDB/Eureka/auth-server 필요)
```

### 프론트엔드

```bash
cd vue-frontend
npm install
npm run dev     # http://localhost:3000
npm run build
```

### 추천 서비스 (Python)

```bash
cd recommend-service
pip install -r requirements.txt
python main.py  # 또는: uvicorn main:app --reload --port 8085
```

---

## 12. 포트 맵 · 참고 문서

| 서비스 | 포트 | 스택 |
|---|---|---|
| eureka-server | 8761 | Spring Cloud Netflix |
| auth-server | 9000 | OAuth2 Authorization Server (prebuilt) |
| api-gateway | 8080 | Spring Cloud Gateway (prebuilt) |
| user-service | 8081 | Spring Boot + JPA |
| course-service | 8082 | Spring Boot + JPA |
| enrollment-service | 8083 | Spring Boot + JPA + Kafka (오케스트레이터) |
| payment-service | 8084 | Spring Boot + JPA + Kafka |
| recommend-service | 8085 | FastAPI (Python) |
| vue-frontend | 3000 (dev) | Vue 3 + Vite |
| MariaDB | 3306 | 공유 `lecture_db` |
| Kafka | 9092 | 이벤트 브로커 |

### 참고 문서

- [`MSA_서비스_이해_서브노트.md`](./MSA_서비스_이해_서브노트.md) — MSA 구조 이해 및 학습 정리
- [`결제_흐름_백엔드_코드_서술.md`](./결제_흐름_백엔드_코드_서술.md) — 정산(Payment) 흐름 백엔드 코드 상세 (엔티티/DTO/트랜잭션/Kafka 계약)
- [`지자체_운영자_대시보드_구성안.md`](./지자체_운영자_대시보드_구성안.md) — 담당자 대시보드 프론트엔드 구성안
- [`CLAUDE.md`](./CLAUDE.md) — 아키텍처 · 서비스 계약 · 요청 흐름 상세 레퍼런스
