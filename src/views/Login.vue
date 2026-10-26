<script setup>
import LoginForm from "./LoginForm.vue";
import ThemeToggle from "@/components/ThemeToggle.vue";
import logo from "@/assets/img/logoD.png";
import mark from "@/assets/img/nyala-mark.png";
import family from "@/assets/img/login-family.png";

const year = new Date().getFullYear();
</script>

<template>
  <div class="login">
    <!-- Ambient background -->
    <div class="login__bg" aria-hidden="true">
      <span class="blob blob--1" />
      <span class="blob blob--2" />
      <span class="blob blob--3" />
      <span class="dots" />
    </div>

    <div class="login__toggle">
      <ThemeToggle />
    </div>

    <div class="login__wrap">
      <div class="shell">
        <!-- ============ Visual ============ -->
        <aside class="visual" aria-hidden="true">
          <div class="visual__top">
            <span class="visual__badge">
              <img :src="mark" alt="" class="w-5 h-5" />
              HealthConnect
            </span>
          </div>

          <div class="stage">
            <span class="stage__ring stage__ring--1" />
            <span class="stage__ring stage__ring--2" />
            <span class="stage__ring stage__ring--3" />
            <span class="stage__glow" />
            <img :src="family" alt="" class="stage__art" width="392" height="511" />

            <!-- Floating product cards -->
            <div class="chip chip--a">
              <span class="chip__icon chip__icon--green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
              </span>
              <span>
                <span class="chip__title">Claim approved</span>
                <span class="chip__sub">Settled and on its way</span>
              </span>
            </div>

            <div class="chip chip--b">
              <span class="chip__icon chip__icon--bronze">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.5 7.5 9.5 4.3-1 7.5-4.9 7.5-9.5V6L12 3Z" /><path d="m9 12 2 2 4-4" /></svg>
              </span>
              <span>
                <span class="chip__title">Policy active</span>
                <span class="chip__sub">Whole family covered</span>
              </span>
            </div>

            <div class="chip chip--c">
              <span class="chip__icon chip__icon--rust">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V8l7-4 7 4v13M10 21v-5h4v5M12 8v4M10 10h4" /></svg>
              </span>
              <span>
                <span class="chip__title">Providers connected</span>
                <span class="chip__sub">Hospitals, clinics, pharmacies</span>
              </span>
            </div>
          </div>

          <div class="visual__copy">
            <h2 class="visual__title">Care that's <em>connected.</em></h2>
            <p class="visual__text">Policies, claims and providers — managed together on Nyala's secure HealthConnect platform.</p>
          </div>
        </aside>

        <!-- ============ Form ============ -->
        <main class="panel" aria-labelledby="login-title">
          <img :src="logo" alt="Nyala Insurance S.C." class="panel__logo" />
          <LoginForm />
          <p class="panel__foot">© {{ year }} Nyala Insurance S.C. · HealthConnect</p>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ---------------------------------------------------------------------------
   Page & ambient background
   --------------------------------------------------------------------------- */
.login {
  --ivory: 250 246 241;
  --sand: 243 228 210;
  --sand-deep: 232 204 176;
  --espresso: 47 33 29;
  --bronze: 184 121 74;
  --rust: 107 42 0;

  position: relative;
  isolation: isolate;
  height: 100%;
  overflow-y: auto;
  background: rgb(var(--ivory));
}
:root[data-theme="dark"] .login {
  --ivory: 22 18 17;
}

.login__bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}
.blob {
  position: absolute;
  border-radius: 9999px;
  filter: blur(90px);
  opacity: 0.55;
  animation: drift 20s ease-in-out infinite alternate;
}
.blob--1 {
  width: 520px;
  height: 520px;
  left: -140px;
  top: -160px;
  background: rgb(var(--bronze) / 0.55);
}
.blob--2 {
  width: 460px;
  height: 460px;
  right: -120px;
  bottom: -160px;
  background: rgb(var(--rust) / 0.35);
  animation-duration: 24s;
}
.blob--3 {
  width: 340px;
  height: 340px;
  right: 22%;
  top: -120px;
  background: rgb(var(--sand-deep) / 0.9);
  animation-duration: 28s;
}
.dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgb(var(--espresso) / 0.13) 1px, transparent 1px);
  background-size: 22px 22px;
  mask-image: radial-gradient(ellipse at center, #000 20%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at center, #000 20%, transparent 70%);
}
:root[data-theme="dark"] .dots {
  background-image: radial-gradient(rgb(255 255 255 / 0.07) 1px, transparent 1px);
}

.login__toggle {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 10;
}

.login__wrap {
  display: grid;
  place-items: center;
  min-height: 100%;
  padding: 4rem 1rem 2rem;
}
@media (min-width: 900px) {
  .login__wrap {
    padding: 2.5rem 2rem;
  }
}

/* ---------------------------------------------------------------------------
   The card
   --------------------------------------------------------------------------- */
