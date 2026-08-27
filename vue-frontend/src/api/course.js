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

  create(data) {
    return api.post('/api/courses', data)
  },
}
