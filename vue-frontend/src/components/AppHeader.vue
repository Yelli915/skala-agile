<template>
  <header class="app-header">
    <div class="header-inner">
      <!-- 로고 -->
      <router-link to="/" class="logo">
        <img src="@/assets/images/logo/main_logo.png" alt="물류이음" class="logo-img" />
        <span class="logo-box">
          <span class="logo-text">물류이음</span>
          <span class="logo-tagline">지역 공동물류 플랫폼</span>
        </span>
      </router-link>

      <!-- 네비게이션 -->
      <nav class="nav-links" v-if="auth.isAuthenticated">
        <router-link to="/courses" class="nav-link" :class="{ active: $route.path.startsWith('/courses') }">공동물류 프로그램</router-link>
        <router-link
          v-if="!isInstructor"
          to="/enrollments"
          class="nav-link"
          :class="{ active: $route.path === '/enrollments' }"
        >내 참여 현황</router-link>
      </nav>

      <!-- 우측 액션 -->
      <div class="header-actions">
        <template v-if="auth.isAuthenticated">
          <router-link to="/mypage" class="user-avatar" :title="auth.user?.name">
            {{ auth.user?.name?.charAt(0) || '?' }}
          </router-link>
          <button class="btn btn-ghost btn-sm" @click="handleLogout">로그아웃</button>
        </template>
        <template v-else>
          <router-link to="/login" class="btn btn-ghost btn-sm">로그인</router-link>
          <router-link to="/login" class="btn btn-primary btn-sm">참여 신청</router-link>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/store/auth.js'

const auth = useAuthStore()

const isInstructor = computed(() => auth.user?.role === 'INSTRUCTOR')

function handleLogout() {
  // auth.logout()이 랜딩('/')으로 전체 새로고침 이동까지 처리한다.
  auth.logout()
}
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  gap: 32px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.logo-img {
  width: 36px;
  height: 36px;
  object-fit: contain;
  border-radius: 8px;
}
.logo-box {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}
.logo-text {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.3px;
}
.logo-tagline {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--color-text-muted);
  letter-spacing: 0.02em;
  margin-top: 1px;
}
.nav-links {
  display: flex;
  gap: 4px;
  flex: 1;
}
.nav-link {
  padding: 6px 14px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: var(--transition);
}
.nav-link:hover,
.nav-link.active {
  color: var(--color-primary);
  background: var(--color-primary-light);
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.btn-sm {
  padding: 7px 16px;
  font-size: 13px;
}
.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
}
.user-avatar:hover {
  background: var(--color-primary);
  color: #fff;
}
</style>
