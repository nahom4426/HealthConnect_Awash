<script setup lang="js">
import DefaultPage from '@/components/DefaultPage.vue'
import { usePagination } from '@/composables/usePagination'
import { claimApproved, getRequestedClaimByBatchDetail } from '../../api/claimApi'
import Table from '@/components/Table.vue'
import { useRoute } from 'vue-router'
import { PaymentStatus } from '@/types/interface'
import { formatCurrency, toasted } from '@/utils/utils'
import Button from '@/components/Button.vue'
import TableWithCheckBox from '@/components/TableWithCheckBox.vue'
import { ref } from 'vue'
import { useApiRequest } from '@/composables/useApiRequest'
import { openModal } from '@customizer/modal-x'

const route = useRoute()
const batchCode = route.params.batchCode
const providerUuid = route.params.providerUuid

const pagination = usePagination({
  cb: (data) =>
    getRequestedClaimByBatchDetail({
      ...data,
      providerUuid,
      status: PaymentStatus.CHECKED,
      batchCode: decodeURIComponent(batchCode)
    })
})

const checked = ref([])
const approveClaimReq = useApiRequest()

function batchVerified() {
  if (approveClaimReq.pending.value) return
  openModal(
    'Comment',
    {
      title: 'Approve Claim'
    },
    (comment) => {
      if (comment) {
        approveClaimReq.send(
          () =>
            claimApproved({
              batchCode,
              claimUuidRequest: pagination.data.value.filter((el) =>
                checked.value.find((id) => id == el.claimUuid)
              ),
              comment
            }),
          (res) => {
            if (res.success) {
              toasted(true, 'Claim Approved')
              pagination.data.value = pagination.data.value.filter((el) => {
                return checked.value.find((id) => id != el.claimUuid)
              })
              checked.value = []
            }
          }
        )
      }
    }
  )
}
</script>

<template>
  <DefaultPage>
    <template #more>
      <Button
        :pending="approveClaimReq.pending.value"
        class="ml-auto"
        @click="batchVerified"
        type="primary"
        v-if="checked.length"
      >
        Approve Selected
      </Button>
    </template>

    <TableWithCheckBox
      v-model="checked"
      toBeSelected="claimUuid"
      :pending="pagination.pending.value"
      :headers="{
        head: [
          'Claim Number',
          'Insurance ID',
          'Institution',
          'Fullname',
          'Relationship',
          'Claim Amount',
          'actions'
        ],
        row: [
          'claimCode',
          'insuranceId',
          'institutionName',
          'fullname',
          'relationship',
          'totalAmount'
        ]
      }"
      :cells="{
        fullname: (_, row) => {
          return `${row?.insuredTitle} ${row?.firstName} ${row?.fatherName} ${row?.grandFatherName}`
        },
        totalAmount: formatCurrency,
        relationship: (relationship) => {
          return !relationship ? 'Main Member' : relationship
        }
      }"
      :rows="pagination.data.value"
    >
      <template #actions="{ row }">
        <Button size="xs" type="elevated">
          <RouterLink
            :to="`/approve_claims/detail/${providerUuid}/${encodeURIComponent(
              batchCode
            )}/individual/${row?.claimUuid}`"
          >
            Detail
          </RouterLink>
        </Button>
      </template>
    </TableWithCheckBox>
  </DefaultPage>
</template>
