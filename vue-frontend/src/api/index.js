import axios from 'axios'
import { useAuthStore } from '@/store/auth.js'

const api = axios.create({
  baseURL: '',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`
  }
  return config
})

// 401 처리를 건너뛰는 경로: 콜백은 스스로 에러를 처리하고,
// 공개/로그인 페이지에서는 리다이렉트가 무의미하거나 루프를 만든다.
const NO_REDIRECT_PATHS = ['/callback', '/login', '/admin', '/']

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.error('[API] 401 Unauthorized —', err.config?.url)

      const auth = useAuthStore()
      auth.logout(false)

      const path = window.location.pathname
      if (!NO_REDIRECT_PATHS.includes(path)) {
        // 세션 만료 → 안내와 함께 로그인 화면으로
        window.location.href = '/login?expired=1'
      }
    }
    return Promise.reject(err)
  }
)

export default api