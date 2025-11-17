<script setup>
import api from '@/scripts/api';
import { mdiPlus } from '@mdi/js';
import SvgIcon from '@jamescoyle/vue-icon';
import { ref, toRefs } from 'vue';
// import { useForm } from 'vee-validate';
import { registerInstitutionSchema } from '@/validations/validations';

import Input from '@/components/new_form_elements/Input.vue';
import { useToast } from '@/toast/store/toast';
// import Input from '@/components/forms/custom/Input.vue';

// const { errors } = useForm({
//     validationSchema: registerInstitutionSchema,
// });

const toast = useToast();
const emit = defineEmits(['save']);

const props = defineProps({
    priceItems: {
        type: String,
        required: true
    }
});

const { priceItems } = toRefs(props)

const toBeUpdatedService = ref([])
const newPrice = ref('')
const amount = ref(null)
const isLoading = ref(false)

const EditServicePrice = async () => {
    isLoading.value = true
    amount.value.validateInput();
    if (!amount.value.hasError) {
        try {
            await api.put(`/service/price/${priceItems.value}`,
                {
                    "value": newPrice.value,
                }).then((data) => {
                    isLoading.value = false
                    emit("save")
                    toast.success(data.message)
                })
        } catch (error) {
            isLoading.value = false;
            toast.error(error.message)
        }
    }
}
</script>

<template>
    <div class="space-y-10 divide-y divide-gray-900/10 flex items-center justify-center">
        <div class="px-4 py-6 sm:p-8">
            <div class="grid max-w-2xl grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-6">
                <div class="sm:col-span-4">
                    <div class="mt-1">
                        <Input type="number" placeholder="0.0 ብር" v-model="newPrice" ref="amount"
                            :required="true" />
                    </div>
                </div>
            </div>
        </div>
        <div class="bg-primary round-xl flex gap-0.5 cursor-pointer item-center text-white px-2 py-1 rounded-lg"
            @click="EditServicePrice()">
            <div class="text-white"><svg-icon type="mdi" :path="mdiPlus"></svg-icon></div>
            <div class="font-medium text-base">Save</div>
        </div>
    </div>
</template>
