<template>
  <div class="landing">
    <AppHeader />

    <!-- 히어로 섹션 -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-content fade-in-up">
          <!-- 타깃 전환 스위치 -->
          <div class="audience-switch" role="tablist" aria-label="이용 대상 선택">
            <button
              v-for="opt in audienceOptions"
              :key="opt.key"
              role="tab"
              type="button"
              :aria-selected="audience === opt.key"
              :class="['audience-tab', { active: audience === opt.key }]"
              @click="audience = opt.key"
            >
              {{ opt.label }}
            </button>
          </div>

          <h1 class="hero-title" v-html="view.title"></h1>
          <p class="hero-desc">{{ view.desc }}</p>

          <ul class="hero-points">
            <li v-for="p in view.points" :key="p">
              <svg class="hero-point-check" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.14" />
                <path d="M5.8 10.2 8.6 13l5.6-6" stroke="currentColor" stroke-width="1.8"
                      stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>{{ p }}</span>
            </li>
          </ul>

          <div class="hero-actions">
            <router-link :to="view.primaryTo" class="btn btn-primary btn-lg">{{ view.primaryLabel }}</router-link>
            <router-link :to="view.secondaryTo" class="btn btn-ghost btn-lg">{{ view.secondaryLabel }}</router-link>
          </div>
        </div>

        <!-- 개별 발송 vs 공동물류 전/후 비교 -->
        <div class="hero-visual fade-in">
          <div class="compare-card">
            <div class="compare-row is-before">
              <div class="compare-head">
                <span class="compare-tag">개별 발송</span>
                <span class="compare-cost">건당 약 ₩3,000</span>
              </div>
              <svg class="compare-svg" viewBox="0 0 320 96" fill="none" aria-hidden="true">
                <g class="cmp-node cmp-shop">
                  <circle cx="22" cy="20" r="7" /><circle cx="22" cy="48" r="7" /><circle cx="22" cy="76" r="7" />
                </g>
                <g class="cmp-line cmp-line-before">
                  <path d="M30 20 C 130 6 210 30 288 20" />
                  <path d="M30 48 C 130 62 210 34 288 48" />
                  <path d="M30 76 C 130 92 210 66 288 76" />
                </g>
                <g class="cmp-node cmp-dest">
                  <rect x="286" y="13" width="15" height="15" rx="3" />
                  <rect x="286" y="41" width="15" height="15" rx="3" />
                  <rect x="286" y="69" width="15" height="15" rx="3" />
                </g>
              </svg>
            </div>

            <div class="compare-arrow" aria-hidden="true">
              <span>공동물류 허브로 물량을 모으면</span>
            </div>

            <div class="compare-row is-after">
              <div class="compare-head">
                <span class="compare-tag">공동물류</span>
                <span class="compare-cost is-save">건당 약 ₩1,800</span>
              </div>
              <svg class="compare-svg" viewBox="0 0 320 96" fill="none" aria-hidden="true">
                <g class="cmp-node cmp-shop">
                  <circle cx="22" cy="20" r="7" /><circle cx="22" cy="48" r="7" /><circle cx="22" cy="76" r="7" />
                </g>
                <g class="cmp-line cmp-line-collect">
                  <path d="M30 20 C 78 20 104 42 140 48" />
                  <path d="M30 48 H 140" />
                  <path d="M30 76 C 78 76 104 54 140 48" />
                </g>
                <rect class="cmp-hub" x="140" y="34" width="28" height="28" rx="7" />
                <path class="cmp-trunk" d="M168 48 H 286" />
                <rect class="cmp-node cmp-dest" x="286" y="40" width="16" height="16" rx="3" />
              </svg>
            </div>

            <div class="compare-legend">
              <span><i class="lg-dot lg-shop"></i>소상공인 매장</span>
              <span><i class="lg-dot lg-hub"></i>지역 공동물류센터</span>
              <span><i class="lg-dot lg-dest"></i>배송지</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 전폭 성과 지표 배너 -->
      <div class="hero-stats-band">
        <div class="stats-inner">
          <div class="stat-lead">
            <span class="stat-lead-label">누적 절감 배송비</span>
            <span class="stat-lead-num">약 62억 원</span>
            <span class="stat-lead-sub">2024–2025 참여 프로그램 합산 · 교육용 예시 수치</span>
          </div>
          <div class="stat-cards">
            <div v-for="s in stats" :key="s.label" class="stat-card">
              <span class="stat-card-ic" v-html="s.icon"></span>
              <span class="stat-card-num">{{ s.num }}</span>
              <span class="stat-card-label">{{ s.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 인기 프로그램 (실제/예시 프로그램이 하나도 없으면 섹션 자체를 숨긴다) -->
    <section v-if="featuredCourses.length" class="popular-section">
      <div class="section-inner">
        <div class="section-header">
          <div>
            <span class="section-eyebrow">모집 중인 프로그램</span>
            <h2 class="section-title">인기 공동물류 프로그램</h2>
            <p class="section-sub">참여 신청이 많은 순 · 분담금은 지자체 지원금 {{ subsidyPercent }}% 반영 후 실부담 기준</p>
          </div>
          <router-link :to="allProgramsLink" class="section-link">전체 보기 →</router-link>
        </div>

        <p v-if="isSample" class="sample-note">
          현재 표시되는 프로그램은 데모용 예시입니다. course-service에 프로그램이 등록되면 자동으로 실제 목록으로 바뀝니다.
        </p>

        <div class="course-grid">
          <router-link
            v-for="course in featuredCourses"
            :key="course.id"
            :to="programLink(course)"
            class="course-card-landing"
          >
            <div class="card-thumb" :class="course.bg">
              <span class="recruit-pill"><i class="recruit-dot"></i>모집 중</span>
              <CategoryIcon :category="course.categoryValue" class="thumb-icon" />
            </div>
            <div class="card-body">
              <span class="badge" :class="course.badgeClass">{{ course.label }}</span>
              <h3 class="card-title">{{ course.title }}</h3>

              <div class="card-price">
                <span class="price-net">₩{{ course.netPrice.toLocaleString() }}</span>
                <span class="price-base">정가 ₩{{ course.basePrice.toLocaleString() }}</span>
                <span class="price-tag">지원금 {{ subsidyPercent }}%</span>
              </div>

              <div class="card-meta">
                <span class="enroll-count">{{ course.enrollmentCount.toLocaleString() }}곳 참여 신청</span>
              </div>

              <span class="card-cta">자세히 보기 →</span>
            </div>
          </router-link>
        </div>
      </div>
    </section>

    <!-- 특징 섹션 -->
    <section class="features-section">
      <div class="section-inner">
        <span class="section-eyebrow center">어떻게 배송비를 줄이나요?</span>
        <h2 class="section-title center">물류이음이 하는 일</h2>
        <div class="features-grid">
          <div v-for="f in features" :key="f.title" class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <template v-if="f.icon === 'coins'">
                  <ellipse cx="12" cy="6" rx="7.5" ry="3.2" />
                  <path d="M4.5 6v5c0 1.8 3.4 3.2 7.5 3.2s7.5-1.4 7.5-3.2V6" />
                  <path d="M4.5 11v5c0 1.8 3.4 3.2 7.5 3.2s7.5-1.4 7.5-3.2v-5" />
                </template>
                <template v-else-if="f.icon === 'landmark'">
                  <path d="M3 21h18" />
                  <path d="M4 21V10h16v11" />
                  <path d="M12 3 3.5 8h17z" />
                  <path d="M8 21v-7M12 21v-7M16 21v-7" />
                </template>
                <template v-else-if="f.icon === 'target'">
                  <circle cx="12" cy="12" r="8.5" />
                  <circle cx="12" cy="12" r="4.5" />
                  <circle cx="12" cy="12" r="1" fill="currentColor" />
                </template>
                <template v-else>
                  <path d="M13 3 4 14h7l-1 7 9-11h-7z" />
                </template>
              </svg>
            </div>
            <h3 class="feature-title">{{ f.title }}</h3>
            <p class="feature-desc">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 푸터 -->
    <AppFooter />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import CategoryIcon from '@/components/CategoryIcon.vue'
import { courseApi } from '@/api/course.js'
import { useCourseStore, SAMPLE_PROGRAMS, SUBSIDY_RATE, netBurden } from '@/store/course.js'
import { isMockEnabled } from '@/config/mock.js'
import { useAuthStore } from '@/store/auth.js'

const courseStore = useCourseStore()
const auth = useAuthStore()

/* 히어로 타깃 전환 — 소상공인 / 지자체 담당자별 카피·CTA 분리.
   CTA는 /login으로 보내되 tab·role·redirect 쿼리로 회원가입 탭·역할·로그인 후 목적지를 지정한다
   (LoginView가 route.query.tab / route.query.role 을 초기 상태로 반영하고,
    route.query.redirect(same-origin 경로)를 세션에 저장했다가 로그인 완료 후 그리로 보낸다). */
const audienceOptions = [
  { key: 'merchant', label: '소상공인이신가요?' },
  { key: 'officer', label: '지자체 담당자이신가요?' },
]
const audience = ref('merchant')

const AUDIENCE = {
  merchant: {
    title: '지역이 함께 나르면,<br>배송비는 내려갑니다',
    desc: '우리 동네 지자체가 여는 공동물류 프로그램에 참여해, 매장 배송비 부담을 이웃 상인과 함께 나누세요.',
    points: [
      '물량을 모아 건당 배송비 최대 40% 절감',
      '지자체 지원금이 정산에 자동 반영',
      '원클릭 신청 즉시 접수 · 배차 시작',
    ],
    primaryLabel: '소상공인 참여 신청',
    primaryTo: { path: '/login', query: { tab: 'register', role: 'STUDENT' } },
    secondaryLabel: '프로그램 둘러보기',
    secondaryTo: { path: '/courses' },
  },
  officer: {
    title: '관내 소상공인 배송비,<br>우리 지자체가 함께 풉니다',
    desc: '모집 조건과 배송 권역, 지원금 기준을 등록하면 관내 소상공인이 바로 참여를 신청합니다. 정산에는 지원금이 자동 반영됩니다.',
    points: [
      '배송 권역 · 지원금 기준 직접 설정',
      '참여 현황 · 정산 내역 한눈에 확인',
      '관내 상권 데이터 기반 참여 리포트',
    ],
    primaryLabel: '지자체 프로그램 개설',
    primaryTo: { path: '/login', query: { tab: 'register', role: 'INSTRUCTOR', redirect: '/courses/new' } },
    secondaryLabel: '담당자 로그인',
    secondaryTo: { path: '/login', query: { redirect: '/courses/new' } },
  },
}

/* 이미 로그인한 사용자가 랜딩으로 돌아온 경우:
   회원가입/로그인 CTA는 guestOnly 가드에 튕기므로, 실제 행동 화면으로 바로 연결한다. */
const view = computed(() => {
  const base = AUDIENCE[audience.value]
  if (!auth.isAuthenticated) return base

  const isInstructor = auth.user?.role === 'INSTRUCTOR'
  if (audience.value === 'officer') {
    return {
      ...base,
      primaryLabel: isInstructor ? '프로그램 개설하기' : '프로그램 둘러보기',
      primaryTo: { path: isInstructor ? '/courses/new' : '/courses' },
      secondaryLabel: '마이페이지',
      secondaryTo: { path: '/mypage' },
    }
  }
  return {
    ...base,
    primaryLabel: '프로그램 참여하러 가기',
    primaryTo: { path: '/courses' },
  }
})

const stats = [
  {
    num: '1,200+',
    label: '공동물류 프로그램',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v9"/></svg>',
  },
  {
    num: '340+',
    label: '참여 지자체',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M4 21V10h16v11"/><path d="M12 3 3.5 8h17z"/><path d="M8 21v-7M12 21v-7M16 21v-7"/></svg>',
  },
  {
    num: '28,000+',
    label: '참여 소상공인',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v12h16V9"/><path d="M2 9l2-6h16l2 6a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M9 21v-6h6v6"/></svg>',
  },
]

/* 인기 프로그램 목록.
   - 로그인 전이라도 course-service GET /api/courses 를 시도해 "실제 모집 중인 프로그램"을 보여준다.
   - 라벨/배지/썸네일/아이콘은 courseStore.categoryMeta 가 단일 소스(수동 동기화 제거).
   - 분담금은 정가와 지자체 지원금 반영 실부담(netBurden)을 함께 노출한다.
   - 목업 스위치(VITE_ENABLE_MOCK)가 켜져 있을 때만 조회 실패/빈 결과에서 SAMPLE_PROGRAMS 를 "예시"로 폴백한다.
     꺼져 있으면 실제 목록만 쓰고, 없으면 이 섹션 자체를 숨긴다. */
const mockOn = isMockEnabled()
const rawPrograms = ref(mockOn ? SAMPLE_PROGRAMS : [])
const isSample = ref(mockOn)
const subsidyPercent = Math.round(SUBSIDY_RATE * 100)

const featuredCourses = computed(() =>
  rawPrograms.value.slice(0, 6).map((c) => {
    const categoryValue = c.category ?? c.categoryKey
    const meta = courseStore.categoryMeta(categoryValue)
    const base = Number(c.price) || 0
    return {
      id: c.id,
      isSample: isSample.value,
      title: c.title,
      categoryValue,
      label: meta.label,
      badgeClass: meta.badge,
      bg: meta.bg,
      basePrice: base,
      netPrice: netBurden(base),
      enrollmentCount: Number(c.enrollmentCount) || 0,
    }
  })
)

// 목록/상세는 공개 페이지 — 로그인 없이 바로 연결한다.
function programLink(course) {
  return `/courses/${course.id}`
}
const allProgramsLink = '/courses'

onMounted(async () => {
  try {
    // 로그인 상태면 게이트웨이 경유, 401(비로그인)이면 course-service 직접 조회로 폴백.
    let res
    try {
      res = await courseApi.getAll()
    } catch (e) {
      if (e.response?.status === 401) {
        res = await courseApi.getPublicCourses()
      } else {
        throw e
      }
    }
    const list = Array.isArray(res.data?.data)
      ? res.data.data
      : Array.isArray(res.data)
        ? res.data
        : []
    if (list.length) {
      rawPrograms.value = [...list].sort(
        (a, b) => (Number(b.enrollmentCount) || 0) - (Number(a.enrollmentCount) || 0)
      )
      isSample.value = false
    } else if (!mockOn) {
      rawPrograms.value = []
      isSample.value = false
    }
  } catch (e) {
    // 비로그인 상태에서 게이트웨이가 401을 주는 경우가 정상 경로.
    // 목업이 켜져 있으면 예시 목록을 그대로 두고, 꺼져 있으면 빈 목록으로 둔다.
    console.warn('[Landing] 실시간 프로그램 조회 실패', e)
    if (!mockOn) {
      rawPrograms.value = []
      isSample.value = false
    }
  }
})

const features = [
  { icon: 'coins',    title: '배송비 분담', desc: '지역 소상공인이 물량을 모아 공동배송하면 건당 배송비 부담이 크게 줄어듭니다.' },
  { icon: 'landmark', title: '지자체 지원금 반영', desc: '프로그램별 지자체 지원금이 정산에 자동 반영되어 실부담금만 냅니다.' },
  { icon: 'target',   title: '맞춤 프로그램 추천', desc: '참여 이력을 분석해 우리 가게에 맞는 공동물류 프로그램을 추천합니다.' },
  { icon: 'bolt',     title: '신청 즉시 접수', desc: '원클릭 신청 후 정산이 완료되면 참여가 확정되고 물류 배차가 시작됩니다.' },
]
</script>

<style scoped>
.landing { background: var(--color-bg-secondary); }
.section-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

/* 공통 섹션 헤더 */
.section-eyebrow {
  display: block;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--color-primary);
  margin-bottom: 6px;
}
.section-eyebrow.center { text-align: center; }
.section-title { font-size: 24px; font-weight: 700; color: var(--color-text-primary); letter-spacing: -0.3px; }
.section-title.center { text-align: center; }
.section-link { font-size: 14px; color: var(--color-primary); font-weight: 600; white-space: nowrap; }
.section-link:hover { text-decoration: underline; }

/* 히어로 */
.hero {
  background: var(--color-primary-light);
  border-bottom: 1px solid var(--color-border);
  padding: 72px 0 0;
}
.hero-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 64px;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 48px;
  align-items: center;
}

