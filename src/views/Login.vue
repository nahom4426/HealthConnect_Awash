<script setup>
import LoginForm from "./LoginForm.vue";
import logo from "@/assets/img/logo.png";

const year = new Date().getFullYear();
</script>

<template>
  <div class="overflow-y-auto relative h-full login-backdrop">
    <!-- Colour orbs behind the card edges give the glass something to refract.
         Clipped layer so they never add scroll width/height. -->
    <div class="overflow-hidden absolute inset-0 pointer-events-none" aria-hidden="true">
      <div class="login-orb login-orb--cyan" />
      <div class="login-orb login-orb--blue" />
      <div class="login-orb login-orb--soft" />
    </div>

    <!-- Contour lines echoing the sweep of the Awash "A" -->
    <svg
      class="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g fill="none" stroke="#ffffff" stroke-linecap="round">
        <path d="M-80 640 C 260 640 380 300 680 200 S 1200 90 1540 150" stroke-opacity="0.12" stroke-width="1.5" />
        <path d="M-80 690 C 280 690 410 350 710 250 S 1220 140 1540 200" stroke-opacity="0.08" stroke-width="1.2" />
        <path d="M-80 740 C 300 740 440 400 740 300 S 1240 190 1540 250" stroke-opacity="0.05" stroke-width="1" />
      </g>
    </svg>

    <div class="flex relative flex-col justify-center items-center px-4 py-10 min-h-full sm:py-16">
      <main class="w-full max-w-[460px] login-card" aria-labelledby="login-title">
        <div class="flex justify-center mb-8">
          <img :src="logo" alt="Awash Insurance" class="w-auto h-12 sm:h-14 login-logo" />
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
  isolation: isolate;
  background: linear-gradient(160deg, rgb(37 55 122) 0%, rgb(28 40 96) 50%, rgb(14 22 58) 100%);
}

/* ---------- Colour orbs ---------- */
.login-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(70px);
  pointer-events: none;
  z-index: 0;
}
.login-orb--cyan {
  width: 420px;
  height: 420px;
  top: calc(50% - 330px);
  left: calc(50% + 90px);
  background: radial-gradient(circle, rgb(0 174 217 / 0.75), rgb(0 174 217 / 0) 70%);
}
.login-orb--blue {
  width: 460px;
  height: 460px;
  top: calc(50% + 40px);
  left: calc(50% - 470px);
  background: radial-gradient(circle, rgb(59 110 246 / 0.7), rgb(59 110 246 / 0) 70%);
}
.login-orb--soft {
  width: 640px;
  height: 640px;
  bottom: -320px;
  right: -200px;
  background: radial-gradient(circle, rgb(0 174 217 / 0.25), rgb(0 174 217 / 0) 70%);
}

/* ---------- Glass card ---------- */
.login-card {
  position: relative;
  z-index: 1;
  padding: 2.5rem;
  border-radius: 1.5rem;
  color-scheme: dark;

  /* Re-theme the design tokens for dark glass; every label, link, hint and
     error in the form already uses these, so they adapt automatically. */
  --control-h: 2.875rem;
  --primary: 125 211 252; /* links + focus rings: light cyan */
  --ink: 255 255 255;
  --ink-muted: 214 222 240;
  --ink-subtle: 176 189 222;
  --line: 255 255 255;
  --line-strong: 255 255 255;
  --error: 254 178 178;
  --focus-ring: 0 0 0 3px rgb(125 211 252 / 0.35);

  background:
    linear-gradient(135deg, rgb(255 255 255 / 0.16) 0%, rgb(255 255 255 / 0.05) 100%),
    rgb(18 28 72 / 0.35);
  border: 1px solid rgb(255 255 255 / 0.22);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.35),
    inset 0 -1px 0 rgb(255 255 255 / 0.05),
    0 30px 80px -20px rgb(4 8 30 / 0.65);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  backdrop-filter: blur(24px) saturate(160%);
}

/* Mirror sheen along the top edge */
.login-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgb(255 255 255 / 0.12) 0%, rgb(255 255 255 / 0) 32%);
  pointer-events: none;
}

/* No backdrop-filter support: solid, still on-brand */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .login-card {
    background: rgb(22 33 82 / 0.94);
  }
}

/* Users who ask for less transparency get a solid card */
@media (prefers-reduced-transparency: reduce) {
  .login-card {
    background: rgb(22 33 82);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}

.login-logo {
  /* Single-colour white wordmark reads cleanly on the glass */
  filter: brightness(0) invert(1);
}

/* ---------- Form controls on glass ---------- */
.login-card :deep(.input-shell) {
  background: rgb(255 255 255 / 0.08);
  border-color: rgb(255 255 255 / 0.22);
  box-shadow: none;
}
.login-card :deep(.input-shell:hover) {
  border-color: rgb(255 255 255 / 0.38);
}
.login-card :deep(.input-shell:focus-within) {
  background: rgb(255 255 255 / 0.12);
  border-color: rgb(125 211 252);
  box-shadow: var(--focus-ring);
}
.login-card :deep(.input-shell--error),
.login-card :deep(.input-shell--error:hover) {
  border-color: rgb(254 178 178 / 0.85);
}
.login-card :deep(.custom-input::placeholder),
.login-card :deep(.skip_custom-input::placeholder) {
  color: rgb(255 255 255 / 0.5);
}

/* Chrome autofill: keep the glass instead of a white box */
.login-card :deep(input:-webkit-autofill),
.login-card :deep(input:-webkit-autofill:hover),
.login-card :deep(input:-webkit-autofill:focus) {
  -webkit-text-fill-color: #fff;
  caret-color: #fff;
  -webkit-box-shadow: 0 0 0 1000px rgb(40 56 118) inset;
  transition: background-color 9999s ease-out 0s;
}

/* Primary action: solid white for contrast on the glass */
.login-card :deep(.btn--primary) {
  background: #ffffff;
  color: rgb(28 40 96);
  box-shadow: 0 8px 20px -8px rgb(0 0 0 / 0.45);
}
.login-card :deep(.btn--primary:hover:not(:disabled)) {
  background: rgb(255 255 255 / 0.9);
}
.login-card :deep(.btn--primary:focus-visible) {
  box-shadow: 0 0 0 3px rgb(125 211 252 / 0.6);
}

/* Divider above the help line */
.login-card :deep(.border-line) {
  border-color: rgb(255 255 255 / 0.14);
}

@media (max-width: 480px) {
  .login-card {
    padding: 1.75rem 1.25rem;
    border-radius: 1.25rem;
  }
  .login-orb--cyan {
    left: auto;
    right: -160px;
    top: -120px;
  }
  .login-orb--blue {
    left: -220px;
  }
}

@media (pointer: coarse) {
  .login-card {
    --control-h: 3rem;
  }
}
</style>
