<script setup>
import LoginForm from "./LoginForm.vue";
import ThemeToggle from "@/components/ThemeToggle.vue";
import mark from "@/assets/img/nyala-mark.png";

const year = new Date().getFullYear();

const highlights = [
  {
    title: "Policies",
    text: "Issue, amend and renew in one place",
    icon: "M9 12h6m-6 4h6M8 3.75h8A2.25 2.25 0 0 1 18.25 6v13.5A1.5 1.5 0 0 1 16.75 21H7.25a1.5 1.5 0 0 1-1.5-1.5V6A2.25 2.25 0 0 1 8 3.75ZM9 8h6",
  },
  {
    title: "Claims",
    text: "Verify, approve and settle with clear tracking",
    icon: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  },
  {
    title: "Providers",
    text: "Contracts, services and networks connected",
    icon: "M12 21s-7.5-4.35-7.5-10.5A4.5 4.5 0 0 1 12 7.5a4.5 4.5 0 0 1 7.5 3c0 6.15-7.5 10.5-7.5 10.5Z",
  },
];
</script>

<template>
  <div class="login-page">
    <!-- ================= Brand panel ================= -->
    <aside class="brand" aria-label="Nyala HealthConnect">
      <div class="brand__glow brand__glow--a" aria-hidden="true" />
      <div class="brand__glow brand__glow--b" aria-hidden="true" />
      <div class="brand__grain" aria-hidden="true" />

      <header class="brand__top">
        <span class="brand__chip">
          <img :src="mark" alt="" class="w-6 h-6" />
          Nyala Insurance S.C.
        </span>
      </header>

      <div class="brand__center">
        <!-- Emblem: the antelope inside slowly turning metallic rings -->
        <div class="emblem" aria-hidden="true">
          <span class="emblem__ring emblem__ring--1" />
          <span class="emblem__ring emblem__ring--2" />
          <span class="emblem__ring emblem__ring--3" />
          <span class="emblem__halo" />
          <img :src="mark" alt="" class="emblem__mark" />
        </div>

        <h2 class="brand__title">
          Nyala <span class="brand__title-accent">HealthConnect</span>
        </h2>
        <p class="brand__tagline">Health insurance, connected — policies, claims and providers on one secure platform.</p>

        <!-- Heartbeat -->
        <svg class="pulse" viewBox="0 0 600 80" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="pulse-stroke" x1="0" x2="1">
              <stop offset="0" stop-color="#e9b98a" stop-opacity="0" />
              <stop offset="0.25" stop-color="#e9b98a" />
              <stop offset="0.75" stop-color="#f6d9b8" />
              <stop offset="1" stop-color="#f6d9b8" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path
            class="pulse__line"
            d="M0 40 H170 L190 40 L205 14 L222 66 L238 26 L250 40 H330 L345 40 L358 22 L372 58 L384 40 H600"
            fill="none"
            stroke="url(#pulse-stroke)"
            stroke-width="3.5" vector-effect="non-scaling-stroke"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

        <ul class="highlights">
          <li v-for="(h, i) in highlights" :key="h.title" class="highlight" :style="{ animationDelay: `${i * 0.9}s` }">
            <span class="highlight__icon" aria-hidden="true">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path :d="h.icon" />
              </svg>
            </span>
            <span class="min-w-0">
              <span class="block text-sm font-semibold text-white">{{ h.title }}</span>
              <span class="block text-xs leading-snug text-white/65">{{ h.text }}</span>
            </span>
          </li>
        </ul>
      </div>

      <footer class="brand__foot">© {{ year }} Nyala Insurance S.C. All rights reserved.</footer>
    </aside>

    <!-- ================= Sign in ================= -->
    <section class="signin">
      <div class="signin__bar">
        <ThemeToggle />
      </div>

      <main class="signin__card" aria-labelledby="login-title">
        <div class="signin__brand">
          <span class="signin__mark">
            <img :src="mark" alt="" class="w-9 h-9" />
          </span>
          <span class="leading-tight">
            <span class="block text-base font-bold tracking-tight text-ink">Nyala Insurance</span>
            <span class="block text-xs font-semibold tracking-[0.18em] uppercase text-primary">HealthConnect</span>
          </span>
        </div>

        <LoginForm />
      </main>

      <p class="signin__foot">© {{ year }} Nyala Insurance S.C.</p>
    </section>
  </div>
</template>

<style scoped>
/* ---------------------------------------------------------------------------
   Layout: brand panel + sign-in column (stacked on small screens)
   --------------------------------------------------------------------------- */
.login-page {
  display: grid;
  grid-auto-rows: max-content; /* phones: band + form stacked at their natural height */
  min-height: 100%;
  height: 100%;
  overflow-y: auto;
  background: rgb(var(--canvas));
}
@media (min-width: 1024px) {
  .login-page {
    grid-template-columns: minmax(0, 1.15fr) minmax(460px, 1fr);
    grid-auto-rows: auto;
    overflow: hidden;
  }
}

