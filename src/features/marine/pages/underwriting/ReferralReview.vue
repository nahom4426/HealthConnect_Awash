<script setup>
// Old referral links open the same quotation, on its underwriting section.
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import PageState from "../../components/PageState.vue";
import { getReferral } from "../../api/marineApi";

const route = useRoute();
const router = useRouter();
const error = ref(null);

onMounted(async () => {
  const res = await getReferral(route.params.id);
  if (!res.ok) {
    error.value = res.error;
    return;
  }
  router.replace({ path: `/marine/quotes/${res.data.quoteId}`, query: { tab: "underwriting" } });
});
</script>

<template>
  <div class="marine-page">
    <PageState v-if="error" kind="error" :message="error.message">
      <RouterLink to="/marine/quotes?status=REFERRED"><Button variant="outline" size="sm">Back to quotations</Button></RouterLink>
    </PageState>
    <PageState v-else kind="loading" />
  </div>
</template>
