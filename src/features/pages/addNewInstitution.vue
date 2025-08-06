<script setup>
import SectionMain from '@/components/section/SectionMain.vue';
import SectionTitleLineWithButton from '@/components/section/SectionTitleLineWithButton.vue';
import api from '@/scripts/api';
import { mdiFileDownload } from '@mdi/js';
import customInput from '@/components/forms/custom/input.vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';

const toast = useToast();
const router = useRouter();

const country = ref('Ethiopia');
const state = ref('');
const institutionName = ref('');
const email = ref('');
const telephone = ref('');
const address1 = ref('');
const address2 = ref('');
const address3 = ref('');
const category = ref('');
const tinNumber = ref('');
const CoreInstitution = ref(null);
const CoreInstitution1 = ref(null);
const CoreInstitution2 = ref(null);
const CoreInstitution3 = ref(null);
const CoreInstitution4 = ref(null);
const CoreInstitution5 = ref(null);
const CoreInstitution6 = ref(null);
const CoreInstitution7 = ref(null);
const CoreInstitution8 = ref(null);
const CoreInstitution9 = ref(null);
const geolocation = ref(13.98, 39.42);
const contractData = ref([]);
const isLoading = ref(false);
const approveModal = ref(false);
const institutionUuid = ref('');

const SaveContract = async () => {
    CoreInstitution.value.validateInput();
    CoreInstitution2.value.validateInput();
    CoreInstitution8.value.validateInput();
    CoreInstitution9.value.validateInput();
    CoreInstitution3.value.validateInput();
    CoreInstitution4.value.validateInput();
    CoreInstitution5.value.validateInput();
    CoreInstitution6.value.validateInput();
    CoreInstitution7.value.validateInput();
    isLoading.value = !isLoading.value
    if (!CoreInstitution.value.hasError && !CoreInstitution2.value.hasError && !CoreInstitution3.value.hasError && !CoreInstitution4.value.hasError && !CoreInstitution5.value.hasError && !CoreInstitution6.value.hasError && !CoreInstitution7.value.hasError && !CoreInstitution8.value.hasError && !CoreInstitution9.value.hasError) {
        try {
            await api.post(`/institution`,
                {
                    institutionName: institutionName.value,
                    tinNumber: tinNumber.value,
                    email: email.value,
                    telephone: telephone.value,
                    category: category.value,
                    address1: address1.value,
                    address2: address2.value,
                    address3: address3.value,
                    state: state.value,
                    country: country.value,
                    latitude: 0,
                    longitude: 0,
                    status: 'ACTIVE'
                }).then((data) => {
                    if (data) {
                        toast.success('Institution Registered Successfully!');
                        isLoading.value = !isLoading.value;
                        router.push({
                            name: 'add-institution-contracts',
                            params: {
                                Uuid: data.institutionUuid
                            }
                        })
                    }
                    console.log(data);
                });
        } catch (e) {
            toast.error(e);
            console.log(e.message);
        }
    }
};
</script>

<template>
    <div class="w-full h-max">
        <SectionMain>
            <SectionTitleLineWithButton :icon="mdiFileDownload" title="Add Policy Holders" main>
            </SectionTitleLineWithButton>

            <div class="w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8 m-3">
                <div class="grid space-y-4">
                    <div class="sm:col-span-6 text-sm font-semibold bg-gray-100 px-2">
                        Policy Holder Information
                    </div>
                    <div class="flex flex-wrap space-x-2">
                        <div class="flex flex-col space-y-1 mt-2 ">
                            <customInput type="text" placeholder="" ref="CoreInstitution" label="Group Policy Name"
                                :max-length='40' v-model="institutionName" name="institutionInsuranceNumber"
                                :required="true" />
                        </div>

                        <div class="flex flex-col space-y-1 mt-2">
                            <customInput type="text" placeholder="" ref="CoreInstitution1" label="Tin Number"
                                :max-length='25' v-model="tinNumber" name="tinNumber" />
                        </div>


                        <div class="flex flex-col space-y-1 mt-2">
                            <customInput type="text" placeholder="" ref="CoreInstitution2" label="Email" v-model="email"
                                :max-length='35' name="email" :required="true" :is-email="true" />
                        </div>
                    </div>
                    <div class="flex flex-wrap space-x-2">
                        <div class="flex flex-col space-y-1 mt-2">
                            <customInput type="text" placeholder="" ref="CoreInstitution3" label="Business Category"
                                v-model="category" name="category" :required="true" />
                        </div>
                        <div class="flex space-y-1 mt-2">
                            <customInput type="text" placeholder="+251910023296" ref="CoreInstitution4"
                                label="Telephone" :max-length='13' v-model="telephone" name="telephone" :required="true"
                                :is-phone="true" />
                        </div>

                    </div>

                    <div class="sm:col-span-6 text-sm font-semibold bg-gray-100 px-2">
                        Address Information
                    </div>
                    <div class="flex flex-wrap space-x-2">
                        <div class="flex flex-col space-y-1 mt-2">
                            <customInput type="text" placeholder="" ref="CoreInstitution5" label="Country"
                                v-model="country" name="Country" :required="true" :disabled="true" />
                        </div>
                        <div class="flex flex-col space-y-1 mt-2">
                            <customInput type="text" placeholder="" ref="CoreInstitution6" label="State" v-model="state"
                                name="state" :required="true" />
                        </div>

                        <div class="flex flex-col space-y-1 mt-2">
                            <customInput type="text" placeholder="" ref="CoreInstitution7" label="City"
                                v-model="address3" name="city" :required="true" />
                        </div>
                    </div>
                    <div class="flex flex-wrap space-x-2">
                        <div class="flex flex-col space-y-1 mt-2">
                            <customInput type="text" placeholder="" ref="CoreInstitution8" label="Sub City"
                                v-model="address2" name="subCity" :required="true" />
                        </div>
                        <div class="flex flex-col space-y-1 mt-2">
                            <customInput type="text" placeholder="" ref="CoreInstitution9" label="Woreda"
                                v-model="address1" name="woreda" :required="true" />
                        </div>
                        <!-- <div class="flex flex-col space-y-1 m-2 flex-grow">
                            <customInput type="text" placeholder="" ref="CoreInstitution10" label="Geolocation"
                                v-model="geolocation" name="Geo Location" />
                        </div> -->
                    </div>
                </div>

                <div class="flex items-center justify-end my-4 gap-x-6 border-gray-900/10 px-4 sm:px-8">
                    <button @click="SaveContract" type="submit"
                        class="rounded-md w-80 bg-primary py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                        Next
                    </button>
                </div>
            </div>
        </SectionMain>
    </div>
</template>
