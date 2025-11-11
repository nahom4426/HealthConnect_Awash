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
import CreateClaimLevelModal from '@/features/claim/modal/CreateClaimLevel.mdl.vue'
import EditClaimLevelModal from '@/features/claim/modal/EditClaimLevel.mdl.vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(modal)
app.use(toast)
app.directive('focus', vFocus)
app.directive('privilage', vPrivilage)
app.directive('ripple', vRipple)
app.component('RoleDetail.mdl.vue', RoleDetailModal)
app.component('CreateClaimLevel', CreateClaimLevelModal)
app.component('EditClaimLevel', EditClaimLevelModal)
app.mount('#app')

