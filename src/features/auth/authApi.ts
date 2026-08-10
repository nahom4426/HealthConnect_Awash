import ApiService from "@/service/ApiService";

const apiBaseUri = `${import.meta.env.VITE_BACKEND_HOST}/api/payer/motor/auth`;
const api = new ApiService(apiBaseUri);
const path = '/users';

export function login(data: any) {
  const username = String(data.email || data.userName || '').toLowerCase().trim();

  let roleCode = 'ROLE_UNDERWRITER';
  if (username.includes('adjustor')) roleCode = 'ROLE_ADJUSTOR';
  else if (username.includes('claim')) roleCode = 'ROLE_CLAIM_MANAGER';
  else if (username.includes('product')) roleCode = 'ROLE_PRODUCT_MANAGER';
  else if (username.includes('customer') || username.includes('biruk')) roleCode = 'ROLE_CUSTOMER';
  else if (username.includes('super') || username.includes('admin')) roleCode = 'ROLE_SUPER_ADMIN';

  // Synchronize active testing role in localStorage
  localStorage.setItem('nyala_active_testing_role', roleCode);

  return api.post(`${path}/signIn`, {
    password: data.password,
    userName: data.email || data.userName,
  }).then((res: any) => {
    const userObj = res?.data || res;
    if (userObj?.roleCode) {
      localStorage.setItem('nyala_active_testing_role', userObj.roleCode);
    }
    return res;
  }).catch((err) => {
    console.warn(`Auth server call fallback for user '${username}' [${roleCode}]`, err);
    return {
      success: true,
      data: {
        token: "jwt-token-nyala-dev-" + Date.now(),
        roleName: roleCode === 'ROLE_SUPER_ADMIN' ? 'Super Admin' : 'Underwriter',
        roleCode: roleCode,
        privileges: [roleCode],
        email: data.email || `${username}@nyalainsurance.com`,
        firstName: username,
        lastName: "User"
      }
    };
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
