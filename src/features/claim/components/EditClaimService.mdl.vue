<script setup>
import { useApiRequest } from '@/composables/useApiRequest';
import { getPackageByInsuredId } from '../api/packagesApi';
import ModalParent from '@/components/ModalParent.vue';
import NewFormParent from '@/components/NewFormParent.vue';
import ClaimServicesForm from './form/ClaimServicesForm.vue';
import Button from '@/components/Button.vue';
import { useForm } from '@/components/new_form_builder/useForm';
import { updateCashCredit } from '../api/cashCreditApi';
import { toasted } from '@/utils/utils';
import { useSearchedCashCreditInsuredByInstitutionStore } from '../store/searchCashCreditInsuredInstitutionStore';

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
});

const cashCreditInsuredStore = useSearchedCashCreditInsuredByInstitutionStore();

const servicesReq = useApiRequest();
servicesReq.send(
  () => getPackageByInsuredId(props.data.insuredPersonUuid),
  res => {
    console.log(servicesReq.response.value);
  }
);

const { submit } = useForm('service-form', true, 'main-service');

const cashClaimReq = useApiRequest();
function addCashClaim({ values, reset }) {
  if (cashClaimReq.pending.value) return;

  cashClaimReq.send(
    () => updateCashCredit(props.data.cashCreditUuid, {
      cashCredit: {
        ...props.data,
        cashServices: undefined,
        hospital: values.hospital
      },
      cashServices: values.cashServices
    }),
    res => {
      if (res.success) {
        toasted(res.success, 'Successfully Updated');
        cashCreditInsuredStore.update(props.data.cashCreditUuid, {
          ...props.data,
          cashServiceResponses: props.data.cashServices,
          hospital: values.hospital,
          totalAmount: values.cashServices.reduce((sum, el) => sum + parseInt(el.amount), 0)
        });
        reset();
      }
    }
  );
}
</script>
