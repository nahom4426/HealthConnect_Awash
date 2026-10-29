<script setup>
// 403: names the role(s) the page needs (plan 4.2).
import { computed } from "vue";
import { useRoute } from "vue-router";
import Button from "@/components/Button.vue";
import MarinePageHeader from "../components/MarinePageHeader.vue";
import PageState from "../components/PageState.vue";
import { ROLE_LABELS } from "../constants";

const route = useRoute();
const roles = computed(() => String(route.query.roles || "").split(",").filter(Boolean).map((r) => ROLE_LABELS[r] ?? r));
const roleText = computed(() => (roles.value.length > 1 ? `${roles.value.slice(0, -1).join(", ")} or ${roles.value.at(-1)}` : roles.value[0] || "a different"));
</script>

<template>
  <div class="marine-page">
    <MarinePageHeader title="No access" />
    <PageState kind="forbidden" title="You don't have access to this page" :message="`You need the ${roleText} role to open this page.`">
      <RouterLink to="/marine/quotes"><Button variant="outline" size="sm">Back to quotes</Button></RouterLink>
    </PageState>
  </div>
</template>
