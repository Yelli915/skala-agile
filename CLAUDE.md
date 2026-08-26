# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Educational MSA (microservices architecture) reference project for a Korea University lecture (contact: audit@korea.ac.kr, Sungryel Lim Ph.D). Not production-ready — intended to demonstrate patterns (service discovery, OAuth2/JWT resource servers, event-driven communication via Kafka, an API gateway) rather than to be a hardened commercial service.

## Architecture

Boot order matters and is encoded in `docker-compose.yml` via `depends_on`:

```
MariaDB + Kafka (infra)
  → eureka-server (service discovery, :8761)
    → auth-server (OAuth2/JWT issuer, :9000 — prebuilt image, no source in this repo)
      → api-gateway (:8080 — prebuilt image, no source in this repo) + 4 domain services
        → recommend-service (:8085)
```

- **eureka-server** — Netflix Eureka registry. All Spring services register here and discover each other by application name.
- **auth-server** and **api-gateway** — not present as source in this repo. They ship as prebuilt images loaded from `infra-images.tar` (`docker load -i infra-images.tar`), tagged `msa-lecture/auth-server:1.0` and `msa-lecture/api-gateway:1.0`. Auth server issues JWTs and exposes a JWKS endpoint (`/oauth2/jwks`) that every resource-server service validates against. The gateway forwards authenticated requests downstream with an `X-User-Id` header (see e.g. `CourseController.createCourse`), which controllers read instead of re-validating the JWT themselves.
- **user-service** (`:8081`), **course-service** (`:8082`), **enrollment-service** (`:8083`), **payment-service** (`:8084`) — Spring Boot domain services, each package-structured as `config/ controller/ dto/ entity/ repository/ service/` under `com.lecture.<domain>`. Each is a Eureka client + OAuth2 resource server (validates JWTs via the auth-server's JWKS) + JPA app talking to a shared `lecture_db` MariaDB instance (container name `lecturedb`).
- **enrollment-service** is the orchestrator of the enrollment flow: it calls `course-service` and `payment-service` over `WebClient` (`CourseServiceClient`, `PaymentServiceClient`) and both produces/consumes Kafka events (`EnrollmentKafkaProducer`/`Consumer`) on topics `payment.completed` and `enrollment.completed`.
- **payment-service** produces `payment.completed` Kafka events after processing a payment; it does not consume anything.
- **recommend-service** — Python/FastAPI app (`recommend-service/main.py`, package under `app/`) implementing rule-based course recommendations. Registers itself with Eureka on startup via `py_eureka_client`, consumes the `enrollment.completed` Kafka topic (`app/kafka/consumer.py`) to react to new enrollments, and calls `course-service`/`enrollment-service` over HTTP via `app/client/*_client.py`. Configuration precedence is documented in `app/config/settings.py`: `docker-compose.yml` env vars (runtime) > `.env` (local dev) > hardcoded defaults in `settings.py`.
- **vue-frontend** — Vue 3 + Vite SPA (`:3000` in dev via `npm run dev`, served through nginx in Docker). `src/api/*` wraps calls to the backend services, `src/store/*` holds Pinia state (`auth`, `course`), `src/views/*` are the routed pages (landing, login/callback, course list/detail/create, enrollment, my page).
- **init-db/01_init.sql** — runs automatically on first MariaDB container start (mounted at `/docker-entrypoint-initdb.d`).

Cross-service calls use container DNS names directly (e.g. `http://course-service:8082`, `http://kafka:9092`) rather than Eureka's `lb://` client-side load balancing — check each service's `application.yml` under `service:` / `*_url` env vars for the exact wiring before assuming Eureka-based discovery is used for a given call.

## Interface boundary per service (what to know vs. what to ignore)

When changing one service, only the "알아야 할 것" column is a cross-service contract — the "몰라도 되는 것" column is private implementation detail that other services (and other engineers) never touch and shouldn't need to read to integrate correctly.

| 구성요소 | 알아야 할 것 (contract) | 몰라도 되는 것 (internal detail) |
|---|---|---|
| **user-service** | 회원가입/로그인 요청 형식, 응답으로 오는 토큰 — `POST /api/users/register` 요청/응답 DTO, `GET /api/users/me`가 `X-User-Id` 헤더로 프로필을 반환한다는 것 | 비밀번호 암호화 로직, DB 내부 구조 — `UserService`/`User` 엔티티 내부, JPA 매핑 |
| **course-service** | 상품(과목) 등록·조회 API 형식 — `POST /api/courses`, `GET /api/courses`, `GET /api/courses/{id}`, 그리고 다른 서비스가 쓰는 `internal/exists`, `internal/{id}`, `internal/{id}/enrollment-count`, `internal/recommend` 계약(요청 파라미터·응답 필드) | JPA 매핑, 내부 쿼리 — `CourseService`/`CourseRepository` 구현, 카테고리 enum 매핑 세부사항 |
| **enrollment-service** | "신청하면 이벤트가 발생하고, 결제 후 자동으로 상태가 바뀐다"는 흐름 — `POST /api/enrollments`는 즉시 `PENDING`으로 201을 반환하고, 실제 `ACTIVE` 전환은 `payment.completed` Kafka 이벤트를 받은 뒤 비동기로 일어난다는 것(→ "Key request flows" 3번 참고) | Kafka Producer/Consumer 코드 — `EnrollmentKafkaProducer`/`Consumer`의 역직렬화 처리, `EnrollmentWriteService`의 `REQUIRES_NEW` 트랜잭션 분리 이유 |
| **payment-service** | 결제 완료 호출 → 이후 enrollment 상태가 바뀐다는 결과 — `POST /api/payments/internal/request`는 항상 성공 응답을 동기로 주고, 그와 별도로 `payment.completed` 이벤트를 발행한다는 것 | 결제 처리 내부 로직 — PG 연동 없이 UUID로 트랜잭션 ID를 발급하는 실습용 시뮬레이션이라는 구현 방식 |
| **auth-server / api-gateway / eureka-server** | 로그인하면 토큰이 나오고, 그 토큰을 헤더에 넣으면 다른 API가 동작한다는 사용법 — Authorization Code flow로 토큰 발급, `Authorization: Bearer <token>`을 모든 API 요청에 첨부, 게이트웨이가 이를 `X-User-Id`로 변환해 하위 서비스에 전달 | 내부 설정, 서명 알고리즘, 서비스 등록 방식 — JWK 서명/키 로테이션, 이 저장소에는 소스가 없고 `infra-images.tar`의 prebuilt 이미지로만 제공된다는 점 이상의 내부 구현 |
| **recommend-service** | 사용자 ID를 넣으면 추천 강의 목록이 나온다는 사용법 — `GET /api/recommend/{userId}` (자체적으로 JWT를 검증), 수강 이력 없으면 인기순, 있으면 최빈 카테고리 기반 추천을 반환한다는 규칙 | 추천 알고리즘 세부 구현, Eureka 등록 방식 — `Counter.most_common` 집계 로직, `py_eureka_client` 초기화 코드 |

## Key request flows

These are the flows that span multiple folders/services — read them before touching any one piece, since a change on one side (a DTO field, a Kafka topic name, an internal endpoint path) has to stay in sync with the other side.

### 1. Login (OAuth2 Authorization Code flow)

```
vue-frontend (LoginView)
  → auth.store.redirectToLogin(): full-page redirect to
     auth-server GET /oauth2/authorize?response_type=code&client_id=...&redirect_uri=...
  → user authenticates on auth-server's login page
  → auth-server redirects browser to vue-frontend /callback?code=...
vue-frontend (CallbackView)
  → auth.store.handleCallback(code)
  → api/auth.js exchangeCode(): POST auth-server /oauth2/token
     (Basic auth: base64(client_id:client_secret), grant_type=authorization_code)
  → auth-server returns { access_token }
  → store.setToken() → sessionStorage; axios instance (api/index.js) attaches
     `Authorization: Bearer <token>` to every subsequent request
  → auth.store.fetchUser(): GET api-gateway /api/users/me  (Bearer token)
     → api-gateway validates the JWT against auth-server's JWKS, extracts the
       subject, and forwards the request to user-service with an `X-User-Id` header
     → user-service UserController.getMe() reads that header (never re-validates the JWT itself)
     → returns the user profile (id, role: STUDENT/INSTRUCTOR, ...) → stored in Pinia
router/index.js's navigation guard then gates `requiresAuth` / `instructorOnly` routes on this store state.
```

### 2. Course browsing & authoring

```
CourseListView / CourseDetailView → GET /api/courses, GET /api/courses/{id}
CourseCreateView (instructor only) → POST /api/courses  (Bearer token)
  → gateway forwards with X-User-Id → CourseController.createCourse() uses that
    header as the instructorId (no separate "who is the instructor" lookup)
```

`course-service` also exposes **internal-only** endpoints (no gateway route, called service-to-service, prefixed `/internal/`) that other services depend on:
- `GET /api/courses/internal/exists/{id}` — used by enrollment-service before accepting an enrollment
- `GET /api/courses/internal/{id}` — used by enrollment-service to enrich "my enrollments" with course details
- `POST /api/courses/internal/{id}/enrollment-count` — bumps the course's enrollment counter once an enrollment activates
- `GET /api/courses/internal/recommend?category=&excludeIds=` — used by recommend-service

### 3. Enrollment → Payment saga (the core distributed-transaction example)

This is the flow the whole Kafka wiring exists to demonstrate: enrollment-service does **not** wait for payment to fully settle before responding, and the resulting state transition (PENDING → ACTIVE) happens asynchronously off a Kafka event, not inside the original HTTP request.

```
EnrollmentView → POST /api/enrollments { courseId }   (Bearer token)
  → gateway adds X-User-Id → EnrollmentController.enroll()
  → EnrollmentService.enroll(userId, courseId):
      1. CourseServiceClient.existsCourse(courseId)        [sync REST → course-service]
         → 404/invalid if the course doesn't exist
      2. enrollmentRepository.existsByUserIdAndCourseId()  [reject duplicate enrollment]
      3. EnrollmentWriteService.createPendingEnrollment()  [REQUIRES_NEW tx — commits
         the Enrollment row as status=PENDING immediately, independent of what
         happens next, so a later failure can't roll it back]
      4. PaymentServiceClient.requestPayment(userId, courseId, amount=99000)
         [sync REST → payment-service POST /api/payments/internal/request]
  ← 201 Created returned to the browser here — the enrollment is still PENDING
    at this point; the caller does not see the outcome of payment yet.

payment-service PaymentController.processInternalPayment():
  → PaymentService.processInternalPayment():
      1. save Payment (PENDING)
      2. "process" the payment — no real PG integration, always succeeds,
         issues a random UUID as the transaction id
      3. payment.complete() → status COMPLETED
      4. PaymentKafkaProducer.publishPaymentCompleted() → Kafka topic `payment.completed`
         (sent synchronously, blocks up to 10s for broker ack)
  ← returns { paymentId, status: COMPLETED } synchronously to enrollment-service's
    WebClient call (informational only — the real state change is driven by the
    Kafka event below, not by this return value)

enrollment-service EnrollmentKafkaConsumer (topic `payment.completed`, consumer
group `enrollment-service`):
  → parses the raw event (received as Map<String,Object> because payment-service's
    JsonSerializer doesn't add type headers)
  → EnrollmentService.activateEnrollment(userId, courseId):
      1. load the Enrollment row, enrollment.activate() → status ACTIVE
      2. CourseServiceClient.increaseEnrollmentCount(courseId)  [sync REST → course-service]
      3. EnrollmentKafkaProducer.publishEnrollmentCompleted() → Kafka topic `enrollment.completed`

recommend-service EnrollmentCompletedConsumer (app/kafka/consumer.py, background
thread, topic `enrollment.completed`):
  → logs enrollmentId/userId/courseId (explicitly marked as the extension point
    for cache invalidation / recomputation — currently a no-op beyond logging)
```

Reading "my enrollments" (`GET /api/enrollments/my`) is a separate read path: `EnrollmentService.getEnrollmentsByUser()` loads the user's `Enrollment` rows and, for each one, calls `CourseServiceClient.getCourse()` synchronously to attach course details (title, price, thumbnail, instructor, etc.) before returning to the frontend — so course-service must be reachable for that page to render fully, even though the enrollment data itself lives in enrollment-service's own table.

### 4. Recommendations

```
MyPageView (student view) → GET /api/recommend/{userId}   (Bearer token, verified
  by recommend-service's own JWT check in app/config/security.py — it validates
  against the same JWKS rather than trusting an X-User-Id header)
  → recommend_router.get_recommendations()
  → RecommendService.get_recommendations(user_id):
      1. EnrollmentServiceClient.get_enrollment_history(user_id)
         [GET enrollment-service /api/enrollments/internal/history/{userId}
          → { activeCourseIds: [...] }; on failure, treated as "no history" since
          recommendations are non-critical]
      2. no history → _recommend_for_new_user(): CourseServiceClient.get_all_courses()
         sorted by enrollmentCount desc, top 5
      3. has history → resolve each active course's category via
         CourseServiceClient.get_all_courses(), pick the most frequent
         (Counter.most_common) category, then CourseServiceClient
         .get_recommend_courses(category, exclude_ids=activeCourseIds)
         [GET course-service /api/courses/internal/recommend] → top 5
```

This is a pure read-time computation (no persisted recommendation state); the Kafka consumer in flow 3 is where a cache/precompute step would be added if this became more than a lecture example.

## Common commands

### Backend (each of eureka-server, user-service, course-service, enrollment-service, payment-service has its own Gradle wrapper)

Run from inside the individual service directory, e.g. `cd course-service`:

```bash
./gradlew build              # compile + test + package
./gradlew test               # run all tests
./gradlew test --tests "com.lecture.course.CourseServiceApplicationTests"   # single test class
./gradlew bootRun             # run the service locally (expects MariaDB/Eureka/auth-server reachable at localhost)
```

### Full stack via Docker Compose (from repo root)

```bash
docker load -i infra-images.tar        # loads prebuilt auth-server / api-gateway images (one-time / after pulling repo)
docker compose build --no-cache && docker compose up -d   # build local services + start everything
docker compose logs -f [service-name]  # e.g. eureka-server, auth-server, api-gateway, user-service, course-service, enrollment-service, payment-service, recommend-service, mariadb, kafka
docker compose down                     # stop and remove containers
```

Check Eureka dashboard at `http://localhost:8761/` to confirm all services registered.

### Frontend

```bash
cd vue-frontend
npm install
npm run dev       # dev server on http://localhost:3000
npm run build      # production build
```

### recommend-service (Python/FastAPI)

```bash
cd recommend-service
pip install -r requirements.txt
python main.py     # or: uvicorn main:app --reload --port 8085
```

## Notes when modifying services

- MariaDB connection details (`manager`/`SqlDba-1`, db `lecture_db`) and JWKS/issuer URIs are duplicated across each service's `application.yml`; when changing one (e.g. rotating credentials or moving the auth server), update all of `user-service`, `course-service`, `enrollment-service`, `payment-service`.
- `application.yml` `datasource.url`/`eureka.client.service-url` point at `localhost` for local `bootRun` but at container names (`lecturedb`, `eureka-server`, `auth-server`) when overridden by `docker-compose.yml` environment variables (`SPRING_PROFILES_ACTIVE=docker` plus `SPRING_DATASOURCE_URL`, etc.) — don't assume the YAML defaults are what's actually used under Docker.
- `hibernate.ddl-auto: update` is set on every domain service, so entity changes auto-migrate the shared schema on next boot; there's no separate migration tool (Flyway/Liquibase) in this repo.
- Kafka topic names (`payment.completed`, `enrollment.completed`) are configured per-service under each `application.yml`'s `kafka.topic` block — keep producer/consumer topic strings in sync across `payment-service`, `enrollment-service`, and `recommend-service`.
