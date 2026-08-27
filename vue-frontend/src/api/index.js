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

// 401 리다이렉트를 건너뛰는 경로: 콜백은 스스로 에러를 처리하고,
// 공개 페이지(랜딩, 로그인, 프로그램 목록/상세)는 로그인 없이도 볼 수 있어야 한다.
// 프로그램 목록/상세는 게이트웨이가 비로그인 요청에 401을 주므로, 여기서 조용히 삼키고
// 화면 쪽에서 예시(목업) 데이터로 폴백한다.
const PUBLIC_PATHS = ['/callback', '/login', '/']
function isPublicPath(path) {
  return PUBLIC_PATHS.includes(path) || path.startsWith('/courses')
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.error('[API] 401 Unauthorized —', err.config?.url)

      const auth = useAuthStore()
      const hadSession = !!auth.accessToken
      auth.logout(false)

      // 실제 세션 만료(토큰이 있었는데 401)일 때만 보호 페이지에서 로그인 화면으로 보낸다.
      // 비로그인 상태로 공개 페이지를 보는 중이면 리다이렉트하지 않는다.
      if (hadSession && !isPublicPath(window.location.pathname)) {
        window.location.href = '/login?expired=1'
      }
    }
    return Promise.reject(err)
  }
)

export default api