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

    const requiredFields = [
      "payerUuid",
      "firstName",
      "fatherName",
      "idNumber",
      
    ];

    const missingFields = requiredFields.filter((field) => !formValues[field]);
    if (missingFields.length > 0) {
      // throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
      toasted(false, "Validation Error ", `Missing required fields: ${missingFields.join(", ")}`);

    }

    const formData = new FormData();
    if (formValues.employeePhoto) {
      formData.append("photo", formValues.employeePhoto);
    }

    const insuredData = {
      email: formValues.email || "",
      firstName: formValues.firstName,
      payerUuid: formValues.payerUuid,
      fatherName: formValues.fatherName,
      grandFatherName: formValues.grandFatherName,
      groupUuid:formValues.groupUuid,
      birthDate: formValues.birthDate,
      inactiveDate: formValues.inactiveDate || "",
      phone: formValues.phone || null,
      woreda: formValues.woreda || "",
      state: formValues.state || "Addis Ababa",
      city: formValues.city || "",
       subcity: formValues.subcity || "",
      country: formValues.country || "Ethiopia",
      idNumber: formValues.idNumber,
      position: formValues.position,
      gender: formValues.gender,
      status: formValues.status || "ACTIVE",
    };

    formData.append("insured", JSON.stringify(insuredData));

    console.log("Submitting insured data:", insuredData);

    const result = await formDataProvider.value.register(formData);

    if (result.success) {
      // Process the insured data to include photo information
      const newInsured = {
        ...result.data,
        photoUrl:
          result.data.photoUrl ||
          (result.data.photoPath
            ? `${
                import.meta.env.VITE_API_URL || "http://localhost:8080/api"
              }/insured/photo/${result.data.photoPath}`
            : null),
      };

      // Add the new insured to the store
      insuredStore.add(newInsured);

      // Show success message
      // toasted(true, "Success", "Employee added successfully");

      // Call the onAdded callback if it exists
      if (
        formDataProvider.value.props &&
        formDataProvider.value.props.data &&
        formDataProvider.value.props.data.onAdded &&
        typeof formDataProvider.value.props.data.onAdded === "function"
      ) {
        formDataProvider.value.props.data.onAdded(newInsured);
      }

      closeModal();
      router.push("/insured_list");
    } else {
      // throw new Error(result.error || "Registration failed");
    }
  } catch (error) {
    console.error("Submission error:", error);
    // toasted(false, "Failed to submit form", error.message);
  } finally {
    pending.value = false;
  }
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
