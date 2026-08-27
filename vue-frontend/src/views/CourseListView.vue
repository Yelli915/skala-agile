<template>
  <div class="catalog">
    <AppHeader />

    <!-- 히어로 배너 — 랜딩과 동일한 톤 -->
    <section class="catalog-hero">
      <div class="hero-inner">
        <div class="hero-copy fade-in-up">
          <span class="hero-eyebrow">모집 중인 프로그램</span>
          <h1 class="hero-title">공동물류 프로그램</h1>
          <p class="hero-desc" v-if="isInstructor">
            지자체 담당자 계정으로 등록된 프로그램을 확인하고 새 프로그램을 추가할 수 있습니다.
          </p>
          <p class="hero-desc" v-else>
            우리 지역에서 열린 공동물류 프로그램에 참여해 배송비 부담을 함께 줄여보세요.
            분담금은 지자체 지원금 {{ subsidyPercent }}% 반영 후 실부담 기준입니다.
          </p>

          <div class="hero-actions" v-if="isInstructor">
            <router-link to="/courses/new" class="btn btn-primary btn-lg">+ 프로그램 등록</router-link>
          </div>
        </div>

        <dl class="hero-stats" v-if="!loading">
          <div class="hero-stat">
            <dt>모집 중 프로그램</dt>
            <dd>{{ programCount.toLocaleString() }}</dd>
          </div>
          <div class="hero-stat">
            <dt>참여 지역</dt>
            <dd>{{ regionCount.toLocaleString() }}</dd>
          </div>
          <div class="hero-stat">
            <dt>누적 참여 신청</dt>
            <dd>{{ totalApplications.toLocaleString() }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <!-- 카탈로그 본문 -->
    <section class="catalog-body">
      <div class="section-inner">
        <p v-if="courseStore.usingMock" class="alert alert-info mock-hint">
          데모용 예시 프로그램입니다. course-service에 프로그램이 등록되면 실제 목록으로 바뀝니다.
        </p>

        <div class="catalog-controls">
          <div class="surface-card filter-panel">
            <!-- 검색 · 정렬 -->
            <div class="catalog-toolbar">
              <div class="search-field" ref="searchField">
                <div class="search-box">
                  <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    v-model="searchInput"
                    type="search"
                    placeholder="프로그램 이름으로 검색"
                    aria-label="프로그램 검색"
                    role="combobox"
                    :aria-expanded="showSuggestions"
                    aria-autocomplete="list"
                    @focus="suggestionsOpen = true"
                    @keydown.enter.prevent="applySearch"
                    @keydown.esc="suggestionsOpen = false"
                  />
                  <button
                    v-if="searchInput"
                    type="button"
                    class="search-clear"
                    aria-label="검색어 지우기"
                    @click="clearSearch"
                  >
                    ✕
                  </button>
                  <button
                    type="button"
                    class="search-submit"
                    aria-label="검색"
                    @click="applySearch"
                  >
                    검색
                  </button>
                </div>

                <ul v-if="showSuggestions" class="search-suggestions" role="listbox">
                  <li
                    v-for="item in suggestions"
                    :key="item.id"
                    role="option"
                    class="suggestion-item"
                    @mousedown.prevent="pickSuggestion(item)"
                  >
                    <CategoryIcon :category="item.category" class="suggestion-icon" />
                    <span class="suggestion-title" v-html="highlight(item.title)"></span>
                    <span class="suggestion-cat">{{ courseStore.categoryMeta(item.category).label }}</span>
                  </li>
                  <li v-if="!suggestions.length" class="suggestion-empty">
                    ‘{{ searchInput.trim() }}’ 관련 프로그램이 없습니다
                  </li>
                </ul>
              </div>

              <label class="sort-box">
                <select v-model="sortBy" aria-label="정렬 기준">
                  <option value="recent">최신 등록순</option>
                  <option value="popular">참여 신청 많은순</option>
                  <option value="priceAsc">분담금 낮은순</option>
                </select>
              </label>
            </div>

            <div class="filter-divider"></div>

            <!-- 배송유형 분류 -->
            <div class="category-filter">
              <div class="filter-head">
                <span class="control-label">배송유형으로 찾기</span>
                <button
                  v-if="activeAxis !== '전체'"
                  type="button"
                  class="filter-reset"
                  @click="clearCategory"
                >
                  초기화
                </button>
              </div>

              <div class="axis-tabs" role="tablist" aria-label="배송유형 대분류">
                <button
                  v-for="axis in axes"
                  :key="axis.key"
                  type="button"
                  role="tab"
                  :aria-selected="activeAxis === axis.key"
                  :class="['axis-tab', { active: activeAxis === axis.key }]"
                  @click="selectAxis(axis.key)"
                >
                  {{ axis.key }}
                  <span v-if="axis.key !== '전체'" class="axis-count">{{ axisCounts[axis.key] ?? 0 }}</span>
                </button>
              </div>

              <div v-if="subChips.length" ref="subBar" class="subfilter-scroller">
                <div class="subfilter-bar">
                  <button
                    v-for="leaf in subChips"
                    :key="leaf"
                    type="button"
                    :class="['sub-chip', { active: activeLeaf === leaf }]"
                    :aria-pressed="activeLeaf === leaf"
                    :disabled="(categoryCounts[leaf] ?? 0) === 0 && activeLeaf !== leaf"
                    @click="toggleLeaf(leaf)"
                  >
                    <CategoryIcon :category="leaf" class="chip-icon" />
                    <span class="chip-label">{{ courseStore.categoryMeta(leaf).short }}</span>
                    <span class="sub-count">{{ categoryCounts[leaf] ?? 0 }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p v-if="!loading" class="results-count">
          <strong>{{ filteredCourses.length }}</strong>개 프로그램
          <span v-if="activeAxis !== '전체'"> · {{ activeLeaf || activeAxis }}</span>
          <span v-if="search.trim()"> · ‘{{ search.trim() }}’ 검색</span>
        </p>

        <div v-if="loading" class="course-grid">
          <div v-for="i in 6" :key="i" class="skeleton-card">
            <div class="skeleton-thumb"></div>
            <div class="skeleton-body">
              <div class="skeleton-line short"></div>
              <div class="skeleton-line"></div>
              <div class="skeleton-line medium"></div>
            </div>
          </div>
        </div>

        <div v-else-if="filteredCourses.length" class="course-grid fade-in">
          <router-link
            v-for="course in filteredCourses"
            :key="course.id"
            :to="`/courses/${course.id}`"
            class="program-card"
          >
            <div class="card-thumb" :class="courseStore.categoryMeta(course.category).bg">
              <span class="recruit-pill"><i class="recruit-dot"></i>모집 중</span>
              <CategoryIcon :category="course.category" class="thumb-icon" />
            </div>
            <div class="card-body">
              <span class="badge" :class="courseStore.categoryMeta(course.category).badge">
                {{ courseStore.categoryMeta(course.category).label }}
              </span>
              <h3 class="card-title">{{ course.title }}</h3>

              <div class="card-price">
                <span class="price-net">₩{{ netBurden(course.price).toLocaleString() }}</span>
                <span class="price-base">정가 ₩{{ Number(course.price || 0).toLocaleString() }}</span>
                <span class="price-tag">지원금 {{ subsidyPercent }}%</span>
              </div>

              <div class="card-meta">
                <span class="operator">{{ operatorOf(course) }}</span>
                <span class="enroll-count">{{ Number(course.enrollmentCount || 0).toLocaleString() }}곳 신청</span>
              </div>

              <span class="card-cta">자세히 보기 →</span>
            </div>
          </router-link>
        </div>

        <div v-else-if="isFilteredEmpty" class="empty-state fade-in">
          <p class="empty-title">조건에 맞는 공동물류 프로그램이 없습니다.</p>
          <p class="empty-desc">검색어와 필터를 초기화하고 전체 프로그램을 다시 살펴보세요.</p>
          <div class="empty-actions">
            <button type="button" class="btn btn-primary" @click="resetFilters">필터 초기화</button>
          </div>
        </div>

        <div v-else class="empty-state fade-in">
          <p class="empty-title">아직 등록된 공동물류 프로그램이 없습니다.</p>
          <p class="empty-desc" v-if="isInstructor">
            새 공동물류 프로그램을 등록해 관내 소상공인의 참여를 받아보세요.
          </p>
          <p class="empty-desc" v-else>우리 가게에 맞는 추천 프로그램을 확인해 보세요.</p>
          <div class="empty-actions">
            <router-link v-if="isInstructor" to="/courses/new" class="btn btn-primary">
              첫 프로그램 등록하기
            </router-link>
            <router-link v-else to="/mypage" class="btn btn-primary">추천 프로그램 보기</router-link>
          </div>
        </div>
      </div>
    </section>

    <AppFooter />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import CategoryIcon from '@/components/CategoryIcon.vue'
import { useCourseStore, SUBSIDY_RATE, netBurden } from '@/store/course.js'
import { useAuthStore } from '@/store/auth.js'

const courseStore = useCourseStore()
const auth = useAuthStore()

const loading = computed(() => courseStore.loading)
const isInstructor = computed(() => auth.user?.role === 'INSTRUCTOR')
const subsidyPercent = Math.round(SUBSIDY_RATE * 100)

const searchInput = ref('') // 입력창의 현재 값 (타이핑 중)
const search = ref('') // 실제로 적용된 검색어 (버튼/엔터로만 갱신)
const suggestionsOpen = ref(false)
const searchField = ref(null)
const sortBy = ref('recent')
const subBar = ref(null)

/* 2글자 이상 입력 시 제목이 일치하는 프로그램을 드롭다운으로 */
const suggestions = computed(() => {
  const q = searchInput.value.trim().toLowerCase()
  if (q.length < 2) return []
  const base = Array.isArray(courseStore.courses) ? courseStore.courses : []
  return base.filter((c) => (c.title || '').toLowerCase().includes(q)).slice(0, 8)
})

const showSuggestions = computed(
  () => suggestionsOpen.value && searchInput.value.trim().length >= 2
)

function highlight(title) {
  const q = searchInput.value.trim()
  if (!q) return title
  const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return String(title).replace(new RegExp(`(${esc})`, 'ig'), '<mark>$1</mark>')
}

function applySearch() {
  search.value = searchInput.value.trim()
  suggestionsOpen.value = false
}

function clearSearch() {
  searchInput.value = ''
  search.value = ''
  suggestionsOpen.value = false
}

function pickSuggestion(item) {
  searchInput.value = item.title
  applySearch()
}

function onDocClick(e) {
  if (searchField.value && !searchField.value.contains(e.target)) {
    suggestionsOpen.value = false
  }
}

/**
 * 백엔드는 course.category 를 단일 enum(8종)으로만 주지만, 화면에서는
 * "어떤 속성으로 공동배송을 묶는가"라는 상위 축으로 2단 필터를 구성한다. (display-only)
 */
const AXES = [
  { key: '전체', items: [] },
  { key: '배송 방식', items: ['당일 공동배송', '정기 묶음배송'] },
  { key: '보관 형태', items: ['냉장상품 공동배송', '안심상품 배송', '공동보관·배송'] },
  { key: '거점·지역', items: ['전통시장 공동배송', '지역 상권 배송'] },
  { key: '기타', items: ['기타 공동물류'] },
]

const axes = computed(() => {
  const known = new Set(AXES.flatMap((a) => a.items))
  const extras = courseStore.categories.filter((c) => c !== '전체' && !known.has(c))
  if (!extras.length) return AXES
  return AXES.map((a) =>
    a.key === '기타' ? { ...a, items: [...a.items, ...extras] } : a
  )
})

const activeLeaf = computed(() => {
  const sel = courseStore.selectedCategory
  return axes.value.some((a) => a.items.includes(sel)) ? sel : null
})

const activeAxis = computed(() => {
  const sel = courseStore.selectedCategory
  if (axes.value.some((a) => a.key === sel)) return sel
  const owner = axes.value.find((a) => a.items.includes(sel))
  return owner ? owner.key : '전체'
})

const subChips = computed(
  () => axes.value.find((a) => a.key === activeAxis.value)?.items ?? []
)

const searchedCourses = computed(() => {
  const base = Array.isArray(courseStore.courses) ? courseStore.courses : []
  const q = search.value.trim().toLowerCase()
  if (!q) return base
  return base.filter((c) => (c.title || '').toLowerCase().includes(q))
})

const axisCounts = computed(() => {
  const counts = { 전체: searchedCourses.value.length }
  for (const axis of axes.value) {
    if (axis.key === '전체') continue
    const set = new Set(axis.items)
    counts[axis.key] = searchedCourses.value.filter((c) => set.has(c.category)).length
  }
  return counts
})

const categoryCounts = computed(() => {
  const map = {}
  for (const label of courseStore.categories) {
    if (label !== '전체') map[label] = 0
  }
  for (const c of searchedCourses.value) {
    if (c.category in map) map[c.category] += 1
  }
  return map
})

function compareCourses(a, b) {
  if (sortBy.value === 'popular') {
    return (Number(b.enrollmentCount) || 0) - (Number(a.enrollmentCount) || 0)
  }
  if (sortBy.value === 'priceAsc') {
    return (Number(a.price) || 0) - (Number(b.price) || 0)
  }
  const ta = a.createdAt ? Date.parse(a.createdAt) : 0
  const tb = b.createdAt ? Date.parse(b.createdAt) : 0
  if (tb !== ta) return tb - ta
  return (Number(b.id) || 0) - (Number(a.id) || 0)
}

const filteredCourses = computed(() => {
  let list = searchedCourses.value
  if (activeAxis.value !== '전체') {
    if (activeLeaf.value) {
      list = list.filter((c) => c.category === activeLeaf.value)
    } else {
      const set = new Set(subChips.value)
      list = list.filter((c) => set.has(c.category))
    }
  }
  return [...list].sort(compareCourses)
})

const isFilteredEmpty = computed(() => {
  const total = Array.isArray(courseStore.courses) ? courseStore.courses.length : 0
  return total > 0 && filteredCourses.value.length === 0
})

/* 히어로 요약 지표 — 전체 목록 기준 */
const programCount = computed(() =>
  Array.isArray(courseStore.courses) ? courseStore.courses.length : 0
)
const regionCount = computed(() => {
  const set = new Set()
  for (const c of courseStore.courses ?? []) {
    const name = c.region || c.instructorName || c.operatorName
    if (name) set.add(name)
  }
  return set.size
})
const totalApplications = computed(() =>
  (courseStore.courses ?? []).reduce((sum, c) => sum + (Number(c.enrollmentCount) || 0), 0)
)

function operatorOf(course) {
  return course.region || course.instructorName || course.operatorName || '지자체 직접 운영'
}

function selectAxis(key) {
  courseStore.setCategory(key)
}
function toggleLeaf(leaf) {
  // 이미 선택된 리프를 다시 누르면 축 전체로 되돌린다 (하위 "전체" 칩 대체)
  courseStore.setCategory(activeLeaf.value === leaf ? activeAxis.value : leaf)
}
function clearCategory() {
  courseStore.setCategory('전체')
}
function resetFilters() {
  searchInput.value = ''
  search.value = ''
  sortBy.value = 'recent'
  courseStore.setCategory('전체')
}

function scrollActiveIntoView() {
  nextTick(() => {
    const scroller = subBar.value
    // 칩이 한 줄로 감싸지는 넓은 화면에서는 스크롤이 없으므로 페이지가 튀지 않게 건너뛴다
    if (!scroller || scroller.scrollWidth <= scroller.clientWidth) return
    scroller
      .querySelector('.sub-chip.active')
      ?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  })
}
watch([activeAxis, activeLeaf], scrollActiveIntoView)

onMounted(() => {
  courseStore.fetchCourses()
  document.addEventListener('click', onDocClick)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
})
</script>

<style scoped>
.catalog {
  background: var(--color-bg-secondary);
}
.section-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* 히어로 배너 — LandingView .hero 와 동일한 배경/여백 */
.catalog-hero {
  background: var(--color-primary-light);
  border-bottom: 1px solid var(--color-border);
  padding: 56px 0;
}
.hero-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 40px;
  align-items: center;
}
.hero-eyebrow {
  display: block;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--color-primary);
  margin-bottom: 8px;
}
.hero-title {
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: var(--color-text-primary);
  margin-bottom: 12px;
}
.hero-desc {
  font-size: 15px;
  color: var(--color-text-secondary);
  line-height: 1.75;
  max-width: 520px;
}
.hero-actions {
  margin-top: 22px;
}
.hero-actions .btn {
  text-decoration: none;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 0;
}
.hero-stat {
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px 14px;
  text-align: center;
}
.hero-stat dt {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}
.hero-stat dd {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: -0.3px;
}

