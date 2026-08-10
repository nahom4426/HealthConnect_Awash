import ApiService from '@/service/ApiService';

const api = new ApiService();

export async function getMetabaseEmbedToken(dashboardId = 7, expirationMinutes = 10) {
  const endpoint = '/claimconnect/reports/metabase-token';
  
  const response = await api.addAuthenticationHeader().post(endpoint, {
    dashboardId,
    expirationMinutes,
  });

  const data = response.data || response;
  return data.token || data.accessToken || data.data?.token || data.data?.accessToken || '';
}