/* ---------------------------------------------------------------------------
   Brand panel
   --------------------------------------------------------------------------- */
.brand {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 1.25rem 1.25rem 2.5rem;
  color: #fff;
  background:
    radial-gradient(120% 90% at 85% 10%, rgb(184 128 84 / 0.45), transparent 55%),
    radial-gradient(90% 80% at 0% 100%, rgb(140 60 22 / 0.5), transparent 60%),
    linear-gradient(160deg, #4a3732 0%, #33241f 48%, #1d1412 100%);
}
@media (min-width: 1024px) {
  .brand {
    padding: 2.25rem 3rem 2rem;
    border-radius: 0 2rem 2rem 0;
    box-shadow: 18px 0 50px -20px rgb(20 10 6 / 0.55);
    z-index: 1;
  }
}

.brand__glow {
  position: absolute;
  border-radius: 9999px;
  filter: blur(70px);
  z-index: -1;
  animation: drift 18s ease-in-out infinite alternate;
}
.brand__glow--a {
  width: 380px;
  height: 380px;
  right: -80px;
  top: 12%;
  background: rgb(214 160 112 / 0.35);
}
.brand__glow--b {
  width: 420px;
  height: 420px;
  left: -120px;
  bottom: -120px;
  background: rgb(150 70 30 / 0.4);
  animation-duration: 22s;
}
/* Fine grain so the gradients don't band */
.brand__grain {
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: 0.08;
  background-image: radial-gradient(rgb(255 255 255 / 0.9) 0.6px, transparent 0.6px);
  background-size: 3px 3px;
  mask-image: linear-gradient(180deg, #000, transparent 85%);
  -webkit-mask-image: linear-gradient(180deg, #000, transparent 85%);
}

.brand__top {
  display: flex;
}
.brand__chip {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.375rem 0.875rem 0.375rem 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  border-radius: 9999px;
  background: rgb(255 255 255 / 0.08);
  border: 1px solid rgb(255 255 255 / 0.14);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}

.brand__center {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1.25rem 0 0.5rem;
}

/* Emblem */
.emblem {
  position: relative;
  display: grid;
  place-items: center;
  width: 7.5rem;
  height: 7.5rem;
  margin-bottom: 1.25rem;
}
@media (min-width: 1024px) {
  .emblem {
    width: 13rem;
    height: 13rem;
    margin-bottom: 2rem;
  }
}
.emblem__ring {
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  border: 1.5px solid transparent;
  background:
    conic-gradient(from 0deg, rgb(246 217 184 / 0.9), rgb(246 217 184 / 0) 30%, rgb(255 255 255 / 0.55) 55%, rgb(246 217 184 / 0) 80%, rgb(246 217 184 / 0.9)) border-box;
  -webkit-mask: linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) padding-box exclude, linear-gradient(#000 0 0);
  animation: spin 16s linear infinite;
}
.emblem__ring--2 {
  inset: 11%;
  animation-duration: 11s;
  animation-direction: reverse;
  opacity: 0.8;
}
.emblem__ring--3 {
  inset: -11%;
  animation-duration: 26s;
  opacity: 0.45;
}
.emblem__halo {
  position: absolute;
  inset: 18%;
  border-radius: 9999px;
  background: radial-gradient(circle, rgb(255 236 214 / 0.35), rgb(255 236 214 / 0) 70%);
  animation: breathe 4.5s ease-in-out infinite;
}
.emblem__mark {
  position: relative;
  width: 62%;
  height: 62%;
  object-fit: contain;
  filter: drop-shadow(0 10px 18px rgb(0 0 0 / 0.45));
}

.brand__title {
  padding: 0 !important;
  font-size: 1.75rem;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.02em;
}
@media (min-width: 1024px) {
  .brand__title {
    font-size: clamp(2.25rem, 3.2vw, 3.25rem);
  }
}
.brand__title-accent {
  background: linear-gradient(100deg, #f6d9b8 0%, #e2a36d 45%, #f6d9b8 90%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: shimmer 6s ease-in-out infinite;
}
.brand__tagline {
  max-width: 28rem;
  margin-top: 0.75rem;
  font-size: 0.875rem;
  line-height: 1.55;
  color: rgb(255 255 255 / 0.72);
}

/* Heartbeat */
.pulse {
  display: none;
  width: min(100%, 30rem);
  height: 4.25rem;
  margin: 1.25rem 0 0.25rem;
}
@media (min-width: 1024px) {
  .pulse {
    display: block;
  }
}
.pulse__line {
  stroke-dasharray: 900;
  stroke-dashoffset: 900;
  animation: trace 3.6s ease-in-out infinite;
  filter: drop-shadow(0 0 8px rgb(233 185 138 / 0.85));
}

/* Floating glass highlights (desktop) */
.highlights {
  display: none;
}
@media (min-width: 1024px) {
  .highlights {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.875rem;
    width: 100%;
    max-width: 44rem;
    margin-top: 1.75rem;
  }
}
.highlight {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 0.875rem;
  text-align: left;
  border-radius: 1rem;
  background: linear-gradient(160deg, rgb(255 255 255 / 0.12), rgb(255 255 255 / 0.04));
  border: 1px solid rgb(255 255 255 / 0.14);
  box-shadow: 0 12px 30px -16px rgb(0 0 0 / 0.6);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  animation: float 6s ease-in-out infinite;
}
.highlight__icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.75rem;
  color: #2a1c18;
  background: linear-gradient(140deg, #f6d9b8, #d99a63);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.6);
}

.brand__foot {
  display: none;
}
@media (min-width: 1024px) {
  .brand__foot {
    display: block;
    font-size: 0.75rem;
    color: rgb(255 255 255 / 0.5);
  }
}

/* ---------------------------------------------------------------------------
   Sign-in column
   --------------------------------------------------------------------------- */
.signin {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem 1.25rem;
  margin-top: -1.25rem; /* card overlaps the brand band on phones */
}
@media (min-width: 1024px) {
  .signin {
    margin-top: 0;
    padding: 2rem 3rem;
    overflow-y: auto;
  }
}
.signin__bar {
  position: absolute;
  top: 1rem;
  right: 1rem;
}
@media (max-width: 1023px) {
  .signin__bar {
    position: fixed;
    z-index: 5;
  }
}

.signin__card {
  --control-h: 2.875rem;
  position: relative;
  width: 100%;
  max-width: 26.5rem;
  padding: 2rem 1.5rem 1.5rem;
  border-radius: 1.5rem;
  background: rgb(var(--surface));
  border: 1px solid rgb(var(--line));
  box-shadow: 0 30px 60px -28px rgb(40 20 12 / 0.35), 0 2px 6px -2px rgb(40 20 12 / 0.08);
  animation: rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@media (min-width: 640px) {
  .signin__card {
    padding: 2.5rem 2.5rem 2rem;
  }
}
@media (min-width: 1024px) {
  .signin__card {
    border: none;
    box-shadow: none;
    background: transparent;
    padding: 0;
  }
}
/* Bronze hairline on top of the card (phones/tablets) */
.signin__card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 1.5rem;
  right: 1.5rem;
  height: 3px;
  border-radius: 0 0 4px 4px;
  background: linear-gradient(90deg, #6b2a00, #d99a63, #6b2a00);
}
@media (min-width: 1024px) {
  .signin__card::before {
    display: none;
  }
}

.signin__brand {
  display: none; /* phones: the brand band above already shows it */
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1.75rem;
}
@media (min-width: 1024px) {
  .signin__brand {
    display: flex;
  }
}
.signin__mark {
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  border-radius: 0.875rem;
  background: linear-gradient(150deg, #4a3732, #1d1412);
  box-shadow: 0 8px 18px -8px rgb(40 20 12 / 0.6), inset 0 1px 0 rgb(255 255 255 / 0.15);
}

/* Form polish */
.signin__card :deep(h1) {
  text-align: left;
}
.signin__card :deep(header.text-center) {
  text-align: left;
}
.signin__card :deep(.login-submit) {
  background-image: linear-gradient(110deg, #4c3f3f 0%, #6b2a00 55%, #b8794a 100%);
  background-size: 160% 100%;
  background-position: 0% 0;
  border: none;
  box-shadow: 0 12px 24px -12px rgb(107 42 0 / 0.7);
  transition: background-position 0.5s ease, transform 0.15s ease, box-shadow 0.3s ease;
}
.signin__card :deep(.login-submit:hover) {
  background-position: 100% 0;
  box-shadow: 0 16px 30px -12px rgb(107 42 0 / 0.75);
}
.signin__card :deep(.login-submit:active) {
  transform: translateY(1px);
}

.signin__foot {
  margin-top: 1.25rem;
  font-size: 0.75rem;
  color: rgb(var(--ink-subtle));
}
@media (min-width: 1024px) {
  .signin__foot {
    display: none;
  }
}

@media (pointer: coarse) {
  .signin__card {
    --control-h: 3rem;
  }
}

/* ---------------------------------------------------------------------------
   Motion
   --------------------------------------------------------------------------- */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes breathe {
  0%,
  100% {
    transform: scale(0.92);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.06);
    opacity: 1;
  }
}
@keyframes shimmer {
  0%,
  100% {
    background-position: 0% 0;
  }
  50% {
    background-position: 100% 0;
  }
}
@keyframes trace {
  0% {
    stroke-dashoffset: 900;
  }
  55%,
  70% {
    stroke-dashoffset: 0;
    opacity: 1;
  }
  100% {
    stroke-dashoffset: 0;
    opacity: 0;
  }
}
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}
@keyframes drift {
  to {
    transform: translate(-30px, 24px) scale(1.08);
  }
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .brand__glow,
  .emblem__ring,
  .emblem__halo,
  .brand__title-accent,
  .highlight,
  .signin__card {
    animation: none;
  }
  .pulse__line {
    animation: none;
    stroke-dashoffset: 0;
  }
}
</style>
