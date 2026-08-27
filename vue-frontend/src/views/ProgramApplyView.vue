<template>
  <div class="page-wrapper app-bg">
    <AppHeader />

    <div class="apply-layout">
      <div class="apply-container">
        <nav class="breadcrumb" aria-label="위치">
          <router-link to="/courses" class="bc-link">공동물류 프로그램</router-link>
          <span class="bc-sep" aria-hidden="true">›</span>
          <router-link v-if="course" :to="`/courses/${course.id}`" class="bc-link">{{ course.title }}</router-link>
          <span class="bc-sep" aria-hidden="true">›</span>
          <span class="bc-current">참여 신청</span>
        </nav>

        <!-- 단계 표시 -->
        <ol class="stepper" aria-label="참여 신청 진행 단계">
          <li
            v-for="s in stepMeta"
            :key="s.n"
            class="stepper-item"
            :class="{ current: step === s.n, done: step > s.n }"
          >
            <span class="stepper-num">{{ step > s.n ? '✓' : s.n }}</span>
            <span class="stepper-label">{{ s.label }}</span>
          </li>
        </ol>

        <p v-if="isMockFlow" class="alert alert-info">
          데모용 예시 프로그램입니다. 백엔드가 연결되면 실제 신청·정산 흐름으로 동작합니다.
        </p>

        <!-- 로딩 -->
        <div v-if="loading" class="apply-card surface-card">
          <div class="spinner"></div>
          <p class="muted-line">프로그램 정보와 신청 상태를 확인하는 중입니다...</p>
        </div>

        <!-- 프로그램 로드 실패 -->
        <div v-else-if="!course" class="apply-card surface-card">
          <p class="empty-text">프로그램 정보를 불러오지 못했습니다.</p>
          <router-link to="/courses" class="btn btn-primary">프로그램 목록으로</router-link>
        </div>

        <template v-else>
          <!-- STEP 2: 분담금 결제 확인 -->
          <section v-if="step === 2" class="apply-card surface-card fade-in">
            <h2 class="apply-title">분담금 결제 확인</h2>
            <p class="apply-sub">
              아래 실부담금으로 정산이 진행되며, 정산이 완료되면 참여가 자동으로 확정됩니다.
            </p>

            <div class="program-strip">
              <div class="program-thumb" :class="meta.bg">
                <CategoryIcon :category="course.category" class="program-thumb-icon" />
              </div>
              <div>
                <span class="badge" :class="meta.badge">{{ meta.label }}</span>
                <h3 class="program-name">{{ course.title }}</h3>
              </div>
            </div>

            <dl class="cost-list">
              <div class="cost-row">
                <dt>분담금 기준액 (배송비)</dt>
                <dd>₩{{ basePrice.toLocaleString() }}</dd>
              </div>
              <div class="cost-row cost-row-subsidy">
                <dt>지자체 지원금 ({{ subsidyPercent }}%)</dt>
                <dd>− ₩{{ subsidyAmount.toLocaleString() }}</dd>
              </div>
              <div class="cost-row cost-row-total">
                <dt>실부담금</dt>
                <dd>₩{{ netPrice.toLocaleString() }}</dd>
              </div>
            </dl>

            <div v-if="error" class="alert alert-error">{{ error }}</div>

            <div class="apply-actions">
              <router-link :to="`/courses/${course.id}`" class="btn btn-ghost">돌아가기</router-link>
              <button
                class="btn btn-primary"
                :disabled="submitting || basePrice <= 0"
                @click="confirmPayAndApply"
              >
                <span v-if="submitting">처리 중...</span>
                <span v-else>결제하고 참여 신청</span>
              </button>
            </div>
            <p v-if="basePrice <= 0" class="helper-text">
              분담금이 설정되지 않은 프로그램입니다. 운영 지자체에 문의해 주세요.
            </p>
          </section>

          <!-- STEP 3: 참여 신청 접수 / 정산 대기 -->
          <section v-else-if="step === 3" class="apply-card surface-card fade-in">
            <h2 class="apply-title">참여 신청이 접수되었습니다</h2>
            <p class="apply-sub">
              분담금 정산을 처리하고 있습니다. 정산이 완료되면 참여가 확정됩니다.
            </p>

            <div class="waiting-box">
              <div class="spinner" v-if="!pollExhausted"></div>
              <div class="waiting-icon" v-else aria-hidden="true">⏳</div>
              <p class="waiting-text" v-if="!pollExhausted">
                정산 결과를 확인하는 중입니다... (자동 갱신)
              </p>
              <p class="waiting-text" v-else>
                정산이 아직 완료되지 않았습니다. 잠시 후 <router-link to="/mypage">내 참여 현황</router-link>에서
                확인하거나 아래 버튼으로 다시 확인해 주세요.
              </p>
            </div>

            <ol class="lifecycle">
              <li class="lifecycle-step done"><span class="lifecycle-dot"></span>신청 접수</li>
              <li class="lifecycle-step" :class="{ active: !pollExhausted }"><span class="lifecycle-dot"></span>정산 처리 중</li>
              <li class="lifecycle-step"><span class="lifecycle-dot"></span>참여 확정</li>
            </ol>

            <div class="apply-actions">
              <router-link to="/mypage" class="btn btn-ghost">내 참여 현황</router-link>
              <button class="btn btn-primary" :disabled="checkingNow" @click="checkOnce">
                <span v-if="checkingNow">확인 중...</span>
                <span v-else>정산 상태 다시 확인</span>
              </button>
            </div>
          </section>

          <!-- STEP 4: 지원 내용 및 비용 확인 (영수증) -->
          <section v-else-if="step === 4" class="apply-card surface-card fade-in">
            <div class="done-head">
              <span class="done-check" aria-hidden="true">✓</span>
              <div>
                <h2 class="apply-title">참여가 확정되었습니다</h2>
                <p class="apply-sub">아래 내용으로 정산이 완료되었습니다.</p>
              </div>
            </div>

            <div class="program-strip">
              <div class="program-thumb" :class="meta.bg">
                <CategoryIcon :category="course.category" class="program-thumb-icon" />
              </div>
              <div>
                <span class="badge" :class="meta.badge">{{ meta.label }}</span>
                <h3 class="program-name">{{ course.title }}</h3>
              </div>
            </div>

            <dl class="cost-list">
              <div class="cost-row">
                <dt>분담금 기준액 (배송비)</dt>
                <dd>₩{{ basePrice.toLocaleString() }}</dd>
              </div>
              <div class="cost-row cost-row-subsidy">
                <dt>지자체 지원금 ({{ subsidyPercent }}%)</dt>
                <dd>− ₩{{ subsidyAmount.toLocaleString() }}</dd>
              </div>
              <div class="cost-row cost-row-total">
                <dt>결제 실부담금</dt>
                <dd>₩{{ netPrice.toLocaleString() }}</dd>
              </div>
              <div class="cost-row">
                <dt>참여 상태</dt>
                <dd><span class="status-badge status-active">참여 확정</span></dd>
              </div>
            </dl>

            <div class="apply-actions">
              <router-link to="/courses" class="btn btn-ghost">다른 프로그램 보기</router-link>
              <router-link to="/mypage" class="btn btn-primary">내 참여 현황으로</router-link>
            </div>
          </section>
        </template>
      </div>
    </div>

    <AppFooter />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import CategoryIcon from '@/components/CategoryIcon.vue'
