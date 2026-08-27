<template>
  <div class="page-wrapper app-bg">
    <AppHeader />

    <div class="detail-layout" v-if="course">
      <div class="detail-container">
        <!-- 브레드크럼 (사이드바가 없는 페이지의 유일한 복귀 동선) -->
        <nav class="breadcrumb" aria-label="위치">
          <router-link to="/courses" class="bc-link">공동물류 프로그램</router-link>
          <span class="bc-sep" aria-hidden="true">›</span>
          <span class="bc-current">{{ course.title }}</span>
        </nav>

        <p v-if="courseStore.usingMock" class="alert alert-info mock-hint">
          데모용 예시 프로그램입니다. 백엔드가 연결되면 실제 프로그램 정보로 바뀝니다.
        </p>

        <div class="detail-grid">
          <!-- 좌측 상세 정보 -->
          <div class="detail-main fade-in-up">
            <header class="detail-head">
              <span class="badge" :class="badgeClass">{{ displayCategory }}</span>
              <h1 class="detail-title">{{ course.title }}</h1>
              <p class="detail-desc">
                {{ course.description || config.blurb || '지역 공동물류 프로그램입니다. 신청 후 정산이 완료되면 참여가 확정됩니다.' }}
              </p>
            </header>

            <!-- 핵심 지표 (금액은 우측 카드가 담당 — 여기선 규모 · 모집 상태 · 지원율) -->
            <div class="stat-row">
              <div class="stat-tile">
                <div class="stat-value">
                  {{ displayEnrollmentCount }}<span class="stat-unit">명</span>
                </div>
                <div class="stat-label">참여 소상공인</div>
              </div>
              <div class="stat-tile">
                <div class="stat-value" :class="isRecruiting ? 'stat-value-ok' : 'stat-value-muted'">
                  {{ displayStatus }}
                </div>
                <div class="stat-label">모집 상태</div>
              </div>
              <div class="stat-tile">
                <div class="stat-value">{{ subsidyPercent }}<span class="stat-unit">%</span></div>
                <div class="stat-label">지자체 지원금</div>
              </div>
            </div>

            <!-- 진행 단계 (enrollment saga 미리보기) -->
            <section class="detail-section">
              <h2 class="detail-section-title">참여는 이렇게 진행돼요</h2>
              <ol class="steps">
                <li class="step">
                  <span class="step-num">1</span>
                  <div class="step-body">
                    <div class="step-name">참여 신청</div>
                    <p class="step-desc">신청 즉시 접수되고 상태가 ‘정산 대기’로 바뀝니다.</p>
                  </div>
                </li>
                <li class="step">
                  <span class="step-num">2</span>
                  <div class="step-body">
                    <div class="step-name">정산</div>
                    <p class="step-desc">배송비에서 지자체 지원금 {{ subsidyPercent }}%를 뺀 실부담금만 정산됩니다.</p>
                  </div>
                </li>
                <li class="step">
                  <span class="step-num">3</span>
                  <div class="step-body">
                    <div class="step-name">참여 확정</div>
                    <p class="step-desc">정산이 완료되면 참여가 자동으로 확정됩니다.</p>
                  </div>
                </li>
              </ol>
            </section>

            <!-- 프로그램 정보 -->
            <section class="detail-section">
              <h2 class="detail-section-title">프로그램 정보</h2>
              <dl class="spec-list">
                <div v-for="s in specs" :key="s.label" class="spec-row">
                  <dt class="spec-label">{{ s.label }}</dt>
                  <dd class="spec-value">{{ s.value }}</dd>
                </div>
              </dl>
            </section>
          </div>

          <!-- 우측 정산/참여 카드 -->
          <aside class="detail-aside">
            <div class="enroll-card fade-in">
              <div class="enroll-head" :class="thumbBg">
                <CategoryIcon :category="course?.category" class="enroll-head-icon" />
                <span class="enroll-head-label">{{ displayCategory }}</span>
              </div>

              <div class="enroll-body">
                <div class="enroll-price-label">
                  참여 분담금 · 지자체 지원금 {{ subsidyPercent }}% 반영
                </div>
                <div class="enroll-price-row">
                  <span class="enroll-price">₩{{ netPrice.toLocaleString() }}</span>
                  <span class="enroll-price-base">정가 ₩{{ basePrice.toLocaleString() }}</span>
                </div>
                <p class="price-note">
                  실제 청구액은 정산 시 지자체 지원금 적용 후 확정됩니다.
                </p>

                <button
                  class="btn btn-primary btn-full"
                  @click="handlePrimaryAction"
                  :disabled="buttonDisabled"
                  :class="{ 'btn-disabled': buttonDisabled }"
                >
                  <span v-if="enrolling">처리 중...</span>
                  <span v-else>{{ buttonLabel }}</span>
                </button>

                <div v-if="enrollError" class="alert alert-error">{{ enrollError }}</div>

                <p class="helper-text" v-if="helperText">
                  {{ helperText }}
                </p>

                <ul class="enroll-info-list">
                  <li v-for="point in infoPoints" :key="point">
                    <svg class="check-icon" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M5 10.5l3.2 3.2L15 6.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    {{ point }}
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>

    <div v-else-if="loading" class="detail-layout">
      <div class="detail-container">
        <div class="detail-grid">
          <div class="detail-main">
            <div class="skeleton-line short"></div>
            <div class="skeleton-line" style="height:32px;margin:12px 0"></div>
            <div class="skeleton-line medium"></div>
            <div class="stat-row">
              <div v-for="i in 3" :key="i" class="stat-tile skeleton-tile"></div>
            </div>
          </div>
          <aside class="detail-aside">
            <div class="enroll-card skeleton-card-lg"></div>
          </aside>
        </div>
      </div>
    </div>

    <div v-else class="detail-error">
      <p class="empty-text">프로그램 정보를 불러오지 못했습니다.</p>
      <router-link to="/courses" class="btn btn-primary">프로그램 목록으로</router-link>
    </div>

    <AppFooter />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import CategoryIcon from '@/components/CategoryIcon.vue'
