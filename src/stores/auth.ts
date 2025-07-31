import { defineStore } from 'pinia'
import type { LoginResponse } from '@/features/auth/authApi'
import { ref } from 'vue'

export const useAuthStore = defineStore('myAuthStore', () => {
  const auth = ref<LoginResponse>({
    token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXllckBnbWFpbC5jb20iLCJpYXQiOjE3MjY3MzE5MDIsImV4cCI6ODY0MDAxNzI2NzMxOTAyfQ.d9lI2EUE3oDicgDquqI3EYV0jEB5QD8UEfvN429GoIQ",
    userUuid: '',
    email: '',
    roleName: '',
    title: '',
    firstName: '',
    fatherName: '',
    grandFatherName: '',
    gender: 'Male ',
    mobilePhone: '',
    userStatus: 'ACTIVE',
    roles: [],
    userType: 'Payer',
    payerUuid: '',
    privileges: []
  })

  function setAuth(data: LoginResponse) {
    auth.value = data
  }

  return {
    auth,
    setAuth
  }
})
