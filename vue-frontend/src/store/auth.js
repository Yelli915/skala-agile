import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth.js'

const AUTH_SERVER_URL = import.meta.env.VITE_AUTH_SERVER_URL || 'http://localhost:8080'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(sessionStorage.getItem('access_token') || null)
  const user = ref(JSON.parse(sessionStorage.getItem('user') || 'null'))

  const isAuthenticated = computed(() => !!accessToken.value)
  const isInstructor = computed(() => user.value?.role === 'INSTRUCTOR')

  function setToken(token) {
    accessToken.value = token
    sessionStorage.setItem('access_token', token)
  }

  function setUser(userData) {
    user.value = userData
    sessionStorage.setItem('user', JSON.stringify(userData))
  }

  /**
   * 현재 토큰으로 /me 프로필을 조회한다.
   * @param {boolean} propagate true면 실패 시 에러를 다시 던진다(콜백 처리에서 구분 필요).
   *   false(기본)면 조용히 로그아웃만 한다(가드/인터셉터에서 호출되는 경우).
   */
  async function fetchUser(propagate = false) {
    try {
      const res = await authApi.getMe()
      console.log('[AuthStore] /me response =', res.data)

      const userData = res?.data?.data ?? res?.data

      if (!userData || typeof userData !== 'object') {
        throw new Error('사용자 정보 형식이 올바르지 않습니다.')
      }

      setUser(userData)
    } catch (error) {
      console.error('[AuthStore] 사용자 정보 조회 실패:', error)
      logout(false)
      if (propagate) throw error
    }
  }

  function logout(redirect = true) {
    accessToken.value = null
    user.value = null
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('user')

    if (redirect) {
      // 로그아웃 후에는 최초 진입 화면(랜딩)으로. 전체 새로고침으로 Pinia 상태도 함께 초기화된다.
      window.location.href = '/'
    }
  }

  /**
   * 아이디(이메일)/비밀번호로 로그인한다.
   * auth-server 폼 로그인으로 Authorization Code를 받아 토큰 교환까지 진행.
   * 실패 사유는 err.stage 로 구분: 'credentials'(자격증명 오류) | 'token' | 'profile' | undefined(네트워크 등)
   */
  async function loginWithPassword(username, password) {
    const code = await authApi.passwordLogin({ username, password })
    await handleCallback(code)
  }

  // OAuth2 Authorization Code Flow — 인증 서버 로그인 페이지로 전체 페이지 리다이렉트(폼 로그인 실패 시 폴백)
  function redirectToLogin() {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: import.meta.env.VITE_CLIENT_ID,
      redirect_uri: import.meta.env.VITE_REDIRECT_URI,
      scope: 'openid profile read write'
    })

    window.location.href = `${AUTH_SERVER_URL}/oauth2/authorize?${params.toString()}`
  }

  async function handleCallback(code) {
    let res
    try {
      res = await authApi.exchangeCode(code)
    } catch (error) {
      console.error('[AuthStore] 토큰 교환 실패:', error)
      const err = new Error('토큰 교환에 실패했습니다.')
      err.stage = 'token'
      throw err
    }
    console.log('[AuthStore] token response =', res.data)

    const token = res?.data?.access_token

    if (!token) {
      const err = new Error('액세스 토큰을 받지 못했습니다.')
      err.stage = 'token'
      throw err
    }

    setToken(token)

    // /me 실패는 토큰 교환 성공과 구분해서 알린다(일시적 오류 → 재시도 안내용).
    try {
      await fetchUser(true)
    } catch (error) {
      const err = new Error('사용자 정보를 불러오지 못했습니다.')
      err.stage = 'profile'
      throw err
    }
  }

  return {
    accessToken,
    user,
    isAuthenticated,
    isInstructor,
    setToken,
    setUser,
    fetchUser,
    logout,
    loginWithPassword,
    redirectToLogin,
    handleCallback
  }
})