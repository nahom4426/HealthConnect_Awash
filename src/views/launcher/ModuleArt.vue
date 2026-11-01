<script setup>
// Small animated illustration for a module or product card: a flickering fire, a car on the road,
// a ship on waves, a heartbeat, a plane round the globe, turning gears and so on. Pure SVG + CSS,
// so it stays sharp at any size and stops moving for people who prefer reduced motion.
// kind: motor, fire, health, marine, travel, life, engineering, liability, burglary, product,
// tool, endowment, education, calendar, infinity, home, shield.
defineProps({ kind: { type: String, default: 'product' } });
</script>

<template>
  <svg class="art" viewBox="0 0 120 80" aria-hidden="true" focusable="false">
    <!-- Fire: logs and three flame layers that flicker, with rising sparks -->
    <g v-if="kind === 'fire'">
      <ellipse cx="60" cy="72" rx="30" ry="4" fill="#fde68a" opacity=".55" />
      <rect x="38" y="62" width="44" height="7" rx="3.5" fill="#e0b98a" transform="rotate(-9 60 65)" />
      <rect x="38" y="62" width="44" height="7" rx="3.5" fill="#c99a66" transform="rotate(9 60 65)" />
      <path class="flame f1" d="M60 12c11 14 21 23 21 36a21 21 0 0 1-42 0c0-10 6-15 9-23 2 6 5 9 8 9-2-8 0-15 4-22z" fill="#fdba74" />
      <path class="flame f2" d="M60 29c7 9 13 14 13 22a13 13 0 0 1-26 0c0-6 4-10 6-15 1 4 3 6 5 6-1-5 0-9 2-13z" fill="#fcd34d" />
      <path class="flame f3" d="M60 44c3 4 6 7 6 11a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 3 3 3z" fill="#fef9c3" />
      <circle class="spark s1" cx="47" cy="34" r="1.7" fill="#fbbf24" />
      <circle class="spark s2" cx="73" cy="30" r="1.4" fill="#f59e0b" />
      <circle class="spark s3" cx="64" cy="22" r="1.2" fill="#fcd34d" />
    </g>

    <!-- Motor: a car with turning wheels on a moving road -->
    <g v-else-if="kind === 'motor'">
      <rect x="0" y="68" width="120" height="8" rx="4" fill="#e2e8f0" />
      <g class="road">
        <rect v-for="x in [2, 32, 62, 92, 122]" :key="x" :x="x" y="71" width="14" height="2" rx="1" fill="#fff" />
      </g>
      <g class="car">
        <path d="M22 60l7-15c2-4 5-6 9-6h29c4 0 7 2 10 5l9 9h7c4 0 6 3 6 6v6H20v-3c0-1 1-2 2-2z" fill="#93c5fd" />
        <path d="M41 43h20v11H35z" fill="#eff6ff" />
        <path d="M65 43h4c3 0 5 1 7 3l7 8H65z" fill="#eff6ff" />
        <circle cx="96" cy="60" r="2" fill="#fde68a" />
        <rect x="20" y="62" width="80" height="3" rx="1.5" fill="#60a5fa" />
      </g>
      <g v-for="cx in [40, 82]" :key="cx" class="wheel">
        <circle :cx="cx" cy="66" r="8" fill="#334155" />
        <circle :cx="cx" cy="66" r="3.6" fill="#cbd5e1" />
        <rect :x="cx - 1" y="59" width="2" height="14" rx="1" fill="#94a3b8" />
      </g>
    </g>

    <!-- Marine: a cargo ship rocking on two rolling waves -->
    <g v-else-if="kind === 'marine'">
      <circle cx="96" cy="16" r="7" fill="#fde68a" />
      <g class="ship">
        <rect x="44" y="30" width="9" height="12" rx="1.5" fill="#fca5a5" />
        <rect x="54" y="36" width="12" height="9" rx="1.5" fill="#fcd34d" />
        <rect x="67" y="36" width="12" height="9" rx="1.5" fill="#86efac" />
        <rect x="58" y="27" width="12" height="9" rx="1.5" fill="#93c5fd" />
        <path d="M30 45h62l-8 14H38z" fill="#475569" />
        <rect x="30" y="45" width="62" height="3" fill="#ef4444" opacity=".7" />
      </g>
      <path class="wave w1" d="M-40 58q10-6 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0V80H-40z" fill="#7dd3fc" />
      <path class="wave w2" d="M-40 64q10-5 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0V80H-40z" fill="#bae6fd" />
    </g>

    <!-- Medical: a heartbeat line drawing itself and a pulsing cross -->
    <g v-else-if="kind === 'health'">
      <rect x="22" y="16" width="70" height="52" rx="12" fill="#d1fae5" />
      <path class="ecg" d="M28 44h14l5-12 7 24 6-18 4 6h18" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" pathLength="100" />
      <g class="pulse">
        <circle cx="92" cy="20" r="11" fill="#34d399" />
        <path d="M92 14v12M86 20h12" stroke="#fff" stroke-width="3" stroke-linecap="round" />
      </g>
    </g>

    <!-- Travel: a plane circling the globe, clouds drifting by -->
    <g v-else-if="kind === 'travel'">
      <g class="cloud c1"><ellipse cx="20" cy="18" rx="10" ry="4" fill="#e0f2fe" /><ellipse cx="26" cy="15" rx="6" ry="4" fill="#e0f2fe" /></g>
      <g class="cloud c2"><ellipse cx="98" cy="64" rx="11" ry="4" fill="#e0f2fe" /><ellipse cx="92" cy="61" rx="6" ry="4" fill="#e0f2fe" /></g>
      <circle cx="60" cy="42" r="22" fill="#bae6fd" />
      <path d="M46 32c6-3 10 0 12 4s-2 7-6 7-6 4-9 2-2-11 3-13zM64 48c4-2 9 0 10 4s-3 7-7 6-6-8-3-10z" fill="#7dd3fc" />
      <ellipse cx="60" cy="42" rx="10" ry="22" fill="none" stroke="#e0f2fe" stroke-width="1.2" />
      <path d="M38 42h44" stroke="#e0f2fe" stroke-width="1.2" />
      <g class="orbit">
        <path d="M58 8l10 4-10 4-2-2 4-2-4-2z" fill="#0284c7" />
        <path d="M52 12h6" stroke="#7dd3fc" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 2" />
      </g>
    </g>

    <!-- Life: a heart beating under a sheltering umbrella -->
    <g v-else-if="kind === 'life'">
      <g class="sway">
        <path d="M24 38a36 26 0 0 1 72 0q-9-6-18 0q-9-6-18 0q-9-6-18 0q-9-6-18 0z" fill="#fecdd3" />
        <path d="M60 12v4" stroke="#fda4af" stroke-width="2.5" stroke-linecap="round" />
      </g>
      <path class="beat" d="M60 72c-11-8-18-13-18-21a8 8 0 0 1 18-4a8 8 0 0 1 18 4c0 8-7 13-18 21z" fill="#fb7185" />
    </g>

    <!-- Engineering: two meshing gears turning -->
    <g v-else-if="kind === 'engineering'">
      <g class="gear spin">
        <circle cx="48" cy="44" r="17" fill="none" stroke="#c4b5fd" stroke-width="8" stroke-dasharray="6.2 4.4" />
        <circle cx="48" cy="44" r="15" fill="#c4b5fd" />
        <circle cx="48" cy="44" r="5" fill="#f5f3ff" />
      </g>
      <g class="gear spin-back">
        <circle cx="80" cy="30" r="10" fill="none" stroke="#a78bfa" stroke-width="6" stroke-dasharray="4.2 3.65" />
        <circle cx="80" cy="30" r="9" fill="#a78bfa" />
        <circle cx="80" cy="30" r="3.2" fill="#f5f3ff" />
      </g>
    </g>

    <!-- Liability: scales of justice tipping gently -->
    <g v-else-if="kind === 'liability'">
      <rect x="58" y="22" width="4" height="42" rx="2" fill="#99f6e4" />
      <rect x="42" y="63" width="36" height="6" rx="3" fill="#5eead4" />
      <g class="tip">
        <rect x="24" y="20" width="72" height="4" rx="2" fill="#2dd4bf" />
        <path d="M30 24l-9 18M30 24l9 18M90 24l-9 18M90 24l9 18" stroke="#14b8a6" stroke-width="1.3" />
        <path d="M19 42h22a11 6 0 0 1-22 0zM79 42h22a11 6 0 0 1-22 0z" fill="#99f6e4" />
      </g>
      <circle cx="60" cy="20" r="4.5" fill="#14b8a6" />
    </g>

    <!-- Burglary: a padlock opening and closing, with a glint -->
    <g v-else-if="kind === 'burglary'">
      <path class="shackle" d="M47 40V30a13 13 0 0 1 26 0v10" fill="none" stroke="#818cf8" stroke-width="6" stroke-linecap="round" />
      <rect x="38" y="38" width="44" height="32" rx="9" fill="#c7d2fe" />
      <circle cx="60" cy="52" r="4.5" fill="#4338ca" />
      <rect x="58" y="54" width="4" height="9" rx="2" fill="#4338ca" />
      <path class="twinkle" d="M88 22l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#a5b4fc" />
    </g>

    <!-- Endowment: coin stacks growing, with a rising arrow -->
    <g v-else-if="kind === 'endowment'">
      <g v-for="(stack, i) in [{ x: 30, n: 2 }, { x: 54, n: 4 }, { x: 78, n: 6 }]" :key="stack.x" class="stack" :style="{ animationDelay: `${i * 0.25}s` }">
        <g v-for="c in stack.n" :key="c">
          <rect :x="stack.x" :y="66 - c * 6" width="16" height="6" fill="#fbbf24" />
          <ellipse :cx="stack.x + 8" :cy="66 - c * 6" rx="8" ry="2.5" fill="#fde68a" />
        </g>
      </g>
      <path class="draw" d="M24 46l20-12 14 6 26-24" fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" pathLength="100" />
      <path d="M78 14l8 2-2 8" fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    </g>

    <!-- Education: a graduation cap with a swinging tassel above a book -->
    <g v-else-if="kind === 'education'">
      <path d="M34 60c8-4 18-4 26 0c8-4 18-4 26 0v8c-8-4-18-4-26 0c-8-4-18-4-26 0z" fill="#fecdd3" />
      <path d="M60 60v8" stroke="#fda4af" stroke-width="1.5" />
      <g class="bob">
        <path d="M60 14l34 13-34 13-34-13z" fill="#fb7185" />
        <path d="M42 33v9c0 4 8 7 18 7s18-3 18-7v-9l-18 7z" fill="#fda4af" />
        <g class="tassel">
          <path d="M90 28v14" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" />
          <circle cx="90" cy="44" r="3" fill="#fbbf24" />
        </g>
      </g>
    </g>

    <!-- Anticipated endowment: a calendar ticking off payouts -->
    <g v-else-if="kind === 'calendar'">
      <rect x="28" y="16" width="64" height="54" rx="10" fill="#ffe4e6" />
      <rect x="28" y="16" width="64" height="14" rx="7" fill="#fda4af" />
      <rect x="40" y="11" width="4" height="10" rx="2" fill="#fb7185" />
      <rect x="76" y="11" width="4" height="10" rx="2" fill="#fb7185" />
      <g v-for="(cell, i) in [[38, 38], [56, 38], [74, 38], [38, 54], [56, 54], [74, 54]]" :key="i">
        <rect :x="cell[0]" :y="cell[1]" width="10" height="10" rx="3" fill="#fff" />
        <path class="tick" :style="{ animationDelay: `${i * 0.35}s` }" :d="`M${cell[0] + 2.5} ${cell[1] + 5}l2 2 3.5-4`" fill="none" stroke="#e11d48" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" pathLength="10" />
      </g>
    </g>

    <!-- Whole life: an endless loop with a light running round it -->
    <g v-else-if="kind === 'infinity'">
      <path d="M60 40c-8-10-14-14-22-14a14 14 0 0 0 0 28c8 0 14-4 22-14s14-14 22-14a14 14 0 0 1 0 28c-8 0-14-4-22-14z" fill="none" stroke="#fecdd3" stroke-width="7" />
      <path class="run" d="M60 40c-8-10-14-14-22-14a14 14 0 0 0 0 28c8 0 14-4 22-14s14-14 22-14a14 14 0 0 1 0 28c-8 0-14-4-22-14z" fill="none" stroke="#fb7185" stroke-width="7" stroke-linecap="round" pathLength="100" />
    </g>

    <!-- Mortgage redemption: a home with smoke rising, covered by a shield -->
    <g v-else-if="kind === 'home'">
      <circle class="smoke m1" cx="80" cy="18" r="3.5" fill="#e2e8f0" />
      <circle class="smoke m2" cx="80" cy="18" r="3" fill="#e2e8f0" />
      <rect x="76" y="20" width="7" height="12" fill="#fda4af" />
      <path d="M26 40l34-24 34 24" fill="#fecdd3" />
      <rect x="32" y="38" width="56" height="32" rx="3" fill="#ffe4e6" />
      <rect x="54" y="50" width="12" height="20" rx="2" fill="#fda4af" />
      <rect x="38" y="46" width="10" height="9" rx="2" fill="#fff" />
      <g class="pulse"><path d="M92 46l8 3v6c0 5-3 8-8 10-5-2-8-5-8-10v-6z" fill="#fb7185" /><path d="M89 55l2 2 4-4" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" /></g>
    </g>

    <!-- Riders: a shield with a pulsing plus and sparkles -->
    <g v-else-if="kind === 'shield'">
      <path class="pulse" d="M60 12l24 9v17c0 15-10 26-24 31-14-5-24-16-24-31V21z" fill="#fecdd3" />
      <path d="M60 30v20M50 40h20" stroke="#fb7185" stroke-width="5" stroke-linecap="round" />
      <path class="twinkle" d="M92 16l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#fda4af" />
      <path class="twinkle late" d="M26 52l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z" fill="#fda4af" />
    </g>

    <!-- Tools: tiles lighting up one after another -->
    <g v-else-if="kind === 'tool'">
      <rect v-for="(t, i) in [[34, 18], [62, 18], [34, 46], [62, 46]]" :key="i" class="tile" :style="{ animationDelay: `${i * 0.3}s` }" :x="t[0]" :y="t[1]" width="24" height="24" rx="6" fill="#cbd5e1" />
    </g>

    <!-- A catalogue product: a parcel bouncing, with sparkles -->
    <g v-else>
      <ellipse class="shadow" cx="60" cy="72" rx="22" ry="3.5" fill="#ddd6fe" />
      <g class="hop">
        <path d="M60 20l24 10v26l-24 10-24-10V30z" fill="#ddd6fe" />
        <path d="M36 30l24 10 24-10M60 40v26" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linejoin="round" />
        <path d="M48 25l24 10" stroke="#c4b5fd" stroke-width="4" />
      </g>
      <path class="twinkle" d="M92 18l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#c4b5fd" />
    </g>
  </svg>
