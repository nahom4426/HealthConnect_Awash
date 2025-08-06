<script setup>
import api from "@/scripts/api";
import { ref, onMounted, watch, toRefs } from "vue";
import { useToast } from "vue-toastification";
import { Field } from "vee-validate";
import { useRoute } from 'vue-router';
import { array } from 'yup';
import { mdiAccountGroupOutline } from '@mdi/js';
import customInput from '@/components/forms/custom/input.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import SvgIcon from '@jamescoyle/vue-icon';

const toast = useToast()
const route = useRoute()
const emit = defineEmits(["close"])

const title = ref("");
const firstName = ref("");
const fatherName = ref("");
const grandFatherName = ref("");
const gender = ref("");
const relationship = ref("");
const memberName = ref("");
const memberTitle = ref("");
const status = ref('');
const birthDate = ref('');
const phone = ref('');
const Beneficiaries = ref([]);
const beneficiaryData = ref();
const approveModal = ref(false);

const props = defineProps({
    member: {
        type: array,
        required: true
    }
});
const { member } = toRefs(props);

const saveBeneficiaries = () => {
    approveModal.value = !approveModal.value;
}

const confirmApprove = () => {
    Beneficiaries.value.forEach(async data => {
        console.log(JSON.stringify(data));
        try {
            await api.post('/dependant', JSON.stringify(data),).then((data) => {
                emit("close")
                toast.success(data.message);
            });
        } catch (error) {
            toast.error(error.message);
            beneficiaryData.value = {}
        }
    })
}

const getBeneficiaries = async () => {
    try {
        await api.get(`/dependant/list/${member.value.insuredUuid}?status=ACTIVE`, Beneficiaries.value).then((data) => {
            const values = Object.values(data);
            values.forEach((value) => Beneficiaries.value.push(value));
        });
    } catch (error) {
        toast.error(error.message);
    }
}

const removeMember = (index) => {
    Beneficiaries.value.splice(index, 1);
}

const saveBeneficiary = () => {
    beneficiaryData.value = {
        insuredPersonUuid: member.value.insuredUuid,
        title: title.value,
        firstName: firstName.value,
        fatherName: fatherName.value,
        grandFatherName: grandFatherName.value,
        relationship: relationship.value,
        birthDate: birthDate.value,
        phone: phone.value,
        status: status.value,
        gender: gender.value
    }
    Beneficiaries.value.push(beneficiaryData.value)
}

onMounted(() => {
    getBeneficiaries();
    memberTitle.value = member.value.title;
    memberName.value = member.value.firstName + " " + member.value.fatherName;
});
</script>

