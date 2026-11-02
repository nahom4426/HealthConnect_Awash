<script setup>
import { MOTOR_FORM, PAPER_FORMS } from '@/customer/paperClaimForms';

// Standard Insurance's four claim notification forms (standardinsurancesc.com → Forms and downloadables).
// Motor claims are filed online from a policy; the others are filled here and printed to hand in.
const forms = [
  { ...MOTOR_FORM, to: '/policies', action: 'File online' },
  ...PAPER_FORMS.map((f) => ({ ...f, to: `/forms/${f.id}`, action: 'Fill in and print' })),
];
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <h1 class="text-2xl font-semibold">Claim forms</h1>
    <p class="mt-1 text-ink-muted">Choose the kind of claim. We fill Standard Insurance’s own notification form with your answers.</p>

    <ul class="mt-6 space-y-3">
      <li v-for="f in forms" :key="f.id" class="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <p class="text-lg font-semibold">{{ f.title }}</p>
            <p class="text-xs text-ink-subtle">{{ f.subtitle }}</p>
            <p class="mt-1 text-sm text-ink-muted">{{ f.summary }}</p>
            <a :href="f.pdf" target="_blank" rel="noopener noreferrer" class="mt-2 inline-block text-xs text-primary underline">Blank form (PDF)</a>
          </div>
          <router-link :to="f.to" class="inline-flex h-11 shrink-0 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover">
            {{ f.action }}
          </router-link>
        </div>
      </li>
    </ul>
  </div>
</template>