/* 카탈로그 본문 */
.catalog-body {
  padding: 40px 0 72px;
}

.mock-hint {
  margin-bottom: 16px;
}

/* 검색 · 정렬 · 분류를 하나의 필터 패널로 통합 */
.catalog-controls {
  margin-bottom: 20px;
}
.filter-panel {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.filter-divider {
  height: 1px;
  background: var(--color-border);
  margin: 0 -16px;
}
.category-filter {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.filter-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.control-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-secondary);
}
.filter-reset {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  padding: 2px 4px;
  cursor: pointer;
  transition: var(--transition);
}
.filter-reset:hover {
  color: var(--color-primary);
}

.catalog-toolbar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.search-field {
  position: relative;
  flex: 1;
  min-width: 240px;
}
.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 6px 0 12px;
  background: var(--color-bg-secondary);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: var(--transition);
}
.search-box:focus-within {
  border-color: var(--color-primary);
}
.search-icon {
  width: 16px;
  height: 16px;
  color: var(--color-text-muted);
  flex-shrink: 0;
}
.search-box input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  padding: 10px 0;
  font-size: 13px;
  color: var(--color-text-primary);
}
.search-box input::-webkit-search-cancel-button {
  display: none;
}
.search-clear {
  flex-shrink: 0;
  padding: 4px;
  font-size: 12px;
  line-height: 1;
  color: var(--color-text-muted);
  cursor: pointer;
}
.search-clear:hover {
  color: var(--color-text-primary);
}
.search-submit {
  flex-shrink: 0;
  padding: 8px 16px;
  margin: 4px 0;
  border-radius: var(--radius-sm);
  background: var(--gradient-primary, var(--color-primary));
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition);
}
.search-submit:hover {
  opacity: 0.92;
}

