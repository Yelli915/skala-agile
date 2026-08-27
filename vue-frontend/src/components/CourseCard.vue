<template>
  <router-link :to="`/courses/${course.id}`" class="course-card">
    <!-- 썸네일: 배송유형 컬러 배경 + 이모지 -->
    <div class="card-thumb" :class="meta.bg">
      <span class="thumb-emoji" aria-hidden="true">{{ meta.emoji }}</span>
    </div>

    <!-- 내용 -->
    <div class="card-body">
      <span class="badge" :class="meta.badge">{{ categoryLabel }}</span>
      <h3 class="card-title">{{ course.title }}</h3>
      <p class="card-blurb">{{ meta.blurb }}</p>
      <div class="card-meta">
        <span class="operator">{{ operatorName }}</span>
        <span class="price">분담금 ₩{{ Number(course.price || 0).toLocaleString() }}</span>
      </div>
      <div class="card-footer">
        <span class="enrolled">현재 {{ Number(course.enrollmentCount || 0).toLocaleString() }}건 참여 신청</span>
      </div>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import { useCourseStore } from '@/store/course.js'

const props = defineProps({
  course: { type: Object, required: true },
})

const courseStore = useCourseStore()

// course.category는 목록(정규화된 라벨) / 추천·참여 응답(원본 enum) 어느 쪽이든 들어올 수 있다.
const meta = computed(() => courseStore.categoryMeta(props.course.category))
const categoryLabel = computed(() => meta.value.label)

// 백엔드 CourseResponse에는 운영 주체 이름 필드가 없다(instructorId만 존재).
const operatorName = computed(
  () => props.course.instructorName || props.course.operatorName || '지자체 직접 운영'
)
</script>

<style scoped>
.course-card {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: var(--transition);
  cursor: pointer;
}
.course-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-hover);
}
.card-thumb {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.thumb-teal   { background: #E1F5EE; }
.thumb-blue   { background: #E6F1FB; }
.thumb-amber  { background: #FAEEDA; }
.thumb-purple { background: #EEEDFE; }
.thumb-pink   { background: #FBEAF0; }
.thumb-cyan   { background: var(--color-cold-light); }
.thumb-slate  { background: #EAEEF3; }
.thumb-gray   { background: #F1EFE8; }
.thumb-emoji {
  font-size: 44px;
  line-height: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08));
}
.card-body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.4;
}
.card-blurb {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}
.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}
.operator {
  font-size: 12px;
  color: var(--color-text-secondary);
}
.price {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
}
.card-footer {
  margin-top: 2px;
}
.enrolled {
  font-size: 11px;
  color: var(--color-text-muted);
}
</style>
