<script setup>
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import InsuredForm from "../form/InsuredMemberForm.vue";
import Button from "@/components/Button.vue";
import { useRouter } from "vue-router";
import { closeModal } from "@customizer/modal-x";
import { toasted } from "@/utils/utils";
import { ref } from "vue";
import InsuredPersonFormDataProvider from "../form/InsuredPersonFormDataProvider.vue";
import { insuredMembers } from "../store/insuredPersonsStore";

const pending = ref(false);
const router = useRouter();
const formDataProvider = ref();
const insuredStore = insuredMembers();

async function handleSubmit(formValues) {
  try {
    pending.value = true;

    // Validate required fields
    const requiredFields = [
      "payerUuid",
      "firstName",
      "fatherName",
      "idNumber",
    ];

    const missingFields = requiredFields.filter((field) => !formValues[field]);
    if (missingFields.length > 0) {
      toasted(false, "Validation Error", `Missing required fields: ${missingFields.join(", ")}`);
      return; // Exit early if validation fails
    }

    // Prepare the insured data according to backend expectations
    const insuredPayload = {
      email: formValues.email || "",
      institutionUuid: formValues.institutionUuid || "", // Add if required
      payerInstitutionContractUuid: formValues.payerUuid, // Assuming this is the correct mapping
      premium: 0, // Default value as per backend
      title: "string", // Default or from formValues if available
      firstName: formValues.firstName,
      fatherName: formValues.fatherName,
      grandFatherName: formValues.grandFatherName || "",
      birthDate: formValues.birthDate ? new Date(formValues.birthDate).toISOString() : "",
      phone: formValues.phone || null,
      branchOffice: "string", // Default or from formValues
      position: formValues.position || "",
      idNumber: formValues.idNumber,
      insuranceId: formValues.insuranceId || "", // Add if required
      address1: formValues.woreda || "",
      address2: formValues.city || "",
      address3: formValues.subcity || "",
      state: formValues.state || "Addis Ababa",
      country: formValues.country || "Ethiopia",
      status: formValues.status || "ACTIVE",
      gender: formValues.gender || ""
    };

    // Handle file upload if present
    if (formValues.employeePhoto) {
      const formData = new FormData();
      formData.append('photo', formValues.employeePhoto);
      formData.append('insured', new Blob([JSON.stringify(insuredPayload)], {
        type: 'application/json'
      }));

      console.log("Submitting with photo:", insuredPayload);
      const result = await formDataProvider.value.register(formData);

      if (result.success) {
        handleSuccess(result.data);
      } else {
        throw new Error(result.error || "Registration failed");
      }
    } else {
      // Submit without photo as pure JSON
      console.log("Submitting without photo:", insuredPayload);
      const result = await formDataProvider.value.register(insuredPayload);

      if (result.success) {
        handleSuccess(result.data);
      } else {
        throw new Error(result.error || "Registration failed");
      }
    }
  } catch (error) {
    console.error("Submission error:", error);
    toasted(false, "Failed to submit form", error.message);
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
  router.push("/insured_list");
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
            :onCancel="() => closeModal()"
          />
        </InsuredPersonFormDataProvider>
      </div>
    </NewFormParent>
  </ModalParent>
</template>
