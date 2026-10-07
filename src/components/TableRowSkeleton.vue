<script setup>
defineProps({
  cols: {
    type: Number,
  },
});
</script>

<template>
  <tr aria-hidden="true">
    <td class="px-4 py-3.5" v-for="num in cols" :key="num">
      <div class="h-3.5 skeleton" :class="num === 1 ? 'w-6' : num % 3 === 0 ? 'w-2/3' : 'w-full max-w-[10rem]'" />
    </td>
  </tr>
</template>
