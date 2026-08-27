<template>
  <div class="page-wrapper">
    <AppHeader />

    <div class="detail-layout" v-if="course">
      <div class="detail-hero">
        <div class="detail-hero-inner">
          <!-- 좌측 상세 정보 -->
          <div class="detail-info fade-in-up">
            <span class="badge" :class="badgeClass">{{ displayCategory }}</span>
            <p class="detail-category-blurb">{{ config.blurb }}</p>
            <h1 class="detail-title">{{ course.title }}</h1>
            <p class="detail-desc">
              {{ course.description || '지역 공동물류 프로그램입니다. 신청 후 정산이 완료되면 참여가 확정됩니다.' }}
            </p>

            <div class="detail-meta">
              <span>운영 주체: {{ displayInstructorName }}</span>
              <span>참여 소상공인: {{ displayEnrollmentCount }}명</span>
            </div>
          </div>

          <!-- 우측 정산/참여 카드 -->
          <div class="enroll-card fade-in">
            <div class="enroll-thumb" :class="thumbBg">
              <span class="thumb-emoji" aria-hidden="true">{{ config.emoji }}</span>
            </div>

            <div class="enroll-body">
              <div class="enroll-price-label">참여 분담금 (배송비 · 지자체 지원금 반영)</div>
              <div class="enroll-price">₩{{ displayPrice }}</div>
              <p class="price-note">
                표시 금액은 프로그램 기준 분담금이며, 실제 청구액은 정산 시 지자체 지원금 적용 후 확정됩니다.
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

              <div v-if="enrollError" class="error-msg">{{ enrollError }}</div>

              <p class="helper-text" v-if="helperText">
                {{ helperText }}
              </p>

              <ul class="enroll-info-list">
                <li>✅ 신청 즉시 접수</li>
                <li>✅ 지자체 지원금 자동 반영</li>
                <li>✅ 정산 완료 시 참여 확정</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="loading" class="loading-center">
      <div class="spinner"></div>
    </div>

    <div v-else class="loading-center">
      <p class="empty-text">프로그램 정보를 불러오지 못했습니다.</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { useCourseStore } from '@/store/course.js'
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

const displayPrice = computed(() => {
  const value = Number(course.value?.price ?? 0)
  return Number.isNaN(value) ? '0' : value.toLocaleString()
})

const buttonLabel = computed(() => {
  if (isInstructor.value) return '지자체 담당자 계정은 신청 불가'
  if (enrollmentStatus.value === 'ACTIVE') return '내 참여 현황으로 이동'
  if (enrollmentStatus.value === 'PENDING') return '신청 완료 · 정산 처리 중'
  return '정산하고 참여하기'
})

const buttonDisabled = computed(() => {
  if (enrolling.value) return true
  if (isInstructor.value) return true
  if (enrollmentStatus.value === 'PENDING') return true
  return false
})

const helperText = computed(() => {
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

  if (isInstructor.value) {
    enrollError.value = '지자체 담당자 계정은 본인 프로그램을 참여 신청할 수 없습니다.'
    return
  }

  if (enrollmentStatus.value === 'ACTIVE') {
    router.push('/enrollments')
    return
  }

  if (enrollmentStatus.value === 'PENDING') {
    return
  }

  enrolling.value = true

  try {
    await enrollmentApi.enroll(course.value.id)
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
.page-wrapper {
  min-height: 100vh;
  background: var(--color-bg-secondary);
}

.detail-hero {
  background: linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 100%);
  border-bottom: 1px solid var(--color-border);
  padding: 48px 0;
}

.detail-hero-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 48px;
  align-items: start;
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-category-blurb {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: -6px;
}

.detail-title {
  font-size: 30px;
  font-weight: 700;
  line-height: 1.3;
}

.detail-desc {
  font-size: 15px;
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.detail-meta {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: var(--color-text-secondary);
  flex-wrap: wrap;
}

.enroll-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.enroll-thumb {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb-emoji {
  font-size: 56px;
  line-height: 1;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.1));
}

.thumb-teal   { background: #E1F5EE; }
.thumb-blue   { background: #E6F1FB; }
.thumb-cyan   { background: var(--color-cold-light); }
.thumb-purple { background: #EEEDFE; }
.thumb-pink   { background: #FBEAF0; }
.thumb-amber  { background: #FAEEDA; }
.thumb-slate  { background: #EAEEF3; }
.thumb-gray   { background: #F1EFE8; }

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

.enroll-price {
  font-size: 26px;
  font-weight: 700;
  color: var(--color-primary);
}

.price-note {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin-top: -4px;
}

.btn-full {
  width: 100%;
  padding: 13px;
  font-size: 15px;
  justify-content: center;
}

.btn-disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.enroll-info-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.enroll-info-list li {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.error-msg {
  font-size: 13px;
  color: #dc2626;
  padding: 8px 12px;
  background: #fef2f2;
  border-radius: var(--radius-sm);
}

.helper-text {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.empty-text {
  font-size: 14px;
  color: var(--color-text-muted);
}

.loading-center {
  display: flex;
  justify-content: center;
  padding: 100px 0;
}

.spinner {
  width: 40px;
  height: 40px;
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

@media (max-width: 900px) {
  .detail-hero-inner {
    grid-template-columns: 1fr;
  }
}
</style>