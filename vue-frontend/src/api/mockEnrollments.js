/**
 * 목업 참여신청(Enrollment) 저장소 — 교육용 데모 지원.
 *
 * enrollment-service / payment-service / Kafka 를 띄우지 않아도
 * "참여 신청 → 정산 대기(PENDING) → 참여 확정(ACTIVE)" 흐름을 화면에서 시연할 수 있게 한다.
 *
 * - 실제 API 가 정상 응답하면 이 모듈은 쓰이지 않는다(enrollment.js 가 실패/빈 응답일 때만 fallback).
 * - 사용자가 새로 신청한 항목은 sessionStorage 에 저장돼 페이지 이동에도 유지된다.
 * - PENDING 으로 담긴 신청은 ACTIVATION_DELAY 후 자동으로 ACTIVE 로 승격된다
 *   (payment.completed → enrollment.activate 사가를 시간차로 흉내).
 *
 * 백엔드 계약은 그대로다. 여기서 만드는 객체 모양은 enrollment-service 의
 * GET /api/enrollments/my 응답(항목: id, courseId, status, course{title,category,price,instructorName})과 동일하다.
 */

import { isMockEnabled } from '@/config/mock.js'

export { isMockEnabled }

const STORAGE_KEY = 'mock_enrollments'
const ACTIVATION_DELAY = 8000 // ms — 정산 대기 → 참여 확정 전환 시간차

/**
 * 로그인 전/직후에도 목록이 비어 보이지 않도록 하는 시드 참여신청.
 * "신청 접수(PENDING)"와 "참여 확정(ACTIVE)"이 섞여 보이도록 상태를 다양하게 둔다.
 * - simulate: true 인 항목만 최초 조회 후 ACTIVATION_DELAY 뒤 자동으로 ACTIVE 로 전환(사가 시연용).
 * - 나머지 PENDING 항목은 계속 "신청 접수" 상태로 남아 대비되어 보인다.
 * courseId 는 store 의 SAMPLE_PROGRAMS(1~9) 와 맞춘다.
 */
const SEED_ENROLLMENTS = [
  {
    id: 90001,
    courseId: 1,
    status: 'ACTIVE',
    createdAt: '2026-07-30T09:00:00Z',
    course: { id: 1, title: '성동구 전통시장 공동배송', category: 'DATA_SCIENCE', price: 12000 },
  },
  {
    id: 90002,
    courseId: 4,
    status: 'PENDING',
    createdAt: '2026-08-06T09:00:00Z',
    course: { id: 4, title: '해운대 수산물 냉장 공동배송', category: 'DEVOPS', price: 18000 },
  },
  {
    id: 90003,
    courseId: 3,
    status: 'ACTIVE',
    createdAt: '2026-08-12T09:00:00Z',
    course: { id: 3, title: '대구 중구 당일 공동배송', category: 'BACKEND', price: 15000 },
  },
  {
    id: 90004,
    courseId: 7,
    status: 'PENDING',
    createdAt: '2026-08-19T09:00:00Z',
    course: { id: 7, title: '유성구 정밀장비 안심 공동배송', category: 'SECURITY', price: 16000 },
  },
  {
    id: 90005,
    courseId: 6,
    status: 'ACTIVE',
    createdAt: '2026-08-23T09:00:00Z',
    course: { id: 6, title: '광주 서구 공동보관·배송', category: 'DATABASE', price: 21000 },
  },
  {
    id: 90006,
    courseId: 2,
    status: 'PENDING',
    simulate: true,
    createdAt: '2026-08-27T09:00:00Z',
    course: { id: 2, title: '수원 전통시장 정기 묶음배송', category: 'FRONTEND', price: 9000 },
  },
]

function readSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeSession(list) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* 프라이빗 모드 등에서 저장 실패 — 무시하고 시드만으로 동작 */
  }
}

/** 담긴 시각 기준으로 PENDING → ACTIVE 자동 승격을 반영해서 돌려준다. */
function withSimulatedActivation(list) {
  const now = Date.now()
  let changed = false
  const next = list.map((item) => {
    if (item.status === 'PENDING' && item._pendingSince && now - item._pendingSince >= ACTIVATION_DELAY) {
      changed = true
      return { ...item, status: 'ACTIVE' }
    }
    return item
  })
  if (changed) writeSession(next)
  return next
}

// 최초 조회 시, simulate 표시된 시드 항목만 세션에 심어 "신청 접수 → 참여 확정" 전환을
// 데모에서 실제로 보여준다(_pendingSince 부터 ACTIVATION_DELAY 후 ACTIVE).
// 그 외 PENDING 시드는 그대로 "신청 접수" 상태로 남긴다.
let seededPending = false
function ensureSeedPending() {
  if (seededPending) return
  seededPending = true
  const session = readSession()
  const known = new Set(session.map((e) => Number(e.courseId)))
  const pendingSeeds = SEED_ENROLLMENTS
    .filter((e) => e.simulate && !known.has(Number(e.courseId)))
    .map((e) => ({ ...e, _pendingSince: Date.now() }))
  if (pendingSeeds.length) writeSession([...session, ...pendingSeeds])
}

/**
 * 시드 + 사용자가 추가한 목업 신청을 합쳐 반환.
 * 같은 courseId 는 사용자가 추가한 항목이 시드를 덮어쓴다.
 */
export function readMockEnrollments() {
  ensureSeedPending()
  const session = withSimulatedActivation(readSession())
  const addedCourseIds = new Set(session.map((e) => Number(e.courseId)))
  const merged = [
    ...SEED_ENROLLMENTS.filter((e) => !addedCourseIds.has(Number(e.courseId))),
    ...session,
  ]
  // 최신 신청이 위로 오도록 id 내림차순 (내부 표시용 필드는 제거)
  return merged
    .map(({ _pendingSince, simulate, ...rest }) => rest)
    .sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0))
}

/** 이미(시드 포함) 신청한 프로그램인지 */
export function hasMockEnrollment(courseId) {
  return readMockEnrollments().some((e) => Number(e.courseId) === Number(courseId))
}

/**
 * 새 목업 신청을 PENDING 으로 추가한다.
 * @param {number|string} courseId
 * @param {object} [courseSnapshot] 화면에 표시할 course 정보(title/category/price)
 * @returns {object} 추가된 enrollment 항목
 */
export function addMockEnrollment(courseId, courseSnapshot = {}) {
  const idNum = Number(courseId)
  const session = readSession()

  const existing = session.find((e) => Number(e.courseId) === idNum)
  if (existing) return existing

  const seed = SEED_ENROLLMENTS.find((e) => Number(e.courseId) === idNum)
  const course = {
    id: idNum,
    title: courseSnapshot.title || seed?.course.title || `공동물류 프로그램 #${courseId}`,
    category: courseSnapshot.category || seed?.course.category || 'OTHER',
    price: Number(courseSnapshot.price ?? seed?.course.price ?? 0),
  }

  const item = {
    id: Date.now(),
    courseId: idNum,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    course,
    _pendingSince: Date.now(),
  }

  writeSession([...session, item])
  return item
}
