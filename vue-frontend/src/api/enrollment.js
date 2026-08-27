import api from './index.js'
import {
  isMockEnabled,
  readMockEnrollments,
  addMockEnrollment,
} from './mockEnrollments.js'

/**
 * enrollment-service 계약은 그대로 사용한다.
 * 다만 백엔드가 없거나(연결 실패) 참여신청이 하나도 없을 때는,
 * 교육용 데모를 위해 목업 참여신청으로 폴백한다(mockEnrollments.js 참고).
 * VITE_ENABLE_MOCK=false 로 끌 수 있다.
 */
export const enrollmentApi = {
  async getMyEnrollments() {
    try {
      const res = await api.get('/api/enrollments/my')
      const payload = res.data
      const list = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : []

      if (list.length === 0 && isMockEnabled()) {
        console.info('[enrollmentApi] 참여신청 없음 → 데모 목업 데이터로 표시')
        return { data: { data: readMockEnrollments(), mock: true } }
      }
      return res
    } catch (error) {
      if (isMockEnabled()) {
        console.warn('[enrollmentApi] GET /api/enrollments/my 실패 → 데모 목업 데이터로 표시', error)
        return { data: { data: readMockEnrollments(), mock: true } }
      }
      throw error
    }
  },

  /**
   * 참여 신청 = 백엔드 결제 사가 트리거.
   * POST /api/enrollments 한 번이 PENDING enrollment 생성 + payment-service 동기 호출 +
   * payment.completed Kafka 발행까지 수행한다. PENDING→ACTIVE 전환은 이후 비동기.
   *
   * @param {number|string} courseId
   * @param {object} [courseSnapshot] 표시용 course 정보(title/category/price/instructorName)
   * @param {object} [options]
   * @param {boolean} [options.allowMockFallback=true] 백엔드 호출 실패 시 목업 신청으로 폴백할지.
   *   실제 흐름(ProgramApplyView)에서 카탈로그가 실데이터면 false 로 넘겨 진짜 에러를 노출한다.
   */
  async enroll(courseId, courseSnapshot = {}, options = {}) {
    const { allowMockFallback = true } = options
    try {
      return await api.post('/api/enrollments', { courseId })
    } catch (error) {
      if (allowMockFallback && isMockEnabled()) {
        console.warn('[enrollmentApi] POST /api/enrollments 실패 → 데모 목업 신청으로 처리', error)
        const item = addMockEnrollment(courseId, courseSnapshot)
        return { data: { data: item, mock: true }, status: 201 }
      }
      throw error
    }
  },

  // 참고: enrollment-service에는 신청 취소(DELETE) 엔드포인트가 없다. 취소 기능은 백엔드 추가가 필요.
  getRecommendations(userId) {
    return api.get(`/api/recommend/${userId}`)
  },
}