<template>
    <ConfirmModal v-model="approveModal" @confirm="confirmApprove" icon="simple-line-icons:check" title="Add Dependent"
        description="Are you sure you want to add this Dependent?" confirmButton="Save"
        iconClass="text-primary p-1 text-3xl" iconWrapperClass="bg-primary rounded-full p-1"
        confirmButtonClass="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary sm:ml-3 sm:w-auto duration-300" />
    <div class="px-4 py-6 sm:p-8">
        <div class="mt-6 grid max-w-2xl grid-cols-1 gap-x-6 sm:grid-cols-6">
            <div class="sm:col-span-6 text-lg font-semibold bg-gray-100 px-2">
                Dependent Info for {{ memberTitle }} {{ memberName }}
            </div>

            <div class="sm:col-span-2">
                <label for="status" class="block leading-6 text-gray-900">Title</label>
                <div class="mt-2">
                    <Field as="select" name="title" v-model="title"
                        class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:leading-6">
                        <option value="Mr.">Mr.</option>
                        <option value="Ms.">Ms.</option>
                    </Field>
                </div>
            </div>

            <div class="sm:col-span-2">
                <customInput type="text" label="First Name" placeholder="First Name" max-length=15 v-model="firstName"
                    :required="true" />
            </div>

            <div class="sm:col-span-2">
                <customInput type="text" label="Fathers Name" placeholder="Fathers Name" max-length=15
                    v-model="fatherName" :required="true" />
            </div>

            <div class="sm:col-span-2">
                <customInput type="text" label="Grandfather Name" placeholder="Grandfathers Name" max-length=15
                    v-model="grandFatherName" :required="true" />
            </div>

            <div class="sm:col-span-2">
                <customInput type="text" label="Phone" placeholder="Phone" max-length=10 v-model="phone"
                    :required="true" :is-phone="true" />
            </div>

            <div class="sm:col-span-2">
                <customInput type="date" label="Birth Date" placeholder="Date of Birth" v-model="birthDate"
                    :required="true" />
            </div>

            <div class="sm:col-span-2">
                <label for="status" class="block leading-6 text-gray-900">Gender</label>
                <div class="mt-2">
                    <Field as="select" name="gender" v-model="gender"
                        class="block w-42 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:leading-6">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </Field>
                </div>
            </div>

            <div class="sm:col-span-2">
                <label for="status" class="block leading-6 text-gray-900">Status</label>
                <div class="mt-2">
                    <Field as="select" name="gender" v-model="status"
                        class="block w-42 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:leading-6">
                        <option value="ACTIVE">Active</option>
                        <option value="PENDING">Pending</option>
                    </Field>
                </div>
            </div>

            <div class="sm:col-span-2">
                <label for="passportNumber" class="block text-sm font-medium leading-6 text-gray-900">
                    Relationship</label>
                <div class="mt-2">
                    <Field as="select" name="relationship" v-model="relationship"
                        class="block w-42 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:leading-6">
                        <option value="Spouse">Spouse</option>
                        <option value="Child">Child</option>
                    </Field>
                </div>
            </div>

            <div class="sm:col-span-4 m-1 p-1">
                <table class="w-full border-separate border-spacing-0">
                    <thead class="sticky top-0 rounded-t-lg">
                        <tr class="px-3 divide-gray-200 bg-gray-200">
                            <th scope="col"
                                class="py-2 pl-4 pr-4 px-6 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                                <span class="ml-3"> Name </span>
                            </th>
                            <th scope="col" class="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                                Relationship
                            </th>
                            <th scope="col" class="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                                gender
                            </th>
                            <th scope="col" class="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                                phone
                            </th>
                            <th scope="col" class="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                                status
                            </th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 bg-section-bg">
                        <tr v-for="(Beneficiary, index) in Beneficiaries" :key="Beneficiary.relationship">
                            <td
                                class='border-b border-gray-200 whitespace-nowrap py-2 pl-1 pr-1 text-sm font-base text-left sm:pl-2 lg:pl-4'>
                                {{ Beneficiary.firstName }} {{ Beneficiary.fatherName }} {{ Beneficiary.grandFatherName
                                }}
                            </td>
                            <td
                                class='border-b border-gray-200 whitespace-nowrap py-2 hidden px-3 text-sm text sm:table-cell'>
                                {{ Beneficiary.relationship }}</td>
                            <td class='border-b border-gray-200 whitespace-nowrap py-2 px-3 text-sm text'>
                                {{ Beneficiary.gender }}</td>
                            <td class='border-b border-gray-200 whitespace-nowrap py-2 px-3 text-sm text'>
                                {{ Beneficiary.phone }}</td>
                            <td class='border-b border-gray-200 whitespace-nowrap py-2 px-3 text-sm text'>
                                <div class="w-full flex justify-start gap-2 items-center text-primary cursor-pointer"
                                    @click="removeMember(index)">
                                    <div>
                                        Remove
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div class="flex bg-slate-400 w-full items-center" v-if="Beneficiaries && Beneficiaries.length == 0">
                    <div class="round-xl flex gap-0.5 item-center text-black px-3 py-2">
                        <div class="text-[#fcfcfc] h-10 w-16">
                            <svg-icon type="mdi" :path="mdiAccountGroupOutline" class="w-full h-full"></svg-icon>
                        </div>
                    </div>
                    <div class="block font-sans text-sm antialiased font-Medium leading-relaxed text-inherit">
                        No Dependents Found
                    </div>
                </div>
            </div>

        </div>

        <div class="flex items-center justify-end gap-x-6 border-gray-900/10 px-4 py-4 sm:px-8">
            <button type="submit" @click="saveBeneficiary"
                class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                Add
            </button>
            <button type="submit" @click="saveBeneficiaries"
                class="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                Save Dependents
            </button>
        </div>
    </div>
</template>
