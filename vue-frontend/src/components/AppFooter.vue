<template>
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <div class="footer-logo">
          <img src="@/assets/images/logo/main_logo.png" alt="물류이음" />
          <span>물류이음</span>
        </div>
        <p class="footer-tagline">지역이 함께 나르는 공동물류 플랫폼</p>
      </div>

      <div class="footer-col">
        <h4>서비스</h4>
        <router-link to="/courses">공동물류 프로그램</router-link>
        <router-link to="/login">소상공인 참여 신청</router-link>
        <router-link to="/login">지자체 담당자 안내</router-link>
      </div>

      <div class="footer-col">
        <h4>운영</h4>
        <p>고려대학교 마이크로서비스 아키텍처 강의용 데모</p>
        <a href="mailto:audit@korea.ac.kr">문의 · audit@korea.ac.kr</a>
      </div>
    </div>
    <p class="footer-copy">© 2026 물류이음 · 교육용 데모 서비스. All rights reserved.</p>
  </footer>
</template>

<script setup>
// 정적 푸터 — 랜딩/카탈로그 등 풀폭 페이지에서 공유한다.
</script>

<style scoped>
.footer {
  background: var(--color-text-primary);
  padding: 48px 0 28px;
}
.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 1.4fr 1fr 1.3fr;
  gap: 32px;
}
.footer-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 10px;
}
.footer-logo img { width: 28px; height: 28px; border-radius: 6px; object-fit: contain; }
.footer-tagline { font-size: 13px; color: rgba(255, 255, 255, 0.55); line-height: 1.6; }
.footer-col h4 {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 12px;
}
.footer-col a,
.footer-col p {
  display: block;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.5;
  margin-bottom: 8px;
}
.footer-col a:hover { color: #fff; text-decoration: underline; }
.footer-copy {
  max-width: 1200px;
  margin: 32px auto 0;
  padding: 18px 24px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}
@media (max-width: 900px) {
  .footer-inner { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 560px) {
  .footer-inner { grid-template-columns: 1fr; gap: 24px; }
}
</style>
