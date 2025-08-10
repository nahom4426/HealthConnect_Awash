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
    minLimit: parseInt(values.minLimit),
    maxLimit: parseInt(values.maxLimit),
    status: values.status || "ACTIVE",
    gender: values.gender
  };

  pending.value = true;

  api.send(
    () => updatePackage(packageUuid.value, payload),
    (res) => {
      pending.value = false;
      if (res.success) {
        coverageStore.updatePackage(packageUuid.value, payload);
      }
      toasted(res.success, 'Package updated successfully', res.error);
      closeModal();
    }
  );
}
  </script>

  <template>
    <ModalParent>
      <NewFormParent
        size="md"
        title="Edit Package"
        subtitle="Update package information"
      >
        <PackageForm 
          :data="packageData" 
          formId="editPackageForm"
        />

        <template #bottom>
          <div class="flex justify-end gap-3 w-full p-4 border-t border-gray-200">
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
              class="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Update Package
            </Button>
          </div>
        </template>
      </NewFormParent>
    </ModalParent>
  </template>