import api from './index.js'

/**
 * course-service 계약 그대로 매핑한다 (게이트웨이 경유).
 *  - GET  /api/courses          전체 프로그램 목록 (쿼리 파라미터 없음 — 필터는 클라이언트에서)
 *  - GET  /api/courses/{id}     프로그램 상세
 *  - POST /api/courses          프로그램 등록 (강사/지자체 담당자, X-User-Id 는 게이트웨이가 주입)
 * 수정(PUT/PATCH)·삭제(DELETE) 엔드포인트는 course-service 에 없다.
 */
export const courseApi = {
  getCourses() {
    return api.get('/api/courses')
  },

  // getCourses 별칭 (호출부 호환용)
  getAll() {
    return api.get('/api/courses')
  },

  getById(id) {
    return api.get(`/api/courses/${id}`)
  },

  // 비로그인 공개 열람용 — 게이트웨이(401)를 건너뛰고 course-service 로 직접 조회한다.
  // (프록시 설정: vite.config.js / nginx.conf 의 /course-service)
  getPublicCourses() {
    return api.get('/course-service/api/courses')
  },

  getPublicById(id) {
    return api.get(`/course-service/api/courses/${id}`)
  },

  create(data) {
    return api.post('/api/courses', data)
  },
}
