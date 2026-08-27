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

      <!-- 우측 클러스터: 주 내비게이션 + 계정 액션을 한 그룹으로 묶는다 -->
      <div class="header-right">
        <nav class="header-nav" aria-label="주 메뉴">
          <router-link
            to="/courses"
            class="header-nav-link"
            :class="{ 'is-active': isCatalogActive }"
          >
            공동물류 프로그램
          </router-link>
        </nav>

        <span class="header-divider" aria-hidden="true"></span>

        <div class="header-actions">
          <template v-if="auth.isAuthenticated">
            <router-link to="/mypage" class="user-avatar" :title="auth.user?.name">
              {{ auth.user?.name?.charAt(0) || '?' }}
            </router-link>
            <button class="btn btn-ghost btn-sm" @click="handleLogout">로그아웃</button>
          </template>
          <template v-else>
            <!-- 히어로의 타깃별 CTA(소상공인/지자체)와 역할이 겹치지 않도록
                 헤더에는 중립적인 로그인 진입점만 둔다 -->
            <router-link to="/login" class="btn btn-outline btn-sm">로그인 / 참여 신청</router-link>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'

const auth = useAuthStore()
const route = useRoute()

// 카탈로그 목록(/courses)과 프로그램 상세(/courses/123)에서만 활성.
// 프로그램 등록(/courses/new)에서는 활성 표시하지 않는다.
const isCatalogActive = computed(
  () => route.path === '/courses' || /^\/courses\/\d+/.test(route.path)
)

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
.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-left: auto;
}
.header-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}
.header-divider {
  width: 1px;
  height: 20px;
  background: var(--color-border);
}
.header-nav-link {
  padding: 8px 12px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  transition: var(--transition);
}
.header-nav-link:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}
.header-nav-link.is-active {
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 560px) {
  .header-inner { gap: 12px; }
  .header-right { gap: 8px; }
  .header-nav-link { padding: 8px 8px; font-size: 13px; }
  .header-divider { display: none; }
  .logo-tagline { display: none; }
}
/* .btn-sm 은 global.css */
.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--gradient-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  border: 2px solid var(--color-primary-light);
  transition: var(--transition);
}
.user-avatar:hover {
  border-color: var(--color-primary);
  transform: translateY(-1px);
}
</style>