/* 검색어 자동완성 드롭다운 */
.search-suggestions {
  position: absolute;
  z-index: 20;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 6px;
  list-style: none;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg, 0 12px 32px rgba(0, 0, 0, 0.12));
  max-height: 340px;
  overflow-y: auto;
}
.suggestion-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--color-text-primary);
  cursor: pointer;
}
.suggestion-item:hover {
  background: var(--color-bg-tertiary);
}
.suggestion-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
.suggestion-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.suggestion-title :deep(mark) {
  background: var(--color-support-light, #fde68a);
  color: inherit;
  border-radius: 2px;
}
.suggestion-cat {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
}
.suggestion-empty {
  padding: 12px 10px;
  font-size: 12.5px;
  color: var(--color-text-muted);
}
.sort-box {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sort-box select {
  padding: 10px 12px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: var(--transition);
}
.sort-box select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.axis-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  overflow-x: auto;
  scrollbar-width: none;
}
.axis-tabs::-webkit-scrollbar {
  display: none;
}
.axis-tab {
  flex: 1 1 0;
  min-width: max-content;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  white-space: nowrap;
  transition: var(--transition);
  cursor: pointer;
}
.axis-tab:hover {
  color: var(--color-text-primary);
}
.axis-tab.active {
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
}
.axis-count {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-muted);
}
.axis-tab.active .axis-count {
  color: rgba(255, 255, 255, 0.85);
}

