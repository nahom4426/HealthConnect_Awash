import { useUserStore } from "@/stores/userStore";

const userIsLoggedIn = (pinia) => {
  const store = useUserStore(pinia);
  return store.userIsLoggedIn;
};

const getUser = (pinia) => {
  const store = useUserStore(pinia);
  return store.user;
};
 

const setUserIsLoggedIn = (state) => {
  const store = useUserStore();
  store.setUserLoggedIn(state);
};

const logoutUser = () => {
  const store = useUserStore();
  store.logout();
};

export { userIsLoggedIn, setUserIsLoggedIn, logoutUser, getUser };
