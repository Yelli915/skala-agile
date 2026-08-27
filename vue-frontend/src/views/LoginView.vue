<template>
  <div class="login-page">
    <!-- 좌측 브랜딩 (데스크톱) -->
    <aside class="login-brand">
      <router-link to="/" class="brand">
        <img src="@/assets/images/logo/main_logo.png" alt="물류이음" class="brand-logo" />
        <span class="brand-name">물류이음</span>
      </router-link>

      <div class="brand-body">
        <h2 class="brand-headline">지역이 함께 나르면,<br />배송비는 내려갑니다</h2>
        <p class="brand-sub">
          지자체가 여는 공동물류 프로그램에 참여하고,<br />
          소상공인 배송비 부담을 함께 줄여보세요.
        </p>
        <ul class="brand-points">
          <li v-for="p in brandPoints" :key="p.label">
            <span class="point-icon" aria-hidden="true">{{ p.icon }}</span>
            <span>{{ p.label }}</span>
          </li>
        </ul>
      </div>

      <p class="brand-foot">© 2026 물류이음</p>

      <KoreaNetworkArt class="brand-art" aria-hidden="true" />
    </aside>

    <!-- 우측 폼 -->
    <main class="login-main">
      <div class="login-content fade-in-up">
        <router-link to="/" class="back-link">← 홈으로</router-link>

        <!-- 모바일 로고 -->
        <div class="mobile-brand">
          <img src="@/assets/images/logo/main_logo.png" alt="물류이음" />
          <span>물류이음</span>
        </div>

        <!-- 탭 -->
        <div class="tabs" role="tablist" aria-label="로그인 또는 회원가입">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            role="tab"
            :aria-selected="mode === tab.key"
            :class="['tab', { active: mode === tab.key }]"
            @click="switchMode(tab.key)"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- 로그인 -->
        <section v-if="mode === 'login'" class="panel" role="tabpanel">
          <header class="panel-head">
            <h1 class="panel-title">로그인</h1>
            <p class="panel-desc">
              가입한 이메일과 비밀번호를 입력해 로그인합니다.
            </p>
          </header>

          <p v-if="sessionExpired" class="alert alert-warn">
            로그인 세션이 만료되었습니다. 다시 로그인해 주세요.
          </p>

          <form class="form" @submit.prevent="handleLogin" novalidate>
            <div class="field">
              <label class="field-label" for="login-username">아이디 (이메일)</label>
              <input
                id="login-username"
                v-model.trim="loginForm.username"
                type="email"
                class="field-input"
                placeholder="user@example.com"
                autocomplete="username"
                required
              />
            </div>

            <div class="field">
              <label class="field-label" for="login-password">비밀번호</label>
              <div class="password-wrap">
                <input
                  id="login-password"
                  v-model="loginForm.password"
                  :type="showLoginPassword ? 'text' : 'password'"
                  class="field-input"
                  placeholder="비밀번호"
                  autocomplete="current-password"
                  required
                />
                <button
                  type="button"
                  class="password-toggle"
                  :aria-label="showLoginPassword ? '비밀번호 숨기기' : '비밀번호 표시'"
                  @click="showLoginPassword = !showLoginPassword"
                >
                  <svg v-if="showLoginPassword" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </div>

            <div v-if="loginError" class="alert alert-error">{{ loginError }}</div>

            <button type="submit" class="btn btn-primary btn-cta" :disabled="loggingIn">
              <span v-if="loggingIn">로그인 중…</span>
              <span v-else>로그인</span>
            </button>
          </form>

          <p class="switch-hint">
            아직 계정이 없으신가요?
            <button class="link-btn" @click="switchMode('register')">회원가입</button>
          </p>
        </section>

        <!-- 회원가입 -->
        <section v-else class="panel" role="tabpanel">
          <header class="panel-head">
            <h1 class="panel-title">회원가입</h1>
            <p class="panel-desc">
              가입 후 <strong>로그인 탭</strong>에서 로그인하면
              이용을 시작할 수 있습니다.
            </p>
          </header>

          <!-- 가입 완료 상태 -->
          <div v-if="registered" class="registered-box">
            <p class="registered-title">✅ 회원가입이 완료되었습니다</p>
            <p class="registered-desc">이제 물류이음 계정으로 로그인해 주세요.</p>
            <button class="btn btn-primary btn-cta" @click="switchMode('login')">
              로그인하러 가기 <span class="cta-arrow" aria-hidden="true">→</span>
            </button>
          </div>

          <form v-else class="form" @submit.prevent="handleRegister" novalidate>
            <div class="field">
              <label class="field-label" for="reg-name">이름</label>
              <input
                id="reg-name"
                v-model.trim="registerForm.name"
                type="text"
                class="field-input"
                :class="{ invalid: touched.name && !validName }"
                placeholder="홍길동"
                autocomplete="name"
                @blur="touched.name = true"
              />
              <p v-if="touched.name && !validName" class="field-error">이름을 입력해 주세요.</p>
            </div>

            <div class="field">
              <label class="field-label" for="reg-email">이메일</label>
              <input
                id="reg-email"
                v-model.trim="registerForm.email"
                type="email"
                class="field-input"
                :class="{ invalid: touched.email && !validEmail }"
                placeholder="user@example.com"
                autocomplete="email"
                @blur="touched.email = true"
              />
              <p v-if="touched.email && !validEmail" class="field-error">이메일 형식이 올바르지 않습니다.</p>
            </div>

            <div class="field">
              <label class="field-label" for="reg-password">비밀번호</label>
              <div class="password-wrap">
                <input
                  id="reg-password"
                  v-model="registerForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  class="field-input"
                  :class="{ invalid: touched.password && !validPassword }"
                  placeholder="8자 이상"
                  autocomplete="new-password"
                  @blur="touched.password = true"
                />
                <button
                  type="button"
                  class="password-toggle"
                  :aria-label="showPassword ? '비밀번호 숨기기' : '비밀번호 표시'"
                  @click="showPassword = !showPassword"
                >
                  <svg v-if="showPassword" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
              <p v-if="touched.password && !validPassword" class="field-error">비밀번호는 8자 이상이어야 합니다.</p>
            </div>

            <div class="field">
              <span class="field-label">역할</span>
              <div class="role-grid">
                <button
                  v-for="role in roles"
                  :key="role.value"
                  type="button"
                  :class="['role-card', { selected: registerForm.role === role.value }]"
                  :aria-pressed="registerForm.role === role.value"
                  @click="registerForm.role = role.value"
                >
                  <span class="role-icon" aria-hidden="true">{{ role.icon }}</span>
                  <span class="role-name">{{ role.name }}</span>
                  <span class="role-desc">{{ role.desc }}</span>
                </button>
              </div>
            </div>

            <div v-if="error" class="alert alert-error">{{ error }}</div>

            <button type="submit" class="btn btn-primary btn-cta" :disabled="loading">
              <span v-if="loading">가입 중…</span>
              <span v-else>회원가입</span>
            </button>
          </form>

          <p v-if="!registered" class="switch-hint">
            이미 계정이 있으신가요?
            <button class="link-btn" @click="switchMode('login')">로그인</button>
          </p>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'