import { useCourseStore, netBurden, SUBSIDY_RATE } from '@/store/course.js'
import { enrollmentApi } from '@/api/enrollment.js'
import { useAuthStore } from '@/store/auth.js'

const route = useRoute()
const router = useRouter()
const courseStore = useCourseStore()
const auth = useAuthStore()

const enrolling = ref(false)
const enrollError = ref('')
const enrollmentStatus = ref('NONE') // NONE | PENDING | ACTIVE

const course = computed(() => courseStore.selectedCourse)
const loading = computed(() => courseStore.loading)
const isInstructor = computed(() => auth.user?.role === 'INSTRUCTOR')
const isGuest = computed(() => !auth.isAuthenticated)

// 카테고리 메타(라벨/배지/썸네일)는 store가 단일 소스. course.category는 정규화된 라벨.
const config = computed(() => courseStore.categoryMeta(course.value?.category))
const badgeClass = computed(() => config.value.badge)
const thumbBg = computed(() => config.value.bg)

const displayCategory = computed(() => config.value.label)

const displayInstructorName = computed(() => {
  return (
    course.value?.instructorName ||
    course.value?.operatorName ||
    course.value?.instructor?.name ||
    '지자체 직접 운영'
  )
})

const displayEnrollmentCount = computed(() => {
  const value = Number(
    course.value?.enrollmentCount ??
    course.value?.enrollment_count ??
    0
  )
  return Number.isNaN(value) ? 0 : value.toLocaleString()
})

// 정가(분담금 기준액)와 지자체 지원금 반영 실부담금 — LandingView 카드와 같은 규칙(store.netBurden)
const basePrice = computed(() => {
  const value = Number(course.value?.price ?? 0)
  return Number.isNaN(value) ? 0 : value
})
const netPrice = computed(() => netBurden(basePrice.value))
const subsidyPercent = Math.round(SUBSIDY_RATE * 100)

// 정산/참여 카드 체크리스트 (정적)
const infoPoints = ['신청 즉시 접수', '지자체 지원금 자동 반영', '정산 완료 시 참여 확정']

// SAMPLE_PROGRAMS 에는 region 이 있고 course-service 응답에는 없을 수 있어 운영 주체로 대체
const displayRegion = computed(() => course.value?.region || displayInstructorName.value)

// course-service Course.status(ACTIVE/INACTIVE) → 모집 상태 라벨
const isRecruiting = computed(() => course.value?.status === 'ACTIVE')
const displayStatus = computed(() => (isRecruiting.value ? '모집 중' : '모집 마감'))

const displayOpenDate = computed(() => {
  const raw = course.value?.createdAt
  if (!raw) return ''
  const d = new Date(raw)
  return Number.isNaN(d.getTime())
    ? ''
    : `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`
})

