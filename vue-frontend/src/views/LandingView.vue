<template>
  <div class="landing">
    <AppHeader />

    <!-- 히어로 섹션 -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-content fade-in-up">
          <span class="hero-badge">MSA 기반 지역 공동물류 플랫폼</span>
          <h1 class="hero-title">지역이 함께 나르면,<br>배송비는 내려갑니다</h1>
          <p class="hero-desc">지자체가 여는 공동물류 프로그램에 참여하고, 소상공인 배송비 부담을 함께 줄여보세요.</p>
          <div class="hero-actions">
            <router-link to="/login" class="btn btn-primary btn-lg">무료로 시작하기</router-link>
            <router-link to="/courses" class="btn btn-outline btn-lg">프로그램 둘러보기</router-link>
          </div>
          <div class="hero-stats">
            <div class="stat"><span class="stat-num">1,200+</span><span class="stat-label">공동물류 프로그램</span></div>
            <div class="stat"><span class="stat-num">340+</span><span class="stat-label">참여 지자체</span></div>
            <div class="stat"><span class="stat-num">28,000+</span><span class="stat-label">참여 소상공인</span></div>
          </div>
        </div>
        <div class="hero-visual fade-in">
          <img src="@/assets/images/logo/main_logo.png" alt="물류이음" class="hero-logo" />
        </div>
      </div>
    </section>

    <!-- 인기 강의 -->
    <section class="popular-section">
      <div class="section-inner">
        <div class="section-header">
          <h2 class="section-title">인기 프로그램</h2>
          <router-link to="/login" class="section-link">전체 보기 →</router-link>
        </div>
        <div class="course-grid">
          <div v-for="course in featuredCourses" :key="course.id" class="course-card-landing">
            <div class="card-thumb" :class="course.thumbBg">
              <img :src="course.thumbSrc" :alt="course.title" class="thumb-img" />
            </div>
            <div class="card-body">
              <span class="badge" :class="course.badgeClass">{{ course.category }}</span>
              <h3 class="card-title">{{ course.title }}</h3>
              <div class="card-meta">
                <span class="instructor">{{ course.instructor }}</span>
                <span class="price">{{ course.price }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 특징 섹션 -->
    <section class="features-section">
      <div class="section-inner">
        <h2 class="section-title center">왜 물류이음일까요?</h2>
        <div class="features-grid">
          <div v-for="f in features" :key="f.title" class="feature-card">
            <div class="feature-icon">{{ f.icon }}</div>
            <h3 class="feature-title">{{ f.title }}</h3>
            <p class="feature-desc">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
      <div class="cta-inner">
        <h2>지금 바로 참여하세요</h2>
        <p>전국 340여 개 지자체와 28,000여 소상공인이 물류이음으로 배송비를 함께 줄이고 있습니다.</p>
        <router-link to="/login" class="btn btn-primary btn-lg">무료로 시작하기</router-link>
      </div>
    </section>

    <!-- 푸터 -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-logo">
          <img src="@/assets/images/logo/main_logo.png" alt="물류이음" />
          <span>물류이음</span>
        </div>
        <p class="footer-copy">© 2026 물류이음. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import AppHeader from '@/components/AppHeader.vue'

import springImg   from '@/assets/images/courses/spring_boot.png'
import vueImg      from '@/assets/images/courses/vue_js.png'
import k8sImg      from '@/assets/images/courses/kubernetes.png'
import dockerImg   from '@/assets/images/courses/docker.png'
import pythonImg   from '@/assets/images/courses/python.png'
import genaiImg    from '@/assets/images/courses/generative_ai.png'

// 랜딩 노출용 예시 데이터(로그인 전 화면). 실제 목록은 로그인 후 /courses에서 course-service로부터 불러온다.
const featuredCourses = [
  { id:1, title:'신선식품 새벽 공동배송', category:'신선식품', instructor:'서울 성동구', price:'분담금 ₩12,000', thumbSrc: springImg, thumbBg:'thumb-teal',   badgeClass:'badge-teal'   },
  { id:2, title:'생활잡화 묶음배송 프로그램', category:'생활잡화', instructor:'경기 수원시', price:'분담금 ₩9,000',  thumbSrc: vueImg,    thumbBg:'thumb-teal',   badgeClass:'badge-teal'   },
  { id:3, title:'의류·잡화 지역 물류거점 공유', category:'의류·잡화', instructor:'대구 중구', price:'분담금 ₩15,000', thumbSrc: dockerImg, thumbBg:'thumb-blue',   badgeClass:'badge-blue'   },
  { id:4, title:'가공식품 냉장 공동물류', category:'가공식품', instructor:'부산 해운대구', price:'분담금 ₩18,000', thumbSrc: pythonImg, thumbBg:'thumb-purple', badgeClass:'badge-purple' },
  { id:5, title:'뷰티·헬스 소형화물 합배송', category:'뷰티·헬스', instructor:'인천 미추홀구', price:'분담금 ₩8,000',  thumbSrc: genaiImg,  thumbBg:'thumb-pink',   badgeClass:'badge-pink'   },
  { id:6, title:'가전·전자 권역별 공동 라스트마일', category:'가전·전자', instructor:'광주 서구', price:'분담금 ₩21,000', thumbSrc: k8sImg,    thumbBg:'thumb-blue',   badgeClass:'badge-blue'   },
]

const features = [
  { icon:'🚚', title:'배송비 분담', desc:'지역 소상공인이 물량을 모아 공동배송하면 건당 배송비 부담이 크게 줄어듭니다.' },
  { icon:'🏛️', title:'지자체 지원금 반영', desc:'프로그램별 지자체 지원금이 정산에 자동 반영되어 실부담금만 냅니다.' },
  { icon:'🎯', title:'맞춤 프로그램 추천', desc:'참여 이력을 분석해 우리 가게에 맞는 공동물류 프로그램을 추천합니다.' },
  { icon:'📦', title:'신청 즉시 접수', desc:'원클릭 신청 후 정산이 완료되면 참여가 확정되고 물류 배차가 시작됩니다.' },
]
</script>

<style scoped>
.landing { background: var(--color-bg-secondary); }

/* 히어로 */
.hero {
  background: linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 50%, #f0f9ff 100%);
  border-bottom: 1px solid var(--color-border);
  padding: 80px 0 64px;
}
.hero-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 48px;
  align-items: center;
}
.hero-badge {
  display: inline-block;
  padding: 5px 14px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 16px;
}
.hero-title {
  font-size: 42px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.5px;
  color: var(--color-text-primary);
  margin-bottom: 16px;
}
.hero-desc {
  font-size: 16px;
  color: var(--color-text-secondary);
  line-height: 1.7;
  max-width: 460px;
  margin-bottom: 28px;
}
.hero-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 40px;
}
.btn-lg { padding: 12px 28px; font-size: 15px; }
.hero-stats {
  display: flex;
  gap: 36px;
}
.stat { display: flex; flex-direction: column; gap: 2px; }
.stat-num { font-size: 22px; font-weight: 700; color: var(--color-primary); }
.stat-label { font-size: 12px; color: var(--color-text-secondary); }
.hero-visual {
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero-logo {
  width: 200px;
  height: 200px;
  object-fit: contain;
  border-radius: 24px;
  box-shadow: var(--shadow-lg);
}

/* 강의 섹션 */
.popular-section { padding: 64px 0; }
.section-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.section-title { font-size: 22px; font-weight: 700; color: var(--color-text-primary); }
.section-title.center { text-align: center; margin-bottom: 40px; }
.section-link { font-size: 14px; color: var(--color-primary); font-weight: 500; }
.section-link:hover { text-decoration: underline; }

.course-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.course-card-landing {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: var(--transition);
}
.course-card-landing:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}
.card-thumb {
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.thumb-teal   { background: #E1F5EE; }
.thumb-blue   { background: #E6F1FB; }
.thumb-purple { background: #EEEDFE; }
.thumb-pink   { background: #FBEAF0; }
.thumb-img { width: 100%; height: 100%; object-fit: contain; padding: 14px; }
.card-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; }
.card-title { font-size: 14px; font-weight: 600; color: var(--color-text-primary); line-height: 1.4; }
.card-meta { display: flex; justify-content: space-between; align-items: center; }
.instructor { font-size: 12px; color: var(--color-text-secondary); }
.price { font-size: 14px; font-weight: 600; color: var(--color-primary); }

/* 특징 */
.features-section { padding: 64px 0; background: var(--color-bg-primary); }
.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.feature-card {
  padding: 28px 24px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-align: center;
  transition: var(--transition);
}
.feature-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
.feature-icon { font-size: 32px; margin-bottom: 12px; }
.feature-title { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
.feature-desc { font-size: 13px; color: var(--color-text-secondary); line-height: 1.6; }

/* CTA */
.cta-section {
  padding: 80px 0;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  text-align: center;
}
.cta-inner { max-width: 600px; margin: 0 auto; padding: 0 24px; }
.cta-inner h2 { font-size: 32px; font-weight: 700; color: #fff; margin-bottom: 12px; }
.cta-inner p { font-size: 16px; color: rgba(255,255,255,0.8); margin-bottom: 32px; }
.cta-inner .btn-primary {
  background: #fff;
  color: var(--color-primary);
  border-color: #fff;
  font-weight: 600;
}
.cta-inner .btn-primary:hover { background: #f0f7ff; }

/* 푸터 */
.footer {
  background: var(--color-text-primary);
  padding: 32px 0;
}
.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.footer-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
}
.footer-logo img { width: 28px; height: 28px; border-radius: 6px; }
.footer-copy { font-size: 13px; color: rgba(255,255,255,0.5); }
</style>
