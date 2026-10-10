<script setup lang="ts">
interface TableRow {
  rank: number;
  institution: string;
  insuredPersons: number;
  percentage: number;
}

defineProps<{
  data: TableRow[];
}>();
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b-2 border-line bg-gradient-to-r from-surface-muted to-surface-muted">
          <th class="text-left py-4 px-4 font-bold text-ink-muted uppercase text-xs tracking-wider">Rank</th>
          <th class="text-left py-4 px-4 font-bold text-ink-muted uppercase text-xs tracking-wider">Institution</th>
          <th class="text-right py-4 px-4 font-bold text-ink-muted uppercase text-xs tracking-wider">Insured Persons</th>
          <th class="text-right py-4 px-4 font-bold text-ink-muted uppercase text-xs tracking-wider">Share</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-line">
        <tr 
          v-for="(row, idx) in data" 
          :key="idx"
          class="hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/5 transition-all duration-200 group"
        >
          <td class="py-4 px-4">
            <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary text-white font-bold text-xs shadow-md group-hover:shadow-lg transition-shadow">
              {{ row.rank }}
            </span>
          </td>
          <td class="py-4 px-4 font-semibold text-ink">{{ row.institution }}</td>
          <td class="py-4 px-4 text-right">
            <span class="font-bold text-ink">{{ row.insuredPersons.toLocaleString() }}</span>
          </td>
          <td class="py-4 px-4 text-right">
            <div class="flex items-center justify-end gap-2">
              <div class="w-16 bg-line rounded-full h-2">
                <div 
                  class="bg-gradient-to-r from-primary to-primary h-2 rounded-full transition-all duration-300"
                  :style="{ width: row.percentage + '%' }"
                ></div>
              </div>
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-primary/10 to-primary/10 text-primary-hover min-w-[50px] text-center">
                {{ row.percentage }}%
              </span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
</style>
