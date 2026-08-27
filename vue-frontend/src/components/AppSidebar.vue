<template>
  <aside class="sidebar">
    <div class="sidebar-section">
      <div class="sidebar-label">{{ isInstructor ? '지자체 담당자' : '소상공인' }}</div>

      <router-link
        to="/courses"
        class="sidebar-item"
        :class="{ active: route.path === '/courses' }"
      >
        <span class="si-icon">📦</span> 공동물류 프로그램
      </router-link>

      <router-link
        v-if="isInstructor"
        to="/courses/new"
        class="sidebar-item"
        :class="{ active: route.path === '/courses/new' }"
      >
        <span class="si-icon">📝</span> 프로그램 등록
      </router-link>

      <router-link
        v-if="!isInstructor"
        to="/enrollments"
        class="sidebar-item"
        :class="{ active: route.path === '/enrollments' }"
      >
        <span class="si-icon">🚚</span> 내 참여 현황
      </router-link>

      <router-link
        to="/mypage"
        class="sidebar-item"
        :class="{ active: route.path === '/mypage' }"
      >
        <span class="si-icon">{{ isInstructor ? '🏢' : '🏪' }}</span>
        {{ isInstructor ? '내 프로그램 관리' : '마이페이지' }}
      </router-link>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-label">계정</div>
      <button class="sidebar-item sidebar-btn" @click="handleLogout">
        <span class="si-icon">🚪</span> 로그아웃
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'

const route = useRoute()
const auth = useAuthStore()

const isInstructor = computed(() => auth.user?.role === 'INSTRUCTOR')

function handleLogout() {
  // auth.logout()이 랜딩('/')으로 전체 새로고침 이동까지 처리한다.
  auth.logout()
}
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 8px;
}

.sidebar-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  padding: 8px 12px 4px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--color-text-secondary);
  transition: var(--transition);
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-family: var(--font-sans);
  text-decoration: none;
}

.sidebar-item:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.sidebar-item.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 600;
}

.si-icon {
  font-size: 15px;
  width: 18px;
  text-align: center;
}
</style>