import { useCourseStore, netBurden, SUBSIDY_RATE } from '@/store/course.js'
import { useAuthStore } from '@/store/auth.js'
import { enrollmentApi } from '@/api/enrollment.js'

const route = useRoute()
const router = useRouter()
const courseStore = useCourseStore()
const auth = useAuthStore()

const stepMeta = [
  { n: 1, label: '신청 상태 확인' },
  { n: 2, label: '분담금 결제' },
  { n: 3, label: '참여 신청' },
  { n: 4, label: '지원 내용·비용 확인' },
]

const loading = ref(true)
const step = ref(1)
const submitting = ref(false)
const checkingNow = ref(false)
const error = ref('')
const enrollmentStatus = ref('NONE') // NONE | PENDING | ACTIVE
const pollExhausted = ref(false)

const course = computed(() => courseStore.selectedCourse)
const isMockFlow = computed(() => courseStore.usingMock)
const meta = computed(() => courseStore.categoryMeta(course.value?.category))

const basePrice = computed(() => {
  const v = Number(course.value?.price ?? 0)
  return Number.isNaN(v) ? 0 : v
})
const netPrice = computed(() => netBurden(basePrice.value))
const subsidyAmount = computed(() => Math.max(0, basePrice.value - netPrice.value))
const subsidyPercent = Math.round(SUBSIDY_RATE * 100)

