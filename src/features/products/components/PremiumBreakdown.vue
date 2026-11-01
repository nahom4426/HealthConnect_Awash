<script setup>
import { money } from '../productUtils';

// Same shape from the Test tab (rating/test), quote preview, and an issued quotation
defineProps({
  result: { type: Object, required: true },
  title: { type: String, default: 'Premium' },
});

const TYPE_LABELS = {
  BASE_PREMIUM: 'Base',
  LOADING: 'Loading',
  DISCOUNT: 'Discount',
  ADDITIONAL_COVER: 'Cover',
  MINIMUM_PREMIUM: 'Minimum',
  INFO: 'Info',
};
</script>

<template>
  <section class="pp-card flush">
    <h2>{{ title }}</h2>
    <p class="muted" style="padding: 0 1.2rem .6rem; margin: 0">
      <template v-if="result.ratingVersion">Rated with {{ result.ratingVersion }}</template>
      <template v-if="result.totalSumInsured != null"> · sum insured {{ money(result.totalSumInsured, result.currency) }}</template>
    </p>
    <table>
      <thead>
        <tr>
          <th>Line</th>
          <th>Type</th>
          <th class="num">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!result.breakdown?.length">
          <td colspan="3" class="muted">No breakdown lines were returned.</td>
        </tr>
        <tr
          v-for="(line, i) in result.breakdown || []"
          :key="line.code || i"
          :style="line.type === 'MINIMUM_PREMIUM' ? 'background: rgb(var(--warning-soft))' : ''"
        >
          <td>
            <strong>{{ line.label || line.code }}</strong>
            <div v-if="line.code" class="muted mono">{{ line.code }}</div>
          </td>
          <td>
            <span class="pp-pill" :class="{ amber: line.type === 'MINIMUM_PREMIUM', green: line.type === 'DISCOUNT' }">
              {{ TYPE_LABELS[line.type] || line.type }}
            </span>
            <div v-if="line.type === 'INFO'" class="muted">Shown only, not added</div>
            <div v-else-if="line.type === 'MINIMUM_PREMIUM'" class="muted">Minimum premium applied</div>
          </td>
          <td class="num" :style="line.type === 'INFO' ? 'color: rgb(var(--ink-subtle)); font-style: italic' : ''">
            {{ money(line.amount, line.currency || result.currency) }}
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr style="background: rgb(var(--primary) / .07)">
          <td colspan="2"><strong>Total premium</strong></td>
          <td class="num" style="font-size: 1.15rem"><strong>{{ money(result.totalPremium, result.currency) }}</strong></td>
        </tr>
      </tfoot>
    </table>
  </section>
</template>