</template>

<style scoped>
/* Clipped to its box: the waves and road run wider than the picture */
.art { display: block; width: 100%; height: 100%; overflow: hidden; }
.art :deep(*) { transform-box: fill-box; }

/* Fire */
.flame { transform-origin: 50% 100%; animation: flicker 1.6s ease-in-out infinite; }
.f2 { animation-duration: 1.2s; animation-delay: -0.4s; }
.f3 { animation-duration: 0.9s; animation-delay: -0.2s; }
@keyframes flicker {
  0%, 100% { transform: scale(1, 1) skewX(0deg); }
  25% { transform: scale(0.96, 1.06) skewX(-2deg); }
  50% { transform: scale(1.03, 0.96) skewX(1.5deg); }
  75% { transform: scale(0.98, 1.04) skewX(-1deg); }
}
.spark { animation: rise-fade 2.4s ease-out infinite; }
.s2 { animation-delay: -0.8s; }
.s3 { animation-delay: -1.6s; }
@keyframes rise-fade {
  0% { transform: translateY(8px); opacity: 0; }
  30% { opacity: 1; }
  100% { transform: translateY(-14px); opacity: 0; }
}

/* Motor */
.road { animation: road 0.8s linear infinite; }
@keyframes road { to { transform: translateX(-30px); } }
.car { animation: bounce 0.8s ease-in-out infinite; }
@keyframes bounce { 50% { transform: translateY(-1.2px); } }
.wheel { transform-origin: center; animation: spin 0.8s linear infinite; }

