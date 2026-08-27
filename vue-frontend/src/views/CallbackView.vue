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

  // 로그인 의도(일반 / 관리자)는 redirect 전에 sessionStorage에 저장돼 있다.
  let intent = 'user'
  try {
    intent = sessionStorage.getItem('login_intent') || 'user'
    sessionStorage.removeItem('login_intent')
  } catch (e) {
    console.warn('login_intent 조회 실패:', e)
  }
  const loginPath = intent === 'admin' ? '/admin' : '/login'

  if (oauthError) {
    console.error('OAuth callback error:', { oauthError, errorDescription })
    redirectWith('로그인이 취소되었거나 실패했습니다.', loginPath)
    return
  }

  if (!code) {
    console.error('OAuth callback error: code 파라미터가 없습니다.')
    redirectWith('잘못된 로그인 요청입니다.', loginPath)
    return
  }

  try {
    await auth.handleCallback(code)
  } catch (err) {
    console.error('OAuth callback 처리 실패:', err)
    // stage === 'profile': 토큰은 받았으나 /me 실패 → 일시적 오류일 가능성이 크다
    if (err?.stage === 'profile') {
      redirectWith('일시적인 오류로 로그인을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.', loginPath, 1800)
    } else {
      redirectWith('로그인 처리에 실패했습니다. 다시 시도해 주세요.', loginPath)
    }
    return
  }

  // 여기 도달 = 토큰 발급 + /me 성공. auth.user가 채워져 있다.
  if (intent === 'admin') {
    if (auth.isInstructor) {
      redirectWith('관리자 로그인 완료! 이동 중입니다...', '/mypage', 800)
    } else {
      // /me는 성공했고 role이 확정적으로 소상공인 → 진짜 권한 거부
      console.warn('[Callback] 관리자 로그인 시도했으나 지자체 담당자 계정이 아님')
      auth.logout(false)
      redirectWith('관리자(지자체 담당자) 계정이 아닙니다.', '/admin?denied=1')
    }
    return
  }

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