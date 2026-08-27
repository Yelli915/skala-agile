<template>
  <aside class="sidebar">
    <!-- '공동물류 프로그램'(전체 카탈로그)은 상단바(AppHeader)로 이동함 -->

    <!-- 소상공인: 내 활동 -->
    <div v-if="isAuthenticated && !isInstructor" class="sidebar-section">
      <div class="sidebar-label">내 활동</div>

      <router-link
        to="/mypage"
        class="sidebar-item"
        :class="{ active: onMypage && !route.hash }"
      >
        <span class="si-icon"><NavIcon name="store" /></span> 마이페이지
      </router-link>

      <router-link
        to="/mypage#my-enrollments"
        class="sidebar-item sidebar-subitem"
        :class="{ active: onMypageHash('#my-enrollments') }"
      >
        <span class="si-icon"><NavIcon name="truck" /></span> 내 참여 현황
      </router-link>

      <router-link
        to="/mypage#recommend"
        class="sidebar-item sidebar-subitem"
        :class="{ active: onMypageHash('#recommend') }"
      >
        <span class="si-icon"><NavIcon name="box" /></span> 추천 프로그램
      </router-link>
    </div>

    <!-- 지자체 담당자: 운영 -->
    <div v-else-if="isAuthenticated && isInstructor" class="sidebar-section">
      <div class="sidebar-label">운영</div>

      <router-link
        to="/courses/new"
        class="sidebar-item"
        :class="{ active: route.path === '/courses/new' }"
      >
        <span class="si-icon"><NavIcon name="plus-box" /></span> 프로그램 등록
      </router-link>

      <router-link
        to="/mypage"
        class="sidebar-item"
        :class="{ active: onMypage }"
      >
        <span class="si-icon"><NavIcon name="building" /></span> 내 프로그램 관리
      </router-link>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-label">계정</div>
      <button
        v-if="isAuthenticated"
        class="sidebar-item sidebar-btn"
        @click="handleLogout"
      >
        <span class="si-icon"><NavIcon name="logout" /></span> 로그아웃
      </button>
      <router-link
        v-else
        to="/login"
        class="sidebar-item"
        :class="{ active: route.path === '/login' }"
      >
        <span class="si-icon"><NavIcon name="store" /></span> 로그인 / 참여 신청
      </router-link>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'
import NavIcon from '@/components/NavIcon.vue'

const route = useRoute()
const auth = useAuthStore()

const isAuthenticated = computed(() => auth.isAuthenticated)
const isInstructor = computed(() => auth.user?.role === 'INSTRUCTOR')

const onMypage = computed(() => route.path === '/mypage')
// 마이페이지 대시보드의 섹션 앵커(#my-enrollments / #recommend) 활성 표시
function onMypageHash(hash) {
  return route.path === '/mypage' && route.hash === hash
}

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
  gap: 4px;
  margin-bottom: 8px;
}

.sidebar-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  padding: 8px 12px 6px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 11px 13px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  transition: var(--transition);
  background: none;
  border: 1px solid transparent;
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
  background: var(--gradient-primary);
  color: #fff;
  font-weight: 700;
  border-color: var(--color-primary-dark);
}

.sidebar-item.active:hover {
  color: #fff;
  filter: brightness(1.05);
}

/* 대시보드 섹션 바로가기 — 상위 '마이페이지' 아래 들여쓰기 */
.sidebar-subitem {
  margin-left: 12px;
  padding-left: 13px;
  font-size: 13px;
  font-weight: 600;
  border-left: 1.5px solid var(--color-border);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.sidebar-subitem:not(.active) {
  color: var(--color-text-muted);
}

.sidebar-subitem.active {
  border-left-color: var(--color-primary-dark);
}

.si-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  flex-shrink: 0;
}
</style>
