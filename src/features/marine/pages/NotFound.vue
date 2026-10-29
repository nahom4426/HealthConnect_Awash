<script setup>
import Button from "@/components/Button.vue";
import MarinePageHeader from "../components/MarinePageHeader.vue";
import PageState from "../components/PageState.vue";

defineProps({ backTo: { type: String, default: "/marine/quotes" }, backLabel: { type: String, default: "Back to quotes" } });
</script>

<template>
  <div class="marine-page">
    <MarinePageHeader title="Not found" />
    <PageState kind="notFound">
      <RouterLink :to="backTo"><Button variant="outline" size="sm">{{ backLabel }}</Button></RouterLink>
    </PageState>
  </div>
</template>
