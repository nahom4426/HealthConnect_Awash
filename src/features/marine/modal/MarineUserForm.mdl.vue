<script setup>
// Create or edit a Marine user. data: { user?: User, selfUsername?: string } — removing your own
// ADMIN role is blocked. Closes with the saved user.
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import FormField from "../components/FormField.vue";
import FormErrorBanner from "../components/FormErrorBanner.vue";
import { inputClass, inputBorder } from "../components/styles";
import { emailRule, required, useForm } from "../composables/useForm";
import { createUser, updateUser } from "../api/marineApi";
import { notifyError } from "../api/marineClient";
import { ROLE_LABELS, ROLES } from "../constants";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const u = props.data?.user ?? {};
const editing = !!u.id;
const isSelf = editing && !!props.data?.selfUsername && u.username === props.data.selfUsername;

const { form, errors, pending, check, validate, applyServerError, bannerItems, submitted } = useForm(
  { username: u.username ?? "", fullName: u.fullName ?? "", email: u.email ?? "", roles: u.roles ?? [], enabled: u.enabled ?? true },
  {
    username: (v) => (!/^[a-z0-9._-]{3,40}$/i.test(v) ? "Username is 3 to 40 letters, digits, dots, dashes or underscores" : ""),
    fullName: required("Full name"),
    email: (v) => required("Email")(v) || emailRule(v),
    roles: (v) => (!v.length ? "Pick at least one role" : isSelf && u.roles?.includes("ADMIN") && !v.includes("ADMIN") ? "You can't remove your own Admin role" : ""),
  },
  { username: "Username", fullName: "Full name", email: "Email", roles: "Roles" }
);

function toggleRole(r) {
  form.roles = form.roles.includes(r) ? form.roles.filter((x) => x !== r) : [...form.roles, r];
  check("roles");
}

async function submit() {
  if (!validate()) return;
  pending.value = true;
  const res = editing ? await updateUser(u.id, form) : await createUser(form);
  pending.value = false;
  if (res.ok) {
    toasted(true, editing ? "User updated" : `${res.data.username} created`);
    closeModal(res.data);
  } else if (!applyServerError(res.error)) notifyError(res.error);
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="editing ? `Edit ${u.username}` : 'New user'">
      <FormErrorBanner :items="submitted ? bannerItems() : []" />
      <form id="marine-user-form" class="grid gap-4 sm:grid-cols-2" novalidate @submit.prevent="submit">
        <FormField v-slot="{ id, invalid }" label="Username" name="username" required :error="errors.username">
          <input :id="id" v-model="form.username" v-focus="!editing" autocomplete="off" :class="[inputClass, inputBorder(invalid)]" @blur="check('username')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Full name" name="fullName" required :error="errors.fullName">
          <input :id="id" v-model="form.fullName" :class="[inputClass, inputBorder(invalid)]" @blur="check('fullName')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Email" name="email" required :error="errors.email" class="sm:col-span-2">
          <input :id="id" v-model="form.email" type="email" :class="[inputClass, inputBorder(invalid)]" @blur="check('email')" />
        </FormField>
        <FormField label="Roles" name="roles" required :error="errors.roles" class="sm:col-span-2">
          <div class="grid gap-2 sm:grid-cols-2" role="group" aria-label="Roles">
            <label v-for="r in ROLES" :key="r" :class="['inline-flex gap-2 items-center px-3 h-9 text-sm rounded-lg border cursor-pointer', form.roles.includes(r) ? 'border-primary bg-primary/5 text-primary' : 'border-line text-ink']">
              <input type="checkbox" class="accent-[rgb(var(--primary))]" :checked="form.roles.includes(r)" @change="toggleRole(r)" />
              {{ ROLE_LABELS[r] }}
            </label>
          </div>
        </FormField>
        <label class="flex gap-3 items-center sm:col-span-2">
          <input v-model="form.enabled" type="checkbox" class="accent-[rgb(var(--primary))]" :disabled="isSelf" />
          <span class="text-sm text-ink">Enabled <span v-if="isSelf" class="text-ink-subtle">(you can't disable yourself)</span></span>
        </label>
        <p v-if="!editing" class="text-xs sm:col-span-2 text-ink-subtle">How new users set their first password is still open (plan section 9); share it with them separately for now.</p>
      </form>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="marine-user-form" :pending="pending">{{ editing ? "Save changes" : "Create user" }}</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
