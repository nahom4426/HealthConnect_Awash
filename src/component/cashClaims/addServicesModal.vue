<script setup>
import api from "@/scripts/api";
import { ref, onMounted, toRefs } from "vue";
import { useToast } from "vue-toastification";
import { useRoute } from "vue-router";
import { mdiSeal } from "@mdi/js";
import customInput from "@/components/forms/custom/input.vue";
import ConfirmModal from "@/components/ConfirmModal.vue";
import SvgIcon from "@jamescoyle/vue-icon";

const toast = useToast();
const route = useRoute();
const emit = defineEmits(["serviceData", "close"]);

const providedDate = ref("");
const amount = ref("");
const serviceDescription = ref("");
const approveModal = ref(false);
const postServices = ref([]);
const serviceData = ref();
const servicesCoverageType = ref([]);
const packageUuid = ref("");
const isLoading = ref(false);

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
});

const SaveService = () => {
  serviceData.value = {
    serviceName: serviceDescription.value,
    packageUuid: packageUuid.value,
    amount: amount.value,
    serviceDate: providedDate.value,
  };
  postServices.value.push(serviceData.value);
  providedDate.value = ref();
  amount.value = ref();
  serviceDescription.value = ref(null);
  packageUuid.value = ref();
};

const confirmApprove = () => {
  emit("serviceData", postServices.value);
  emit("close");
};

const fetchServiceCoverages = async () => {
  isLoading.value = true;
  await api.get(`/package/dropdown/${props.id}`).then((data) => {
    servicesCoverageType.value = data;
    isLoading.value = false;
  });
};

const saveServicesForPatient = () => {
  approveModal.value = !approveModal.value;
};

const removeService = (index) => {
  postServices.value.splice(index, 1);
};

onMounted(() => {
  fetchServiceCoverages();
});
</script>

<template>
  <ConfirmModal
    v-model="approveModal"
    @confirm="confirmApprove"
    icon="simple-line-icons:check"
    title="Add Cash Services"
    description="Are you sure you want to add this Services?"
    confirmButton="Save"
    iconClass="text-primary p-1 text-3xl"
    iconWrapperClass="bg-primary rounded-full p-1"
    confirmButtonClass="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary sm:ml-3 sm:w-auto duration-300"
  />
  <div class="px-4 py-6 sm:p-8">
    <div
      class="w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8 m-3"
    >
      <div class="flex flex-col">
        <div class="flex flex-1 text-lg font-semibold bg-gray-100 px-2 w-full">
          Service Details
        </div>
        <div class="flex flex-wrap space-x-2">
          <div class="flex flex-col space-y-1 mt-2">
            <customInput
              type="date"
              label="Service Provided Date"
              placeholder=""
              v-model="providedDate"
              :required="true"
            />
          </div>

          <div class="flex flex-col space-y-1 mt-2">
            <div class="flex flex-col">
              <label for="status" class="block leading-6 text-gray-900"
                >Service Category</label
              >
              <div
                class="flex rounded-md shadow-sm mt-2 ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:w-[250px]"
              >
                <select
                  name="serviceGroup"
                  id="serviceGroup"
                  class="truncate px-4 w-full border-0 bg-transparent py-1.5 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                  placeholder="serviceGroup"
                  v-model="packageUuid"
                >
                  <option
                    v-for="item in servicesCoverageType"
                    :value="item.packageUuid"
                  >
                    {{ item.packageName }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="flex flex-col space-y-1 mt-2">
            <customInput
              type="text"
              label="Service Description"
              placeholder="Service Description"
              v-model="serviceDescription"
              :required="true"
            />
          </div>

          <div class="flex flex-col space-y-1 mt-2">
            <customInput
              type="number"
              label="Amount"
              placeholder="Amount"
              v-model="amount"
              :required="true"
            />
          </div>
          <div class="flex flex-col space-y-1 mt-10">
            <button
              type="submit"
              @click="SaveService"
              class="rounded-md hover:bg-indigo-400 bg-indigo-500 px-4 py-1"
            >
              Add
            </button>
          </div>
        </div>

        <div class="sm:col-span-4 m-1 p-1">
          <table class="w-full border-separate border-spacing-0">
            <thead class="sticky top-0 rounded-t-lg">
              <tr class="px-3 divide-gray-200 bg-gray-200">
                <th
                  scope="col"
                  class="py-2 px-4 text-left text-sm font-semibold text-gray-900"
                >
                  <span>Service Provided </span>
                </th>
                <th
                  scope="col"
                  class="px-4 py-2 text-left text-sm font-semibold text-gray-900"
                >
                  Service Category
                </th>
                <th
                  scope="col"
                  class="px-4 py-2 text-left text-sm font-semibold text-gray-900"
                >
                  Service Description
                </th>
                <th
                  scope="col"
                  class="px-4 py-2 text-left text-sm font-semibold text-gray-900"
                >
                  Amount
                </th>
                <th
                  scope="col"
                  class="px-4 py-2 text-left text-sm font-semibold text-gray-900"
                ></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-section-bg">
              <tr v-for="(service, index) in postServices" :key="index">
                <td
                  class="border-b border-gray-200 whitespace-nowrap py-2 pl-1 pr-1 text-sm font-base text-left sm:pl-2 lg:pl-4"
                >
                  {{ service.serviceDate }}
                </td>
                <td
                  class="border-b border-gray-200 whitespace-nowrap py-2 hidden px-3 text-sm text sm:table-cell"
                >
                  {{ service.packageUuid }}
                </td>
                <td
                  class="border-b border-gray-200 whitespace-nowrap py-2 hidden px-3 text-sm text sm:table-cell"
                >
                  {{ service.serviceName }}
                </td>
                <td
                  class="border-b border-gray-200 whitespace-nowrap py-2 px-3 text-sm text"
                >
                  {{ service.amount }}
                </td>
                <td
                  class="border-b border-gray-200 whitespace-nowrap py-2 px-3 text-sm text"
                >
                  <div
                    class="w-full flex justify-start gap-2 items-center text-primary cursor-pointer"
                    @click="removeService(index)"
                  >
                    <div>Remove</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div
            class="flex bg-slate-400 w-full items-center"
            v-if="postServices && postServices.length == 0"
          >
            <div class="round-xl flex gap-0.5 item-center text-black px-3 py-2">
              <div class="text-[#fcfcfc] h-10 w-16">
                <svg-icon
                  type="mdi"
                  :path="mdiSeal"
                  class="w-full h-full"
                ></svg-icon>
              </div>
            </div>
            <div
              class="block font-sans text-sm antialiased font-Medium leading-relaxed text-inherit"
            >
              No Services Added
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="flex items-center justify-end gap-x-6 border-gray-900/10 px-4 py-4 sm:px-8"
    >
      <button
        type="submit"
        @click="saveServicesForPatient"
        class="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Save Services
      </button>
    </div>
  </div>
</template>
