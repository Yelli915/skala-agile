<template>
  <div class="admin-login">
    <div class="admin-card fade-in-up">
      <router-link to="/" class="back-link">← 물류이음 홈</router-link>

      <div class="brand">
        <img src="@/assets/images/logo/main_logo.png" alt="물류이음" class="brand-logo" />
        <div>
          <div class="brand-name">물류이음 관리자</div>
          <div class="brand-sub">지자체 담당자 · 운영 콘솔</div>
        </div>
      </div>

      <h1 class="title">관리자 로그인</h1>
      <p class="desc">
        지자체 담당자(관리자) 계정으로 로그인하면 공동물류 프로그램 개설·운영 화면으로 이동합니다.
      </p>

      <p v-if="denied" class="denied-msg">
        관리자(지자체 담당자) 계정이 아닙니다. 소상공인 계정은
        <router-link to="/login" class="inline-link">일반 로그인</router-link>을 이용해 주세요.
      </p>

      <button class="btn btn-primary btn-full" @click="handleAdminLogin">
        관리자 계정으로 로그인
      </button>

      <p class="switch">
        소상공인이신가요?
        <router-link to="/login" class="inline-link">참여 신청 / 일반 로그인</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'

const route = useRoute()
const auth = useAuthStore()

const denied = computed(() => route.query.denied === '1')

function handleAdminLogin() {
  // 'admin' 의도로 OAuth 시작 → 콜백에서 INSTRUCTOR role만 통과시킨다.
  auth.redirectToLogin('admin')
}
</script>

<style scoped>
.admin-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(160deg, #12324f 0%, #185FA5 55%, #1e7bc4 100%);
}

.admin-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.back-link {
  font-size: 13px;
  color: var(--color-text-secondary);
  transition: var(--transition);
}
.back-link:hover {
  color: var(--color-primary);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}
.brand-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: 10px;
}
.brand-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}
.brand-sub {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 1px;
}

.title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-top: 6px;
}

.desc {
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.denied-msg {
  padding: 10px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  font-size: 13px;
  line-height: 1.5;
  color: #dc2626;
}

.btn-full {
  width: 100%;
  padding: 12px;
  font-size: 15px;
  justify-content: center;
  margin-top: 4px;
}

.switch {
  text-align: center;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.inline-link {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: underline;
}
</style>
