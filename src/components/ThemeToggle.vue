<script setup>
import { useId } from "vue";
import { useTheme } from "@/composables/useTheme";

const { isDark, toggleTheme } = useTheme();
const maskId = `theme-toggle-mask-${useId()}`;

const stars = [
  { x: 9, y: 7, s: 2.5, d: 0.05 },
  { x: 16, y: 15, s: 1.75, d: 0.12 },
  { x: 6, y: 17, s: 1.5, d: 0.18 },
  { x: 21, y: 6, s: 1.5, d: 0.24 },
];

function onClick(event) {
  const r = event.currentTarget.getBoundingClientRect();
  toggleTheme({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
}
</script>

<template>
  <button
    type="button"
    role="switch"
    class="theme-toggle"
    :class="{ 'is-dark': isDark }"
    :aria-checked="isDark"
    aria-label="Dark mode"
    :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="onClick"
  >
    <span class="tt-track" aria-hidden="true">
      <span class="tt-sky tt-sky--day" />
      <span class="tt-sky tt-sky--night" />
      <span class="tt-cloud tt-cloud--a" />
      <span class="tt-cloud tt-cloud--b" />
      <span
        v-for="(star, i) in stars"
        :key="i"
        class="tt-star"
        :style="{ left: `${star.x}px`, top: `${star.y}px`, width: `${star.s}px`, height: `${star.s}px`, transitionDelay: isDark ? `${star.d + 0.15}s` : '0s' }"
      />
    </span>

    <span class="tt-thumb" aria-hidden="true">
      <svg class="tt-icon" viewBox="0 0 24 24">
        <defs>
          <mask :id="maskId">
            <rect width="24" height="24" fill="#fff" />
            <circle class="tt-bite" cx="17" cy="7" r="7" fill="#000" />
          </mask>
        </defs>
        <g class="tt-rays" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M12 1.75v2M12 20.25v2M1.75 12h2M20.25 12h2M4.75 4.75l1.4 1.4M17.85 17.85l1.4 1.4M4.75 19.25l1.4-1.4M17.85 6.15l1.4-1.4" />
        </g>
        <circle class="tt-core" cx="12" cy="12" r="8.5" fill="currentColor" :mask="`url(#${maskId})`" />
      </svg>
    </span>
  </button>
</template>

<style scoped>
.theme-toggle {
  --tt-w: 3.25rem;
  --tt-h: 1.75rem;
  --tt-pad: 3px;
  --tt-thumb: calc(var(--tt-h) - var(--tt-pad) * 2);
  --tt-travel: calc(var(--tt-w) - var(--tt-thumb) - var(--tt-pad) * 2);
  --tt-stretch: 0px;
  --tt-spring: cubic-bezier(0.34, 1.45, 0.64, 1);

  position: relative;
  flex-shrink: 0;
  width: var(--tt-w);
  height: var(--tt-h);
  border-radius: 9999px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.theme-toggle:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgb(var(--primary-fg) / 0.45);
}
.theme-toggle:active {
  --tt-stretch: 5px;
}

/* ---------- Track ---------- */
.tt-track {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  box-shadow: inset 0 1px 3px rgb(0 0 0 / 0.18), inset 0 0 0 1px rgb(0 0 0 / 0.04);
}
.tt-sky {
  position: absolute;
  inset: 0;
  transition: opacity 0.45s ease;
}
.tt-sky--day {
  background: linear-gradient(160deg, #bfeaf9 0%, #7fd0ef 100%);
}
.tt-sky--night {
  opacity: 0;
  background: radial-gradient(120% 140% at 20% 0%, #2c3a78 0%, #151d45 55%, #0b1029 100%);
}
.is-dark .tt-sky--day {
  opacity: 0;
}
.is-dark .tt-sky--night {
  opacity: 1;
}

/* Clouds drift away to the right as night falls */
.tt-cloud {
  position: absolute;
  border-radius: 9999px;
  background: #fff;
  transition: transform 0.55s var(--tt-spring), opacity 0.35s ease;
}
.tt-cloud--a {
  width: 14px;
  height: 6px;
  right: 6px;
  top: 7px;
  box-shadow: 4px -3px 0 -1px #fff;
}
.tt-cloud--b {
  width: 11px;
  height: 5px;
  right: 11px;
  bottom: 5px;
  opacity: 0.85;
}
.is-dark .tt-cloud {
  opacity: 0;
  transform: translateX(14px);
}

/* Stars pop in one after another */
.tt-star {
  position: absolute;
  border-radius: 9999px;
  background: #fff;
  box-shadow: 0 0 4px rgb(255 255 255 / 0.9);
  opacity: 0;
  transform: scale(0);
  transition: transform 0.4s var(--tt-spring), opacity 0.3s ease;
}
.is-dark .tt-star {
  opacity: 1;
  transform: scale(1);
}
.is-dark .tt-star:nth-child(5) {
  animation: tt-twinkle 3.2s ease-in-out 1s infinite;
}
.is-dark .tt-star:nth-child(7) {
  animation: tt-twinkle 4.1s ease-in-out 2s infinite;
}
@keyframes tt-twinkle {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

/* ---------- Thumb ---------- */
.tt-thumb {
  position: absolute;
  top: var(--tt-pad);
  left: var(--tt-pad);
  display: grid;
  place-items: center;
  width: calc(var(--tt-thumb) + var(--tt-stretch));
  height: var(--tt-thumb);
  border-radius: 9999px;
  background: #fff;
  color: #f59e0b;
  box-shadow: 0 2px 6px rgb(0 0 0 / 0.22), 0 0 0 0.5px rgb(0 0 0 / 0.06);
  transition: transform 0.55s var(--tt-spring), width 0.2s ease, background-color 0.4s ease, color 0.4s ease;
}
.is-dark .tt-thumb {
  transform: translateX(calc(var(--tt-travel) - var(--tt-stretch)));
  background: #e6eaf8;
  color: #3d4c8a;
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.45), 0 0 10px rgb(200 214 255 / 0.35);
}
.theme-toggle:hover .tt-thumb {
  box-shadow: 0 3px 10px rgb(0 0 0 / 0.25), 0 0 0 0.5px rgb(0 0 0 / 0.06);
}

/* ---------- Sun ↔ moon ---------- */
.tt-icon {
  width: 15px;
  height: 15px;
  overflow: visible;
  transition: transform 0.6s var(--tt-spring);
}
.is-dark .tt-icon {
  transform: rotate(-30deg);
}
.tt-core {
  transform-box: fill-box;
  transform-origin: center;
  transform: scale(0.55);
  transition: transform 0.5s var(--tt-spring);
}
.is-dark .tt-core {
  transform: scale(1);
}
.tt-bite {
  transform: translate(9px, -9px);
  transition: transform 0.5s cubic-bezier(0.65, 0, 0.35, 1);
}
.is-dark .tt-bite {
  transform: translate(0, 0);
}
.tt-rays {
  transform-origin: 12px 12px;
  transition: transform 0.5s var(--tt-spring), opacity 0.3s ease;
}
.is-dark .tt-rays {
  opacity: 0;
  transform: rotate(-90deg) scale(0.4);
}
</style>
