<template>
  <div class="page-wrapper app-bg">
    <AppHeader />
    <div class="page-layout">
      <AppSidebar />

      <main class="main-content dashboard">
        <div class="content-header">
          <div>
            <h1 class="page-title">{{ isInstructor ? '내 프로그램 관리' : '마이페이지' }}</h1>
            <p class="page-subtitle">
              {{ isInstructor
                ? '등록한 공동물류 프로그램과 참여 소상공인 현황을 한눈에 관리합니다.'
                : '내 참여 현황과 정산 상태, 우리 가게에 맞는 추천 프로그램을 한눈에 확인합니다.' }}
            </p>
          </div>

          <router-link
            v-if="isInstructor"
            to="/courses/new"
            class="btn btn-primary header-action"
          >
            + 새 공동물류 프로그램 등록
          </router-link>
        </div>

        <!-- 프로필 스트립 -->
        <div class="profile-strip surface-card fade-in-up">
          <div class="profile-avatar">{{ auth.user?.name?.charAt(0) || '?' }}</div>
          <div class="profile-info">
            <h2 class="profile-name">{{ auth.user?.name || '사용자' }}</h2>
            <p class="profile-email">{{ auth.user?.email || '-' }}</p>
          </div>
          <span class="badge profile-role" :class="isInstructor ? 'badge-amber' : 'badge-blue'">
            {{ isInstructor ? '🏢 지자체 담당자' : '🏪 소상공인' }}
          </span>
        </div>

        <!-- ============ 소상공인 대시보드 ============ -->
        <template v-if="!isInstructor">
          <!-- KPI 타일 -->
          <div class="kpi-grid">
            <div class="kpi-tile">
              <span class="kpi-ic kpi-ic-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              </span>
              <span class="kpi-value">{{ enrollmentLoading ? '–' : activeEnrollments.length }}</span>
              <span class="kpi-label">참여 확정</span>
            </div>
            <div class="kpi-tile">
              <span class="kpi-ic kpi-ic-amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
              </span>
              <span class="kpi-value">{{ enrollmentLoading ? '–' : pendingEnrollments.length }}</span>
              <span class="kpi-label">정산 대기</span>
            </div>
            <div class="kpi-tile">
              <span class="kpi-ic kpi-ic-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </span>
              <span class="kpi-value kpi-value-amount">
                {{ enrollmentLoading ? '–' : `₩${totalContribution.toLocaleString()}` }}
              </span>
              <span class="kpi-label">분담금 합계</span>
            </div>
          </div>

          <p v-if="enrollmentIsMock" class="alert alert-info">
            데모용 예시 참여 내역입니다. 백엔드(enrollment-service)가 연결되면 실제 신청 내역으로 바뀝니다.
          </p>
          <p
            v-if="!enrollmentLoading && pendingEnrollments.length"
            class="alert alert-warn pending-alert"
          >
            정산 대기 중인 참여 신청이 {{ pendingEnrollments.length }}건 있습니다.
            정산이 완료되면 참여가 자동으로 확정됩니다.
          </p>
          <p v-if="!enrollmentLoading && pollTimerActive" class="alert alert-info">
            정산 처리 결과를 확인하는 중입니다. 잠시 후 상태가 자동으로 갱신됩니다.
          </p>

          <!-- 위젯: 내 참여 현황 -->
          <section id="my-enrollments" class="widget surface-card">
            <div class="widget-head">
              <h3 class="section-title">내 참여 현황</h3>
              <span v-if="!enrollmentLoading && myEnrollments.length" class="widget-meta">
                총 {{ myEnrollments.length }}건
              </span>
            </div>

            <div v-if="enrollmentLoading" class="recent-list">
              <div v-for="i in 2" :key="i" class="skeleton-card recent-skeleton">
                <div class="skeleton-body">
                  <div class="skeleton-line short"></div>
                  <div class="skeleton-line medium"></div>
                </div>
              </div>
            </div>

            <div v-else-if="sortedEnrollments.length" class="recent-list fade-in">
              <div v-for="item in sortedEnrollments" :key="item.id" class="recent-card">
                <div class="recent-thumb" :class="enrollmentMeta(item).bg">
                  <CategoryIcon :category="item?.course?.category" class="recent-thumb-icon" />
                </div>

                <div class="recent-info">
                  <span class="badge" :class="enrollmentMeta(item).badge">
                    {{ enrollmentMeta(item).label }}
                  </span>
                  <h4 class="recent-title">{{ item.course?.title || '공동물류 프로그램' }}</h4>

                  <!-- 신청 → 정산 → 참여확정 라이프사이클 (enrollment saga 가시화) -->
                  <ol class="lifecycle">
                    <li class="lifecycle-step done">
                      <span class="lifecycle-dot"></span>신청 접수
                    </li>
                    <li class="lifecycle-step" :class="{ done: item.status === 'ACTIVE' }">
                      <span class="lifecycle-dot"></span>정산 완료
                    </li>
                    <li class="lifecycle-step" :class="{ done: item.status === 'ACTIVE' }">
                      <span class="lifecycle-dot"></span>참여 확정
                    </li>
                  </ol>
                </div>

                <div class="recent-status">
                  <span
                    class="status-badge"
                    :class="item.status === 'ACTIVE' ? 'status-active' : 'status-pending'"
                  >
                    {{ item.status === 'ACTIVE' ? '참여 확정' : '정산 대기' }}
                  </span>
                  <router-link
                    v-if="item.status !== 'ACTIVE' && !enrollmentIsMock"
                    :to="`/courses/${item.courseId}/apply`"
                    class="btn btn-primary btn-sm"
                  >
                    정산 상태 보기
                  </router-link>
                  <router-link :to="`/courses/${item.courseId}`" class="btn btn-ghost btn-sm">
                    프로그램 보기
                  </router-link>
                </div>
              </div>
            </div>

            <div v-else class="widget-empty">
              <p class="empty-title">아직 참여한 공동물류 프로그램이 없습니다.</p>
              <p class="empty-desc">
                우리 지역에서 열린 공동물류 프로그램에 참여해 배송비 부담을 함께 줄여보세요.
              </p>
              <div class="empty-actions">
                <router-link to="/courses" class="btn btn-primary">프로그램 둘러보기</router-link>
              </div>
            </div>
          </section>

          <!-- 위젯: 추천 프로그램 -->
          <section id="recommend" class="widget surface-card">
            <div class="widget-head">
              <h3 class="section-title">추천 프로그램</h3>
            </div>

            <p v-if="recommendMessage" class="recommend-message">{{ recommendMessage }}</p>

            <div v-if="recommendLoading" class="recommend-grid">
              <div v-for="i in 3" :key="i" class="skeleton-card">
                <div class="skeleton-thumb"></div>
                <div class="skeleton-body">
                  <div class="skeleton-line short"></div>
                  <div class="skeleton-line"></div>
                </div>
              </div>
            </div>

            <div v-else-if="recommendations.length" class="recommend-grid fade-in">
              <div v-for="c in recommendations" :key="c.id" class="recommend-item">
                <CourseCard :course="c" />
                <router-link :to="`/courses/${c.id}/apply`" class="btn btn-primary btn-sm recommend-apply">
                  이 프로그램 참여 신청
                </router-link>
              </div>
            </div>

            <p v-else-if="recommendError" class="empty-text">{{ recommendError }}</p>
            <p v-else class="empty-text">아직 추천할 프로그램이 없습니다.</p>
          </section>
        </template>

        <!-- ============ 지자체 담당자 대시보드 ============ -->
        <template v-else>
          <!-- KPI 타일 -->
          <div class="kpi-grid">
            <div class="kpi-tile">
              <span class="kpi-ic kpi-ic-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5"/></svg>
              </span>
              <span class="kpi-value">{{ myCourses.length }}</span>
              <span class="kpi-label">등록 프로그램</span>
            </div>
            <div class="kpi-tile">
              <span class="kpi-ic kpi-ic-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>
              </span>
              <span class="kpi-value">{{ activeCourseCount }}</span>
              <span class="kpi-label">진행 중</span>
            </div>
            <div class="kpi-tile">
              <span class="kpi-ic kpi-ic-amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 20v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 20v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11"/></svg>
              </span>
              <span class="kpi-value">{{ totalEnrollmentCount }}</span>
              <span class="kpi-label">총 참여 소상공인</span>
            </div>
          </div>

          <!-- 위젯: 내가 등록한 프로그램 -->
          <section class="widget surface-card">
            <div class="widget-head">
              <div>
                <h3 class="section-title">내가 등록한 프로그램</h3>
                <span class="section-subtitle">프로그램별 참여 소상공인 수와 진행 상태를 확인합니다.</span>
              </div>
            </div>

            <div v-if="!instructorLoading && myCourses.length" class="filter-row">
              <button
                v-for="opt in courseFilterOptions"
                :key="opt.value"
                type="button"
                class="filter-chip"
                :class="{ 'filter-chip-active': courseFilter === opt.value }"
                @click="courseFilter = opt.value"
              >
                {{ opt.label }}
                <span class="filter-count">{{ courseCountByFilter(opt.value) }}</span>
              </button>
            </div>

            <div v-if="instructorLoading" class="recommend-grid">
              <div v-for="i in 3" :key="i" class="skeleton-card">
                <div class="skeleton-thumb"></div>
                <div class="skeleton-body">
                  <div class="skeleton-line short"></div>
                  <div class="skeleton-line"></div>
                </div>
              </div>
            </div>

            <div v-else-if="filteredCourses.length" class="instructor-course-list fade-in">
              <div
                v-for="course in filteredCourses"
                :key="course.id"
                class="instructor-course-card"
              >
                <div class="course-card-top">
                  <div>
                    <h4 class="course-title">{{ course.title }}</h4>
                    <p class="course-desc">{{ course.description || '설명이 없습니다.' }}</p>
                  </div>
                  <span
                    class="status-badge"
                    :class="course.status === 'ACTIVE' ? 'status-active' : 'status-inactive'"
                  >
                    {{ course.status === 'ACTIVE' ? '모집 중' : '모집 마감' }}
                  </span>
                </div>

                <div class="course-meta-grid">
                  <div class="meta-box">
                    <div class="meta-label">배송유형</div>
                    <div class="meta-value meta-value-type">
                      <CategoryIcon :category="course.category" class="type-icon" />
                      {{ courseStore.categoryMeta(course.category).label }}
                    </div>
                  </div>
                  <div class="meta-box">
                    <div class="meta-label">분담금 (지원금 30% 반영)</div>
                    <div class="meta-value">{{ formatPrice(netBurden(course.price)) }}</div>
                  </div>
                  <div class="meta-box">
                    <div class="meta-label">참여 소상공인 수</div>
                    <div class="meta-value">{{ courseEnrollmentCount(course) }}명</div>
                  </div>
                  <div class="meta-box">
                    <div class="meta-label">프로그램 ID</div>
                    <div class="meta-value">#{{ course.id }}</div>
                  </div>
                </div>

                <!-- 참여율 (등록 프로그램 간 상대 비교 — 정원 개념이 백엔드에 없어 최다 참여 대비로 표시) -->
                <div class="participation">
                  <div class="participation-head">
                    <span class="participation-label">참여율</span>
                    <span class="participation-value">{{ courseEnrollmentCount(course) }}명</span>
                  </div>
                  <div class="participation-track">
                    <div
                      class="participation-fill"
                      :style="{ width: participationWidth(course) + '%' }"
                    ></div>
                  </div>
                  <span class="participation-hint">
                    {{ maxEnrollmentCount > 0
                      ? `최다 참여 프로그램 대비 ${participationWidth(course)}%`
                      : '아직 참여 신청이 없습니다.' }}
                  </span>
                </div>

                <div class="course-card-actions">
                  <router-link :to="`/courses/${course.id}`" class="btn btn-primary btn-sm">
                    프로그램 보기
                  </router-link>
                </div>
              </div>
            </div>

            <p v-else-if="instructorError" class="empty-text">{{ instructorError }}</p>
            <p v-else-if="myCourses.length" class="empty-text">해당 상태의 프로그램이 없습니다.</p>

            <div v-else class="widget-empty">
              <p class="empty-title">아직 등록한 프로그램이 없습니다.</p>
              <p class="empty-desc">새 공동물류 프로그램을 등록해 관내 소상공인의 참여를 받아보세요.</p>
              <div class="empty-actions">
                <router-link to="/courses/new" class="btn btn-primary">첫 프로그램 등록하기</router-link>
              </div>
            </div>
          </section>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import CourseCard from '@/components/CourseCard.vue'
