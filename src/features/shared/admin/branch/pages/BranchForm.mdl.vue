<script setup>
// Create / edit a branch. data: { branch?: BranchResponse, onSaved?: (branch) => void }
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Input from "@/components/new_form_elements/Input.vue";
import Form from "@/components/new_form_builder/Form.vue";
import { closeModal } from "@customizer/modal-x";
import { computed, ref } from "vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { toasted } from "@/utils/utils";
import { createBranch, updateBranch } from "../Api/BranchApi";

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});

const existing = props.data?.branch || null;
const isEdit = computed(() => !!existing?.branchUuid);

const code = ref(existing?.code || "");
const name = ref(existing?.name || "");
const region = ref(existing?.region || "");
const address = ref(existing?.address || "");
const phone = ref(existing?.phone || "");

const req = useApiRequest();

function handleSubmit() {
  const payload = {
    code: code.value?.trim(),
    name: name.value?.trim(),
    region: region.value?.trim() || null,
    address: address.value?.trim() || null,
    phone: phone.value?.trim() || null,
  };

  req.send(
    () => (isEdit.value ? updateBranch(existing.branchUuid, payload) : createBranch(payload)),
    (res) => {
      toasted(res.success, isEdit.value ? "Branch updated" : "Branch created", res.error);
      if (res.success) {
        if (typeof props.data?.onSaved === "function") props.data.onSaved(res.data);
        closeModal();
      }
    }
  );
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="mdd"
      :title="isEdit ? `Edit ${existing?.name || 'Branch'}` : 'Create Branch'"
      subtitle="Branch code and name are required."
    >
      <Form :inner="true" class="p-4 sm:p-6" id="branch-form" v-slot="{ submit }">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-ink-muted">
              Code <span class="text-error">*</span>
            </label>
            <Input
              v-model="code"
              name="code"
              validation="required"
              :attributes="{ placeholder: 'e.g. BOLE', required: true, maxlength: 30 }"
            />
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-ink-muted">
              Name <span class="text-error">*</span>
            </label>
            <Input
              v-model="name"
              name="name"
              validation="required"
              :attributes="{ placeholder: 'Branch name', required: true, maxlength: 120 }"
            />
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-ink-muted">Region</label>
            <Input
              v-model="region"
              name="region"
              :attributes="{ placeholder: 'Region', maxlength: 80 }"
            />
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-ink-muted">Phone</label>
            <Input
              v-model="phone"
              name="phone"
              :attributes="{ placeholder: 'Phone', maxlength: 20 }"
            />
          </div>
          <div class="space-y-2 sm:col-span-2">
            <label class="block text-sm font-medium text-ink-muted">Address</label>
            <Input
              v-model="address"
              name="address"
              :attributes="{ placeholder: 'Address', maxlength: 255 }"
            />
          </div>
        </div>

        <div class="flex flex-col-reverse gap-3 justify-end pt-4 mt-6 border-t border-line sm:flex-row">
          <button
            type="button"
            @click="closeModal()"
            :disabled="req.pending.value"
            class="px-4 py-2.5 w-full text-sm bg-white rounded-lg border transition-colors text-ink-muted border-line-strong sm:w-auto sm:px-6 hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="submit(() => handleSubmit())"
            :disabled="req.pending.value"
            class="px-4 py-2.5 w-full text-sm text-white rounded-lg transition-colors bg-primary sm:w-auto sm:px-6 hover:bg-primary-hover disabled:opacity-50"
          >
            {{ req.pending.value ? "Saving…" : isEdit ? "Update Branch" : "Create Branch" }}
          </button>
        </div>
      </Form>
    </NewFormParent>
  </ModalParent>
</template>
