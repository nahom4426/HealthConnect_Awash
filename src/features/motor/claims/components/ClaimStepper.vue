<script setup>
// Breadcrumb-style stepper shared by the new-claim wizard and the claim workspace.
// steps: [{ n, label, hint, state }]; state holds one or more of current, done, error, todo, closed
// (e.g. 'error current').
import { computed } from 'vue';

const props = defineProps({
  steps: { type: Array, required: true },
  // Fraction of the bar to fill, 0..1; defaults to the current step's position.
  progress: { type: Number, default: null },
  label: { type: String, default: 'Steps' },
});
const emit = defineEmits(['select']);

const has = (s, flag) => String(s.state || '').split(' ').includes(flag);

const fill = computed(() => {
  if (props.progress !== null) return Math.max(0, Math.min(1, props.progress));
  const idx = props.steps.findIndex(s => has(s, 'current'));
  return idx < 0 ? 1 : (idx + 1) / props.steps.length;
});
</script>

<template>
  <nav class="cs-steps" :aria-label="label">
    <ol>
      <li v-for="s in steps" :key="s.n" :class="s.state">
        <button type="button" :title="s.hint ? `${s.label} · ${s.hint}` : s.label" :aria-current="has(s, 'current') ? 'step' : undefined" @click="emit('select', s)">
          <span class="cs-no">
            <template v-if="has(s, 'error')">!</template>
            <template v-else-if="has(s, 'done')">✓</template>
            <template v-else-if="has(s, 'closed')">✕</template>
            <template v-else>{{ s.n }}</template>
          </span>
          <span class="cs-text">
            <span class="cs-label">{{ s.label }}</span>
            <span v-if="s.hint" class="cs-hint">{{ s.hint }}</span>
          </span>
        </button>
      </li>
    </ol>
    <div class="cs-progress" aria-hidden="true"><span :style="{ width: `${fill * 100}%` }"></span></div>
  </nav>
</template>

<style scoped>
.cs-steps { scroll-margin-top: 1rem; }
.cs-steps ol { display: flex; list-style: none; margin: 0; padding: 0; overflow-x: auto; }
.cs-steps li { flex: 1 1 0; min-width: 8rem; position: relative; display: flex; }
.cs-steps li + li { margin-left: -2px; }
.cs-steps button {
  width: 100%; height: 100%; display: flex; align-items: center; gap: .5rem; padding: .65rem 1.1rem .65rem 1.5rem; border: 0; cursor: pointer;
  background: #eef2f7; color: var(--cn-sub, #64748b); text-align: left; font-family: inherit;
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 14px 50%);
  transition: background .2s, color .2s;
}
:global(.dark) .cs-steps button { background: rgba(255,255,255,0.05); }
.cs-steps li:first-child button { padding-left: 1rem; clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%); border-radius: 10px 0 0 10px; }
.cs-steps li:last-child button { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 14px 50%); border-radius: 0 10px 10px 0; }
.cs-steps button:hover { color: var(--cn-title, #0f172a); background: #e0e7ff; }
.cs-steps button:focus-visible { outline: none; box-shadow: inset 0 0 0 2px var(--cn-accent, #6366f1); }
.cs-steps li.done button { color: #047857; background: #ecfdf5; }
.cs-steps li.current button { color: #fff; background: var(--cn-accent, #6366f1); }
.cs-steps li.error button { color: #b91c1c; background: #fef2f2; }
.cs-steps li.error.current button { color: #fff; background: #dc2626; }
.cs-steps li.closed button { color: #b91c1c; background: #fef2f2; }
.cs-steps li.viewing button { box-shadow: inset 0 -3px 0 var(--cn-accent, #6366f1); }
.cs-no { flex-shrink: 0; width: 1.6rem; height: 1.6rem; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-size: .75rem; font-weight: 800; background: rgba(255,255,255,.75); color: inherit; border: 1.5px solid currentColor; }
.cs-steps li.current .cs-no { background: #fff; color: var(--cn-accent, #6366f1); border-color: #fff; }
.cs-steps li.error.current .cs-no { color: #dc2626; }
.cs-text { display: flex; flex-direction: column; min-width: 0; }
.cs-label { font-size: .8rem; font-weight: 800; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
.cs-hint { font-size: .68rem; font-weight: 600; opacity: .85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cs-progress { height: 3px; border-radius: 3px; background: var(--cn-border, #e2e8f0); margin-top: .6rem; overflow: hidden; }
.cs-progress span { display: block; height: 100%; background: var(--cn-accent, #6366f1); transition: width .35s ease; }
@media (prefers-reduced-motion: reduce) { .cs-progress span { transition: none; } }

/* Narrow screens: numbers only, plus the current step's name */
@media (max-width: 1100px) {
  .cs-steps li { min-width: 0; }
  .cs-hint { display: none; }
  .cs-steps li:not(.current) .cs-text { display: none; }
  .cs-steps li:not(.current) { flex: 0 0 4rem; }
}
</style>