import CategoryIcon from '@/components/CategoryIcon.vue'
import { useAuthStore } from '@/store/auth.js'
import { enrollmentApi } from '@/api/enrollment.js'
import { courseApi } from '@/api/course.js'
import { useCourseStore, netBurden } from '@/store/course.js'

const auth = useAuthStore()
const courseStore = useCourseStore()

const isInstructor = computed(() => auth.user?.role === 'INSTRUCTOR')

/* ── 소상공인: 참여 현황 (GET /api/enrollments/my) ── */
const myEnrollments = ref([])
const enrollmentLoading = ref(true)
const enrollmentIsMock = ref(false)

const activeEnrollments = computed(() =>
  myEnrollments.value.filter((e) => e.status === 'ACTIVE')
)
// 백엔드 Enrollment 상태는 PENDING / ACTIVE 두 가지뿐 → ACTIVE 가 아니면 정산 대기로 본다.
const pendingEnrollments = computed(() =>
  myEnrollments.value.filter((e) => e.status !== 'ACTIVE')
)
const sortedEnrollments = computed(() =>
  [...myEnrollments.value].sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0))
)
// 분담금은 화면 전체에서 지자체 지원금 30% 반영 후 실부담(netBurden) 기준으로 표시·합산한다.
const totalContribution = computed(() =>
  myEnrollments.value.reduce((sum, e) => sum + netBurden(e.course?.price), 0)
)

