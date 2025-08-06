<script setup>
import api from "@/scripts/api";
import { onMounted, ref, toRefs } from "vue";
import { useToast } from "vue-toastification";
import { array } from 'yup';

const emit = defineEmits(["save"])

const props = defineProps({
    user: {
        type: array,
        required: true
    }
});

const toast = useToast()
const { user } = toRefs(props)

const firstName = ref(user.value.firstName)
const fatherName = ref(user.value.fatherName)
const grandFatherName = ref(user.value.grandFatherName)
const phone = ref(user.value.phone)
const address1 = ref(user.value.address1)
const address2 = ref(user.value.address2)
const address3 = ref(user.value.address3)
const state = ref(user.value.state)
const beginDate = ref(user.value.beginDate)
const endDate = ref(user.value.endDate)
const premium = ref(user.value.premium)

const EditService = async () => {
    try {
        await api.put(`/insuredperson/${user.value.insuredUuid}`,
            {
                email: user.value.email,
                institutionUuid: user.value.institutionUuid,
                payerInstitutionConractUuid: user.value.payerInstitutionConractUuid,
            }).then((data) => {
                emit("save", data);
                toast.success(data.message);
            });
    } catch (e) {
        toast.error(e.message);
    }
};
</script>

<template>
    <div class="px-4 py-6 sm:p-8">
        <div class="mt-6 grid max-w-2xl grid-cols-1 gap-x-6 sm:grid-cols-6">
            <div class="sm:col-span-6 text-lg font-semibold bg-gray-100 px-2">
                Members Info
            </div>

            <div class="sm:col-span-2 sm:col-start-1">
                <label for="city" class="block text-sm font-medium leading-6 text-gray-900">First Name</label>
                <div class="mt-1">
                    <input type="text" name="firstName" id="firstName" v-model="firstName" autocomplete="firstName"
                        class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                </div>
            </div>

            <div class="sm:col-span-2">
                <label for="Father's Name" class="block text-sm font-medium leading-6 text-gray-900">Father's
                    Name</label>
                <div class="mt-1">
                    <input type="text" name="fatherName" v-model="fatherName" id="fatherName"
                        autocomplete="address-level1"
                        class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                </div>
            </div>

            <div class="sm:col-span-2">
                <label for="GrandFather" class="block text-sm font-medium leading-6 text-gray-900">Grandfather's
                    Name</label>
                <div class="mt-1">
                    <input type="text" v-model="grandFatherName" name="grandFatherName" id="grandFatherName"
                        autocomplete="grandFatherName"
                        class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                </div>
            </div>

            <span class="sm:col-span-6 mt-1 cursor-none font-semibold bg-gray-100 w-full px-2 text-lg">Address</span>

            <div class="sm:col-span-2 sm:col-start-1">
                <label for="city" class="block text-sm font-medium leading-6 text-gray-900">City</label>
                <div class="mt-1">
                    <input type="text" name="address1" id="address1" v-model="address1" autocomplete="address1"
                        class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                </div>
            </div>

            <div class="sm:col-span-2">
                <label for="Subcity" class="block text-sm font-medium leading-6 text-gray-900">Subcity</label>
                <div class="mt-1">
                    <input type="text" name="address2" v-model="address2" id="address2" autocomplete="address2"
                        class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                </div>
            </div>

            <div class="sm:col-span-2">
                <label for="woreda" class="block text-sm font-medium leading-6 text-gray-900">Woreda</label>
                <div class="mt-1">
                    <input type="text" v-model="address3" name="address3" id="address3" autocomplete="address3"
                        class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                </div>
            </div>

            <div class="sm:col-span-2">
                <label for="Region" class="block text-sm font-medium leading-6 text-gray-900">Region</label>
                <div class="mt-1">
                    <input placeholder="" id="state" name="state" v-model="state" type="state" autocomplete="state"
                        class="block w-48 rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                </div>
            </div>
            <div class="sm:col-span-3">
                <label for="Telephone" class="block text-sm font-medium leading-6 text-gray-900">Telephone</label>
                <div class="mt-1">
                    <input id="phone" name="phone" v-model="phone" type="phone" autocomplete="phone"
                        class="block w-48 px-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                </div>
            </div>

            <div class="sm:col-span-2">
                <label for="date" class="block text-sm font-medium leading-6 text-gray-900">Effective Date</label>
                <div class="mt-1">
                    <input id="date" v-model="beginDate" name="date" type="date" autocomplete="date"
                        class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                </div>
            </div>
            <div class="sm:col-span-3">
                <label for="date" class="block text-sm font-medium leading-6 text-gray-900">End Date</label>
                <div class="mt-1">
                    <input id="date" name="date" v-model="endDate" type="date" autocomplete="date"
                        class="block w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                </div>
            </div>

            <span class="sm:col-span-6 mt-1 cursor-none font-semibold bg-gray-100 w-ful px-2 text-lg">Covered
                Benefits</span>
            <div class="block sm:col-span-3">
                <label for="TotalBenefits" class="block text-sm font-medium leading-6 text-gray-900">Total
                    Benefits</label>
                <div class="mt-1">
                    <input id="TotalBenefits" name="TotalBenefits" v-model="premium" type="TotalBenefits"
                        autocomplete="TotalBenefits"
                        class="block w-48 rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                </div>
            </div>
        </div>

        <div class="flex justify-end gap-x-6 border-gray-900/10 px-4 sm:px-8">
            <button @click="EditService"
                class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                Save
            </button>
        </div>
    </div>
</template>
../../stores/piniaState