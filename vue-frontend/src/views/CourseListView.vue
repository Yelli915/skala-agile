<template>
  <div class="page-wrapper">
    <AppHeader />
    <div class="page-layout">
      <AppSidebar />

      <!-- 메인 -->
      <main class="main-content">
        <div class="content-header">
          <div>
            <h1 class="page-title">공동물류 프로그램</h1>
            <p class="page-subtitle" v-if="isInstructor">
              지자체 담당자 계정으로 등록된 프로그램을 확인하고 새 프로그램을 추가할 수 있습니다.
            </p>
            <p class="page-subtitle" v-else>
              우리 지역에서 열린 공동물류 프로그램에 참여해 배송비 부담을 함께 줄여보세요.
            </p>
          </div>

          <router-link
            v-if="isInstructor"
            to="/courses/new"
            class="btn btn-primary create-course-btn"
          >
            + 프로그램 등록
          </router-link>
        </div>

        <!-- 필터 -->
        <div class="filter-bar">
          <button
            v-for="cat in categories"
            :key="cat"
            :class="['filter-chip', { active: selectedCategory === cat }]"
            @click="selectCategory(cat)"
          >
            {{ cat }}
          </button>
        </div>

        <!-- 로딩 -->
        <div v-if="loading" class="loading-grid">
          <div v-for="i in 6" :key="i" class="skeleton-card">
            <div class="skeleton-thumb"></div>
            <div class="skeleton-body">
              <div class="skeleton-line short"></div>
              <div class="skeleton-line"></div>
              <div class="skeleton-line medium"></div>
            </div>
          </div>
        </div>

        <!-- 프로그램 그리드 -->
        <div v-else-if="filteredCourses.length" class="course-grid fade-in">
          <CourseCard
            v-for="course in filteredCourses"
            :key="course.id"
            :course="course"
          />
        </div>

        <!-- 빈 상태 -->
        <div v-else class="empty-state">
          <p class="empty-icon" aria-hidden="true">📭</p>
          <p>해당 배송유형의 프로그램이 없습니다.</p>

          <router-link
            v-if="isInstructor"
            to="/courses/new"
            class="btn btn-primary empty-action-btn"
          >
            첫 프로그램 등록하기
          </router-link>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import CourseCard from '@/components/CourseCard.vue'
import { useCourseStore } from '@/store/course.js'
import { useAuthStore } from '@/store/auth.js'

const courseStore = useCourseStore()
const auth = useAuthStore()

const { categories } = courseStore

const loading = computed(() => courseStore.loading)
const selectedCategory = computed(() => courseStore.selectedCategory)
const isInstructor = computed(() => auth.user?.role === 'INSTRUCTOR')

const filteredCourses = computed(() => {
  if (!Array.isArray(courseStore.courses)) return []
  if (selectedCategory.value === '전체') return courseStore.courses
  return courseStore.courses.filter(c => c.category === selectedCategory.value)
})

function selectCategory(cat) {
  courseStore.setCategory(cat)
}

onMounted(() => {
  courseStore.fetchCourses()
})
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

.content-header {
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.page-subtitle {
  margin-top: 6px;
  font-size: 13px;
  color: var(--color-text-muted);
  max-width: 520px;
  line-height: 1.6;
}

.create-course-btn {
  white-space: nowrap;
  text-decoration: none;
}

/* 필터 */
.filter-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.filter-chip {
  padding: 7px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  border: 1.5px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  transition: var(--transition);
  cursor: pointer;
}

.filter-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.filter-chip.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

/* 프로그램 그리드 */
.course-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

/* 스켈레톤 */
.loading-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.skeleton-card {
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.skeleton-thumb {
  height: 120px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.skeleton-body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.skeleton-line.short {
  width: 40%;
}

.skeleton-line.medium {
  width: 70%;
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

/* 빈 상태 */
.empty-state {
  text-align: center;
  padding: 72px 0;
  color: var(--color-text-muted);
  font-size: 15px;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.empty-action-btn {
  display: inline-flex;
  margin-top: 16px;
  text-decoration: none;
}

@media (max-width: 992px) {
  .page-layout {
    grid-template-columns: 1fr;
  }

  .course-grid,
  .loading-grid {
    grid-template-columns: 1fr;
  }

  .content-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
