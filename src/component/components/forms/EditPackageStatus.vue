<script setup>
import {ref,watch,onMounted} from "vue"
import { storeToRefs } from 'pinia'
import {usePackageStore} from '@stores/packageStore'
import {useRatePerpersonStore} from '../../../stores/packageRatePerpersonStore'
import { useRatePerFamiliyStore } from '../../../stores/packageRatePerfamiliyStore'
import loader from "../loader/loader.vue";
const ratePerpersonStore=useRatePerpersonStore()
const {pending} = storeToRefs(useRatePerpersonStore);
const ratePerfamiliyStore=useRatePerFamiliyStore()
import { useToast } from "vue-toastification";
import { boolean } from "yup";
const toast = useToast();
const error=ref({'packageName':'','minLimit':'','maxiLimit':'','packageCategory':''})
const props=defineProps({item: {type:Object},stype:{type:String}})
const formData=ref({})
const pId=ref('')
const status=ref('')
const saveToDB=async ()=> {

         if(props.stype=='indiv')
            {

            let dataToSummit=props.item  

            console.log('you called me',dataToSummit)
            
            const formattedData = {
                        ...dataToSummit,
                        maxLimit: dataToSummit.maxLimit.replace(/,/g, ''),
                        minLimit: dataToSummit.minLimit.replace(/,/g, ''),
                        status: status.value
                    };
                    const formattedDataArray = [{
                              ...dataToSummit,
                              maxLimit: dataToSummit.maxLimit.replace(/,/g, ''),
                              minLimit: dataToSummit.minLimit.replace(/,/g, ''),
                              status: status.value
                          }];        



         
          
         let data= await ratePerpersonStore.updatePackagePerperson(formattedDataArray,formattedData.individualBenefitRangeUuid)
            }

            else
             {

              let dataToSummit=props.item  

console.log('you called me',dataToSummit)

            const formattedData = {
                        ...dataToSummit,
                        maxLimit: dataToSummit.maxLimit.replace(/,/g, ''),
                        minLimit: dataToSummit.minLimit.replace(/,/g, ''),
                        status: status.value
                    };
              const formattedDataArray = [{
                        ...dataToSummit,
                        maxLimit: dataToSummit.maxLimit.replace(/,/g, ''),
                        minLimit: dataToSummit.minLimit.replace(/,/g, ''),
                        status: status.value
                    }];    

      let data=await ratePerfamiliyStore.updatePackagePerfamiliy(formattedDataArray,formattedData.familyBenefitRangeUuid)

             }             

}
watch(props.item,()=> {
     
  }),
 onMounted(() => {
  formData.value = { ...props.item };
  console.log('props ',props.stype)
  pId.value=props.item.packageUuid
 })

</script>

<template>
 
  <div class="w-[450px] mt-8">
    {{type}}
    <form class=""> 
        <div class="w-[200px] mb-6">                
                <label class="text-sm required">
                      <span class=" text-sm font-medium  text-gray-900">Package Status</span>
                    </label>
                    
                    <div class="mt-2">
                      <select v-model="status"
                       
                        class="rounded-md border-0 py-1.5 text-gray-900 shadow-sm
                       ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 w-[400px]
                       focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                >
                 <!-- [SUSPENDED,  ACTIVE, PENDING] -->
                <option disabled>select status</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="SUSPENDED">Suspended</option>

                </select>  
                    </div>
                  </div>
        
     
    </form>
    <div>
        <button
           @click="saveToDB"
         
          class="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Update
        </button>


        <!-- <button
              type="submit"
              v-if="pending"
              class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <loader />
            </button> -->
      </div>
  

      </div>
</template>
