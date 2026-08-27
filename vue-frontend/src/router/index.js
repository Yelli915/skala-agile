import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: () => import('@/views/LandingView.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/callback',
    name: 'Callback',
    component: () => import('@/views/CallbackView.vue')
  },
  {
    // 프로그램 목록/상세는 로그인 없이도 열람 가능(공개 카탈로그).
    // 참여 신청 등 행위는 각 화면에서 로그인으로 유도한다.
    path: '/courses',
    name: 'CourseList',
    component: () => import('@/views/CourseListView.vue')
  },
  {
    path: '/courses/new',
    name: 'CourseCreate',
    component: () => import('@/views/CourseCreateView.vue'),
    meta: { requiresAuth: true, instructorOnly: true }
  },
  {
    path: '/courses/:id(\\d+)',
    name: 'CourseDetail',
    component: () => import('@/views/CourseDetailView.vue')
  },
  {
    // 소상공인 참여 체크아웃: 신청 상태 확인 → 분담금 결제 확인 → 참여 신청(POST /api/enrollments)
    // → 정산 대기 폴링 → 지원 내용·비용 확인. 지자체 담당자는 화면 내부에서 상세로 되돌린다.
    path: '/courses/:id(\\d+)/apply',
    name: 'ProgramApply',
    component: () => import('@/views/ProgramApplyView.vue'),
    meta: { requiresAuth: true }
  },
  {
    // 내 참여 현황은 마이페이지의 한 섹션으로 통합됨. 기존 링크 호환을 위해 리다이렉트만 유지.
    path: '/enrollments',
    redirect: '/mypage'
  },
  {
    path: '/mypage',
    name: 'MyPage',
    component: () => import('@/views/MyPageView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to) {
    // 대시보드 섹션 앵커(#my-enrollments 등)로 이동할 때는 해당 섹션을 헤더 아래로 스크롤
    if (to.hash) {
      return { el: to.hash, top: 80, behavior: 'smooth' }
    }
    return { top: 0 }
  }
})

// 인증/권한 가드
router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'Login' }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'CourseList' }
  }

  if (to.meta.instructorOnly && auth.user?.role !== 'INSTRUCTOR') {
    return { name: 'CourseList' }
  }
})

export default router