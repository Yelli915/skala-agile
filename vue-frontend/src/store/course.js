import { defineStore } from 'pinia'
import { ref } from 'vue'
import { courseApi } from '@/api/course.js'
import { isMockEnabled } from '@/config/mock.js'

/**
 * 백엔드 course-service의 Course.Category enum(불변) → 공동물류 플랫폼 표시용 "배송유형" 라벨.
 *
 * 백엔드는 여전히 강의 마켓플레이스로 동작한다(BACKEND/FRONTEND/... 값을 그대로 주고받음).
 * 여기서는 화면에 보이는 문구/색상/아이콘만 물류 도메인으로 덮어씌운다. (display-only relabel)
 * enum 값 8종(BACKEND, FRONTEND, DEVOPS, DATA_SCIENCE, MOBILE, SECURITY, DATABASE, OTHER)을
 * 모두 커버해야 새로 등록된 프로그램도 라벨/아이콘이 깨지지 않는다.
 *
 * 분류 축은 "배송유형" — 상품군이 아니라 공동배송을 묶는 방식으로 나눈다.
 * - icon: 컬러 배경 위에 얹는 단색 라인 아이콘 이름 (components/CategoryIcon.vue)
 * - blurb: 목록/상세에서 배송유형을 한 줄로 설명
 */
const CATEGORY_META = {
  BACKEND:      { label: '당일 공동배송',     short: '당일배송',  badge: 'badge-teal',   bg: 'thumb-teal',   icon: 'truck',     blurb: '오전 마감 물량을 모아 당일 중 공동 배송' },
  FRONTEND:     { label: '정기 묶음배송',     short: '정기배송',  badge: 'badge-blue',   bg: 'thumb-blue',   icon: 'repeat',    blurb: '주 단위로 예약된 물량을 묶어 정기 배송' },
  DEVOPS:       { label: '냉장상품 공동배송', short: '냉장·신선', badge: 'badge-cyan',   bg: 'thumb-cyan',   icon: 'snowflake', blurb: '콜드체인 차량으로 냉장·신선 상품을 함께 배송' },
  DATA_SCIENCE: { label: '전통시장 공동배송', short: '전통시장',  badge: 'badge-purple', bg: 'thumb-purple', icon: 'store',     blurb: '전통시장 점포 물량을 모아 권역 공동 배송' },
  MOBILE:       { label: '지역 상권 배송',    short: '지역상권',  badge: 'badge-amber',  bg: 'thumb-amber',  icon: 'pin',       blurb: '지역 상권 거점에서 소비자 문 앞까지 최종 배송' },
  SECURITY:     { label: '안심상품 배송',     short: '안심배송',  badge: 'badge-pink',   bg: 'thumb-pink',   icon: 'shield',    blurb: '고가·파손주의 상품을 안심 포장해 공동 배송' },
  DATABASE:     { label: '공동보관·배송',     short: '보관·배송', badge: 'badge-slate',  bg: 'thumb-slate',  icon: 'warehouse', blurb: '권역 물류창고에 함께 보관하고 필요할 때 배송' },
  OTHER:        { label: '기타 공동물류',     short: '기타',      badge: 'badge-gray',   bg: 'thumb-gray',   icon: 'package',   blurb: '위 유형에 속하지 않는 공동물류 프로그램' },
}

const FALLBACK_META = { label: '기타', short: '기타', badge: 'badge-gray', bg: 'thumb-gray', icon: 'package', blurb: '공동물류 프로그램' }

/**
 * 표시 전용 정산 규칙 — 백엔드 Course 에는 지원금 필드가 없다.
 * course.price(분담금 기준액)에 지자체 지원금률을 적용해 "실부담금"을 화면에서만 계산한다.
 * CourseCreateView 예시 문구("건당 배송비의 30% 지원") / CourseDetailView 안내와 같은 기준.
 */
export const SUBSIDY_RATE = 0.3

export function netBurden(price) {
  const base = Number(price) || 0
  if (base <= 0) return 0
  // 100원 단위로 반올림
  return Math.round((base * (1 - SUBSIDY_RATE)) / 100) * 100
}

/**
 * 교육용 데모 예시 프로그램("우리 지역" 공동물류 프로그램 목록).
 * course-service 조회가 성공하고 실제 데이터가 있으면 그대로 대체되고,
 * 실패하거나 등록된 프로그램이 하나도 없을 때만 이 목록이 "예시"로 표시된다.
 *
 * 필드 모양은 course-service 의 CourseResponse 와 맞춘다
 * (id, title, description, category(enum), price, enrollmentCount, status, createdAt).
 * id 1~3 은 mockEnrollments.js 의 시드 참여신청 courseId 와 일치시켜, 목업끼리도 앞뒤가 맞게 한다.
 */
