<template>
  <div class="page-wrapper">
    <AppHeader />
    <div class="page-layout">
      <AppSidebar />

      <main class="main-content">
        <h1 class="page-title">내 참여 현황</h1>

        <p v-if="!loading && pollTimerActive" class="poll-hint">
          정산 처리 결과를 확인하는 중입니다. 잠시 후 상태가 자동으로 갱신됩니다.
        </p>

        <div v-if="loading" class="loading-center">
          <div class="spinner"></div>
        </div>

        <div v-else-if="enrollments.length" class="enrollment-list fade-in">
          <div v-for="item in enrollments" :key="item.id" class="enrollment-card">
            <div class="enroll-thumb" :class="categoryMeta(item).bg">
              <span class="thumb-emoji" aria-hidden="true">{{ categoryMeta(item).emoji }}</span>
            </div>

            <div class="enroll-info">
              <span class="badge" :class="categoryMeta(item).badge">
                {{ categoryMeta(item).label }}
              </span>
              <h3 class="enroll-title">{{ item.course?.title }}</h3>
              <p class="enroll-operator">운영 주체: {{ operatorName(item) }}</p>
            </div>

            <div class="enroll-status">
              <span
                :class="[
                  'status-badge',
                  item.status === 'ACTIVE' ? 'status-active' : 'status-pending'
                ]"
              >
                {{ statusText(item.status) }}
              </span>
              <router-link :to="`/courses/${item.courseId}`" class="btn btn-ghost btn-sm">
                프로그램 보기
              </router-link>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <p class="empty-icon" aria-hidden="true">📭</p>
          <p>참여 중인 공동물류 프로그램이 없습니다.</p>
          <router-link to="/courses" class="btn btn-primary" style="margin-top:16px;">
            프로그램 둘러보기
          </router-link>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import { enrollmentApi } from '@/api/enrollment.js'
import { useAuthStore } from '@/store/auth.js'
import { useCourseStore } from '@/store/course.js'

const router = useRouter()
const auth = useAuthStore()
const courseStore = useCourseStore()

const enrollments = ref([])
const loading = ref(true)

const isInstructor = computed(() => auth.user?.role === 'INSTRUCTOR')

// PENDING → ACTIVE 전환은 payment.completed Kafka 이벤트로 비동기 처리되고 프론트로 푸시되지 않는다.
// 백엔드 변경 없이, 대기 중인 신청이 있으면 기존 GET /api/enrollments/my 를 잠시 폴링해 상태를 갱신한다.
const POLL_INTERVAL = 3000
const POLL_MAX_TRIES = 10
let pollTimer = null
const pollTimerActive = ref(false)

const hasPendingEnrollment = computed(() =>
  enrollments.value.some((item) => item.status !== 'ACTIVE')
)

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  pollTimerActive.value = false
}

function assignEnrollments(data) {
  if (Array.isArray(data?.data)) {
    enrollments.value = data.data
  } else if (Array.isArray(data)) {
    enrollments.value = data
  } else {
    enrollments.value = []
  }
}

function startPollingIfNeeded() {
  if (pollTimer || !hasPendingEnrollment.value) return

  pollTimerActive.value = true
  let tries = 0
  pollTimer = setInterval(async () => {
    tries += 1
    try {
      const res = await enrollmentApi.getMyEnrollments()
      assignEnrollments(res.data)
    } catch (error) {
      console.error('[EnrollmentView] polling failed:', error)
    }
    if (!hasPendingEnrollment.value || tries >= POLL_MAX_TRIES) {
      stopPolling()
    }
  }, POLL_INTERVAL)
}

// item.course.category는 course-service가 준 원본 enum. store가 라벨/색상/이모지로 해석한다.
function categoryMeta(item) {
  return courseStore.categoryMeta(item?.course?.category)
}

function operatorName(item) {
  return item?.course?.instructorName || item?.course?.operatorName || '지자체 직접 운영'
}

// 백엔드 Enrollment 상태는 PENDING / ACTIVE 두 가지뿐 (payment.completed 이벤트로 전환).
function statusText(status) {
  return status === 'ACTIVE' ? '참여 확정' : '신청 접수 · 정산 대기'
}

onMounted(async () => {
  // 지자체 담당자는 이 페이지 접근 불가 → 마이페이지로 이동
  if (isInstructor.value) {
    console.warn('[EnrollmentView] instructor tried to access /enrollments, redirect to /mypage')
    router.replace('/mypage')
    return
  }

  try {
    const res = await enrollmentApi.getMyEnrollments()
    console.log('[EnrollmentView] my enrollments response:', res.data)
    assignEnrollments(res.data)
  } catch (error) {
    console.error('[EnrollmentView] failed to load enrollments:', error)
    enrollments.value = []
  } finally {
    loading.value = false
  }

  startPollingIfNeeded()
})

onUnmounted(stopPolling)
</script>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  background: var(--color-bg-secondary);
}

.page-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 28px;
}

.main-content {
  min-width: 0;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 24px;
}

.poll-hint {
  margin-top: -12px;
  margin-bottom: 20px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  background: var(--color-warning-light);
  color: var(--color-warning);
  font-size: 13px;
}

.enrollment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.enrollment-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px;
  transition: var(--transition);
}

.enrollment-card:hover {
  box-shadow: var(--shadow-sm);
}

.enroll-thumb {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.thumb-emoji {
  font-size: 30px;
  line-height: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08));
}

.thumb-teal   { background: #E1F5EE; }
.thumb-blue   { background: #E6F1FB; }
.thumb-cyan   { background: var(--color-cold-light); }
.thumb-purple { background: #EEEDFE; }
.thumb-pink   { background: #FBEAF0; }
.thumb-amber  { background: #FAEEDA; }
.thumb-slate  { background: #EAEEF3; }
.thumb-gray   { background: #F1EFE8; }

.enroll-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.enroll-title {
  font-size: 15px;
  font-weight: 600;
}

.enroll-operator {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.enroll-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.status-active {
  background: #E1F5EE;
  color: #0F6E56;
}

.status-pending {
  background: #FAEEDA;
  color: #854F0B;
}

.btn-sm {
  padding: 7px 14px;
  font-size: 13px;
}

.empty-state {
  text-align: center;
  padding: 80px 0;
  color: var(--color-text-muted);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.loading-center {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
