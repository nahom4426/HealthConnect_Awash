<template>
    <div>
        <label class="block text-sm font-medium leading-6 text-gray-900 mb-2">{{ label }}</label>
        <input :type="type" :placeholder="placeholder" :value="modelValue" @input="updateValue"
            :class="{ 'error': hasError }" :disabled="disabled"
            class="block w-full h-[48%] rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:leading-6" />
        <div v-if="hasError" class="error-message m-2 font-medium text-center whitespace-wrap">{{ errorMessage }}</div>
    </div>
</template>

<script>
export default {
    props: {
        label: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        placeholder: {
            type: String,
            required: true,
        },
        modelValue: {
            type: String,
            required: true,
        },
        required: {
            type: Boolean,
            default: false,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        minLength: {
            type: Number,
            default: 0,
        },
        maxLength: {
            type: Number,
            default: 200,
        },
        isPhone: {
            type: Boolean,
            default: false,
        },
        isEmail: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            errorMessage: '',
        };
    },
    computed: {
        hasError() {
            return !!this.errorMessage;
        },
    },
    watch: {
        modelValue: {
            handler(newVal) {
                this.validateInput();
            },
        },
    },
    methods: {
        updateValue(event) {
            this.$emit('update:modelValue', event.target.value);
        },
        validateInput() {
            this.errorMessage = '';

            if (this.required && this.modelValue.length === 0) {
                this.errorMessage = `${this.label} Field is Required.`;
            } else if (this.modelValue.length < this.minLength) {
                this.errorMessage = `Minimum length is ${this.minLength}.`;
            } else if (this.modelValue.length > this.maxLength) {
                this.errorMessage = `Maximum length is ${this.maxLength}.`;
            } else if (this.isPhone && !this.validatePhone()) {
                this.errorMessage = 'Invalid phone number.';
            } else if (this.isEmail && !this.validateEmail()) {
                this.errorMessage = 'Invalid email address.';
            }

            this.$emit('input', this.modelValue);
        },
        validatePhone() {
            const regex = /^(\+2519|09)[0-9]{8}$/;
            return regex.test(this.modelValue);
        },
        validateEmail() {
            const regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
            return regex.test(this.modelValue);
        },
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