// item.course.category 는 course-service 가 준 원본 enum. store 가 라벨/색상/아이콘으로 해석.
function enrollmentMeta(item) {
  return courseStore.categoryMeta(item?.course?.category)
}

/* ── 소상공인: 정산 상태 폴링 ──
 * PENDING → ACTIVE 전환은 payment.completed Kafka 이벤트로 비동기 처리되고 프론트로 푸시되지 않는다.
 * 백엔드 변경 없이, 대기 중인 신청이 있으면 GET /api/enrollments/my 를 잠시 폴링해 상태를 갱신한다. */
const POLL_INTERVAL = 3000
const POLL_MAX_TRIES = 10
let pollTimer = null
const pollTimerActive = ref(false)

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  pollTimerActive.value = false
}

function startPollingIfNeeded() {
  if (pollTimer || !pendingEnrollments.value.length) return

  pollTimerActive.value = true
  let tries = 0
  pollTimer = setInterval(async () => {
    tries += 1
    try {
      const res = await enrollmentApi.getMyEnrollments()
      const data = res.data
      if (Array.isArray(data?.data)) {
        myEnrollments.value = data.data
      } else if (Array.isArray(data)) {
        myEnrollments.value = data
      }
    } catch (error) {
      console.error('[MyPage] enrollment polling failed:', error)
    }
    if (!pendingEnrollments.value.length || tries >= POLL_MAX_TRIES) {
      stopPolling()
    }
  }, POLL_INTERVAL)
}

