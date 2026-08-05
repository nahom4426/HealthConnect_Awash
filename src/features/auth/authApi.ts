import ApiService from "@/service/ApiService";

const api = new ApiService(import.meta.env?.v_API_AUTH_URI);
const path = '/users';

export function login(data) {
  return api.post(`${path}/signIn`, {
    password: data.password,
    userName: data.email,
  });
}

export function forgotPassword(email) {
  return api.post(`${path}/forgot-password`, {
    email,
  });
}

export function checkResetCodeAndSetPassword(data) {
  return api.put(`${path}/resetPassword`, {
    passwordResetCode: data.passwordResetCode,
    newPassword: data.newPassword,
    confirmPassword: data.confirmPassword,
  });
}
