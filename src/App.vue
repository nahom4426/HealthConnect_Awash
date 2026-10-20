<script setup>
import { computed, onMounted, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { useSocket } from './composables/useSocket';
import { useNotifications } from './store/notifications';
import { useAuthStore } from './stores/auth';
import { routeLoading } from './router/loading';
// import { useAuth } from './store/auth';

const auth = useAuthStore();

const socket = useSocket();
const notifications = useNotifications();

watchEffect(async (cleanUp) => {
  if (!auth.auth?.user?.userUuid && !auth.auth?.user?.userType) return;

  try {
    let sock = await socket.connect();
    socket.send(
      '/app/notification',  // The destination endpoint
      JSON.stringify({
        userName: auth.auth?.user?.user, // Add userName to the payload
        userUuid: auth.auth?.user?.userUuid, // Add userUuid to the payload
        token: auth.auth?.user?.token       // Optionally, you can still include token
      })
    );
    socket.subscribe('/topic/notify', (messgae) => {
      
      let messages = JSON.parse(messgae.body);
      let type = Array.isArray(messages) ? messages?.[0]?.userType : messages.userType
      if(type == auth.auth?.user?.userType) {
        notifications.setNotifications(messgae);
      }
    })
  } catch (err) {
    console.error(err);
  }

  return cleanUp(async () => {
    await socket.unSub();
  });
});
</script>

<template>
  <!-- Page-switch progress bar -->
  <div
    class="route-progress"
    :class="{ 'route-progress--active': routeLoading }"
    role="progressbar"
    aria-label="Loading page"
    :aria-hidden="!routeLoading"
  >
    <div class="route-progress__bar" />
  </div>
  <router-view />
</template>

<style>
.route-progress {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 10001;
  height: 3px;
  overflow: hidden;
  pointer-events: none;
  opacity: 0;
  transition: opacity 200ms ease;
}
.route-progress--active {
  opacity: 1;
}
.route-progress__bar {
  width: 40%;
  height: 100%;
  border-radius: 0 9999px 9999px 0;
  background: linear-gradient(90deg, rgb(var(--primary)), rgb(var(--brand-accent)));
  box-shadow: 0 0 8px rgb(var(--brand-accent) / 0.6);
  transform: translateX(-100%);
}
.route-progress--active .route-progress__bar {
  animation: route-progress 1.1s var(--ease-out) infinite;
}
@keyframes route-progress {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(260%);
  }
}
</style>
 