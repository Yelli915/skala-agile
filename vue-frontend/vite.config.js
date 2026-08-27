import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// 인증 서버(auth-server)로 가는 프록시 공통 옵션.
//  - changeOrigin: 대상(:8080) 기준으로 Host 헤더 변경
//  - autoRewrite: 3xx 응답의 Location(http://localhost:8080/...)을 현재 호스트(:3000)로 rewrite
//    → 폼 로그인 fetch 가 리다이렉트 체인을 same-origin 으로 따라갈 수 있게 한다(CORS 회피)
//  - cookieDomainRewrite: JSESSIONID 쿠키의 Domain 을 제거해 :3000 에 그대로 저장되게 한다
const authProxy = {
  target: 'http://localhost:8080',
  changeOrigin: true,
  autoRewrite: true,
  cookieDomainRewrite: '',
  secure: false
}

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    host: 'localhost',
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      },
      // 공개 카탈로그(프로그램 목록/상세)는 게이트웨이가 비로그인 요청에 401을 준다.
      // course-service 자체는 GET /api/courses 를 permitAll 로 열어두므로, 비로그인 열람은
      // 게이트웨이를 건너뛰고 course-service(:8082)로 직접 프록시한다. (읽기 전용)
      '/course-service': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/course-service/, '')
      },
      '/oauth2': { ...authProxy },
      '/login': {
        ...authProxy,
        // 브라우저가 SPA 의 /login 라우트를 직접 열거나 새로고침한 경우엔
        // auth-server 로 프록시하지 않고 앱(index.html)을 서빙한다.
        // 폼 로그인 요청은 POST 이거나 sec-fetch-dest=empty 라 이 조건에 걸리지 않는다.
        bypass(req) {
          const isDocNav =
            req.method === 'GET' &&
            (req.headers['sec-fetch-dest'] === 'document' ||
              (req.headers.accept || '').includes('text/html'))
          if (isDocNav) return '/index.html'
        }
      },
      '/logout': { ...authProxy },
      '/userinfo': { ...authProxy }
    }
  }
})