// 프로그램 정보 표 — 가격은 우측 정산 카드가 단일 소스이므로 여기서는 사실 정보만 (금액 중복 노출 제거)
const specs = computed(() => {
  const rows = [
    { label: '배송 유형', value: displayCategory.value },
    { label: '운영 주체', value: displayRegion.value },
    { label: '모집 시작일', value: displayOpenDate.value },
  ]
  return rows.filter((r) => r.value != null && r.value !== '')
})

const buttonLabel = computed(() => {
  if (isGuest.value) return '로그인하고 참여하기'
  if (isInstructor.value) return '지자체 담당자 계정은 신청 불가'
  if (enrollmentStatus.value === 'ACTIVE') return '내 참여 현황으로 이동'
  if (enrollmentStatus.value === 'PENDING') return '신청 완료 · 정산 처리 중'
  return '정산하고 참여하기'
})

const buttonDisabled = computed(() => {
  if (enrolling.value) return true
  if (isGuest.value) return false
  if (isInstructor.value) return true
  if (enrollmentStatus.value === 'PENDING') return true
  return false
})

const helperText = computed(() => {
  if (isGuest.value) {
    return '로그인하면 참여 신청과 정산을 진행할 수 있습니다.'
  }

  if (isInstructor.value) {
    return '지자체 담당자 계정은 본인 프로그램을 참여 신청할 수 없습니다.'
  }

  if (enrollmentStatus.value === 'ACTIVE') {
    return '이미 참여 중인 프로그램입니다. 내 참여 현황에서 진행 상태를 확인할 수 있습니다.'
  }

  if (enrollmentStatus.value === 'PENDING') {
    return '참여 신청이 접수되었습니다. 정산 상태가 반영되면 내 참여 현황에서 확인할 수 있습니다.'
  }

  return '정산을 진행하면 참여 신청이 함께 처리됩니다.'
})

async function loadEnrollmentStatus() {
  if (!auth.user?.id || !course.value?.id || isInstructor.value) {
    enrollmentStatus.value = 'NONE'
    return
  }

  try {
    const res = await enrollmentApi.getMyEnrollments()
    console.log('[CourseDetail] my enrollments response =', res.data)

    const enrollments = Array.isArray(res.data?.data)
      ? res.data.data
      : Array.isArray(res.data)
        ? res.data
        : []

    const matched = enrollments.find(item => Number(item.courseId) === Number(course.value.id))

    if (!matched) {
      enrollmentStatus.value = 'NONE'
      return
    }

    enrollmentStatus.value = matched.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING'
  } catch (e) {
    console.error('[CourseDetail] failed to load enrollment status:', e)
    enrollmentStatus.value = 'NONE'
  }
}

async function handlePrimaryAction() {
  enrollError.value = ''

  if (!course.value?.id) {
    enrollError.value = '프로그램 정보가 올바르지 않습니다.'
    return
  }

  if (isGuest.value) {
    router.push({ path: '/login', query: { redirect: route.path } })
    return
  }

  if (isInstructor.value) {
    enrollError.value = '지자체 담당자 계정은 본인 프로그램을 참여 신청할 수 없습니다.'
    return
  }

  if (enrollmentStatus.value === 'ACTIVE') {
    router.push('/mypage')
    return
  }

  if (enrollmentStatus.value === 'PENDING') {
    return
  }

  enrolling.value = true

  try {
    await enrollmentApi.enroll(course.value.id, {
      title: course.value.title,
      category: course.value.category,
      price: course.value.price,
      instructorName: displayInstructorName.value,
    })
    enrollmentStatus.value = 'PENDING'
    startActivationPolling()
  } catch (e) {
    console.error('[CourseDetail] enroll failed:', e)
    enrollError.value = e.response?.data?.message || '정산/참여 신청에 실패했습니다.'
  } finally {
    enrolling.value = false
  }
}

// PENDING → ACTIVE 전환은 payment.completed Kafka 이벤트로 비동기 처리되고 프론트로 푸시되지 않는다.
// 백엔드 변경 없이, 기존 GET /api/enrollments/my 를 잠시 폴링해 확정 여부를 반영한다.
const POLL_INTERVAL = 3000
const POLL_MAX_TRIES = 8
let pollTimer = null

function stopActivationPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function startActivationPolling() {
  if (pollTimer || enrollmentStatus.value !== 'PENDING') return

  let tries = 0
  pollTimer = setInterval(async () => {
    tries += 1
    await loadEnrollmentStatus()
    if (enrollmentStatus.value !== 'PENDING' || tries >= POLL_MAX_TRIES) {
      stopActivationPolling()
    }
  }, POLL_INTERVAL)
}

