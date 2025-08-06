<script setup>
import {ref,watch,onMounted} from "vue"
import { storeToRefs } from 'pinia'
import {usePackageStore} from '@stores/packageStore'
import loader from "../loader/loader.vue";
const packageStore=usePackageStore()
const {pending} = storeToRefs(packageStore);
import { useToast } from "vue-toastification";
import { boolean } from "yup";
const toast = useToast();
const error=ref({'packageName':'','minLimit':'','maxiLimit':'','packageCategory':'','gender':''})
const props=defineProps({item: {type:Object},status:{type:Boolean}})
const formData=ref({})
const pId=ref('')



const validateFInput=(field)=>
     {
      console.log('field',field)
      let fieldValue=field
      if (formData.value[fieldValue] =='') {
        error.value[fieldValue] = 'required';
       
      } else {
        error.value[fieldValue] = '';
      }

     }
const saveToDB=async ()=> {

      console.log('this form data',formData.value)
      
                if(formData.value.maxLimit < formData.value.minLimit) {

            alert('maximum limit must be Greater than minimum limit')
            return

            }

            if(formData.value.packageName=='')
            {
            error.value.packageName='Name is Required'
            return

            }
            if(formData.value.gender=='')
            {
            error.value.gender='applicability is Required'
            return

            }
            if(formData.value.packageCategory=='')
            {
            error.value.packageCategory='category is Required'
            return

            }
            if(formData.value.minLimit=='')
            {
            error.value.minLimit='Minimum Limit is Required'
            return

            }
            if(formData.value.maxLimit=='')
            {
            error.value.maxiLimit='Maximum Limit is Required'
            return

            }



      await packageStore.updatePackage(formData.value,pId.value)
      
      // toast.success("you have successfully logged in");
}
watch(props.item,()=> {
     
  }),
 onMounted(() => {
  formData.value = { ...props.item };
  pId.value=props.item.packageUuid
 })

</script>

<template>
 
  <div class="w-[600px] mt-8">
    <form class="grid grid-cols-3 gap-y-6 gap-x-9"> 
      <div class="">
        <label class="text-sm required">
        <span class="text-gray-700 ">Name</span>
      </label>
        <input
          v-model="formData.packageName"
          @blur="validateFInput('packageName')"
          @input="validateFInput('packageName')"
          @change="validateFInput('packageName')"
          type="text"
          class="
            mt-2
            w-[200px]
            border-gray-300
            h-[35px]
            rounded-md
            shadow-sm
            focus:border-indigo-300
            focus:ring
            focus:ring-indigo-200
            focus:ring-opacity-50
          "
    
          required
        />
        <span v-if="error.packageName" class="text-red-500 text-xs"> name required </span>

    
      </div>

      <div class="">
        <label class="text-sm required">
        <span class="text-gray-700 ">Category</span>
      </label>
        <input
          v-model="formData.packageCategory"
          @blur="validateFInput('packageCategory')"
          @input="validateFInput('packageCategory')"
          @change="validateFInput('packageCategory')"
          class="
           mt-2
            w-[200px]
            border-gray-300
            h-[35px]
            rounded-md
            shadow-sm
            focus:border-indigo-300
            focus:ring
            focus:ring-indigo-200
            focus:ring-opacity-50
          "
    
          required
        />
        <span v-if="error.packageCategory" class="text-red-500 text-xs" > Category required </span>

    
      </div>

      <div class="">
        <label class="text-sm required">
        <span class="text-gray-700 ">Minimum limit</span>
      </label>
        <input
          v-model="formData.minLimit"
          type="number"
          @blur="validateFInput('minLimit')"
          @input="validateFInput('minLimit')"
          @change="validateFInput('minLimit')"
          class="
           mt-2
            w-[150px]
            border-gray-300
            h-[35px]
            rounded-md
            shadow-sm
            focus:border-indigo-300
            focus:ring
            focus:ring-indigo-200
            focus:ring-opacity-50
          "
    
          required
        />
        <span v-if="error.minLimit" class="text-red-500 text-xs"> Minimum limit required </span>

    
      </div>
      <div class="">
        <label class="text-sm required">
        <span class="text-gray-700 ">Maximum limit</span>
      </label>
        <input
          v-model="formData.maxLimit"
          type="number"
          @blur="validateFInput('maxLimit')"
          @input="validateFInput('maxLimit')"
          @change="validateFInput('maxLimit')"
          class="
           mt-2
            w-[200px]
            border-gray-300
            h-[35px]
            rounded-md
            shadow-sm
            focus:border-indigo-300
            focus:ring
            focus:ring-indigo-200
            focus:ring-opacity-50
          "
    
          required
        />
        <span v-if="error.maxiLimit" class="text-red-500 text-xs">Maximum limit required </span>

      </div>
      <div class=" w-[400px]">
                    <label class="text-sm required">
                      <span class=" text-sm font-medium  text-gray-900">Applicable to</span>
                    </label>
                    
                    <div class="mt-2">
                      <select v-model="formData.gender"
                      @blur="validateFInput('gender')"
                       
                        class="block  rounded-md border-0 py-1.5 text-gray-900 shadow-sm
                       ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 w-[150px]
                       focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                >
                <option disabled>Select Applicability</option>
                <option value="BOTH">Both</option>
                <option value="MEN">Male</option>
                <option value="FEMALE">Female</option>

                </select>  
                    </div>
                    <span v-if="error.gender" class="text-xs text-red-500">Gender is required</span>
                  </div>
      
      <div class="mb-2 col-span-3">
        <label class="text-sm required">
        <span class="text-gray-700 ">Description</span>
      </label>
          <textarea
            v-model="formData.packageDescription"
            @blur="validateFInput('packageDescription')"
            @input="validateFInput('packageDescription')"
            @change="validateFInput('packageDescription')"
            class="
             mt-2
              block
              mb-2
              w-full
              mt-1
              border-gray-300
              rounded-md
              shadow-sm
              focus:border-indigo-300
              focus:ring
              focus:ring-indigo-200
              focus:ring-opacity-50
            "
            rows="3"
          ></textarea>

<span v-if="error.packageDescription" class="text-red-500 text-xs">Description required </span>

</div>


     
    </form>
    <div>
        <button
           @click="saveToDB"
           v-if="!pending"
          class="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Save
        </button>


        <button
              type="submit"
              v-if="pending"
              class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <loader />
            </button>
      </div>
  

      </div>
</template>