/* Marine */
.ship { transform-origin: 50% 100%; animation: rock 3s ease-in-out infinite; }
@keyframes rock {
  0%, 100% { transform: rotate(-3deg) translateY(0); }
  50% { transform: rotate(3deg) translateY(1.5px); }
}
.wave { transform-box: view-box; }
.w1 { animation: waves 3s linear infinite; }
.w2 { animation: waves 2.2s linear infinite reverse; }
@keyframes waves { from { transform: translateX(0); } to { transform: translateX(-40px); } }

/* Medical */
.ecg { stroke-dasharray: 100; animation: draw-line 2.2s ease-in-out infinite; }
@keyframes draw-line {
  0% { stroke-dashoffset: 100; }
  55%, 75% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -100; }
}
.pulse { transform-origin: center; animation: pulse 1.8s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }

/* Travel */
.orbit { transform-box: view-box; transform-origin: 60px 42px; animation: spin 6s linear infinite; }
.cloud { animation: drift 7s ease-in-out infinite alternate; }
.c2 { animation-duration: 9s; }
@keyframes drift { to { transform: translateX(10px); } }

/* Life */
.beat { transform-origin: center; animation: heartbeat 1.6s ease-in-out infinite; }
@keyframes heartbeat {
  0%, 40%, 100% { transform: scale(1); }
  12% { transform: scale(1.12); }
  24% { transform: scale(1.04); }
  32% { transform: scale(1.1); }
}
.sway { transform-origin: 50% 100%; animation: sway 4s ease-in-out infinite; }
@keyframes sway { 0%, 100% { transform: rotate(-2.5deg); } 50% { transform: rotate(2.5deg); } }

