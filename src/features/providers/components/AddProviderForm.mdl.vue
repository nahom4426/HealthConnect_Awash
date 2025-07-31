<script setup lang="ts">
import ModalParent from '@/components/ModalParent.vue';
import NewFormParent from '@/components/NewFormParent.vue';
import Button from '@/components/Button.vue';
import Form from '@/components/new_form_builder/Form.vue';
import Input from '@/components/new_form_elements/Input.vue';
import Textarea from '@/components/new_form_elements/Textarea.vue';
import Select from '@/components/new_form_elements/Select.vue';
import { useForm } from '@/components/new_form_builder/useForm';
import { useApiRequest } from '@/composables/useApiRequest';
import { createProvider } from '../api/providerApi';
import { toasted } from '@/utils/utils';
import { closeModal } from '@customizer/modal-x';
import { useProviders, type Provider } from '../store/providersStore';

const { submit } = useForm('provider-form');
const providerStore = useProviders();
const createReq = useApiRequest();

function handleSubmit({ values, reset }: any) {
    if (createReq.pending.value) return;
    
    createReq.send(
        () => createProvider(values),
        res => {
            if (res.success) {
                toasted(true, 'Provider Created Successfully');
                providerStore.providers.unshift(res.data as Provider);
                reset();
                closeModal();
            }
        }
    );
}
</script>

<template>
    <ModalParent>
        <NewFormParent size="lg" title="Add Provider">
            <Form id="provider-form" class="grid grid-cols-2 gap-4 p-4">
                <Input
                    name="providerName"
                    label="Provider Name"
                    validation="required"
                    :attributes="{ placeholder: 'Enter provider name' }"
                />
                <Input
                    name="email"
                    label="Email"
                    validation="required|email"
                    :attributes="{ placeholder: 'Enter email address' }"
                />
                <Input
                    name="telephone"
                    label="Telephone"
                    validation="required"
                    :attributes="{ placeholder: 'Enter phone number' }"
                />
                <Input
                    name="category"
                    label="Category"
                    validation="required"
                    :attributes="{ placeholder: 'Enter category' }"
                />
                <Input
                    name="level"
                    label="Level"
                    validation="required"
                    :attributes="{ placeholder: 'Enter level' }"
                />
                <Input
                    name="tinNumber"
                    label="TIN Number"
                    validation="required"
                    :attributes="{ placeholder: 'Enter TIN number' }"
                />
                <Input
                    name="address1"
                    label="Address 1"
                    validation="required"
                    :attributes="{ placeholder: 'Enter primary address' }"
                />
                <Input
                    name="address2"
                    label="Address 2"
                    :attributes="{ placeholder: 'Enter secondary address' }"
                />
                <Input
                    name="address3"
                    label="Address 3"
                    :attributes="{ placeholder: 'Enter additional address' }"
                />
                <Input
                    name="state"
                    label="State"
                    validation="required"
                    :attributes="{ placeholder: 'Enter state' }"
                />
                <Input
                    name="country"
                    label="Country"
                    validation="required"
                    :attributes="{ placeholder: 'Enter country' }"
                />
                <Select
                    name="status"
                    label="Status"
                    validation="required"
                    :options="[
                        { label: 'Active', value: 'ACTIVE' },
                        { label: 'Inactive', value: 'INACTIVE' }
                    ]"
                />
                <div class="col-span-2">
                    <Textarea
                        name="description"
                        label="Description"
                        validation="required"
                        :attributes="{ placeholder: 'Enter provider description' }"
                    />
                </div>
            </Form>
            <template #bottom>
                <div class="p-4">
                    <Button 
                        @click="submit?.(handleSubmit)" 
                        :pending="createReq.pending.value"
                        class="w-full" 
                        size="lg" 
                        type="primary"
                    >
                        Add Provider
                    </Button>
                </div>
            </template>
        </NewFormParent>
    </ModalParent>
</template>







