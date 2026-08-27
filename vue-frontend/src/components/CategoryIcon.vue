<template>
  <svg
    class="category-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    role="img"
    :aria-label="label"
  >
    <!-- 당일 공동배송: 배송 트럭 -->
    <template v-if="name === 'truck'">
      <rect x="2" y="7" width="12" height="9" rx="1" />
      <path d="M14 10h3.5l3 3.2V16H14z" />
      <circle cx="6.5" cy="18" r="1.7" />
      <circle cx="17" cy="18" r="1.7" />
    </template>

    <!-- 정기 묶음배송: 반복(스케줄) 화살표 -->
    <template v-else-if="name === 'repeat'">
      <path d="M4 12a8 8 0 0 1 13.5-5.8L20 8" />
      <path d="M20 4v4h-4" />
      <path d="M20 12a8 8 0 0 1-13.5 5.8L4 16" />
      <path d="M4 20v-4h4" />
    </template>

    <!-- 냉장상품 공동배송: 눈송이 -->
    <template v-else-if="name === 'snowflake'">
      <path d="M12 3v18" />
      <path d="M3.8 7.5 20.2 16.5" />
      <path d="M20.2 7.5 3.8 16.5" />
      <path d="M12 3 9.8 5.2M12 3l2.2 2.2" />
      <path d="M12 21l-2.2-2.2M12 21l2.2-2.2" />
    </template>

    <!-- 전통시장 공동배송: 점포(차양) -->
    <template v-else-if="name === 'store'">
      <path d="M4 9.5V20h16V9.5" />
      <path d="M3 9.5 5 4.5h14l2 5" />
      <path d="M3 9.5h18" />
      <path d="M9.5 20v-5h5v5" />
    </template>

    <!-- 지역 상권 배송: 지도 핀 -->
    <template v-else-if="name === 'pin'">
      <path d="M12 21c4-5 7-8.2 7-11.5A7 7 0 0 0 5 9.5C5 12.8 8 16 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </template>

    <!-- 안심상품 배송: 방패 체크 -->
    <template v-else-if="name === 'shield'">
      <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6z" />
      <path d="m9 12 2 2 4-4" />
    </template>

    <!-- 공동보관·배송: 물류창고 -->
    <template v-else-if="name === 'warehouse'">
      <path d="M3 21V9l9-5 9 5v12" />
      <path d="M2 21h20" />
      <rect x="8" y="12.5" width="8" height="8.5" />
      <path d="M8 16.5h8" />
    </template>

    <!-- 전체(필터): 4분할 격자 -->
    <template v-else-if="name === 'grid'">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
    </template>

    <!-- 기타 공동물류: 포장 상자 -->
    <template v-else>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" />
      <path d="m4 7.5 8 4.5 8-4.5" />
      <path d="M12 12v9" />
    </template>
  </svg>
</template>

<script setup>
import { computed } from 'vue'
import { useCourseStore } from '@/store/course.js'

/**
 * 배송유형(카테고리)별 단색 라인 아이콘.
 * category 에는 원본 enum('BACKEND') 또는 표시 라벨('당일 공동배송') 아무거나 넣어도 된다
 * — store 의 categoryMeta 가 둘 다 해석한다.
 */
const props = defineProps({
  category: { type: String, default: '' },
})

const courseStore = useCourseStore()
const meta = computed(() => courseStore.categoryMeta(props.category))
const name = computed(() => {
  if (props.category === '전체') return 'grid'
  return meta.value.icon || 'package'
})
const label = computed(() =>
  props.category === '전체' ? '전체 아이콘' : `${meta.value.label} 아이콘`
)
</script>
