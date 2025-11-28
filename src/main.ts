import './assets/wind.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import modal from '@customizer/modal-x'
import vFocus from '@/directives/vFocus'
import vPrivilage from '@/directives/vPrivilage'
import vRipple from '@/directives/vRipple'
import toast from '@/toast'
import RoleDetailModal from '@/features/admin/role/components/RoleDetail.mdl.vue'
import CompletedPaymentModal from '@/features/claim/modal/CompletedPaymentModal.mdl.vue'
import ClaimPaymentModal from '@/features/insured_persons/components/ClaimPayment.mdl.vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(modal)
app.use(toast)
app.directive('focus', vFocus)
app.directive('privilage', vPrivilage)
app.directive('ripple', vRipple)
// Register modals with the .mdl.vue suffix to match the modal system's expectations
app.component('RoleDetail.mdl.vue', RoleDetailModal)
app.component('CompletedPaymentModal.mdl.vue', CompletedPaymentModal)
app.mount('#app')

