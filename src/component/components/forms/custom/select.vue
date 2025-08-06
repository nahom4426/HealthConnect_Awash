<template>
    <div>
        <label class="block text-sm font-medium leading-6 text-gray-900 mb-2">{{ label }}</label>
        <select v-model="selectedItem" :class="{ 'error': hasError }"
            class="truncate block w-full px-4 py-2 rounded-md bg-gray-100 border-1 focus:border-gray-500 focus:bg-white focus:ring-0">
            <option disabled value="">{{ placeholder }}</option>
            <option v-for="(item, index) in items" :value="item[valueKey]" :key="index"
                class="py-1 hover:bg-red-500 hover:text-white">{{ item[displayKey] }}</option>
        </select>
        <div v-if="hasError" class="error-message">{{ errorMessage }}</div>
    </div>
</template>

<script>
import { ref, watch, computed } from 'vue';

export default {
    props: {
        label: {
            type: String,
            required: true,
        },
        items: {
            type: Array,
            required: true,
        },
        placeholder: {
            type: String,
            default: 'Select an option',
        },
        displayKey: {
            type: String,
            required: true,
        },
        valueKey: {
            type: String,
            required: true,
        },
        required: {
            type: Boolean,
            default: false,
        },
        modelValue: {
            type: [String, Number],
            default: '',
        },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        const selectedItem = ref(props.modelValue);
        const errorMessage = ref('');

        const hasError = computed(() => {
            return props.required && !selectedItem.value;
        });

        watch(selectedItem, (newVal) => {
            emit('update:modelValue', newVal);

            console.log('Testing' + newVal);
        });

        watch(
            () => props.modelValue,
            (newVal) => {
                selectedItem.value = newVal;
            }
        );

        const validateInput = () => {
            errorMessage.value = props.required && !selectedItem.value ? `${props.label} Field is Required.` : '';
        };

        return {
            selectedItem,
            errorMessage,
            hasError,
            validateInput,
        };
    },
};
</script>

<style>
.error {
    border-color: red;
}

.error-message {
    color: red;
}
</style>