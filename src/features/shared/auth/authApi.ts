import ApiService from "@/service/ApiService";

const apiBaseUri =
  import.meta.env.v_API_AUTH_URI ||
  `${import.meta.env.VITE_BACKEND_HOST || ''}/api/payer/auth`;
const api = new ApiService(apiBaseUri);
const path = '/users';

export function login(data: any) {
  return api.post(`${path}/signIn`, {
    password: data.password,
    userName: data.email || data.userName,
  }).then((res: any) => {
    const userObj = res?.data || res;
    const roleCode = userObj?.roleCode || userObj?.role || userObj?.roleName;
    if (roleCode) {
      localStorage.setItem('standard_active_testing_role', roleCode);
      localStorage.setItem('awash_active_testing_role', roleCode);
    }
    return res;
  });
}



export function forgotPassword(email: string) {
  return api.post(`${path}/forgot-password`, { email });
}

export function checkResetCodeAndSetPassword(data: any) {
  return api.post(`${path}/password/checkresetcode`, {
    passwordResetCode: data.passwordResetCode,
    newPassword: data.newPassword,
    confirmPassword: data.confirmPassword,
  });
}
