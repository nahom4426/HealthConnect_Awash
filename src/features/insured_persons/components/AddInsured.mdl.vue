<script setup>
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import InsuredForm from "../form/InsuredMemberForm.vue";
import Button from "@/components/Button.vue";
import { useRouter } from "vue-router";
import { closeModal } from "@customizer/modal-x";
import { toasted } from "@/utils/utils";
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import InsuredPersonFormDataProvider from "../form/InsuredPersonFormDataProvider.vue";
import { insuredMembers } from "../store/insuredPersonsStore";
import { useRoute } from "vue-router";
const route = useRoute();
const institutionUuid = route.params.institutionUuid;
const payerInstitutionContractUuid = route.params.id;
const pending = ref(false);
const router = useRouter();
const formDataProvider = ref();
const insuredStore = insuredMembers();
const authStore = useAuthStore();

function normalizeEmptyToNull(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value instanceof File) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : value;
  }
  return value;
}

function normalizePayload(payload) {
  const normalized = {};
  for (const [key, value] of Object.entries(payload)) {
    normalized[key] = normalizeEmptyToNull(value);
  }
  return normalized;
}

async function handleSubmit(formValues) {
  try {
    pending.value = true;

    // Validate required fields
    const requiredFields = [
      "firstName",
      "fatherName",
    ];

    const missingFields = requiredFields.filter((field) => !formValues[field]);
    if (missingFields.length > 0) {
      toasted(false, "Validation Error", `Missing required fields: ${missingFields.join(", ")}`);
      return; // Exit early if validation fails
    }

    // Prepare the insured data according to backend expectations
    const insuredPayload = normalizePayload({
      email: formValues.email,
      institutionUuid: formValues.institutionUuid || institutionUuid || null, // Add if required
      payerInstitutionContractUuid: payerInstitutionContractUuid || null, // Assuming this is the correct mapping
      hasInstitution: false,
      group: false,
      premium: 0, // Default value as per backend
      title: "string", // Default or from formValues if available
      firstName: formValues.firstName,
      fatherName: formValues.fatherName,
      grandFatherName: formValues.grandFatherName,
      birthDate: formValues.birthDate ? new Date(formValues.birthDate).toISOString() : null,
      phone: formValues.phone || null,
      branchOffice: "string", // Default or from formValues
      position: formValues.position,
      idNumber: formValues.idNumber || null,
      insuranceId: formValues.insuranceId || null, // Add if required
      address1: formValues.woreda,
      address2: formValues.city,
      address3: formValues.subcity,
      state: formValues.state || "Addis Ababa",
      country: formValues.country || "Ethiopia",
      status: formValues.status || "ACTIVE",
      gender: formValues.gender || "Male"
    });

    // Always send multipart FormData like Provider: 'insured' JSON + optional 'photo'
    const formData = new FormData();
    formData.append('insuredRequest', JSON.stringify(insuredPayload));
    if (formValues.employeePhoto) {
      formData.append('profile', formValues.employeePhoto);
    }

    // Debug: log what we are sending
    console.log('AddInsured submit -> insuredPayload:', insuredPayload);
    console.log('AddInsured submit -> FormData entries:');
    for (const [k, v] of formData.entries()) {
      if (v instanceof File || v instanceof Blob) {
        console.log(`  - ${k}:`, `${v.constructor.name} type=${v.type || 'n/a'} size=${v.size}`);
      } else {
        console.log(`  - ${k}:`, v);
      }
    }

    const result = await formDataProvider.value.register(formData);

    if (result.success) {
      handleSuccess(result.data);
    } else {
      throw new Error(result.error || "Registration failed");
    }
  } catch (error) {
    console.error("Submission error:", error);
    // toasted(false, "Failed to submit form", error.message);
  } finally {
    pending.value = false;
  }
}

function handleSuccess(data) {
  // Process the insured data to include photo information
  const newInsured = {
    ...data,
    photoUrl: data.photoUrl || (data.photoPath 
      ? `${import.meta.env.VITE_API_URL || "http://localhost:8080/api"}/insured/photo/${data.photoPath}`
      : null),
  };

  // Add to store
  insuredStore.add(newInsured);

  // Show success message
  toasted(true, "Success", "Employee added successfully");

  // Call callback if exists
  if (formDataProvider.value.props?.data?.onAdded && typeof formDataProvider.value.props.data.onAdded === "function") {
    formDataProvider.value.props.data.onAdded(newInsured);
  }

  closeModal();
  // router.push("/insured_list");
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      class=""
      size="lg"
      title="Add Employee"
      subtitle="To add a new employee, please fill out the information in the fields below."
    >
      <div class="bg-white rounded-lg">
        <InsuredPersonFormDataProvider ref="formDataProvider">
          <InsuredForm
            :onSubmit="handleSubmit"
            :pending="pending"
            :institutionId="authStore.auth?.user?.payerUuid || ''"
            :onCancel="() => closeModal()"
          />
        </InsuredPersonFormDataProvider>
      </div>
    </NewFormParent>
  </ModalParent>
</template>
