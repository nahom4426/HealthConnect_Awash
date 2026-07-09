<script setup>
import { ref } from 'vue';

const activeTab = ref('Overview');
</script>

<template>
  <div class="p-6 h-full flex flex-col bg-slate-50">
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Broker Dashboard</h1>
        <p class="text-sm text-slate-500">Overview of broker performance and system metrics.</p>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div class="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Brokers</div>
        <div class="text-3xl font-bold text-slate-900 mt-2">124</div>
      </div>
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div class="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Rules</div>
        <div class="text-3xl font-bold text-emerald-600 mt-2">8</div>
      </div>
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div class="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pending Comm.</div>
        <div class="text-3xl font-bold text-amber-600 mt-2">ETB 45,210</div>
      </div>
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div class="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Paid (YTD)</div>
        <div class="text-3xl font-bold text-indigo-600 mt-2">ETB 1.2M</div>
      </div>
    </div>

    <div class="bg-white flex-1 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center text-slate-400">
      Charts and recent transactions will go here.
    </div>
  </div>
</template>