.shell {
  display: grid;
  width: 100%;
  max-width: 28rem;
  overflow: hidden;
  border-radius: 1.75rem;
  background: rgb(var(--surface));
  border: 1px solid rgb(var(--espresso) / 0.06);
  box-shadow:
    0 1px 0 rgb(255 255 255 / 0.8) inset,
    0 40px 80px -30px rgb(var(--espresso) / 0.35),
    0 12px 30px -16px rgb(var(--espresso) / 0.2);
  animation: rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@media (min-width: 900px) {
  .shell {
    max-width: 70rem;
    min-height: min(44rem, calc(100vh - 5rem));
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  }
}
:root[data-theme="dark"] .shell {
  border-color: rgb(255 255 255 / 0.06);
  box-shadow: 0 40px 80px -30px rgb(0 0 0 / 0.7);
}

/* ---------------------------------------------------------------------------
   Visual side
   --------------------------------------------------------------------------- */
.visual {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 1.25rem 1.25rem 1.5rem;
  background:
    radial-gradient(90% 70% at 50% 42%, rgb(255 255 255 / 0.75), transparent 70%),
    linear-gradient(160deg, rgb(var(--sand)) 0%, rgb(var(--sand-deep)) 100%);
}
@media (min-width: 900px) {
  .visual {
    margin: 0.75rem;
    padding: 1.75rem 2rem 2.25rem;
    border-radius: 1.375rem;
  }
}
:root[data-theme="dark"] .visual {
  background:
    radial-gradient(90% 70% at 50% 42%, rgb(184 121 74 / 0.22), transparent 70%),
    linear-gradient(160deg, #3a2b26 0%, #241a17 100%);
}

.visual__top {
  display: flex;
}
.visual__badge {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.3rem 0.8rem 0.3rem 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(var(--espresso));
  border-radius: 9999px;
  background: rgb(255 255 255 / 0.7);
  border: 1px solid rgb(255 255 255 / 0.9);
  box-shadow: 0 4px 12px -6px rgb(var(--espresso) / 0.3);
}
:root[data-theme="dark"] .visual__badge {
  color: #f3dcc3;
  background: rgb(255 255 255 / 0.08);
  border-color: rgb(255 255 255 / 0.12);
}

/* Illustration stage */
.stage {
  position: relative;
  display: grid;
  flex: 1;
  place-items: center;
  min-height: 11rem;
  margin: 0.5rem 0;
}
@media (min-width: 900px) {
  .stage {
    min-height: 22rem;
    margin: 1rem 0 1.25rem;
  }
}
.stage__ring {
  position: absolute;
  aspect-ratio: 1;
  border-radius: 9999px;
  border: 2px solid rgb(255 255 255 / 0.95);
  box-shadow: 0 0 0 1px rgb(var(--bronze) / 0.14), 0 10px 30px -18px rgb(var(--bronze) / 0.5);
  animation: pulse-ring 6s ease-in-out infinite;
}
.stage__ring--1 {
  width: 52%;
}
.stage__ring--2 {
  width: 72%;
  opacity: 0.7;
  animation-delay: 1s;
}
.stage__ring--3 {
  width: 92%;
  opacity: 0.4;
  animation-delay: 2s;
}
:root[data-theme="dark"] .stage__ring {
  border-color: rgb(246 217 184 / 0.22);
}
.stage__glow {
  position: absolute;
  width: 46%;
  aspect-ratio: 1;
  border-radius: 9999px;
  background: radial-gradient(circle, rgb(255 255 255 / 0.95), rgb(255 255 255 / 0) 70%);
}
:root[data-theme="dark"] .stage__glow {
  background: radial-gradient(circle, rgb(246 217 184 / 0.28), rgb(246 217 184 / 0) 70%);
}
.stage__art {
  position: relative;
  width: auto;
  height: 9.5rem;
  filter: drop-shadow(0 18px 22px rgb(var(--espresso) / 0.22));
  animation: bob 7s ease-in-out infinite;
}
@media (min-width: 900px) {
  .stage__art {
    height: min(25rem, 48vh);
  }
}

/* Floating product cards */
.chip {
  position: absolute;
  z-index: 1;
  display: none;
  gap: 0.625rem;
  align-items: center;
  padding: 0.6rem 0.9rem 0.6rem 0.6rem;
  border-radius: 1rem;
  background: rgb(255 255 255 / 0.82);
  border: 1px solid rgb(255 255 255 / 0.95);
  box-shadow: 0 18px 36px -18px rgb(var(--espresso) / 0.45), 0 2px 6px -2px rgb(var(--espresso) / 0.12);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  animation: float 6s ease-in-out infinite;
}
@media (min-width: 900px) {
  .chip {
    display: flex;
  }
}
:root[data-theme="dark"] .chip {
  background: rgb(40 32 29 / 0.82);
  border-color: rgb(255 255 255 / 0.08);
}
.chip--a {
  top: 6%;
  left: 2%;
}
.chip--b {
  top: 40%;
  right: 0;
  animation-delay: 1.4s;
}
.chip--c {
  bottom: 4%;
  left: 6%;
  animation-delay: 2.8s;
}
.chip__icon {
  display: grid;
  place-items: center;
  width: 2.125rem;
  height: 2.125rem;
  border-radius: 0.7rem;
  color: #fff;
}
.chip__icon svg {
  width: 1.125rem;
  height: 1.125rem;
}
.chip__icon--green {
  background: linear-gradient(140deg, #34c38f, #15803d);
}
.chip__icon--bronze {
  background: linear-gradient(140deg, #e2a36d, #a8673c);
}
.chip__icon--rust {
  background: linear-gradient(140deg, #9a4a1c, #5a2405);
}
.chip__title {
  display: block;
  font-size: 0.8125rem;
  font-weight: 700;
  line-height: 1.2;
  color: rgb(var(--espresso));
}
.chip__sub {
  display: block;
  margin-top: 0.1rem;
  font-size: 0.6875rem;
  color: rgb(var(--espresso) / 0.6);
}
:root[data-theme="dark"] .chip__title {
  color: #f6ebe1;
}
:root[data-theme="dark"] .chip__sub {
  color: rgb(246 235 225 / 0.6);
}

.visual__copy {
  text-align: center;
}
@media (min-width: 900px) {
  .visual__copy {
    text-align: left;
  }
}
.visual__title {
  padding: 0 !important;
  font-size: 1.5rem;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: rgb(var(--espresso));
}
@media (min-width: 900px) {
  .visual__title {
    font-size: clamp(2rem, 2.8vw, 2.75rem);
  }
}
.visual__title em {
  font-style: normal;
  background: linear-gradient(100deg, #6b2a00, #b8794a 60%, #6b2a00);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: shimmer 7s ease-in-out infinite;
}
:root[data-theme="dark"] .visual__title {
  color: #f6ebe1;
}
:root[data-theme="dark"] .visual__title em {
  background-image: linear-gradient(100deg, #f6d9b8, #e2a36d 60%, #f6d9b8);
}
.visual__text {
  display: none;
  max-width: 26rem;
  margin-top: 0.75rem;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: rgb(var(--espresso) / 0.68);
}
@media (min-width: 900px) {
  .visual__text {
    display: block;
  }
}
:root[data-theme="dark"] .visual__text {
  color: rgb(246 235 225 / 0.65);
}

/* ---------------------------------------------------------------------------
   Form side
   --------------------------------------------------------------------------- */
.panel {
  --control-h: 2.875rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 1.75rem 1.5rem 1.5rem;
}
@media (min-width: 640px) {
  .panel {
    padding: 2.25rem 2.5rem 1.75rem;
  }
}
@media (min-width: 900px) {
  .panel {
    padding: 3rem clamp(2.5rem, 4.5vw, 4.5rem) 2rem;
  }
}
.panel__logo {
  width: auto;
  height: 3.5rem;
  margin-bottom: 1.5rem;
  align-self: flex-start;
}
@media (min-width: 900px) {
  .panel__logo {
    height: 4.5rem;
    margin-bottom: 2rem;
  }
}
:root[data-theme="dark"] .panel__logo {
  padding: 0.25rem 0.5rem;
  border-radius: 0.75rem;
  background: #fff;
}
.panel__foot {
  margin-top: 2rem;
  font-size: 0.75rem;
  color: rgb(var(--ink-subtle));
}

/* Form polish */
.panel :deep(h1) {
  font-size: 1.875rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}
.panel :deep(.input-shell) {
  border-radius: 0.75rem;
}
.panel :deep(.login-submit) {
  height: 3rem;
  border: none;
  border-radius: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  background-image: linear-gradient(110deg, #3a2a25 0%, #6b2a00 60%, #b8794a 100%);
  background-size: 170% 100%;
  background-position: 0% 0;
  box-shadow: 0 14px 28px -14px rgb(107 42 0 / 0.75), inset 0 1px 0 rgb(255 255 255 / 0.15);
  transition: background-position 0.6s ease, transform 0.15s ease, box-shadow 0.3s ease;
}
.panel :deep(.login-submit:hover) {
  background-position: 100% 0;
  box-shadow: 0 18px 34px -14px rgb(107 42 0 / 0.8), inset 0 1px 0 rgb(255 255 255 / 0.15);
}
.panel :deep(.login-submit:active) {
  transform: translateY(1px);
}

@media (pointer: coarse) {
  .panel {
    --control-h: 3rem;
  }
}

/* ---------------------------------------------------------------------------
   Motion
   --------------------------------------------------------------------------- */
@keyframes drift {
  to {
    transform: translate(40px, 30px) scale(1.1);
  }
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.985);
  }
}
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}
@keyframes bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}
@keyframes pulse-ring {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.035);
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

@media (prefers-reduced-motion: reduce) {
  .blob,
  .shell,
  .stage__ring,
  .stage__art,
  .chip,
  .visual__title em {
    animation: none;
  }
}
</style>