export const SAMPLE_PROGRAMS = [
  { id: 1, category: 'DATA_SCIENCE', title: '성동구 전통시장 공동배송',       price: 12000, enrollmentCount: 214, status: 'ACTIVE', createdAt: '2026-07-02T09:00:00Z', description: '성수·왕십리 일대 전통시장 점포 물량을 공동물류센터로 모아 권역 단위로 함께 배송합니다. 지자체가 건당 배송비의 일부를 지원합니다.' },
  { id: 2, category: 'FRONTEND',     title: '수원 전통시장 정기 묶음배송',     price: 9000,  enrollmentCount: 187, status: 'ACTIVE', createdAt: '2026-07-05T09:00:00Z', description: '주 2회(화·금) 고정 스케줄로 예약 물량을 묶어 정기 배송합니다. 소규모 점포도 정기 물류비를 예측할 수 있습니다.' },
  { id: 3, category: 'BACKEND',      title: '대구 중구 당일 공동배송',         price: 15000, enrollmentCount: 156, status: 'ACTIVE', createdAt: '2026-07-08T09:00:00Z', description: '오전 11시 이전 접수 물량을 모아 당일 오후에 공동 배송합니다. 도심 상권의 빠른 배송 수요에 대응합니다.' },
  { id: 4, category: 'DEVOPS',       title: '해운대 수산물 냉장 공동배송',     price: 18000, enrollmentCount: 132, status: 'ACTIVE', createdAt: '2026-07-11T09:00:00Z', description: '콜드체인 차량으로 수산·신선식품을 0~5℃ 유지 상태로 함께 배송합니다. 냉장 포장재는 지자체가 무상 제공합니다.' },
  { id: 5, category: 'MOBILE',       title: '미추홀 지역상권 라스트마일 배송', price: 8000,  enrollmentCount: 98,  status: 'ACTIVE', createdAt: '2026-07-14T09:00:00Z', description: '지역 상권 거점에서 소비자 문 앞까지 마지막 구간을 공동 배송합니다. 반경 3km 내 당일·익일 배송을 지원합니다.' },
  { id: 6, category: 'DATABASE',     title: '광주 서구 공동보관·배송',         price: 21000, enrollmentCount: 71,  status: 'ACTIVE', createdAt: '2026-07-17T09:00:00Z', description: '권역 물류창고에 재고를 함께 보관하고 주문이 들어오면 순차 출고·배송합니다. 매장 보관 공간 부담을 덜 수 있습니다.' },
  { id: 7, category: 'SECURITY',     title: '유성구 정밀장비 안심 공동배송',   price: 16000, enrollmentCount: 54,  status: 'ACTIVE', createdAt: '2026-07-20T09:00:00Z', description: '고가·파손주의 품목을 완충 포장 후 전담 기사가 함께 배송합니다. 배송 전 구간 위치 추적이 제공됩니다.' },
  { id: 8, category: 'DEVOPS',       title: '춘천 로컬푸드 냉장 묶음배송',     price: 13000, enrollmentCount: 42,  status: 'ACTIVE', createdAt: '2026-07-23T09:00:00Z', description: '지역 농가·로컬푸드 매장의 냉장 물량을 주 단위로 묶어 배송합니다. 산지-매장-소비자 구간을 한 번에 연결합니다.' },
  { id: 9, category: 'FRONTEND',     title: '창원 산단상가 정기 공동배송',     price: 10000, enrollmentCount: 33,  status: 'ACTIVE', createdAt: '2026-07-26T09:00:00Z', description: '산업단지 내 상가·식자재 매장 물량을 정기 스케줄로 함께 배송합니다. 입주 업체 공동 계약으로 단가를 낮췄습니다.' },
]

const SAMPLE_BY_ID = Object.fromEntries(SAMPLE_PROGRAMS.map((p) => [String(p.id), p]))

// 표시용 라벨 → enum 역매핑 (이미 정규화된 값이 다시 들어와도 해석 가능하도록)
const LABEL_TO_KEY = Object.fromEntries(
  Object.entries(CATEGORY_META).map(([key, meta]) => [meta.label, key])
)

/**
 * enrollment-service 의 EnrollmentService.normalizeCategory() 는 응답 course.category 를
 * 원본 enum 이 아니라 강의 마켓플레이스 한글 라벨로 바꿔서 내려준다
 * (BACKEND→"백엔드", FRONTEND→"프론트엔드", DEVOPS→"DevOps", 그 외 5종은 원본 enum 유지).
 * 따라서 `GET /api/enrollments/my` 응답을 그릴 때 이 한글 라벨도 enum 으로 되짚어야 한다.
 * (course-service 직접 조회 응답은 항상 원본 enum 이라 이 매핑이 필요 없다.)
 */
const LEGACY_LABEL_TO_KEY = {
  '백엔드': 'BACKEND',
  '프론트엔드': 'FRONTEND',
  'DevOps': 'DEVOPS',
  '데이터': 'OTHER',
  'AI': 'OTHER',
}

/**
 * 원본 enum('BACKEND') 또는 정규화된 라벨('정기 묶음배송') 어느 쪽이 들어와도
 * 동일한 메타 정보를 돌려준다.
 * - store.fetchCourses를 거친 course 객체는 category가 라벨로 바뀌어 있고,
 * - recommend 응답의 course는 원본 enum,
 * - enrollment(`/my`) 응답의 course는 enrollment-service가 덧씌운 강의 마켓 한글 라벨이다.
 */