/* 넓은 화면에서는 칩이 여러 줄로 감싸지고, 좁은 화면에서만 가로 스크롤로 전환된다 */
.subfilter-scroller {
  overflow: visible;
}
.subfilter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.sub-chip {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px 7px 10px;
  border-radius: var(--radius-xl);
  font-size: 12.5px;
  font-weight: 600;
  border: 1.5px solid var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  white-space: nowrap;
  scroll-snap-align: center;
  transition: var(--transition);
  cursor: pointer;
}
.chip-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}
.sub-count {
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--color-bg-tertiary);
  color: var(--color-text-muted);
}
.sub-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.sub-chip.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.sub-chip.active .sub-count {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
}
.sub-chip:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.sub-chip:disabled:hover {
  border-color: var(--color-border);
  color: var(--color-text-secondary);
}

.results-count {
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.results-count strong {
  color: var(--color-text-primary);
}

/* 프로그램 그리드 — LandingView .course-card-landing 와 동일한 카드 */
.course-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}
.program-card {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: var(--transition);
}
.program-card:hover {
  transform: translateY(-3px);
  border-color: var(--color-primary);
}
.program-card:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
.program-card:hover .card-cta {
  color: var(--color-primary);
}
.card-thumb {
  position: relative;
  height: 116px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.thumb-icon {
  width: 42px;
  height: 42px;
}
.recruit-pill {
  position: absolute;
  top: 10px;
  left: 10px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  font-size: 10.5px;
  font-weight: 700;
  color: var(--color-support);
}
.recruit-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-support);
}
.card-body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}
.card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.4;
}
.card-price {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
}
.price-net {
  font-size: 16px;
  font-weight: 800;
  color: var(--color-support);
}
.price-base {
  font-size: 12px;
  color: var(--color-text-muted);
  text-decoration: line-through;
}
.price-tag {
  font-size: 10.5px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--color-support-light);
  color: var(--color-support);
}
.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.operator {
  font-size: 12px;
  color: var(--color-text-secondary);
}
.enroll-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  white-space: nowrap;
}
.card-cta {
  margin-top: auto;
  padding-top: 4px;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-muted);
  transition: var(--transition);
}

@media (max-width: 900px) {
  .hero-inner {
    grid-template-columns: 1fr;
    gap: 28px;
  }
  .hero-title {
    font-size: 28px;
  }
  .course-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 560px) {
  .course-grid {
    grid-template-columns: 1fr;
  }
  .hero-stats {
    grid-template-columns: 1fr;
  }
  .sort-box {
    flex: 1;
    min-width: 200px;
  }
  .sort-box select {
    flex: 1;
  }
  /* 좁은 화면에서는 배송유형 칩을 한 줄 가로 스크롤로 */
  .subfilter-scroller {
    overflow-x: auto;
    overflow-y: hidden;
    margin: -2px -16px -4px;
    padding: 2px 16px 4px;
    scrollbar-width: none;
    scroll-snap-type: x proximity;
    -webkit-mask-image: linear-gradient(to right, transparent, #000 16px, #000 calc(100% - 16px), transparent);
    mask-image: linear-gradient(to right, transparent, #000 16px, #000 calc(100% - 16px), transparent);
  }
  .subfilter-scroller::-webkit-scrollbar {
    display: none;
  }
  .subfilter-bar {
    flex-wrap: nowrap;
    width: max-content;
  }
}
</style>