const courseSnapshot = computed(() => ({
  title: course.value?.title,
  category: course.value?.category,
  price: course.value?.price,
}))

/** 이 프로그램에 대한 내 신청 상태를 조회해 enrollmentStatus 를 갱신한다. */
async function loadStatus() {
  try {
    const res = await enrollmentApi.getMyEnrollments()
    const list = Array.isArray(res.data?.data)
      ? res.data.data
      : Array.isArray(res.data)
        ? res.data
        : []
    const matched = list.find((e) => Number(e.courseId) === Number(route.params.id))
    enrollmentStatus.value = !matched ? 'NONE' : matched.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING'
  } catch (e) {
    console.error('[ProgramApply] 신청 상태 조회 실패:', e)
    enrollmentStatus.value = 'NONE'
  }
}

/* ── 정산 대기 → 참여 확정 폴링 ──
 * PENDING→ACTIVE 는 payment.completed Kafka 이벤트로 비동기 처리되고 프론트로 푸시되지 않는다.
 * 백엔드 변경 없이 GET /api/enrollments/my 를 잠시 폴링한다. (CourseDetailView 와 같은 패턴) */
const POLL_INTERVAL = 3000
const POLL_MAX_TRIES = 8
let pollTimer = null

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function startPolling() {
  if (pollTimer || enrollmentStatus.value !== 'PENDING') return
  pollExhausted.value = false
  let tries = 0
  pollTimer = setInterval(async () => {
    tries += 1
    await loadStatus()
    if (enrollmentStatus.value === 'ACTIVE') {
      stopPolling()
      step.value = 4
    } else if (tries >= POLL_MAX_TRIES) {
      stopPolling()
      pollExhausted.value = true
    }
  }, POLL_INTERVAL)
}

/** STEP 2 버튼: 분담금 결제 = 참여 신청 (POST /api/enrollments 한 번) */
async function confirmPayAndApply() {
  error.value = ''
  if (!course.value?.id) {
    error.value = '프로그램 정보가 올바르지 않습니다.'
    return
  }
  submitting.value = true
  try {
    // 카탈로그가 실데이터면 목업 폴백을 끄고 실제 백엔드 에러를 노출한다.
    await enrollmentApi.enroll(course.value.id, courseSnapshot.value, {
      allowMockFallback: isMockFlow.value,
    })
    enrollmentStatus.value = 'PENDING'
    step.value = 3
    startPolling()
  } catch (e) {
    console.error('[ProgramApply] 참여 신청 실패:', e)
    error.value =
      e.response?.data?.message ||
      e.response?.data?.error ||
      '결제·참여 신청에 실패했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    submitting.value = false
  }
}

/** STEP 3 버튼: 즉시 1회 상태 확인 */
async function checkOnce() {
  checkingNow.value = true
  try {
    await loadStatus()
    if (enrollmentStatus.value === 'ACTIVE') {
      stopPolling()
      step.value = 4
    } else if (!pollTimer) {
      // 폴링이 끝났으면 다시 한 텀 돌린다
      enrollmentStatus.value = 'PENDING'
      startPolling()
    }
  } finally {
    checkingNow.value = false
  }
}