function resolveCategoryMeta(value) {
  if (!value) return FALLBACK_META
  if (CATEGORY_META[value]) return CATEGORY_META[value]
  const key = LABEL_TO_KEY[value] || LEGACY_LABEL_TO_KEY[value]
  return key ? CATEGORY_META[key] : FALLBACK_META
}

// 프로그램 등록 폼용 옵션 (value는 백엔드 enum 문자열 그대로 전송해야 함)
const categoryOptions = Object.entries(CATEGORY_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}))

export const useCourseStore = defineStore('course', () => {
  const courses = ref([])
  const selectedCourse = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const selectedCategory = ref('전체')
  // 목업 예시 데이터로 채워졌는지 (화면에서 "데모 예시" 배너를 띄우는 용도)
  const usingMock = ref(false)

  const categories = ['전체', ...Object.values(CATEGORY_META).map((m) => m.label)]

  function normalizeCategory(category) {
    return resolveCategoryMeta(category).label
  }

  function normalizeCourse(course) {
    if (!course || typeof course !== 'object') return course

    return {
      ...course,
      category: normalizeCategory(course.category),
    }
  }

  // 컴포넌트에서 배지 색상 / 썸네일 배경 / 이모지 / 설명 문구를 한 번에 얻는다.
  function categoryMeta(value) {
    return resolveCategoryMeta(value)
  }

  async function fetchCourses() {
    loading.value = true
    error.value = null

    try {
      // 로그인 상태면 게이트웨이 경유, 401(비로그인)이면 course-service 직접 조회로 폴백.
      let res
      try {
        res = await courseApi.getAll()
      } catch (e) {
        if (e.response?.status === 401) {
          res = await courseApi.getPublicCourses()
        } else {
          throw e
        }
      }
      console.log('[CourseStore] fetchCourses response =', res.data)

      const rawCourses = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : []

      courses.value = rawCourses.map(normalizeCourse)
      usingMock.value = false

      console.log('[CourseStore] normalized courses =', courses.value)

      // 등록된 프로그램이 하나도 없으면 데모 예시로 채운다.
      if (courses.value.length === 0 && isMockEnabled()) {
        courses.value = SAMPLE_PROGRAMS.map(normalizeCourse)
        usingMock.value = true
        console.info('[CourseStore] 등록된 프로그램 없음 → 데모 예시 목록 표시')
      }
    } catch (e) {
      console.error('[CourseStore] fetchCourses failed:', e)
      if (isMockEnabled()) {
        courses.value = SAMPLE_PROGRAMS.map(normalizeCourse)
        usingMock.value = true
        error.value = null
        console.warn('[CourseStore] 프로그램 목록 조회 실패 → 데모 예시 목록 표시')
      } else {
        error.value = e.message || '프로그램 목록을 불러오지 못했습니다.'
        courses.value = []
      }
    } finally {
      loading.value = false
    }
  }

  async function fetchCourse(id) {
    loading.value = true
    error.value = null

    try {
      let res
      try {
        res = await courseApi.getById(id)
      } catch (e) {
        if (e.response?.status === 401) {
          res = await courseApi.getPublicById(id)
        } else {
          throw e
        }
      }
      console.log('[CourseStore] fetchCourse response =', res.data)

      const rawCourse =
        res.data?.data && typeof res.data.data === 'object'
          ? res.data.data
          : res.data

      const normalized = rawCourse && typeof rawCourse === 'object' ? normalizeCourse(rawCourse) : null

      if (normalized?.id != null) {
        selectedCourse.value = normalized
        usingMock.value = false
      } else if (isMockEnabled() && SAMPLE_BY_ID[String(id)]) {
        selectedCourse.value = normalizeCourse(SAMPLE_BY_ID[String(id)])
        usingMock.value = true
        console.info('[CourseStore] 프로그램 상세 없음 → 데모 예시 표시', id)
      } else {
        selectedCourse.value = normalized
        usingMock.value = false
      }

      console.log('[CourseStore] normalized selectedCourse =', selectedCourse.value)
    } catch (e) {
      console.error('[CourseStore] fetchCourse failed:', e)
      if (isMockEnabled() && SAMPLE_BY_ID[String(id)]) {
        selectedCourse.value = normalizeCourse(SAMPLE_BY_ID[String(id)])
        usingMock.value = true
        error.value = null
        console.warn('[CourseStore] 프로그램 상세 조회 실패 → 데모 예시 표시', id)
      } else {
        error.value = e.message || '프로그램 정보를 불러오지 못했습니다.'
        selectedCourse.value = null
      }
    } finally {
      loading.value = false
    }
  }

  function setCategory(cat) {
    selectedCategory.value = cat
  }

  return {
    courses,
    selectedCourse,
    loading,
    error,
    usingMock,
    categories,
    categoryOptions,
    selectedCategory,
    normalizeCategory,
    normalizeCourse,
    categoryMeta,
    fetchCourses,
    fetchCourse,
    setCategory,
  }
})
