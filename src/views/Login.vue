<script setup>
import LoginForm from "./LoginForm.vue";
import logo from "@/assets/img/logo.png";

const year = new Date().getFullYear();
</script>

<template>
  <div class="overflow-y-auto relative h-full login-backdrop">
    <!-- Brand backdrop: curves echo the sweep of the Awash "A"; cyan glow from the logo's accent -->
    <svg
      class="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="login-glow-cyan" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1240 820) scale(620)">
          <stop offset="0" stop-color="#00AED9" stop-opacity="0.35" />
          <stop offset="1" stop-color="#00AED9" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="login-glow-top" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(160 40) scale(560)">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.10" />
          <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
      </defs>

      <rect width="1440" height="900" fill="url(#login-glow-cyan)" />
      <rect width="1440" height="900" fill="url(#login-glow-top)" />

      <!-- Broad soft sweeps -->
      <path d="M-120 760 C 220 760 360 420 640 300 S 1180 160 1560 220 L 1560 900 L -120 900 Z" fill="#ffffff" fill-opacity="0.035" />
      <path d="M-120 860 C 300 860 520 600 820 520 S 1300 470 1560 520 L 1560 900 L -120 900 Z" fill="#ffffff" fill-opacity="0.04" />

      <!-- Fine contour lines -->
      <g fill="none" stroke="#ffffff" stroke-linecap="round">
        <path d="M-80 640 C 260 640 380 300 680 200 S 1200 90 1540 150" stroke-opacity="0.10" stroke-width="1.5" />
        <path d="M-80 690 C 280 690 410 350 710 250 S 1220 140 1540 200" stroke-opacity="0.07" stroke-width="1.2" />
        <path d="M-80 740 C 300 740 440 400 740 300 S 1240 190 1540 250" stroke-opacity="0.05" stroke-width="1" />
      </g>

    </svg>

    <div class="flex relative flex-col justify-center items-center px-4 py-10 min-h-full sm:py-16">
      <main
        class="w-full max-w-[460px] login-card"
        aria-labelledby="login-title"
      >
        <div class="flex justify-center mb-8">
          <img :src="logo" alt="Awash Insurance" class="w-auto h-12 sm:h-14" />
        </div>
        <LoginForm />
      </main>

      <footer class="mt-8 text-center">
        <p class="text-xs text-white/65">© {{ year }} Awash Insurance Company S.C. · Health Connect</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.login-backdrop {
  background:
    linear-gradient(160deg, rgb(var(--primary)) 0%, rgb(var(--primary-hover)) 55%, rgb(20 30 72) 100%);
}

.login-card {
  /* Roomier fields than the in-app default */
  --control-h: 2.875rem;
  padding: 2.5rem;
  border-radius: 1.25rem;
  background: rgb(var(--surface));
  box-shadow:
    0 1px 2px rgb(0 0 0 / 0.08),
    0 24px 60px -12px rgb(8 15 45 / 0.55);
}

@media (max-width: 480px) {
  .login-card {
    padding: 1.75rem 1.25rem;
    border-radius: 1rem;
  }
}

@media (pointer: coarse) {
  .login-card {
    --control-h: 3rem;
  }
}
</style>