onMounted(async () => {
  await courseStore.fetchCourse(route.params.id)

  // 지자체 담당자는 참여 신청 대상이 아니다 → 상세로 되돌린다.
  if (auth.user?.role === 'INSTRUCTOR') {
    router.replace(`/courses/${route.params.id}`)
    return
  }

  await loadStatus()
  loading.value = false

  if (enrollmentStatus.value === 'ACTIVE') {
    step.value = 4
  } else if (enrollmentStatus.value === 'PENDING') {
    step.value = 3
    startPolling()
  } else {
    step.value = 2
  }
})

onUnmounted(stopPolling)
</script>

<style scoped>
.apply-layout {
  background: var(--color-bg-secondary);
  padding: 24px 0 72px;
  min-height: 60vh;
}
.apply-container {
  max-width: 640px;
  margin: 0 auto;
  padding: 0 24px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.bc-link { color: var(--color-primary); font-weight: 600; }
.bc-sep { color: var(--color-text-muted); }
.bc-current { color: var(--color-text-secondary); }

/* ── 단계 표시 ── */
.stepper {
  list-style: none;
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}
.stepper-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  font-size: 11px;
  color: var(--color-text-muted);
}
.stepper-num {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}
.stepper-item.current .stepper-num {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.stepper-item.current .stepper-label { color: var(--color-text-primary); font-weight: 600; }
.stepper-item.done .stepper-num {
  background: var(--color-support-light);
  color: var(--color-support);
  border-color: var(--color-support-light);
}

.apply-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: stretch;
}
.apply-card .spinner { align-self: center; }

.apply-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text-primary);
}
.apply-sub {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-top: -8px;
}
.muted-line { font-size: 13px; color: var(--color-text-muted); text-align: center; }
.empty-text { font-size: 14px; color: var(--color-text-muted); text-align: center; }
.helper-text { font-size: 12px; color: var(--color-text-muted); }

/* ── 프로그램 요약 스트립 ── */
.program-strip {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
}
.program-thumb {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.program-thumb-icon { width: 26px; height: 26px; }
.program-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-top: 4px;
}

/* ── 비용 표 ── */
.cost-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.cost-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  font-size: 14px;
  border-bottom: 1px solid var(--color-border);
}
.cost-row:last-child { border-bottom: none; }
.cost-row dt { color: var(--color-text-secondary); }
.cost-row dd { font-weight: 600; color: var(--color-text-primary); }
.cost-row-subsidy dd { color: var(--color-support); }
.cost-row-total {
  background: var(--color-bg-secondary);
}
.cost-row-total dt { font-weight: 700; color: var(--color-text-primary); }
.cost-row-total dd { font-size: 18px; font-weight: 800; color: var(--color-primary); }

.apply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 4px;
}

/* ── 대기 박스 ── */
.waiting-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
}
.waiting-icon { font-size: 28px; }
.waiting-text { font-size: 13px; color: var(--color-text-secondary); text-align: center; line-height: 1.6; }

/* ── 라이프사이클 ── */
.lifecycle {
  list-style: none;
  display: flex;
  gap: 8px;
}
.lifecycle-step {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-muted);
}
.lifecycle-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--color-border);
  flex-shrink: 0;
}
.lifecycle-step.active .lifecycle-dot { background: var(--color-warning); }
.lifecycle-step.done { color: var(--color-support); }
.lifecycle-step.done .lifecycle-dot { background: var(--color-support); }

/* ── 완료 헤더 ── */
.done-head { display: flex; gap: 14px; align-items: flex-start; }
.done-check {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-support-light);
  color: var(--color-support);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 800;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .stepper-label { display: none; }
  .apply-actions { flex-direction: column-reverse; }
  .apply-actions .btn { width: 100%; }
}
</style>
