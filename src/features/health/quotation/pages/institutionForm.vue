<script setup lang="ts">
import { ref } from "vue"
import Input from "@/components/new_form_elements/Input.vue";
const showInstitution = ref(true)
const showMore = ref(true)
const institutionForm = ref({
  institutionName: "",
  email: "",
  tinNumber: "",
  telephone: "",
  description: "",
  category: "",
  referralType: "",
  address: "",
})

function prefillOnce(v: any) {
  if (!prefilled.value && v) {
    institutionForm.value = {
      institutionName: v.institutionName || "",
      email: v.email || "",
      tinNumber: (v.tinNumber as any) || "",
      telephone: v.telephone || "",
      description: v.description || "",
      category: (v.category as any) || "",
      referralType: v.referralType || "Direct",
      address: `${v.address1 || ''} ${v.address2 || ''} ${v.address3 || ''}, ${v.state || ''}`,
    }
    prefilled.value = true
    currentInstitution.value = v
  }
  return true
}

</script>

<template v-if="prefillOnce(instituton)">
<div class="px-4 box-border flex bg-sky-100 border-sky-400 border rounded-lg p-4 flex-col gap-3">

        <div class="flex flex-col  p-3 px-2 rounded-md gap-3">
          <div class="flex items-center justify-between border-b pb-2">
            <div class="text-3xl">Institution Detail</div>
            <button class="text-primary" @click.prevent="(showInstitution = !showInstitution)">{{ showInstitution ? 'Hide' : 'Show' }}</button>
          </div>
          <div v-show="showInstitution" class="grid grid-cols-2 gap-3">
            <Input name="institutionName" v-model="institutionForm.institutionName" label="Institution Name" />
            <Input name="email" v-model="institutionForm.email" label="Email" />
            <Input name="tinNumber" v-model="institutionForm.tinNumber" label="Tin Number" />
            <Input name="telephone" v-model="institutionForm.telephone" label="Telephone" />
          </div>
        </div>

        <div class="flex flex-col  p-3 px-2 rounded-md gap-3">
          <div class="flex items-center   justify-between border-b pb-2">
            <div class="text-lg">More Detail</div>
            <button class="text-primary" @click.prevent="(showMore = !showMore)">{{ showMore ? 'Hide' : 'Show' }}</button>
          </div>
          <div v-show="showMore" class="grid grid-cols-2 gap-3">
            <Input name="description" v-model="institutionForm.description" label="Description" />
            <Input name="category" v-model="institutionForm.category" label="Category" />
            <Input name="referralType" v-model="institutionForm.referralType" label="Source Of Business" />
            <Input name="address" v-model="institutionForm.address" label="Address" />
          </div>
        </div>
        </div>
        </template>