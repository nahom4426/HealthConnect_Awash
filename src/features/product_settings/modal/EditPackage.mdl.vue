  <script setup>
  import ModalParent from "@/components/ModalParent.vue";
  import NewFormParent from "@/components/NewFormParent.vue";
  import Button from "@/components/Button.vue";
  import { useForm } from "@/components/new_form_builder/useForm";
  import { useApiRequest } from "@/composables/useApiRequest";
  import { updatePackage } from "../api/coverageApi";
  import { useCoverage } from "../store/coverageStore";
  import { closeModal } from "@customizer/modal-x";
  import { useToast } from "@/toast/store/toast";
  import PackageForm from "../components/form/PackageForm.vue";
  import { computed, ref } from "vue";
import { toasted } from "@/utils/utils";

  const props = defineProps({
    data: {
      type: Object,
      required: true,
      default: () => ({
        packageUuid: '',
        packageName: '',
        packageCategory: '',
        packageDescription: '',
        minLimit: 0,
        maxLimit: 0,
        status: 'ACTIVE',
        gender: 'BOTH'
      })
    }
  });

  console.log('EditPackage props:', props);

  // Extract values from nested data prop
  const packageData = computed(() => props.data?.data || props.data);
  const packageUuid = computed(() => packageData.value.packageUuid);

  const { submit } = useForm("editPackageForm");
  const api = useApiRequest();
  const coverageStore = useCoverage();
const pending = ref(false);
function handleUpdate({ values }) {
    console.log('Form values received:', values);
  console.log('allServices value:', values.allServices);
  console.log('allServices type:', typeof values.allServices);
  if (!packageUuid.value) {
    toasted(false, '', 'Package UUID is missing');
    return;
  }

  if (parseInt(values.minLimit) >= parseInt(values.maxLimit)) {
    toasted(false, '', 'Maximum limit must be greater than minimum limit');
    return;
  }

  const payload = {
    packageName: values.packageName,
    packageCategory: values.packageCategory,
    packageDescription: values.packageDescription,
    minLimit: parseInt(values.minLimit) || 0,
    maxLimit: parseInt(values.maxLimit),
    status: values.status || "ACTIVE",
    gender: values.gender,
    allServices: values.allServices === 'true' || values.allServices === true,
     exclusive_benefit: values.exclusive_benefit === 'true' || values.exclusive_benefit === true,
    benefit_pooling: values.benefit_pooling === 'true' || values.benefit_pooling === true,
    benefit_pooling_from: (values.benefit_pooling === 'true' || values.benefit_pooling === true)
      ? (values.benefit_pooling_from || null)
      : null,
  };

  pending.value = true;

  api.send(
    () => updatePackage(packageUuid.value, payload),
    (res) => {
      pending.value = false;
      if (res.success) {
        coverageStore.updatePackage(packageUuid.value, payload);
         toasted(res.success, 'Package updated successfully', res.error);
         closeModal();
      }
     
     
    }
  );
}
  </script>

  <template>
    <ModalParent>
      <NewFormParent
        size="lg"
        title="Edit Package"
        subtitle="Update package information"
      >
        <PackageForm 
          :data="packageData" 
          formId="editPackageForm"
        />

        <template #bottom>
          <div class="flex gap-3 justify-end p-4 w-full border-t border-gray-200">
            <Button
              @click="closeModal"
              type="secondary"
              size="lg"
              class="border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              :pending="api.pending.value"
              @click.prevent="submit(handleUpdate)"
              type="primary"
              size="lg"
              class="text-white bg-blue-600 hover:bg-blue-700"
            >
              Update Package
            </Button>
          </div>
        </template>
      </NewFormParent>
    </ModalParent>
  </template>