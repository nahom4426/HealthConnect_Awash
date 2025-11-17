<script setup>
import { ref, onMounted, computed } from "vue";
import Form from "@/components/new_form_builder/Form.vue";
import Input from "@/components/new_form_elements/Input.vue";
import Select from "@/components/new_form_elements/Select.vue";
import Button from "@/components/Button.vue";
import InputEmail from "@/components/new_form_elements/InputEmail.vue";
import ModalFormSubmitButton from "@/components/new_form_builder/ModalFormSubmitButton.vue";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const props = defineProps({
  isEdit: {
    type: Boolean,
    default: false,
  },
  institutionId: {
    type: String,
    required: true,
  },
  pending: {
    type: Boolean,
    default: false,
  },
});

const genderOptions = ["Male", "Female", "Other"];
</script>

<template>
  <Form id="familyGroup-form" class="bg-white rounded-lg shadow-sm"> </Form>
</template>
