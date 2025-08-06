<script setup>
  import pdfMake from 'pdfmake/build/pdfmake'
  import pdfFonts from 'pdfmake/build/vfs_fonts'
  import { ref, watch } from 'vue';
  
  pdfMake.vfs = pdfFonts.pdfMake.vfs

  const props = defineProps({
    content: {
      type: [Object, Array],
      required: true
    }
  })

  const file = ref()

  pdfMake.createPdf(props.content).getBlob(blob => {
    file.value = URL.createObjectURL(blob)
  })

  watch(props, () => {
    pdfMake.createPdf(props.content).getBlob(blob => {
      file.value = URL.createObjectURL(blob)
    })
  })
</script>
<template>
  <slot
    :file="file"
  />
</template>