/* 타깃 전환 스위치 */
.audience-switch {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  margin-bottom: 20px;
}
.audience-tab {
  padding: 7px 15px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--color-text-secondary);
  background: transparent;
  transition: var(--transition);
}
.audience-tab:hover { color: var(--color-text-primary); }
.audience-tab.active {
  background: var(--gradient-primary);
  color: #fff;
}

.hero-title {
  font-size: 44px;
  font-weight: 800;
  line-height: 1.24;
  letter-spacing: -0.6px;
  color: var(--color-text-primary);
  margin-bottom: 16px;
}
.hero-desc {
  font-size: 16px;
  font-weight: 450;
  color: var(--color-text-secondary);
  line-height: 1.75;
  max-width: 500px;
  margin-bottom: 22px;
}
.hero-points {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 30px;
}
.hero-points li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}
.hero-point-check {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: var(--color-support);
}
.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
/* .btn-lg 은 global.css */

/* 개별 발송 vs 공동물류 비교 카드 */
.hero-visual { display: flex; align-items: center; justify-content: center; }
.compare-card {
  width: 100%;
  max-width: 440px;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 22px 22px 18px;
}
.compare-row { display: flex; flex-direction: column; gap: 8px; }
.compare-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.compare-tag {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-secondary);
}
.is-after .compare-tag { color: var(--color-primary); }
.compare-cost {
  font-size: 14px;
  font-weight: 800;
  color: var(--color-warning);
}
.compare-cost.is-save { color: var(--color-support); }
.compare-svg { width: 100%; height: auto; }

