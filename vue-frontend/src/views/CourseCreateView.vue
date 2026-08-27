<template>
  <div class="page-wrapper">
    <AppHeader />

    <div class="page-layout">
      <AppSidebar />

      <!-- 메인 -->
      <main class="main-content">
        <div class="content-header">
          <div>
            <h1 class="page-title">공동물류 프로그램 등록</h1>
            <p class="page-subtitle">지자체 담당자 계정으로 새로운 공동물류 프로그램을 개설합니다.</p>
          </div>
        </div>

        <div class="form-card">
          <form class="course-form" @submit.prevent="handleSubmit">
            <div class="form-group">
              <label class="form-label" for="title">프로그램명</label>
              <input
                id="title"
                v-model.trim="form.title"
                type="text"
                class="form-input"
                placeholder="예: 성동구 신선식품 새벽 공동배송 프로그램"
                maxlength="100"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="description">지원 대상 · 배송 권역 · 지원 내용</label>
              <textarea
                id="description"
                v-model.trim="form.description"
                class="form-textarea"
                rows="7"
                placeholder="- 지원 대상: 관내 등록 소상공인 (예: 전통시장 상인회 소속)&#10;- 배송 권역: 성동구 전역 + 인접 3개 동&#10;- 지자체 지원 내용: 건당 배송비의 30% 지원, 냉장 포장재 무상 제공&#10;- 모집 마감: 2026-09-30"
              ></textarea>
              <p class="form-hint">
                여기에 적은 내용은 프로그램 상세 화면 상단의 <strong>지원 대상 · 배송비 기준</strong> 영역에 그대로 노출됩니다.
              </p>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="category">배송유형</label>
                <select id="category" v-model="form.category" class="form-select">
                  <option disabled value="">배송유형을 선택하세요</option>
                  <option
                    v-for="option in categoryOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
                <p v-if="selectedCategoryBlurb" class="form-hint">{{ selectedCategoryBlurb }}</p>
              </div>

              <div class="form-group">
                <label class="form-label" for="price">참여 분담금 기준액 (원)</label>
                <input
                  id="price"
                  v-model.number="form.price"
                  type="number"
                  min="0"
                  step="1000"
                  class="form-input"
                  placeholder="예: 12000"
                />
                <p class="form-hint">지자체 지원금 적용 전 배송비 기준액입니다. 소상공인 실부담금은 정산 시 확정됩니다.</p>
              </div>
            </div>

            <div v-if="validationError" class="error-box">
              {{ validationError }}
            </div>

            <div v-if="submitError" class="error-box">
              {{ submitError }}
            </div>

            <div v-if="submitSuccess" class="success-box">
              {{ submitSuccess }}
            </div>

            <div class="form-actions">
              <router-link to="/courses" class="btn btn-ghost">
                취소
              </router-link>

              <button type="submit" class="btn btn-primary" :disabled="submitting">
                <span v-if="submitting">등록 중...</span>
                <span v-else>프로그램 등록</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import { courseApi } from '@/api/course.js'
import { useAuthStore } from '@/store/auth.js'
import { useCourseStore } from '@/store/course.js'

const router = useRouter()
const auth = useAuthStore()
const courseStore = useCourseStore()

const form = reactive({
  title: '',
  description: '',
  category: '',
  price: null
})

const submitting = ref(false)
const validationError = ref('')
const submitError = ref('')
const submitSuccess = ref('')

// 백엔드 Course.Category enum 8종과 1:1로 매핑된 표시용 배송유형 (store가 단일 소스)
const categoryOptions = courseStore.categoryOptions

const selectedCategoryBlurb = computed(() =>
  form.category ? courseStore.categoryMeta(form.category).blurb : ''
)

function validateForm() {
  validationError.value = ''

  if (!auth.user || auth.user.role !== 'INSTRUCTOR') {
    validationError.value = '지자체 담당자 계정만 프로그램을 등록할 수 있습니다.'
    return false
  }

  if (!form.title) {
    validationError.value = '프로그램명을 입력해 주세요.'
    return false
  }

  if (!form.description) {
    validationError.value = '지원 대상·배송 권역·지원 내용을 입력해 주세요.'
    return false
  }

  if (!form.category) {
    validationError.value = '배송유형을 선택해 주세요.'
    return false
  }

  if (form.price === null || form.price === undefined || form.price === '') {
    validationError.value = '참여 분담금 기준액을 입력해 주세요.'
    return false
  }

  const price = Number(form.price)
  if (Number.isNaN(price) || price < 0) {
    validationError.value = '참여 분담금 기준액은 0 이상의 숫자로 입력해 주세요.'
    return false
  }

  return true
}

async function handleSubmit() {
  submitError.value = ''
  submitSuccess.value = ''

  if (!validateForm()) return

  submitting.value = true

  try {
    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      price: Number(form.price)
    }

    const res = await courseApi.create(payload)
    console.log('[CourseCreate] create response =', res.data)

    submitSuccess.value = '프로그램이 성공적으로 등록되었습니다.'

    const createdCourseId =
      res.data?.data?.id ??
      res.data?.id

    if (createdCourseId) {
      setTimeout(() => {
        router.push(`/courses/${createdCourseId}`)
      }, 500)
    } else {
      setTimeout(() => {
        router.push('/courses')
      }, 500)
    }
  } catch (error) {
    console.error('[CourseCreate] create failed:', error)
    submitError.value =
      error.response?.data?.message ||
      '프로그램 등록에 실패했습니다.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  background: var(--color-bg-secondary);
}

.page-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 28px;
}

.main-content {
  min-width: 0;
}

.content-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.page-subtitle {
  margin-top: 6px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.form-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.course-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.form-hint {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  padding: 12px 14px;
  font-size: 14px;
  font-family: inherit;
  color: var(--color-text-primary);
  outline: none;
  transition: var(--transition);
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.form-textarea {
  resize: vertical;
  min-height: 150px;
  line-height: 1.6;
}

.error-box {
  background: #fef2f2;
  color: #dc2626;
  border-radius: var(--radius-md);
  padding: 12px 14px;
  font-size: 13px;
}

.success-box {
  background: var(--color-support-light);
  color: var(--color-support);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  font-size: 13px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 6px;
}

@media (max-width: 992px) {
  .page-layout {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
