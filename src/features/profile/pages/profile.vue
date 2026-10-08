<script setup>
import { ref, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import ProfileForm from "../components/ProfileForm.vue";
import SecurityForm from "../components/SecurityForm.vue";
import Button from "@/components/Button.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { updateProfileData, uploadProfilePicture } from "../api/profileApi";
import { convertBase64Image, toasted } from "@/utils/utils";
import { useForm } from "@/components/new_form_builder/useForm";
import icons from "@/utils/icons";
import imageSrc from '@/assets/img/profile.png'
import TabGroup from "@/components/TabGroup.vue";
import { computed } from "vue";

const auth = useAuthStore();

const profilePicture = ref(auth.auth?.user?.imageData || null);

async function processProfilePicture() {
  if (profilePicture.value && !profilePicture.value.startsWith("data:image/")) {
    profilePicture.value = `data:image/png;base64,${profilePicture.value}`;
    return
  }

}

processProfilePicture();

const fileInput = ref(null);
const api=useApiRequest()
const profileApi=useApiRequest()
const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = (event) => {
  const file = event.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    toasted(false, "Please select a valid image file.");
    return;
  }

  const formData = new FormData();
  formData.append("profilePicture", file);

  const reader = new FileReader();

  reader.onload = (e) => {
    const base64Image = e.target.result;

    profileApi.send(
      () => uploadProfilePicture(formData),
      (res) => {
        if (res.success) {
          profilePicture.value = base64Image;
          authStore.setProfile(base64Image);

          localStorage.setItem(
            "userDetail",
            JSON.stringify({...(authStore.auth?.user || {})})
          );

          toasted(true, "Profile picture updated successfully!");
        } else {
          toasted(false, res.error || "Failed to update profile picture.");
        }
      }
    );
  };

  reader.onerror = () => {
    toasted(false, "Error reading image file.");
  };

  reader.readAsDataURL(file); // Trigger FileReader to get base64
};



const active = ref(0);

const setActive = (item) => {
  active.value = item;
};
const components = [
  {
    name: "Profile",
    component: ProfileForm,
  },
  {
    name: "Security",
    component: SecurityForm,
  },
];
const {submit}=useForm('ProfileForm');

// Tabs (TabGroup works with names)
const tabNames = components.map((c) => c.name);
const activeTab = computed({
  get: () => tabNames[active.value],
  set: (name) => setActive(Math.max(0, tabNames.indexOf(name))),
});

const user = computed(() => auth.auth?.user || {});
const fullName = computed(
  () => [user.value.firstName, user.value.fatherName].filter(Boolean).join(" ") || "Your profile"
);

const authStore=useAuthStore();
function handleUpdateProfile({values}){

  const roleUuid = authStore.auth?.user?.roleUuid || authStore.auth?.user?.roleName;

  const payload = {
    email: values?.email ?? authStore.auth?.user?.email,
    title: authStore.auth?.user?.title,
    firstName: values?.firstName,
    fatherName: values?.fatherName,
    grandFatherName: values?.grandFatherName,
    mobilePhone: values?.mobilePhone ?? values?.phone,
    userStatus: 'ACTIVE',
    roleUuid,
    gender: typeof values?.gender === 'string' ? values.gender.toLowerCase() : values?.gender
  };

  api.send(()=>updateProfileData(authStore.auth?.user?.userUuid,payload),res=>{
    if(res.success){

    }
    toasted(res.success,'Profile Updated Successfully',res.error)
  })
}


</script>
<template>
  <div class="space-y-6">
    <!-- Identity -->
    <section class="overflow-hidden card" aria-label="Profile summary">
      <div class="h-28 sm:h-36 profile-banner" aria-hidden="true" />
      <div class="flex flex-col gap-4 px-5 pb-5 -mt-12 sm:flex-row sm:items-end sm:px-6 sm:-mt-14">
        <div class="relative shrink-0 w-fit">
          <img
            :src="profilePicture || imageSrc"
            class="object-cover w-24 h-24 rounded-2xl ring-4 shadow-card sm:w-28 sm:h-28 ring-surface bg-surface-muted"
            alt="Profile photo"
          />
          <button
            type="button"
            class="grid absolute -right-2 -bottom-2 place-items-center w-9 h-9 text-white rounded-full ring-4 transition-colors bg-primary ring-surface hover:bg-primary-hover disabled:opacity-60"
            :disabled="profileApi.pending.value"
            aria-label="Change profile photo"
            @click.prevent="triggerFileInput"
          >
            <svg v-if="profileApi.pending.value" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.3" stroke-width="3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
            </svg>
            <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
            </svg>
          </button>
          <!-- Hidden file input -->
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileChange"
          />
        </div>

        <div class="flex-1 min-w-0 sm:pb-1">
          <h1 class="!px-0 text-xl font-semibold tracking-tight truncate text-ink">{{ fullName }}</h1>
          <p class="flex flex-wrap gap-x-2 gap-y-1 items-center mt-1 text-sm text-ink-muted">
            <span v-if="user.roleName" class="badge badge-primary">{{ user.roleName }}</span>
            <span v-if="user.email" class="truncate">{{ user.email }}</span>
          </p>
        </div>

        <Button
          type="secondary"
          class="self-start sm:self-auto"
          :disabled="profileApi.pending.value"
          @click.prevent="triggerFileInput"
        >
          Change photo
        </Button>
      </div>
    </section>

    <!-- Details -->
    <section class="card" aria-label="Account details">
      <div class="flex flex-col gap-3 px-5 pt-3 border-b sm:flex-row sm:justify-between sm:items-end sm:px-6 border-line">
        <TabGroup v-model="activeTab" :tabs="tabNames" class="!border-b-0" />
        <Button
          v-if="active === 0"
          type="primary"
          class="self-start mb-3 sm:self-auto"
          :pending="api.pending.value"
          @click.prevent="submit(handleUpdateProfile)"
        >
          Save changes
        </Button>
      </div>
      <div class="p-5 sm:p-6">
        <component :is="components[active].component" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.profile-banner {
  background:
    repeating-radial-gradient(circle at 85% 120%, rgb(255 255 255 / 0.07) 0 2px, transparent 2px 28px),
    linear-gradient(120deg, rgb(var(--primary)) 0%, rgb(var(--primary-hover)) 60%, rgb(0 120 160) 140%);
}
</style>
