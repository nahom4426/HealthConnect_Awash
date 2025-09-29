<!-- <script setup>
import DefaultPage from '@/components/DefaultPage.vue';
import { usePagination } from "@/composables/usePagination";
import { claimApproved, claimAuthorized, claimProcessed, claimVerified, getRequestedClaimByBatchDetail } from '../../api/claimApi';
import Table from '@/components/Table.vue';
import { useRoute } from 'vue-router';
import { PaymentStatus } from '@/types/interface';
import { formatCurrency, toasted } from '@/utils/utils';
import Button from '@/components/Button.vue';
import TableWithCheckBox from '@/components/TableWithCheckBox.vue';
import { ref } from 'vue';
import { useApiRequest } from '@/composables/useApiRequest';
import { openModal } from '@customizer/modal-x';

const route = useRoute();
const batchCode = route.params.batchCode;
const providerUuid = route.params.providerUuid;

const pagination = usePagination({
    cb: (data) => getRequestedClaimByBatchDetail({
        ...data,
        providerUuid,
        status: PaymentStatus.AUTHORIZED,
        batchCode: decodeURIComponent(batchCode)
    })
});

const checked = ref([]);
const auth = useApiRequest();

function batchVerified() {
    if (auth.pending.value) return;
    
    openModal('Comment', {
        title: 'Authorize Claim'
    }, comment => {
        if (comment) {
            auth.send(
                () => claimAuthorized({
                    batchCode,
                    claimUuidRequest: pagination.data.value.filter(el => checked.value.find(id => id == el.claimUuid)),
                    comment
                }),
                res => {
                    if (res.success) {
                        toasted(true, 'Claim Authorized');
                        pagination.data.value = pagination.data.value.filter(el => {
                            return checked.value.find(id => id != el.claimUuid);
                        });
                        checked.value = [];
                    }
                }
            );
        }
    });
}
</script> -->
<template>
	
</template>