/* ── 소상공인: 추천 ── */
const recommendations = ref([])
const recommendLoading = ref(true)
const recommendError = ref('')
const recommendMessage = ref('')

/* ── 지자체 담당자: 등록 프로그램 ── */
const myCourses = ref([])
const instructorLoading = ref(true)
const instructorError = ref('')
const courseFilter = ref('ALL')

const courseFilterOptions = [
  { value: 'ALL', label: '전체' },
  { value: 'ACTIVE', label: '모집 중' },
  { value: 'INACTIVE', label: '모집 마감' },
]

function courseEnrollmentCount(course) {
  const n = Number(course.enrollment_count ?? course.enrollmentCount ?? 0)
  return Number.isNaN(n) ? 0 : n
}

const totalEnrollmentCount = computed(() =>
  myCourses.value.reduce((sum, course) => sum + courseEnrollmentCount(course), 0)
)

// course-service의 Course.status가 ACTIVE인 프로그램을 "진행 중"으로 집계
const activeCourseCount = computed(() =>
  myCourses.value.filter((course) => course.status === 'ACTIVE').length
)

const maxEnrollmentCount = computed(() =>
  myCourses.value.reduce((max, course) => Math.max(max, courseEnrollmentCount(course)), 0)
)

function courseCountByFilter(value) {
  if (value === 'ACTIVE') return activeCourseCount.value
  if (value === 'INACTIVE') return myCourses.value.length - activeCourseCount.value
  return myCourses.value.length
}

