<script setup>
import { ref } from 'vue';

const activeTab = ref('Overview');
</script>

<template>
  <div class="p-6 h-full flex flex-col bg-surface-muted">
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-ink">Broker Dashboard</h1>
        <p class="text-sm text-ink-subtle">Overview of broker performance and system metrics.</p>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-5 rounded-xl border border-line shadow-sm">
        <div class="text-sm font-semibold text-ink-subtle uppercase tracking-wider">Total Brokers</div>
        <div class="text-3xl font-bold text-ink mt-2">124</div>
      </div>
      <div class="bg-white p-5 rounded-xl border border-line shadow-sm">
        <div class="text-sm font-semibold text-ink-subtle uppercase tracking-wider">Active Rules</div>
        <div class="text-3xl font-bold text-success mt-2">8</div>
      </div>
      <div class="bg-white p-5 rounded-xl border border-line shadow-sm">
        <div class="text-sm font-semibold text-ink-subtle uppercase tracking-wider">Pending Comm.</div>
        <div class="text-3xl font-bold text-warning mt-2">ETB 45,210</div>
      </div>
      <div class="bg-white p-5 rounded-xl border border-line shadow-sm">
        <div class="text-sm font-semibold text-ink-subtle uppercase tracking-wider">Total Paid (YTD)</div>
        <div class="text-3xl font-bold text-primary mt-2">ETB 1.2M</div>
      </div>
    </div>

    <div class="bg-white flex-1 rounded-xl border border-line shadow-sm flex items-center justify-center text-ink-subtle">
      Charts and recent transactions will go here.
    </div>
  </div>
</template>
