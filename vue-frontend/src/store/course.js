import { defineStore } from 'pinia'
import { ref } from 'vue'
import { courseApi } from '@/api/course.js'

/**
 * 백엔드 course-service의 Course.Category enum(불변) → 공동물류 플랫폼 표시용 "배송유형" 라벨.
 *
 * 백엔드는 여전히 강의 마켓플레이스로 동작한다(BACKEND/FRONTEND/... 값을 그대로 주고받음).
 * 여기서는 화면에 보이는 문구/색상/아이콘만 물류 도메인으로 덮어씌운다. (display-only relabel)
 * enum 값 8종(BACKEND, FRONTEND, DEVOPS, DATA_SCIENCE, MOBILE, SECURITY, DATABASE, OTHER)을
 * 모두 커버해야 새로 등록된 프로그램도 라벨/아이콘이 깨지지 않는다.
 *
 * 분류 축은 "배송유형" — 상품군이 아니라 공동배송을 묶는 방식으로 나눈다.
 * - emoji: 별도 이미지 자산 없이 컬러 배경 위에 얹는 카드 썸네일
 * - blurb: 목록/상세에서 배송유형을 한 줄로 설명
 */
const CATEGORY_META = {
  BACKEND:      { label: '당일 공동배송',      badge: 'badge-teal',   bg: 'thumb-teal',   emoji: '🚚', blurb: '오전 마감 물량을 모아 당일 중 공동 배송' },
  FRONTEND:     { label: '정기 묶음배송',      badge: 'badge-blue',   bg: 'thumb-blue',   emoji: '📦', blurb: '주 단위로 예약된 물량을 묶어 정기 배송' },
  DEVOPS:       { label: '냉장·신선 공동배송', badge: 'badge-cyan',   bg: 'thumb-cyan',   emoji: '❄️', blurb: '콜드체인 차량으로 신선식품을 함께 배송' },
  DATA_SCIENCE: { label: '새벽 배송',          badge: 'badge-purple', bg: 'thumb-purple', emoji: '🌙', blurb: '심야 집하 후 익일 새벽 시간대에 배송' },
  MOBILE:       { label: '권역 라스트마일',    badge: 'badge-amber',  bg: 'thumb-amber',  emoji: '📍', blurb: '권역 거점에서 소비자 문 앞까지 최종 배송' },
  SECURITY:     { label: '반품·회수 물류',     badge: 'badge-pink',   bg: 'thumb-pink',   emoji: '🔄', blurb: '반품·교환 물량을 권역별로 모아 회수' },
  DATABASE:     { label: '대형화물 공동배차',  badge: 'badge-slate',  bg: 'thumb-slate',  emoji: '🚛', blurb: '가전·가구 등 대형 화물을 공동 배차로 운송' },
  OTHER:        { label: '기타',               badge: 'badge-gray',   bg: 'thumb-gray',   emoji: '📋', blurb: '위 유형에 속하지 않는 공동물류 프로그램' },
}

const FALLBACK_META = { label: '기타', badge: 'badge-gray', bg: 'thumb-gray', emoji: '📋', blurb: '공동물류 프로그램' }

// 표시용 라벨 → enum 역매핑 (이미 정규화된 값이 다시 들어와도 해석 가능하도록)
const LABEL_TO_KEY = Object.fromEntries(
  Object.entries(CATEGORY_META).map(([key, meta]) => [meta.label, key])
)

/**
 * 원본 enum('BACKEND') 또는 정규화된 라벨('신선식품') 어느 쪽이 들어와도
 * 동일한 메타 정보를 돌려준다.
 * - store.fetchCourses를 거친 course 객체는 category가 라벨로 바뀌어 있고,
 * - enrollment / recommend 응답에 실려 오는 course는 원본 enum 그대로다.
 */
function resolveCategoryMeta(value) {
  if (!value) return FALLBACK_META
  if (CATEGORY_META[value]) return CATEGORY_META[value]
  const key = LABEL_TO_KEY[value]
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
      const res = await courseApi.getAll()
      console.log('[CourseStore] fetchCourses response =', res.data)

      const rawCourses = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : []

      courses.value = rawCourses.map(normalizeCourse)

      console.log('[CourseStore] normalized courses =', courses.value)
    } catch (e) {
      console.error('[CourseStore] fetchCourses failed:', e)
      error.value = e.message || '프로그램 목록을 불러오지 못했습니다.'
      courses.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchCourse(id) {
    loading.value = true
    error.value = null

    try {
      const res = await courseApi.getById(id)
      console.log('[CourseStore] fetchCourse response =', res.data)

      const rawCourse =
        res.data?.data && typeof res.data.data === 'object'
          ? res.data.data
          : res.data

      selectedCourse.value = normalizeCourse(rawCourse)

      console.log('[CourseStore] normalized selectedCourse =', selectedCourse.value)
    } catch (e) {
      console.error('[CourseStore] fetchCourse failed:', e)
      error.value = e.message || '프로그램 정보를 불러오지 못했습니다.'
      selectedCourse.value = null
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
