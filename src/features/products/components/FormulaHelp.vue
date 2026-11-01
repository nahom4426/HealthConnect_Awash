<script setup>
// Formula language reference shown beside the Pricing editor
defineProps({
  fieldIds: { type: Array, default: () => [] },
  formulaCodes: { type: Array, default: () => [] },
  perilCodes: { type: Array, default: () => [] },
});

const VARIABLES = [
  ['sumInsured', 'Total sum insured of all risk items'],
  ['itemCount', 'Number of risk items'],
  ['items', 'List of { type, description, sumInsured }'],
  ['answers.<fieldId>', 'A proposal form answer'],
  ['perils', 'Set of selected cover codes'],
  ['minPremium, currency', 'From this version'],
  ['<earlier code>', 'Result of an earlier formula, e.g. BASE'],
];

const FUNCTIONS = [
  ["fn:rate('BRICK','OFFICE')", 'Rate from the rate grid (with * fallback)'],
  ["fn:perilRate('THEFT')", "A cover's rate"],
  ["fn:has('THEFT')", 'Was this cover selected?'],
  ["fn:answer('age')", 'Same as answers.age'],
  ['fn:pct(x, p)', 'p % of x, e.g. fn:pct(BASE, 20)'],
  ['fn:min(a,b), fn:max(a,b)', 'Smaller / larger'],
  ['fn:round(x, 2)', 'Round to 2 decimals'],
  ['fn:between(x, lo, hi)', 'lo ≤ x ≤ hi'],
  ['cond ? a : b', 'If / else'],
  ['&&  ||  ==  >  + - * /', 'Operators'],
];
</script>

<template>
  <aside class="pp-card" style="font-size: .8rem; position: sticky; top: 1rem">
    <h3>Formula reference</h3>
    <table>
      <tbody>
        <tr v-for="[name, meaning] in VARIABLES" :key="name">
          <td style="padding: .35rem .4rem"><code>{{ name }}</code></td>
          <td style="padding: .35rem .4rem" class="muted">{{ meaning }}</td>
        </tr>
        <tr v-for="[name, meaning] in FUNCTIONS" :key="name">
          <td style="padding: .35rem .4rem"><code>{{ name }}</code></td>
          <td style="padding: .35rem .4rem" class="muted">{{ meaning }}</td>
        </tr>
      </tbody>
    </table>

    <h3 style="margin-top: .9rem">This product</h3>
    <p class="muted" style="margin: 0 0 .3rem">Form answers</p>
    <p style="margin: 0 0 .6rem; line-height: 1.9">
      <code v-for="id in fieldIds" :key="id" style="margin-right: .3rem">answers.{{ id }}</code>
      <span v-if="!fieldIds.length" class="muted">No form fields yet</span>
    </p>
    <p class="muted" style="margin: 0 0 .3rem">Covers</p>
    <p style="margin: 0 0 .6rem; line-height: 1.9">
      <code v-for="code in perilCodes" :key="code" style="margin-right: .3rem">{{ code }}</code>
      <span v-if="!perilCodes.length" class="muted">No covers yet</span>
    </p>
    <p class="muted" style="margin: 0 0 .3rem">Formula results (in order)</p>
    <p style="margin: 0; line-height: 1.9">
      <code v-for="code in formulaCodes" :key="code" style="margin-right: .3rem">{{ code }}</code>
      <span v-if="!formulaCodes.length" class="muted">No formulas yet</span>
    </p>

    <p class="muted" style="margin: .9rem 0 0">
      A formula returning <code>null</code> is left out and counts as 0 later. INFO lines are shown but not added.
      Total = sum of the other lines, at least the minimum premium. Loops, assignments and Java calls are blocked.
    </p>
  </aside>
</template>
