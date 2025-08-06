<script setup>
  import { Form, Input, Select, InputPassword } from '@/components/form_elements/'

</script>
<template>
  <Form v-slot="form" class="grid grid-cols-2 grid-flow-row gap-4">
    <slot v-bind="form" />
  </Form>
</template>