<script setup lang="ts">
import ClaimDetail from "../../components/ClaimDetail.vue";
import ClaimIndividualDetailDataProvider from "../../components/ClaimIndividualDetailDataProvider.vue";
</script>
<template>
  <ClaimIndividualDetailDataProvider v-slot="{ pending, ...rest }" >
    <ClaimDetail
      v-bind="rest"
    />
  </ClaimIndividualDetailDataProvider>
</template>
