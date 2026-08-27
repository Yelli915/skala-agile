/**
 * 교육용 데모 목업 스위치.
 *
 * 백엔드(course-service / enrollment-service 등)가 비어 있거나 연결되지 않아도
 * 화면 흐름을 시연할 수 있도록, 각 API 래퍼가 "실패 또는 빈 응답"일 때만 목업으로 폴백한다.
 * 실제 데이터가 있으면 목업은 절대 쓰이지 않는다.
 *
 * 끄려면 vue-frontend/.env 에서 VITE_ENABLE_MOCK=false
 */
export function isMockEnabled() {
  return String(import.meta.env.VITE_ENABLE_MOCK ?? 'true') !== 'false'
}