.cmp-shop circle { fill: var(--color-primary-light); stroke: var(--color-primary); stroke-width: 1.4; }
.cmp-dest, .cmp-dest rect {
  fill: #fff;
  stroke: var(--color-text-muted);
  stroke-width: 1.4;
}
.cmp-line path { fill: none; stroke-width: 1.6; }
.cmp-line-before path {
  stroke: var(--color-warning);
  stroke-dasharray: 3 4;
  opacity: 0.75;
}
.cmp-line-collect path { stroke: var(--color-primary); opacity: 0.55; }
.cmp-hub { fill: var(--color-primary); }
.cmp-trunk {
  stroke: var(--color-support);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-dasharray: 7 6;
  animation: cmp-flow 1.1s linear infinite;
}
@keyframes cmp-flow { to { stroke-dashoffset: -13; } }
@media (prefers-reduced-motion: reduce) {
  .cmp-trunk { animation: none; stroke-dasharray: none; }
}

.compare-arrow {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 12px 0;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--color-primary);
  text-align: center;
}
.compare-arrow::before,
.compare-arrow::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.compare-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--color-border);
}
.compare-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--color-text-secondary);
}
.lg-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}
.lg-shop { background: var(--color-primary-light); border: 1.4px solid var(--color-primary); }
.lg-hub { background: var(--color-primary); }
.lg-dest { background: #fff; border: 1.4px solid var(--color-text-muted); }

/* 전폭 성과 지표 배너 */
.hero-stats-band {
  background: rgba(255, 255, 255, 0.72);
  border-top: 1px solid var(--color-border);
}
.stats-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 22px 24px;
  display: flex;
  align-items: center;
  gap: 32px;
}
.stat-lead {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-right: 32px;
  border-right: 1px solid var(--color-border);
  flex-shrink: 0;
}
.stat-lead-label { font-size: 12px; font-weight: 700; color: var(--color-text-secondary); }
.stat-lead-num { font-size: 26px; font-weight: 800; color: var(--color-support); letter-spacing: -0.4px; }
.stat-lead-sub { font-size: 11px; color: var(--color-text-muted); }
.stat-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  flex: 1;
}
.stat-card {
  display: grid;
  grid-template-columns: 34px 1fr;
  grid-template-rows: auto auto;
  column-gap: 12px;
  align-items: center;
}
.stat-card-ic {
  grid-row: 1 / 3;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--color-primary-light);
  color: var(--color-primary);
}
.stat-card-ic :deep(svg) { width: 19px; height: 19px; }
.stat-card-num { font-size: 19px; font-weight: 800; color: var(--color-text-primary); align-self: end; }
.stat-card-label { font-size: 11.5px; color: var(--color-text-secondary); align-self: start; }