import { authApi } from '@/api/auth.js'
import KoreaNetworkArt from '@/components/KoreaNetworkArt.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const sessionExpired = computed(() => route.query.expired === '1')

/* 로그인 후 돌아갈 목적지.
   랜딩의 프로그램 카드/‘전체 보기’가 ?redirect=/courses/123 형태로 넘겨준다.
   OAuth(전체 페이지 리다이렉트) 흐름에서도 살아남도록 세션에 보관하고,
   CallbackView 가 같은 키를 읽어 이동한다. 오픈 리다이렉트 방지를 위해 same-origin 경로만 허용. */
function safeInternalPath(value) {
  return typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.startsWith('/login') &&
    !value.startsWith('/callback')
    ? value
    : ''
}
const REDIRECT_KEY = 'post_login_redirect'
const initialRedirect = safeInternalPath(route.query.redirect)
if (initialRedirect) {
  sessionStorage.setItem(REDIRECT_KEY, initialRedirect)
}
function consumePostLoginRedirect() {
  const stored = safeInternalPath(sessionStorage.getItem(REDIRECT_KEY))
  sessionStorage.removeItem(REDIRECT_KEY)
  return stored || '/courses'
}

const tabs = [
  { key: 'login', label: '로그인' },
  { key: 'register', label: '회원가입' },
]
// 랜딩 히어로의 타깃별 CTA가 ?tab=register&role=INSTRUCTOR 형태로 넘겨준다.
const mode = ref(route.query.tab === 'register' ? 'register' : 'login')

