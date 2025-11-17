import { useToast } from "@/toast/store/toast";
import { defineStore } from "pinia";


// const toast = useToast();

export const useUserStore = defineStore("userStore", {
  state: () => {
    return {
      session: {
        userIsLoggedIn: false,
        user: {
          accessToken: "",
          personalInfos: {},
          privileges: [],
        },
      },
    };
  },
  /**
   * 💪 This is needed to PERSIST your store values.
   * Otherwise they will be lost when you refresh the page.
   * */
  persist: {
    enabled: true,
    strategies: [
      {
        key: "userStore",
        storage: localStorage, // or sessionStorage
      },
    ],
  },
  getters: {
    userIsLoggedIn(state) {
      return state.session.userIsLoggedIn;
    },
    user(state) {
      return state.session.user;
    },
  },
  actions: {
    setUserLoggedIn({ accessToken, privileges, personalInfos }) {
      this.session.userIsLoggedIn = true;
      this.session.user = { accessToken, privileges, personalInfos };
    },
    logout() {
      this.session.userIsLoggedIn = false;
      this.session.user = null;
      // toast.addToast({ type: 'success', title: 'Logged Out', message: 'You have successfully logged out' });
    },
  },
});