const filteredCourses = computed(() => {
  if (courseFilter.value === 'ACTIVE') {
    return myCourses.value.filter((c) => c.status === 'ACTIVE')
  }
  if (courseFilter.value === 'INACTIVE') {
    return myCourses.value.filter((c) => c.status !== 'ACTIVE')
  }
  return myCourses.value
})

function participationWidth(course) {
  if (maxEnrollmentCount.value <= 0) return 0
  return Math.round((courseEnrollmentCount(course) / maxEnrollmentCount.value) * 100)
}

function formatPrice(price) {
  const value = Number(price ?? 0)
  if (Number.isNaN(value)) return '-'
  return `${value.toLocaleString()}원`
}

/**
 * course 객체에서 강사 식별자 추출
 */
function getCourseInstructorId(course) {
  return (
    course.instructorId ??
    course.instructor_id ??
    course.instructor ??
    course.teacherId ??
    course.teacher_id ??
    null
  )
}

function buildRecommendMessage(basedOnCategory) {
  if (basedOnCategory) {
    return `'${courseStore.categoryMeta(basedOnCategory).label}' 참여 이력을 기반으로 추천한 공동물류 프로그램입니다.`
  }
  return '참여 소상공인에게 인기 있는 공동물류 프로그램입니다.'
}

async function loadStudentEnrollments() {
  try {
    const res = await enrollmentApi.getMyEnrollments()
    console.log('[MyPage] my enrollments response:', res.data)

    const data = res.data
    if (Array.isArray(data?.data)) {
      myEnrollments.value = data.data
    } else if (Array.isArray(data)) {
      myEnrollments.value = data
    } else {
      console.warn('[MyPage] unexpected enrollments response shape:', data)
      myEnrollments.value = []
    }
    enrollmentIsMock.value = data?.mock === true
  } catch (error) {
    console.error('[MyPage] failed to load enrollments:', error)
    myEnrollments.value = []
  } finally {
    enrollmentLoading.value = false
  }
}

