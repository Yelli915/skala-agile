<template>
  <div class="callback-page">
    <div class="callback-box">
      <div class="spinner"></div>
      <p>{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const message = ref('로그인 처리 중...')

// 짧게 메시지를 보여준 뒤 이동 (즉시 replace하면 사용자가 이유를 못 봄)
function redirectWith(msg, path, delay = 1200) {
  message.value = msg
  setTimeout(() => router.replace(path), delay)
}

onMounted(async () => {
  const code = route.query.code
  const oauthError = route.query.error
  const errorDescription = route.query.error_description

  if (oauthError) {
    console.error('OAuth callback error:', { oauthError, errorDescription })
    redirectWith('로그인이 취소되었거나 실패했습니다.', '/login')
    return
  }

  if (!code) {
    console.error('OAuth callback error: code 파라미터가 없습니다.')
    redirectWith('잘못된 로그인 요청입니다.', '/login')
    return
  }

  try {
    await auth.handleCallback(code)
  } catch (err) {
    console.error('OAuth callback 처리 실패:', err)
    // stage === 'profile': 토큰은 받았으나 /me 실패 → 일시적 오류일 가능성이 크다
    if (err?.stage === 'profile') {
      redirectWith('일시적인 오류로 로그인을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.', '/login', 1800)
    } else {
      redirectWith('로그인 처리에 실패했습니다. 다시 시도해 주세요.', '/login')
    }
    return
  }

  // 토큰 발급 + /me 성공.
  redirectWith('로그인 완료! 이동 중입니다...', '/courses', 800)
})
</script>

<style scoped>
.callback-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-secondary);
}

.callback-box {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: var(--color-text-secondary);
  font-size: 15px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>