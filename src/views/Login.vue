<script setup>
import LoginForm from "./LoginForm.vue";
import logo from "@/assets/img/logoD.png";
import mark from "@/assets/img/nyala-mark.png";
import family from "@/assets/img/login-family.png";

const year = new Date().getFullYear();

const features = [
  {
    title: "Secure digital platform",
    text: "Role-based access and an audit trail on every action.",
    icon: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
  },
  {
    title: "Real-time policy management",
    text: "Issue, amend and renew institutional policies in one place.",
    icon: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z",
  },
  {
    title: "Reliable claim management",
    text: "Verify, approve and settle claims with clear status tracking.",
    icon: "M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75",
  },
];
</script>

<template>
  <div class="overflow-y-auto relative h-full login-backdrop">
    <!-- Decorative layer (clipped so it never adds scroll) -->
    <div class="overflow-hidden absolute inset-0 pointer-events-none" aria-hidden="true">
      <div class="login-rings" />
      <div class="login-orb login-orb--bronze" />
      <div class="login-orb login-orb--rust" />
    </div>

    <div class="flex relative flex-col min-h-full">
      <!-- Brand -->
      <header class="flex gap-3 items-center px-5 pt-6 sm:px-10 sm:pt-8 lg:px-14">
        <span class="grid place-items-center w-10 h-10 bg-white rounded-xl shadow-sm">
          <img :src="mark" alt="" class="w-7 h-7" />
        </span>
        <span class="text-lg font-semibold tracking-tight text-white">Nyala Insurance</span>
      </header>

      <div
        class="grid flex-1 gap-10 items-center px-4 py-8 mx-auto w-full max-w-[1400px] sm:px-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-12 lg:px-14 xl:gap-20"
      >
        <!-- Story (desktop) -->
        <section class="hidden flex-col-reverse gap-8 items-center lg:flex 2xl:flex-row 2xl:gap-12 2xl:justify-between" aria-label="About Health Connect">
          <ul class="space-y-5 w-full max-w-md 2xl:max-w-sm 2xl:space-y-6">
            <li v-for="item in features" :key="item.title" class="flex gap-4 items-start">
              <span class="grid place-items-center w-10 h-10 rounded-xl ring-1 shrink-0 bg-white/10 ring-white/15 text-[#f3cfa6]" aria-hidden="true">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path :d="item.icon" />
                </svg>
              </span>
              <div>
                <p class="text-base font-semibold text-white">{{ item.title }}</p>
                <p class="mt-0.5 text-sm leading-relaxed text-white/70">{{ item.text }}</p>
              </div>
            </li>
          </ul>

          <div class="relative w-full max-w-[300px] xl:max-w-[340px] 2xl:max-w-[460px] 2xl:flex-1 login-hero">
            <img :src="family" alt="A family protected under an umbrella" class="relative mx-auto w-full h-auto max-h-[42vh] 2xl:max-h-[60vh] object-contain" width="392" height="511" />
          </div>
        </section>

        <!-- Sign in -->
        <main class="justify-self-center w-full max-w-[440px] login-card" aria-labelledby="login-title">
          <div class="flex justify-center mb-6">
            <img :src="logo" alt="Nyala Insurance" class="w-auto h-14 sm:h-16" />
          </div>
          <LoginForm />
        </main>
      </div>

      <footer class="px-5 pb-6 text-xs text-center sm:px-10 lg:px-14 lg:text-left text-white/60">
        © {{ year }} Nyala Insurance S.C. All rights reserved.
      </footer>
    </div>
  </div>
</template>

<style scoped>
.login-backdrop {
  isolation: isolate;
  background: linear-gradient(150deg, rgb(96 76 70) 0%, rgb(70 54 50) 45%, rgb(40 29 27) 100%);
}

/* Concentric rings centred behind the card (CSS replacement for ornament.jpg) */
.login-rings {
  position: absolute;
  inset: -20%;
  background: repeating-radial-gradient(
    circle at 76% 50%,
    rgb(255 255 255 / 0.055) 0 3px,
    transparent 3px 46px
  );
  mask-image: radial-gradient(ellipse at 70% 50%, #000 25%, transparent 72%);
  -webkit-mask-image: radial-gradient(ellipse at 70% 50%, #000 25%, transparent 72%);
}

.login-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(80px);
}
.login-orb--bronze {
  width: 460px;
  height: 460px;
  right: 6%;
  top: 4%;
  background: radial-gradient(circle, rgb(184 128 84 / 0.42), rgb(184 128 84 / 0) 70%);
}
.login-orb--rust {
  width: 520px;
  height: 520px;
  left: 22%;
  bottom: -12%;
  background: radial-gradient(circle, rgb(150 70 30 / 0.4), rgb(150 70 30 / 0) 70%);
}

/* Soft spotlight + ground shadow under the illustration */
.login-hero::before {
  content: "";
  position: absolute;
  inset: 4% -10% 0;
  border-radius: 9999px;
  background: radial-gradient(circle at 50% 55%, rgb(255 255 255 / 0.16), rgb(255 255 255 / 0) 65%);
}
.login-hero::after {
  content: "";
  position: absolute;
  left: 18%;
  right: 18%;
  bottom: -6px;
  height: 22px;
  border-radius: 9999px;
  background: radial-gradient(ellipse, rgb(0 0 0 / 0.35), rgb(0 0 0 / 0) 70%);
}

/* ---------- Light frosted-glass card ---------- */
.login-card {
  --control-h: 2.875rem;
  position: relative;
  padding: 2.25rem 2.25rem 2rem;
  border-radius: 1.5rem;
  background: rgb(255 255 255 / 0.86);
  border: 1px solid rgb(255 255 255 / 0.7);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.9),
    0 30px 70px -20px rgb(25 12 6 / 0.6);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  backdrop-filter: blur(20px) saturate(160%);
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .login-card {
    background: rgb(255 255 255);
  }
}
@media (prefers-reduced-transparency: reduce) {
  .login-card {
    background: rgb(255 255 255);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}

/* Fields sit as crisp white inputs on the frosted card */
.login-card :deep(.input-shell) {
  background: rgb(255 255 255);
}

@media (max-width: 480px) {
  .login-card {
    padding: 1.75rem 1.25rem 1.5rem;
    border-radius: 1.25rem;
  }
}

@media (pointer: coarse) {
  .login-card {
    --control-h: 3rem;
  }
}
</style>
