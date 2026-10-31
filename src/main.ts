import './assets/wind.css'
import './assets/theme-dark.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import modal from '@customizer/modal-x'
import vFocus from '@/directives/vFocus'
import vPrivilage from '@/directives/vPrivilage'
import vRipple from '@/directives/vRipple'
import toast from '@/toast'
import { installFloatingMenus } from '@/utils/floatingMenus'
import { installErrorReporting } from '@/features/marine/utils/errorReporting'
import { i18n } from '@/features/marine/i18n'

// Row action menus render above tables instead of being clipped by them
installFloatingMenus()

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(modal)
app.use(toast)
app.use(i18n)
app.directive('focus', vFocus)
app.directive('privilage', vPrivilage)
app.directive('ripple', vRipple)
installErrorReporting(app)
// Register modals with the .mdl.vue suffix to match the modal system's expectations

app.mount('#app')

