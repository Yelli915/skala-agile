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

  // OAuth2 Authorization Code Flow
  // intent: 'user'(소상공인 일반 로그인) | 'admin'(지자체 담당자·관리자 로그인)
  // auth-server는 수정 불가라 role 구분을 서버에 넘길 수 없으므로, 로그인 의도를
  // sessionStorage에 저장해 두고 콜백에서 실제 role과 대조해 접근을 판정한다.
  function redirectToLogin(intent = 'user') {
    try {
      sessionStorage.setItem('login_intent', intent === 'admin' ? 'admin' : 'user')
    } catch (e) {
      console.warn('[AuthStore] login_intent 저장 실패:', e)
    }

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
    redirectToLogin,
    handleCallback
  }
})