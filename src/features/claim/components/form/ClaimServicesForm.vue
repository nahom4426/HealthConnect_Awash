<script setup>
import Button from "@/components/Button.vue";
import Form from "@/components/new_form_builder/Form.vue";
import InputParent from "@/components/new_form_builder/InputParent.vue";
import { useForm } from "@/components/new_form_builder/useForm";
import Input from "@/components/new_form_elements/Input.vue";
import InputError from "@/components/new_form_elements/InputError.vue";
import Select from "@/components/new_form_elements/Select.vue";
import Textarea from "@/components/new_form_elements/Textarea.vue";
import Table from "@/components/Table.vue";
import icons from "@/utils/icons";
import { formatCurrency, genId, secondDateFormat } from "@/utils/utils";
import { computed, ref } from "vue";

const props = defineProps({
  servicesPending: {
    type: Boolean,
    default: false,
  },
  service: {
    type: Object
  },
  services: {
    type: Array,
    default: [],
  },
});

const selectedServices = ref(props.service?.cashService || []);
const service = ref({
  cashServiceUuid: '',
  serviceDate: "",
  packageUuid: "",
  amount: 0,
  serviceName: "",
});

const serviceOptions = computed(() => {
  const options = (props.services || []).filter(
    el => !selectedServices.value.find(service => service.packageUuid == el.packageUuid)
  );

  if (service.value?.packageUuid) {
    options.unshift({
      packageUuid: service.value?.packageUuid,
      packageName: (props.services.find(el => el.packageUuid == service.value?.packageUuid)?.packageName || ""),
    });
  }
  return options;
});

function addService({ values, reset }) {
  const idx = selectedServices.value.findIndex(el => el.cashServiceUuid == service.value.cashServiceUuid);
  if (idx == -1) {
    selectedServices.value.unshift({
      ...service.value,
      cashServiceUuid: genId.next().value,
    });
  } else {
    selectedServices.value.splice(idx, 1, {
      ...selectedServices.value[idx],
      ...service.value,
    });
  }
  reset();
}

function remove(id) {
  const idx = selectedServices.value.findIndex(el => el.cashServiceUuid == id);
  if (idx == -1) return;
  selectedServices.value.splice(idx, 1);
}
</script>