onMounted(async () => {
  await courseStore.fetchCourse(route.params.id)
  console.log('[CourseDetail] selectedCourse =', courseStore.selectedCourse)
  await loadEnrollmentStatus()
  // 다른 화면에서 신청만 하고 넘어온 경우에도 확정을 이어서 감지
  startActivationPolling()
})

onUnmounted(stopActivationPolling)

watch(
  () => courseStore.selectedCourse,
  async (value) => {
    console.log('[CourseDetail] selectedCourse changed =', value)
    if (value?.id) {
      await loadEnrollmentStatus()
    }
  },
  { deep: true }
)
</script>

<style scoped>
/* 레이아웃/스피너/알림 배너/스켈레톤은 global.css 공통 규칙 사용 */

.detail-layout {
  background: var(--color-bg-secondary);
  padding: 24px 0 72px;
}

.detail-container {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 24px;
}

/* ── 브레드크럼 ── */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 18px;
}
.bc-link {
  color: var(--color-primary);
  font-weight: 600;
}
.bc-sep { color: var(--color-text-muted); }
.bc-current {
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 60vw;
}

.mock-hint { margin-bottom: 20px; }

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 40px;
  align-items: start;
}

/* ── 좌측 본문 ── */
.detail-main {
  display: flex;
  flex-direction: column;
  gap: 28px;
  min-width: 0;
}

.detail-head {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-title {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.3;
  color: var(--color-text-primary);
}

.detail-desc {
  font-size: 15px;
  color: var(--color-text-secondary);
  line-height: 1.7;
}

/* ── 핵심 지표 타일 ── */
.stat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.stat-tile {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px 18px;
  min-height: 78px;
}
.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text-primary);
  line-height: 1.2;
}
.stat-value-ok { color: var(--color-support); }
.stat-value-muted { color: var(--color-text-secondary); }
.stat-unit {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-left: 2px;
}
.stat-label {
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-text-muted);
}

/* ── 본문 섹션 ── */
.detail-section {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
}
.detail-section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 18px;
}

/* 진행 단계 */
.steps {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.step {
  display: flex;
  gap: 14px;
  padding-bottom: 18px;
  position: relative;
}
.step:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 14px;
  top: 30px;
  bottom: 0;
  width: 2px;
  background: var(--color-border);
}
.step:last-child { padding-bottom: 0; }
.step-num {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}
.step-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
}
.step-desc {
  margin-top: 3px;
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

/* 프로그램 정보 표 */
.spec-list {
  display: flex;
  flex-direction: column;
}
.spec-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 0;
  border-bottom: 1px solid var(--color-border);
  font-size: 14px;
}
.spec-row:last-child { border-bottom: none; }
.spec-label { color: var(--color-text-muted); flex-shrink: 0; }
.spec-value {
  color: var(--color-text-primary);
  font-weight: 600;
  text-align: right;
}

/* ── 우측 정산/참여 카드 ── */
.detail-aside {
  position: sticky;
  /* AppHeader 가 position:sticky; height:64px 이므로 그 아래로 붙도록 offset 을 준다 */
  top: 84px;
  /* 카드가 뷰포트보다 길어도 내부에서만 스크롤되게 (헤더 64 + 위아래 여백) */
  max-height: calc(100vh - 104px);
  overflow-y: auto;
}
.enroll-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.enroll-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
}
/* .thumb-* 배경/아이콘 색은 global.css */
.enroll-head-icon {
  width: 28px;
  height: 28px;
}
.enroll-head-label {
  font-size: 13px;
  font-weight: 700;
  color: inherit;
}
.enroll-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.enroll-price-label {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: -6px;
}
.enroll-price-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
}
.enroll-price {
  font-size: 26px;
  font-weight: 800;
  color: var(--color-support);
}
.enroll-price-base {
  font-size: 13px;
  color: var(--color-text-muted);
  text-decoration: line-through;
}
.price-note {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin-top: -4px;
}
.btn-full {
  padding: 13px;
  font-size: 15px;
}
.btn-disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.enroll-info-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.enroll-info-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.check-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--color-support);
}
.helper-text {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.detail-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 80px 24px;
}
.empty-text {
  font-size: 14px;
  color: var(--color-text-muted);
}

/* ── 스켈레톤 ── */
.skeleton-tile {
  border: none;
  background: var(--color-bg-tertiary);
  animation: pulse 1.4s ease-in-out infinite;
}
.skeleton-card-lg {
  height: 380px;
  background: var(--color-bg-tertiary);
  animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}
</style>