async function loadStudentRecommendations() {
  try {
    if (!auth.user) {
      console.warn('[MyPage] auth.user is missing')
      recommendError.value = '추천 프로그램을 준비 중입니다.'
      return
    }

    if (!auth.user.id) {
      console.warn('[MyPage] auth.user.id is missing:', auth.user)
      recommendError.value = '추천 프로그램을 준비 중입니다.'
      return
    }

    const res = await enrollmentApi.getRecommendations(auth.user.id)
    console.log('[MyPage] recommendation response:', res.data)

    const payload = res.data

    if (Array.isArray(payload?.recommendedCourses)) {
      recommendations.value = payload.recommendedCourses
    } else if (Array.isArray(payload?.data)) {
      recommendations.value = payload.data
    } else if (Array.isArray(payload)) {
      recommendations.value = payload
    } else {
      console.warn('[MyPage] unexpected recommendation response shape:', payload)
      recommendations.value = []
    }

    // recommend-service가 내려주는 message에는 "강의" 문구가 섞여 있어(수정 불가 대상),
    // 프론트에서 공동물류 도메인 문구로 다시 만든다.
    recommendMessage.value = buildRecommendMessage(payload?.basedOnCategory)
  } catch (error) {
    console.error('[MyPage] failed to load recommendations:', error)
    recommendError.value = '현재 추천 프로그램을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    recommendLoading.value = false
  }
}

async function loadInstructorCourses() {
  try {
    if (!auth.user) {
      console.warn('[MyPage] instructor auth.user is missing')
      instructorError.value = '프로그램 정보를 불러오지 못했습니다.'
      return
    }

    if (!auth.user.id) {
      console.warn('[MyPage] instructor auth.user.id is missing:', auth.user)
      instructorError.value = '프로그램 정보를 불러오지 못했습니다.'
      return
    }

    const res = await courseApi.getCourses()
    console.log('[MyPage] course list response:', res.data)

    let courses = []

    if (Array.isArray(res.data?.data)) {
      courses = res.data.data
    } else if (Array.isArray(res.data)) {
      courses = res.data
    } else {
      console.warn('[MyPage] unexpected course response shape:', res.data)
    }

    const instructorId = Number(auth.user.id)

    myCourses.value = courses.filter(course => {
      const courseInstructorId = Number(getCourseInstructorId(course))
      return !Number.isNaN(courseInstructorId) && courseInstructorId === instructorId
    })

    console.log('[MyPage] filtered myCourses =', myCourses.value)
  } catch (error) {
    console.error('[MyPage] failed to load instructor courses:', error)
    instructorError.value = '현재 프로그램 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    instructorLoading.value = false
  }
}

onMounted(async () => {
  if (isInstructor.value) {
    recommendLoading.value = false
    enrollmentLoading.value = false
    await loadInstructorCourses()
  } else {
    instructorLoading.value = false
    await Promise.all([loadStudentEnrollments(), loadStudentRecommendations()])
    startPollingIfNeeded()
  }
})

onUnmounted(stopPolling)
</script>

<style scoped>
/* 레이아웃/제목/배지/섹션 제목/상태 배지/스켈레톤/알림/빈 상태는 global.css 공통 규칙 사용 */

.main-content.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-action {
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── 프로필 스트립 ── */
.profile-strip {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
}
.profile-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--gradient-primary);
  color: #fff;
  font-size: 19px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid var(--color-primary-light);
}
.profile-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.profile-name {
  font-size: 16px;
  font-weight: 700;
}
.profile-email {
  font-size: 13px;
  color: var(--color-text-secondary);
}
.profile-role {
  margin-left: auto;
  flex-shrink: 0;
}

/* ── KPI 타일 ── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.kpi-tile {
  display: grid;
  grid-template-columns: 40px 1fr;
  grid-template-rows: auto auto;
  column-gap: 12px;
  align-items: center;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px 18px;
}
.kpi-ic {
  grid-row: 1 / 3;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
}
.kpi-ic svg { width: 20px; height: 20px; }
.kpi-ic-blue  { background: var(--color-primary-light); color: var(--color-primary); }
.kpi-ic-green { background: var(--color-support-light); color: var(--color-support); }
.kpi-ic-amber { background: var(--color-warning-light); color: var(--color-warning); }
.kpi-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text-primary);
  align-self: end;
  letter-spacing: -0.3px;
}
.kpi-value-amount { font-size: 18px; }
.kpi-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  align-self: start;
}

/* ── 위젯 카드 ── */
.widget {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.widget-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.widget-meta {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted);
  white-space: nowrap;
}
.widget-empty {
  text-align: center;
  padding: 40px 16px 44px;
}
.widget-empty .empty-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
}
.widget-empty .empty-desc {
  margin-top: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.pending-alert {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
}
.alert-link {
  font-weight: 700;
  color: var(--color-warning);
  text-decoration: underline;
  white-space: nowrap;
}

/* ── 내 참여 현황 리스트 ── */
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.recent-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px;
  transition: var(--transition);
}
.recent-card:hover {
  border-color: var(--color-primary);
}
.recent-thumb {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.recent-thumb-icon {
  width: 26px;
  height: 26px;
}
.recent-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.recent-title {
  font-size: 15px;
  font-weight: 600;
}
.recent-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}
.recent-skeleton {
  padding: 16px;
}