/* 프로그램 섹션 */
.popular-section { padding: 72px 0; }
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;
  gap: 16px;
}
.section-sub {
  margin-top: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.sample-note {
  margin-bottom: 20px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-size: 12.5px;
  font-weight: 600;
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}
.course-card-landing {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: var(--transition);
}
.course-card-landing:hover {
  transform: translateY(-3px);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}
.course-card-landing:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
.course-card-landing:hover .card-cta { color: var(--color-primary); }
.card-thumb {
  position: relative;
  height: 116px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
/* .thumb-* 배경/아이콘 색은 global.css 에서 관리 */
.thumb-icon { width: 42px; height: 42px; }
.recruit-pill {
  position: absolute;
  top: 10px;
  left: 10px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  font-size: 10.5px;
  font-weight: 700;
  color: var(--color-support);
}
.recruit-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-support);
}
.card-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
.card-title { font-size: 15px; font-weight: 700; color: var(--color-text-primary); line-height: 1.4; }

.card-price { display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px; }
.price-net { font-size: 16px; font-weight: 800; color: var(--color-support); }
.price-base { font-size: 12px; color: var(--color-text-muted); text-decoration: line-through; }
.price-tag {
  font-size: 10.5px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--color-support-light);
  color: var(--color-support);
}

.card-meta { display: flex; justify-content: flex-end; align-items: center; gap: 8px; }
.enroll-count { font-size: 12px; font-weight: 600; color: var(--color-text-secondary); white-space: nowrap; }