/* Engineering */
.gear { transform-origin: center; }
.spin { animation: spin 8s linear infinite; }
.spin-back { animation: spin 5.2s linear infinite reverse; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Liability */
.tip { transform-box: view-box; transform-origin: 60px 22px; animation: tip 4s ease-in-out infinite; }
@keyframes tip { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }

/* Burglary */
.shackle { animation: unlock 2.8s ease-in-out infinite; }
@keyframes unlock { 0%, 60%, 100% { transform: translateY(0); } 75% { transform: translateY(-5px); } }
.twinkle { transform-origin: center; animation: twinkle 2s ease-in-out infinite; }
.twinkle.late { animation-delay: -1s; }
@keyframes twinkle { 0%, 100% { transform: scale(0.5) rotate(0deg); opacity: 0.3; } 50% { transform: scale(1.1) rotate(45deg); opacity: 1; } }

/* Endowment */
.stack { transform-origin: 50% 100%; animation: grow 2.8s ease-in-out infinite; }
@keyframes grow { 0%, 100% { transform: scaleY(0.92); } 50% { transform: scaleY(1); } }
.draw { stroke-dasharray: 100; animation: draw-line 3s ease-in-out infinite; }

/* Education */
.bob { animation: bounce 2.4s ease-in-out infinite; }
.tassel { transform-origin: 50% 0; animation: sway 2s ease-in-out infinite; }

/* Calendar */
.tick { stroke-dasharray: 10; stroke-dashoffset: 10; animation: tick 2.8s ease-in-out infinite; }
@keyframes tick { 15%, 85% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 10; } }

/* Whole life */
.run { stroke-dasharray: 18 82; animation: run 3s linear infinite; }
@keyframes run { to { stroke-dashoffset: -100; } }

/* Home */
.smoke { animation: smoke 3s ease-out infinite; }
.m2 { animation-delay: -1.5s; }
@keyframes smoke {
  0% { transform: translate(0, 0) scale(0.6); opacity: 0; }
  30% { opacity: 0.9; }
  100% { transform: translate(6px, -16px) scale(1.4); opacity: 0; }
}

/* Tools */
.tile { animation: light 2.4s ease-in-out infinite; }
@keyframes light { 0%, 100% { fill: #cbd5e1; } 25% { fill: #94a3b8; } }

/* Catalogue product */
.hop { animation: hop 1.8s ease-in-out infinite; }
@keyframes hop { 0%, 100% { transform: translateY(0); } 45% { transform: translateY(-6px); } }
.shadow { transform-origin: center; animation: shrink 1.8s ease-in-out infinite; }
@keyframes shrink { 45% { transform: scaleX(0.8); opacity: 0.6; } }

@media (prefers-reduced-motion: reduce) {
  .art :deep(*) { animation: none !important; }
}
</style>
