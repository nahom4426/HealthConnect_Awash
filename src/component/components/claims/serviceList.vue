<script setup>
import { onMounted, ref, computed, toRefs } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/scripts/api';
import { v3ImgPreviewFn } from 'v3-img-preview';
import { formatCurrency } from '@/util/utils'

const props = defineProps({
  claimUuid: {
    type: String,
    default: '',
    required: true,
  },
});

const emit = defineEmits(['selected-services']);


const { claimUuid } = toRefs(props);

onMounted(async () => {
  await fetchClaimServices(claimUuid.value);
});

const route = useRoute();

const services = ref([]);
const selected = ref([]);
const required = ref(false);
const loading = ref(false);
const isPriceEdited = ref(false);
const Url = ref('');
const editedAmount = ref(0);
const editIndex = ref(null);

const fetchClaimServices = async (claimUuid) => {
  loading.value = true;
  if (required.value) {
    Url.value = `/service-provided/authorization/requested/services?claimUuid=${claimUuid}&providerCounter=${route.params.Uuid}`
  } else {
    Url.value = `/claim/claimed-services?claimUuid=${claimUuid}`
  }

  await api.get(Url.value,).then((data) => {
    services.value = data;
    services.value.forEach((service) => {
      if (service.authorizationRequired) {
        required.value = true;
      }
    });
    loading.value = false;
  });
};

const receiptUrl = import.meta.env.VITE_RECEIPT_URL;

const handlePreview = (imgUrl) => {
  imgUrl = `${import.meta.env.VITE_RECEIPT_URL}${imgUrl}`;
  console.log(imgUrl);
  v3ImgPreviewFn(imgUrl);
};

const emitSelectedServices = () => {
  emit('selected-services', selected.value)
}

const editPrice = (index) => {
  isPriceEdited.value = true;
  editIndex.value = index;
}

const totalAmountToBePaid = computed(() => {
  return services.value.reduce((service, item) => service + Number(item.amount), 0);
});
</script>

<template>
  <div class="flow-root">
    <div class="overflow-x-auto">
      <div class="ring-1 ring-black ring-opacity-5 sm:rounded-lg max-h[15rem] xl:max-h-[20rem] overflow-y-auto">
        <table
          class="min-w-full ring-1 ring-black ring-opacity-5 sm:rounded-lg max-h[15rem] xl:max-h-[20rem] overflow-y-auto">
          <thead class="sticky top-0 rounded-t-lg">
            <tr class="px-3 divide-gray-200 bg-gray-200">
              <th scope="col" class="py-2 pl-4 pr-4 px-6 text-left text-lg font-semibold text-gray-900 sm:pl-0"></th>
              <th scope="col" class="py-2 pl-4 pr-4 px-6 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                <span class="ml-3"> Service Date </span>
              </th>
              <th scope="col" class="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                Service Category
              </th>
              <th scope="col" class="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                Service Code
              </th>
              <th scope="col" class="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                Service Name
              </th>
              <th scope="col" class="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                Quantity
              </th>
              <th scope="col" class="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                Unit Price
              </th>
              <th scope="col" class="px-4 py-2 text-left text-sm font-semibold text-gray-900" v-if="required">
                Requested Price
              </th>
              <th scope="col" class="px-4 py-2 text-left text-sm font-semibold text-gray-900" v-else>
                Total Price
              </th>

              <th scope="col" class="px-4 py-2 text-left text-sm font-semibold text-gray-900" v-if="required">
                Approved Price
              </th>
              <th scope="col" class="px-4 py-2 text-left text-sm font-semibold text-gray-900" v-else>
                Attachment
              </th>
              <th scope="col" class="px-4 py-2 text-left text-sm font-semibold text-gray-900"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-section-bg">
            <tr v-for="(service, index) in services" :key="service.item"
              class="divide-gray-200 px-3 hover:bg-primary duration-200">
              <td class="whitespace-nowrap py-2 px-4 text-center font-medium text-gray-900">
                {{ index + 1 }}.
              </td>
              <td class="whitespace-nowrap py-2 px-4 text-gray-500">
                {{ service.providedDate }}
              </td>
              <td class="whitespace-nowrap py-2 px-4 text-gray-500">
                {{ service.category }}
              </td>
              <td class="whitespace-nowrap py-2 px-4 text-gray-500">
                {{ service.itemCode }}
              </td>
              <td class="whitespace-nowrap py-2 px-4 text-gray-500">
                {{ service.item }}
              </td>
              <td class="whitespace-nowrap py-2 px-4 text-gray-500">
                {{ service.qty }}
              </td>
              <td class="whitespace-nowrap py-2 px-4 text-gray-500">
                {{ formatCurrency(service.unitPrice) }}
              </td>
              <td class="whitespace-nowrap py-2 px-4 text-gray-500">
                {{ formatCurrency(service.amount) }}
              </td>
              <td class="whitespace-nowrap py-2 px-4 text-primary font-semibold underline underline-offset-4"
                v-if="!required">
                <button @click.stop="handlePreview(service.receipt)" v-if="service?.file != null">
                  Preview
                </button>
                <span v-else>No Attachment</span>
              </td>
              <td class="whitespace-nowrap py-2 px-4 text-gray-500" v-else>
                <template v-if="isPriceEdited && index === editedIndex">
                  <input class="rounded-lg w-[60%]" v-model="service.amount" @input="handleAmountChange(index)" />
                </template>
                <div class="bg-primary h-8 p-1 m-1 text-white text-center cursor-pointer rounded-md" v-else
                  @click="editPrice(index)">
                  <div class="text-base capitalize">Edit</div>
                </div>
              </td>
              <td class="px-2 py-2" v-if="required">
                <input type="checkbox"
                  :value="{ serviceProvidedUuid: service?.serviceProvidedUuid, authorizedAmount: service?.amount }"
                  v-model="selected" @change="emitSelectedServices" />
                <i class="form-icon"></i>
              </td>
              <td v-else></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex justify-end text-xl font-medium text-gray-600 mt-10">
        <div class="flex gap-x-10 justify-between mr-20">
          <h3 class="flex-1"></h3>
          <h3 class="flex-1 whitespace-nowrap text-primary font-semibold">
            Total Claim:
          </h3>
          <h3 class="flex-1 whitespace-nowrap">{{ formatCurrency(totalAmountToBePaid) }}</h3>
        </div>
      </div>
    </div>
  </div>
</template>
