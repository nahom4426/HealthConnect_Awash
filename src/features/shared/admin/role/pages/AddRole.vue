<script setup>
import PrivilegesDataProvider from "../../privilege/components/RolePrivilegesDataProvider.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { craeteRole } from "../Api/RoleApi";
import { toasted } from "@/utils/utils";
import { useRoles } from "../store/roleStore";
import RoleForm from "../form/RoleForm.vue";
import { useRouter } from "vue-router";
import NewFormParent from "../components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { useForm } from "@/components/new_form_builder/useForm";
import { computed, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { moduleLabel, moduleOptions } from "../../catalog";

const { submit } = useForm("roleForm");
const roleStore = useRoles();
const req = useApiRequest();
const router = useRouter();
const authStore = useAuthStore();
const currentUser = computed(() => authStore.auth?.user ?? authStore.auth ?? {});
const modules = computed(() => moduleOptions(currentUser.value));
const moduleType = ref(modules.value.length === 1 ? modules.value[0].value : "");

function create({ values }) {
  if (!moduleType.value) {
    toasted(false, "", "Select a module for this role");
    return;
  }
  req.send(
    () => craeteRole({ ...values, moduleType: moduleType.value }),
    (res) => {
      if (res.success) {
        roleStore.add(res.data);
        router.push("/roles");
        toasted(res.success, "Role Created", res.error);
      }
      
      //  
    }
  );
}

const goBack = () => {
  router.go(-1);
};
</script>

<template>
  <NewFormParent
    :is-modal="false"
    size="auto"
    class="pb-2 bg-white"
    title="Add Role"
  >
    <div class="px-6 pt-6 max-w-sm">
      <label class="block mb-1 text-sm font-medium text-ink" for="role-module">Module</label>
      <select
        id="role-module"
        v-model="moduleType"
        class="px-3 w-full h-control text-sm bg-white rounded-lg border text-ink border-line-strong"
      >
        <option value="">Select a module</option>
        <option v-for="mod in modules" :key="mod.value" :value="mod.value">{{ mod.label }}</option>
      </select>
      <p v-if="!moduleType" class="mt-2 text-sm text-ink-muted">Choose a module to load its privileges. A role belongs to one module.</p>
    </div>
    <PrivilegesDataProvider :module-type="moduleType" :pre-page="5000" v-slot="{ privileges, pending }">
      <RoleForm
        v-if="moduleType && !pending"
        :privilege-key="moduleType"
        :privileges="privileges"
        :selectPrivilege="[]"
        :role="{ roleName: '', roleDescription: '' }"
      />
      <p v-else-if="moduleType" class="px-6 py-4 text-sm text-ink-muted">Loading {{ moduleLabel(moduleType) }} privileges...</p>
    </PrivilegesDataProvider>

    <template #bottom>
      <Button
        size="sm"
        type="primary"
        class="flex gap-3 justify-center items-center p-2 mt-3 bg-primary"
        :pending="req.pending.value"
        @click.prevent="submit(create)"
      >
        Add Role
      </Button>
    </template>
  </NewFormParent>
</template>
