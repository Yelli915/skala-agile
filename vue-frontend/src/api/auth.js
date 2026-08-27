import api from './index.js'
import axios from 'axios'

// OAuth/인증 관련 호출은 모두 상대경로로 보낸다.
//  - dev: vite.config.js 의 /oauth2 · /login 프록시가 auth-server(:8080)로 전달
//  - docker: nginx.conf 의 /oauth2 · /login 프록시가 api-gateway(:8080)로 전달
// 절대경로(http://localhost:8080)로 부르면 브라우저가 cross-origin(CORS) 요청으로 처리하고,
// 로그인 리다이렉트 체인의 마지막 착지(/callback)가 CORS 위반으로 차단된다. 상대경로로 두면
// 전 구간이 same-origin이라 CORS 자체가 발생하지 않는다.

function buildAuthorizeUrl() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: import.meta.env.VITE_CLIENT_ID,
    // redirect_uri 는 auth-server에 등록된 값 그대로(절대 URL) 보내야 한다.
    redirect_uri: import.meta.env.VITE_REDIRECT_URI,
    scope: 'openid profile read write'
  })
  return `/oauth2/authorize?${params.toString()}`
}

export const authApi = {
  // OAuth2 Authorization Code -> Access Token 교환
  // CLIENT_SECRET_BASIC: Authorization 헤더에 client_id:client_secret을 Base64로 인코딩
  exchangeCode(code) {
    const clientId = import.meta.env.VITE_CLIENT_ID
    const clientSecret = import.meta.env.VITE_CLIENT_SECRET
    const redirectUri = import.meta.env.VITE_REDIRECT_URI
    const credentials = btoa(`${clientId}:${clientSecret}`)

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    })

    return axios.post(
      '/oauth2/token',
      body.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        }
      }
    )
  },

  /**
   * 아이디(이메일)/비밀번호로 로그인해 Authorization Code를 받아온다.
   *
   * auth-server(prebuilt, 수정 불가)는 표준 OAuth2 Authorization Code + 폼 로그인만
   * 지원하고, 자격증명을 토큰으로 바로 바꿔주는 API가 없다. 그래서 브라우저 리다이렉트
   * 대신 fetch로 같은 흐름을 진행한다(전 구간 same-origin, 프록시가 :8080으로 전달):
   *   1) GET /oauth2/authorize → 세션(JSESSIONID) + saved-request 생성 (302 → /login)
   *   2) POST /login (username/password) → 성공 시 saved-request로 리다이렉트되어
   *      최종적으로 {redirect_uri}/callback?code=... 에 착지
   *   3) 최종 URL에서 code 추출
   *
   * 전제: auth-server가 CSRF 미적용, consent 화면 비활성 — 현재 lecture auth-server 설정에서 확인됨.
   * 프록시가 리다이렉트 Location(http://localhost:8080/...)을 현재 호스트로 rewrite 해주므로
   * (vite: autoRewrite, nginx: proxy_redirect) fetch가 same-origin 체인을 따라간다.
   */
  async passwordLogin({ username, password }) {
    // 1) 세션 + saved request
    await fetch(buildAuthorizeUrl(), { credentials: 'include' })

    // 2) 폼 로그인 (Spring Security 기본 form login)
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username, password }),
      credentials: 'include'
    })

    // 3) 리다이렉트 체인의 최종 착지 URL에서 code
    let finalUrl
    try {
      finalUrl = new URL(res.url, window.location.origin)
    } catch {
      throw new Error('로그인 응답을 해석하지 못했습니다.')
    }

    const code = finalUrl.searchParams.get('code')
    if (!code) {
      // 실패 시 Spring은 /login?error 로 되돌린다
      const err = new Error('아이디 또는 비밀번호가 올바르지 않습니다.')
      err.stage = 'credentials'
      throw err
    }
    return code
  },

  // 내 정보 조회
  getMe() {
    return api.get('/api/users/me')
  },

  // 회원가입
  register(data) {
    return api.post('/api/users/register', data)
  }
}
