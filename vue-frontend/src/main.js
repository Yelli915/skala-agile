import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'

// 국문 UI 가독성용 Pretendard (공공 서비스 톤).
// variable + dynamic-subset: 브라우저가 실제로 쓰는 글자 구간만 내려받는다(한글 전체 포함).
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'

import '@/assets/styles/global.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
