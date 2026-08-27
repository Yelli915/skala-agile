<template>
  <svg
    class="nav-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    role="img"
    :aria-label="ariaLabel"
    aria-hidden="true"
  >
    <!-- 공동물류 프로그램: 포장 상자 -->
    <template v-if="name === 'box'">
      <path d="m12 3 8 4.2v9.6L12 21l-8-4.2V7.2z" />
      <path d="m4 7.4 8 4.3 8-4.3" />
      <path d="M12 11.7V21" />
    </template>

    <!-- 프로그램 등록: 상자 + 플러스 -->
    <template v-else-if="name === 'plus-box'">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M12 9v6M9 12h6" />
    </template>

    <!-- 내 참여 현황: 배송 트럭 -->
    <template v-else-if="name === 'truck'">
      <rect x="2.5" y="6.5" width="12" height="9" rx="1.2" />
      <path d="M14.5 9.5h3.6l2.9 3.2v2.8h-6.5z" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17.5" cy="17.5" r="1.8" />
    </template>

    <!-- 내 프로그램 관리(지자체): 관공서 건물 -->
    <template v-else-if="name === 'building'">
      <path d="M4 21V8l8-4 8 4v13" />
      <path d="M3 21h18" />
      <path d="M9 21v-5h6v5" />
      <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" />
    </template>

    <!-- 마이페이지(소상공인): 상점 차양 -->
    <template v-else-if="name === 'store'">
      <path d="M4 10v10h16V10" />
      <path d="M3 10 5 4.5h14L21 10" />
      <path d="M3 10h18" />
      <path d="M9.5 20v-5h5v5" />
    </template>

    <!-- 로그아웃: 문 + 화살표 -->
    <template v-else-if="name === 'logout'">
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M10 17 5 12l5-5" />
      <path d="M5 12h11" />
    </template>

    <!-- 기본: 점 3개 -->
    <template v-else>
      <circle cx="12" cy="5" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="12" cy="19" r="1.4" />
    </template>
  </svg>
</template>

<script setup>
/**
 * 좌측 네비게이션용 단색 라인 아이콘. 기존 이모지(📦/🚚/📝…)를 대체한다.
 * 색은 currentColor를 따르므로 활성/비활성 상태 색이 부모에서 그대로 상속된다.
 */
const props = defineProps({
  name: { type: String, default: '' },
  ariaLabel: { type: String, default: '' },
})
</script>

<style scoped>
.nav-icon {
  width: 1.15rem;
  height: 1.15rem;
  flex-shrink: 0;
}
</style>
