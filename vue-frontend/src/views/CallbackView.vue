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
const processing = ref(false)

onMounted(async () => {
  if (processing.value) return
  processing.value = true

  const code = route.query.code
  const error = route.query.error
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

  if (error) {
    console.error('OAuth callback error:', {
      error,
      errorDescription
    })
    message.value = '로그인에 실패했습니다. 다시 시도해주세요.'
    router.replace(loginPath)
    return
  }

  if (!code) {
    console.error('OAuth callback error: code 파라미터가 없습니다.')
    message.value = '잘못된 로그인 요청입니다.'
    router.replace(loginPath)
    return
  }

  try {
    await auth.handleCallback(code)

    if (intent === 'admin') {
      // 관리자 로그인 경로 → 지자체 담당자(INSTRUCTOR) 계정만 통과
      if (auth.isInstructor) {
        message.value = '관리자 로그인 완료! 이동 중입니다...'
        router.replace('/mypage')
      } else {
        console.warn('[Callback] 관리자 로그인 시도했으나 지자체 담당자 계정이 아님')
        auth.logout(false)
        message.value = '관리자 계정이 아닙니다. 다시 시도해주세요.'
        router.replace('/admin?denied=1')
      }
      return
    }

    message.value = '로그인 완료! 이동 중입니다...'
    router.replace('/courses')
  } catch (err) {
    console.error('OAuth callback 처리 실패:', err)
    message.value = '로그인 처리에 실패했습니다.'
    router.replace(loginPath)
  }
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