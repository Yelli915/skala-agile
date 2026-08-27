<template>
  <div class="login-page">
    <!-- 좌측 브랜딩 (데스크톱) -->
    <aside class="login-brand">
      <router-link to="/" class="brand">
        <img src="@/assets/images/logo/main_logo.png" alt="물류이음" class="brand-logo" />
        <span class="brand-name">물류이음</span>
      </router-link>

      <div class="brand-body">
        <h2 class="brand-headline">지역이 함께 나르면,<br>배송비는 내려갑니다</h2>
        <p class="brand-sub">
          지자체가 여는 공동물류 프로그램에 참여하고,<br>
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
    </aside>

    <!-- 우측 폼 -->
    <main class="login-main">
      <div class="login-card fade-in-up">
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
          <h1 class="panel-title">로그인</h1>
          <p class="panel-desc">
            물류이음 계정으로 로그인합니다. 버튼을 누르면 인증 서버로 이동해
            안전하게 로그인한 뒤 다시 돌아옵니다.
          </p>

          <button
            class="btn btn-primary btn-full"
            :disabled="redirecting"
            @click="handleOAuth"
          >
            <span v-if="redirecting">인증 서버로 이동 중…</span>
            <span v-else>물류이음 계정으로 로그인 →</span>
          </button>

          <p class="switch-hint">
            아직 계정이 없으신가요?
            <button class="link-btn" @click="switchMode('register')">회원가입</button>
          </p>
        </section>

        <!-- 회원가입 -->
        <section v-else class="panel" role="tabpanel">
          <h1 class="panel-title">회원가입</h1>
          <p class="panel-desc">
            가입 후 <strong>로그인 탭</strong>에서 인증 서버를 통해 로그인하면 이용을 시작할 수 있습니다.
          </p>

          <!-- 가입 완료 상태 -->
          <div v-if="registered" class="registered-box">
            <p class="registered-title">✅ 회원가입이 완료되었습니다</p>
            <p class="registered-desc">이제 물류이음 계정으로 로그인해 주세요.</p>
            <button class="btn btn-primary btn-full" @click="switchMode('login')">
              로그인하러 가기 →
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
                  {{ showPassword ? '🙈' : '👁️' }}
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
                  @click="registerForm.role = role.value"
                >
                  <span class="role-icon" aria-hidden="true">{{ role.icon }}</span>
                  <span class="role-name">{{ role.name }}</span>
                  <span class="role-desc">{{ role.desc }}</span>
                </button>
              </div>
            </div>

            <div v-if="error" class="alert alert-error">{{ error }}</div>

            <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
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
import { useAuthStore } from '@/store/auth.js'
import { authApi } from '@/api/auth.js'

const auth = useAuthStore()

const tabs = [
  { key: 'login', label: '로그인' },
  { key: 'register', label: '회원가입' },
]
const mode = ref('login')

const redirecting = ref(false)
const loading = ref(false)
const error = ref('')
const registered = ref(false)
const showPassword = ref(false)

const registerForm = reactive({ name: '', email: '', password: '', role: 'STUDENT' })
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
}

function handleOAuth() {
  redirecting.value = true
  auth.redirectToLogin()
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
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

/* ── 좌측 브랜딩 ── */
.login-brand {
  background: linear-gradient(160deg, #0C447C 0%, #185FA5 52%, #2E86C7 100%);
  padding: 48px 56px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 40px;
  color: #fff;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.brand-logo {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  object-fit: contain;
  background: rgba(255, 255, 255, 0.12);
  padding: 4px;
}
.brand-name {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}
.brand-headline {
  font-size: 30px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: -0.5px;
  margin-bottom: 16px;
}
.brand-sub {
  font-size: 15px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.78);
  margin-bottom: 32px;
}
.brand-points {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.brand-points li {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.92);
}
.point-icon {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.14);
  font-size: 17px;
}
.brand-foot {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

/* ── 우측 폼 ── */
.login-main {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background: var(--color-bg-secondary);
}
.login-card {
  width: 100%;
  max-width: 400px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  padding: 32px 28px;
}
.back-link {
  display: inline-block;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 20px;
  transition: var(--transition);
}
.back-link:hover {
  color: var(--color-primary);
}

.mobile-brand {
  display: none;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 20px;
}
.mobile-brand img {
  width: 30px;
  height: 30px;
  object-fit: contain;
}

/* 탭 */
.tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 4px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  margin-bottom: 24px;
}
.tab {
  padding: 9px 0;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: transparent;
  transition: var(--transition);
}
.tab.active {
  background: var(--color-bg-primary);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.panel-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
}
.panel-desc {
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin-top: -6px;
}

.btn-full {
  width: 100%;
  padding: 13px;
  font-size: 15px;
  justify-content: center;
}
.btn-primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.switch-hint {
  text-align: center;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.link-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0 2px;
  text-decoration: underline;
}

/* 폼 */
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}
.field-input {
  width: 100%;
  padding: 11px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  transition: var(--transition);
  outline: none;
}
.field-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}
.field-input.invalid {
  border-color: var(--color-danger);
}
.field-error {
  font-size: 12px;
  color: var(--color-danger);
}

.password-wrap {
  position: relative;
}
.password-wrap .field-input {
  padding-right: 44px;
}
.password-toggle {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: transparent;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.password-toggle:hover {
  background: var(--color-bg-tertiary);
}

/* 역할 선택 카드 */
.role-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.role-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 12px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  text-align: left;
  transition: var(--transition);
}
.role-card:hover {
  border-color: var(--color-border-hover);
}
.role-card.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}
.role-icon {
  font-size: 20px;
}
.role-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
}
.role-desc {
  font-size: 11px;
  line-height: 1.4;
  color: var(--color-text-secondary);
}

.alert {
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 13px;
  line-height: 1.5;
}
.alert-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: var(--color-danger);
}

.registered-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px;
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
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}

/* ── 반응형 ── */
@media (max-width: 880px) {
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
    padding: 32px 16px;
  }
}

@media (max-width: 400px) {
  .login-card {
    padding: 24px 18px;
    border: none;
    box-shadow: none;
    background: transparent;
  }
  .role-grid {
    grid-template-columns: 1fr;
  }
}
</style>