const loading = ref(false)
const error = ref('')
const registered = ref(false)
const showPassword = ref(false)

/* 로그인(아이디/비밀번호) */
const loginForm = reactive({ username: '', password: '' })
const loggingIn = ref(false)
const loginError = ref('')
const showLoginPassword = ref(false)

const registerForm = reactive({
  name: '',
  email: '',
  password: '',
  role: route.query.role === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT',
})
const touched = reactive({ name: false, email: false, password: false })

const brandPoints = [
  { icon: '🚚', label: '참여 중인 공동물류 프로그램 관리' },
  { icon: '🎯', label: '우리 가게에 맞는 프로그램 추천' },
  { icon: '🧾', label: '정산·분담금 내역 확인' },
]

// value는 백엔드 User.role enum 그대로 전송 (STUDENT / INSTRUCTOR)
const roles = [
  { value: 'STUDENT', icon: '🏪', name: '소상공인', desc: '공동물류 프로그램에 참여 신청' },
  { value: 'INSTRUCTOR', icon: '🏢', name: '지자체 담당자', desc: '공동물류 프로그램을 개설·운영' },
]

const validName = computed(() => registerForm.name.length > 0)
const validEmail = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email))
const validPassword = computed(() => registerForm.password.length >= 8)
const formValid = computed(() => validName.value && validEmail.value && validPassword.value)

function switchMode(next) {
  mode.value = next
  error.value = ''
  loginError.value = ''
}

async function handleLogin() {
  loginError.value = ''

  if (!loginForm.username || !loginForm.password) {
    loginError.value = '이메일과 비밀번호를 입력해 주세요.'
    return
  }

  loggingIn.value = true
  try {
    await auth.loginWithPassword(loginForm.username, loginForm.password)
    router.replace(consumePostLoginRedirect())
  } catch (e) {
    console.error('[Login] 로그인 실패:', e)
    if (e?.stage === 'credentials') {
      loginError.value = '아이디 또는 비밀번호가 올바르지 않습니다.'
    } else if (e?.stage === 'profile') {
      loginError.value = '로그인은 되었으나 사용자 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
    } else {
      loginError.value = '로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    }
  } finally {
    loggingIn.value = false
  }
}

async function handleRegister() {
  error.value = ''
  touched.name = touched.email = touched.password = true

  if (!formValid.value) {
    error.value = '입력값을 다시 확인해 주세요.'
    return
  }

  loading.value = true
  try {
    await authApi.register({ ...registerForm })
    registered.value = true
  } catch (e) {
    error.value = e.response?.data?.message || '회원가입에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  /* 로그인/회원가입이 놓이는 우측 영역을 넓게 */
  grid-template-columns: minmax(0, 1fr) clamp(560px, 46%, 820px);
}

/* ── 좌측 브랜딩 ── */
.login-brand {
  position: relative;
  overflow: hidden;
  background: #123F82;
  /* 브랜딩 문구를 좌측 가장자리에서 떼어 패널 안쪽(더 오른쪽)에 배치 */
  padding: 64px 64px 56px clamp(72px, 13vw, 176px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 56px;
  color: #fff;
}

/* 브랜딩 문구는 항상 배경 일러스트 위에 */
.brand,
.brand-body,
.brand-foot {
  position: relative;
  z-index: 1;
}

/* 전국 공동물류 네트워크 — 패널 전체를 덮는 배경 일러스트 */
.brand-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand-logo {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  object-fit: contain;
  background: rgba(255, 255, 255, 0.12);
  padding: 5px;
}
.brand-name {
  font-size: 19px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.01em;
}
.brand-body {
  max-width: 420px;
}
.brand-headline {
  font-size: 34px;
  font-weight: 800;
  line-height: 1.42;
  letter-spacing: -0.02em;
  margin-bottom: 24px;
}
.brand-sub {
  font-size: 15px;
  line-height: 1.85;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 44px;
}
.brand-points {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.brand-points li {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 14.5px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.94);
}
.point-icon {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.14);
  font-size: 18px;
}
.brand-foot {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

/* ── 우측 폼 (카드 없이 영역에 직접) ── */
.login-main {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  /* 상단 고정: 탭 전환으로 콘텐츠 양이 달라져도 시작 위치가 흔들리지 않도록
     세로 중앙 정렬 대신 위에서부터 배치한다 */
  padding: 88px 80px 64px;
  background: var(--color-bg-primary);
  overflow-y: auto;
}
.login-content {
  width: 100%;
  max-width: 480px;
}
.back-link {
  display: inline-block;
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 32px;
  transition: var(--transition);
}
.back-link:hover {
  color: var(--color-primary);
}

.mobile-brand {
  display: none;
  align-items: center;
  gap: 9px;
  font-size: 17px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 24px;
}
.mobile-brand img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

/* 탭 */
.tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 6px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-lg);
  margin-bottom: 32px;
}
.tab {
  position: relative;
  padding: 12px 0;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: transparent;
  transition: var(--transition);
}
.tab:hover {
  color: var(--color-text-primary);
}
.tab.active {
  background: var(--color-bg-primary);
  color: var(--color-primary);
  font-weight: 700;
  box-shadow: var(--shadow-sm);
}
.tab.active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 6px;
  transform: translateX(-50%);
  width: 20px;
  height: 2.5px;
  border-radius: 2px;
  background: var(--color-primary);
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.panel-head {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.panel-title {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
}
.panel-desc {
  font-size: 13px;
  line-height: 1.75;
  color: var(--color-text-secondary);
}
.panel-desc strong {
  color: var(--color-text-primary);
  font-weight: 700;
}

/* 메인 버튼 */
.btn-cta {
  width: 100%;
  padding: 15px;
  font-size: 15px;
  font-weight: 600;
  border-radius: var(--radius-md);
  justify-content: center;
  gap: 6px;
}
.cta-arrow {
  font-size: 14px;
  font-weight: 500;
}

/* 하단 링크 */
.switch-hint {
  text-align: center;
  font-size: 13px;
  color: var(--color-text-muted);
}
.link-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 0 2px;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.link-btn:hover {
  color: var(--color-primary-dark);
}

/* 폼 */
.form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.field-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}
.field-input {
  width: 100%;
  padding: 13px 15px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  transition: var(--transition);
  outline: none;
}
.field-input::placeholder {
  color: var(--color-text-muted);
  opacity: 0.75;
}
.field-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}
.field-input.invalid {
  border-color: var(--color-danger);
}
.field-input.invalid:focus {
  box-shadow: 0 0 0 3px #fde8e8;
}
.field-error {
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-danger);
}