/* 신청 → 정산 → 참여확정 라이프사이클 */
.lifecycle {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
  margin-top: 8px;
}
.lifecycle-step {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--color-text-muted);
}
.lifecycle-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-border);
  flex-shrink: 0;
}
.lifecycle-step.done {
  color: var(--color-support);
  font-weight: 600;
}
.lifecycle-step.done .lifecycle-dot {
  background: var(--color-support);
}

/* ── 추천 ── */
.recommend-message {
  font-size: 13px;
  color: var(--color-text-secondary);
}
.recommend-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.recommend-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.recommend-item > .course-card { flex: 1; }
.recommend-apply {
  width: 100%;
  justify-content: center;
}

/* ── 지자체 담당자: 필터 ── */
.filter-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 999px;
  border: 1.5px solid var(--color-border);
  background: var(--color-bg-primary);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  transition: var(--transition);
}
.filter-chip:hover {
  border-color: var(--color-border-hover);
}
.filter-chip-active {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-light);
}
.filter-count {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--color-bg-tertiary);
  color: var(--color-text-muted);
}
.filter-chip-active .filter-count {
  background: var(--color-bg-primary);
  color: var(--color-primary);
}

/* ── 지자체 담당자: 등록 프로그램 카드 ── */
.instructor-course-list {
  display: grid;
  gap: 16px;
}
.instructor-course-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
}
.course-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}
.course-title {
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 6px;
}
.course-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  white-space: pre-line;
}
.course-meta-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}
.meta-box {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px;
}
.meta-label {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 6px;
}
.meta-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}
.meta-value-type {
  display: flex;
  align-items: center;
  gap: 6px;
}
.type-icon {
  width: 18px;
  height: 18px;
  color: var(--color-primary);
}

/* 참여율 막대 */
.participation {
  margin-bottom: 16px;
}
.participation-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
}
.participation-label {
  font-size: 12px;
  color: var(--color-text-muted);
}
.participation-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
}
.participation-track {
  height: 8px;
  border-radius: 999px;
  background: var(--color-bg-tertiary);
  overflow: hidden;
}
.participation-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--gradient-primary);
  transition: width 0.3s ease;
  min-width: 2px;
}
.participation-hint {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: var(--color-text-muted);
}
.course-card-actions {
  display: flex;
  justify-content: flex-end;
}
.course-card-actions .btn {
  text-decoration: none;
}

.empty-text {
  color: var(--color-text-muted);
  font-size: 14px;
}

@media (max-width: 992px) {
  .kpi-grid {
    grid-template-columns: 1fr 1fr;
  }
  .recommend-grid,
  .course-meta-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .content-header {
    flex-direction: column;
  }
  .kpi-grid {
    grid-template-columns: 1fr;
  }
  .profile-strip {
    flex-wrap: wrap;
  }
  .profile-role {
    margin-left: 0;
  }
  .course-card-top {
    flex-direction: column;
  }
  .recent-card {
    flex-wrap: wrap;
  }
  .recent-status {
    flex-direction: row;
    align-items: center;
    width: 100%;
    justify-content: space-between;
  }
}
</style>
