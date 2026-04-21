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
  <div class="box-border overflow-auto max-w-full min-h-full">
    <div class="relative">
      <div class="h-56 rounded-2xl bg-primary"></div>
      <div class="flex absolute right-8 left-8 top-28 gap-8">
        <div class="p-4 space-y-4 bg-white rounded-2xl w-fit h-fit">
          <img
            :src="profilePicture || imageSrc"
            class="rounded-lg w-[259px] h-[206px] object-cover"
            alt="Profile"
          />

          <!-- Hidden file input -->
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileChange"
          />

          <button
            @click.prevent="triggerFileInput"
            class="flex gap-4 justify-center items-center w-full h-12 font-medium text-white rounded bg-primary hover:bg-primary/80"
            size="xs"
            type="primary"
          >
          <i v-if="profileApi.pending.value" v-html="icons.spinner"/>
          <p v-else>Change Photo</p>
            
          </button>
        </div>
        <div class="p-6 space-y-14 w-full bg-white rounded-2xl">
         <div class="flex justify-between items-center w-full">
           <div class="flex rounded border border-base-clr w-fit">
            <div
              v-for="(item, index) in components"
              :key="index"
              @click="setActive(index)"
              :class="[
                'px-4 py-3 transition-colors cursor-pointer duration-300',
                active === index
                  ? index === 0
                    ? 'bg-base-clr w-fit text-white rounded-l font-medium'
                    : 'bg-base-clr text-white rounded-r  font-medium'
                  : '',
              ]"
            >
              {{ item.name }}
            </div>
          </div>
          <Button v-if="active===0" :pending="api.pending.value" @click.prevent="submit(handleUpdateProfile)" class=" bg-[#FFD665]  font-medium leading-5" type="">Edit</Button>
         </div>
          <component
            :is="components[active].component"
          ></component>
        </div>
      </div>
    </div>
  </div>
</template>