.password-wrap {
  position: relative;
}
.password-wrap .field-input {
  padding-right: 46px;
}
.password-toggle {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
}
.password-toggle:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}

/* 역할 선택 카드 */
.role-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 2px;
}
.role-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
  padding: 18px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-primary);
  transition: var(--transition);
}
.role-card:hover {
  border-color: var(--color-border-hover);
  background: var(--color-bg-secondary);
}
.role-card.selected {
  border-width: 2px;
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  box-shadow: 0 0 0 3px rgba(24, 95, 165, 0.1);
}
.role-icon {
  font-size: 24px;
  line-height: 1;
  margin-bottom: 2px;
}
.role-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
}
.role-card.selected .role-name {
  color: var(--color-primary-dark);
}
.role-desc {
  font-size: 11px;
  line-height: 1.45;
  color: var(--color-text-secondary);
}

.alert {
  padding: 11px 14px;
  border-radius: var(--radius-md);
  font-size: 13px;
  line-height: 1.6;
}
.alert-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: var(--color-danger);
}
.alert-warn {
  background: var(--color-warning-light);
  border: 1px solid #f0d9b0;
  color: var(--color-warning);
}

.registered-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  border: 1px solid var(--color-support);
  background: var(--color-support-light);
  border-radius: var(--radius-md);
}
.registered-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-support);
}
.registered-desc {
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

/* ── 반응형 ── */
@media (max-width: 960px) {
  .login-page {
    grid-template-columns: 1fr;
  }
  .login-brand {
    display: none;
  }
  .mobile-brand {
    display: flex;
  }
  .login-main {
    padding: 48px 32px;
  }
  .login-content {
    max-width: 460px;
  }
}

@media (max-width: 480px) {
  .login-main {
    padding: 32px 20px;
  }
  .role-grid {
    grid-template-columns: 1fr;
  }
  .panel-title {
    font-size: 23px;
  }
}
</style>
