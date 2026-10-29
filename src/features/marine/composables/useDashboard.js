import { onBeforeUnmount, ref } from "vue";
import { getDashboard } from "../api/marineApi";

// One shared poll of GET /dashboard for the alerts bell and the dashboard page (every 60 s while
// any marine page is open), so moving between pages doesn't refetch it.
const data = ref(null);
let timer = null;
let users = 0;

async function refresh() {
  const res = await getDashboard();
  if (res.ok) data.value = res.data;
  return res;
}

export function useDashboard() {
  users++;
  if (users === 1) {
    refresh();
    timer = setInterval(refresh, 60000);
  }
  onBeforeUnmount(() => {
    users--;
    if (!users) clearInterval(timer);
  });
  return { data, refresh };
}