.card-cta {
  margin-top: auto;
  padding-top: 4px;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-muted);
  transition: var(--transition);
}

/* 특징 — 밝은 배경 섹션 (페이지 전체 톤과 일관되게) */
.features-section {
  padding: 84px 0;
  background: var(--color-bg-primary);
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}
.features-section .section-title.center { margin-bottom: 44px; }
.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.feature-card {
  padding: 28px 22px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-align: center;
  transition: var(--transition);
}
.feature-card:hover {
  border-color: var(--color-border-hover);
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);
  transform: translateY(-2px);
}
.feature-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: var(--color-primary-light);
  color: var(--color-primary);
}
.feature-icon svg { width: 24px; height: 24px; }
.feature-title { font-size: 15px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 8px; }
.feature-desc { font-size: 13px; color: var(--color-text-secondary); line-height: 1.6; }

@media (max-width: 900px) {
  .hero { padding: 52px 0 0; }
  .hero-inner { grid-template-columns: 1fr; gap: 36px; padding-bottom: 44px; }
  .hero-visual { order: 2; }
  .compare-card { max-width: 100%; }
  .hero-title { font-size: 36px; }
  .stats-inner { flex-direction: column; align-items: stretch; gap: 18px; }
  .stat-lead { padding-right: 0; padding-bottom: 16px; border-right: none; border-bottom: 1px solid var(--color-border); }
  .course-grid { grid-template-columns: repeat(2, 1fr); }
  .features-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 560px) {
  .course-grid { grid-template-columns: 1fr; }
  .features-grid { grid-template-columns: 1fr; }
  .hero-title { font-size: 29px; }
  .audience-switch { display: flex; width: 100%; }
  .audience-tab { flex: 1; text-align: center; }
  .stat-cards { grid-template-columns: 1fr; gap: 14px; }
}
</style>
