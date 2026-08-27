import api from './index.js'

export const enrollmentApi = {
  getMyEnrollments() {
    return api.get('/api/enrollments/my')
  },
  enroll(courseId) {
    return api.post('/api/enrollments', { courseId })
  },
  // 참고: enrollment-service에는 신청 취소(DELETE) 엔드포인트가 없다. 취소 기능은 백엔드 추가가 필요.
  getRecommendations(userId) {
    return api.get(`/api/recommend/${userId}`)
  }
}
