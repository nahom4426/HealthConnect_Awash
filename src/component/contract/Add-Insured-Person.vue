<script setup>
import { makeAuthenticatedRequest } from '@/scripts/api';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { Field, ErrorMessage, Form, useForm } from 'vee-validate';
import { useToast } from 'vue-toastification';
import ConfirmModal from '@/components/ConfirmModal.vue';

const { handleSubmit } = useForm({});
const loading = ref(false);
const toast = useToast();
const description = ref();
const route = useRoute();
const institutions = ref([]);
const approveModal = ref(false);
const contractData = ref();
const profileImageInput = ref(null);
const emit = defineEmits(['refetch', 'close']);
onMounted(() => {
  fetchInstitutions();
});
const open = () => {
  profileImageInput.value.click();
};
const fetchInstitutions = async () => {
  loading.value = true;
  await makeAuthenticatedRequest({
    method: 'Get',
    url: 'api/payer/claimconnect/institution/list',
  }).then((data) => {
    institutions.value = data;
    loading.value = false;
  });
};

const submit = handleSubmit(async (values) => {
  contractData.value = {
    email: values['Email'],
    institutionUuid: route.params.Uuid,
    payerInstitutionConractUuid: route.params.id,
    premium: Number(values['Premium']),
    title: values['Title'],
    firstName: values['First Name'],
    fatherName: values['Father Name'],
    grandFatherName: values["Grand Father's Name"],
    birthDate: values['Birth Date'],
    phone: values['Phone'],
    branchOffice: values['Branch Office'],
    position: values['Position'],
    idNumber: values['Id Number'],
    insuranceId: values['Group Policy Number'],
    address1: values['City'],
    address2: values['Sub-city'],
    address3: values['Woreda'],
    state: values['Region'],
    country: values['Country'],
    beginDate: values['Begin Date'],
    endDate: values['End Date'],
    status: 'Active',
    gender: values['Gender'],
  };
  approveModal.value = true;
});

async function confirmApprove() {
  loading.value = true;
  await makeAuthenticatedRequest({
    method: 'Post',
    url: `api/payer/claimconnect/insuredperson`,
    data: contractData.value,
  }).then((data) => {
    console.log(data);
    loading.value = false;
    approveModal.value = false;
    emit('close');
    emit('refetch');
    toast.success(data.message);
  });
}

const files = ref();

function createImage(file) {
  var reader = new FileReader();

  reader.onload = (e) => {
    // base64Files.value.push({
    //   base64: e.target.result,
    //   fromBack: file.fromBack,
    // });
  };
  reader.readAsDataURL(file);
}

const importedFile = ref(null);
async function onFileSelect(event) {
  var input = event.target;
  var file = input.files[0];

  var output = document.getElementById('preview_img');
  output.src = URL.createObjectURL(event.target.files[0]);
  output.onload = function () {
    URL.revokeObjectURL(output.src); // free memory
  };
  importedFile.value = output.src;
  // addProfilePicture();
}

async function addProfilePicture() {
  let formData = new FormData();
  formData.append('files', importedFile.value);
  try {
    await makeAuthenticatedRequest({
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      method: 'POST',
      url: `api/payer/claimconnect/insuredperson/profile-picture/bfdabcc8-d9a4-41f7-b1a3-7affc445637d`,
      data: formData,
    }).then((data) => {
      toast.success(data.message);
    });
  } catch (error) {
    toast.error(error);
  }
}
</script>
<template>
  <div class="space-y-10 divide-y divide-gray-900/10 flex items-center justify-center">
    <ConfirmModal v-model="approveModal" @confirm="confirmApprove" icon="simple-line-icons:check"
      title="Add Insured Person" description="Are you sure you want to add this person to the contract?"
      confirmButton="Add" iconClass="text-primary p-1 text-3xl" iconWrapperClass="bg-primary/10 rounded-full p-1"
      confirmButtonClass="inline-flex w-full justify-center rounded-md bg-primary/80 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary sm:ml-3 sm:w-auto duration-300" />
    <div class=" ">
      <form @submit.prevent="submit" class="md:col-span-2">
        <div class="px-4 py-6 sm:px-8 sm:py-4">
          <div class="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
            <div class="sm:col-span-6 text-lg font-semibold bg-gray-100 px-2">
              Member Info
            </div>

            <form @submit="addProfilePicture" enctype="multipart/form-data"
              class="relative w-44 h-44 col-span-6 flex justify-center mx-auto">
              <input class="invisible" type="file" accept="image/*" ref="profileImageInput" @change="onFileSelect" />
              <div class="w-40 h-40 absolute rounded-xl overflow-clip">
                <img class="object-contain w-40" id="preview_img"
                  src="https://media.istockphoto.com/id/1337144146/vector/default-avatar-profile-icon-vector.jpg?s=612x612&w=0&k=20&c=BIbFwuv7FxTWvh5S3vB6bkT0Qv8Vn8N5Ffseq84ClGI="
                  alt="" />
              </div>
              <div @click="open"
                class="w-40 h-40 group hover:bg-gray-200 opacity-60 rounded-xl absolute flex justify-center items-center cursor-pointer transition duration-500">
                <img class="hidden group-hover:block w-12" src="https://www.svgrepo.com/show/33565/upload.svg" alt="" />
              </div>
            </form>
            <div class="sm:col-span-2">
              <label for="first_name" class="block font-medium leading-6 text-gray-900">First Name</label>
              <div class="mt-1">
                <Field type="text" name="First Name" id="first_name"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-300 sm:leading-6" />
                <ErrorMessage name="First Name" class="text-xs text-red-600" />
              </div>
            </div>
            <div class="sm:col-span-2">
              <label for="father_name" class="block font-medium leading-6 text-gray-900">Father's Name</label>
              <div class="mt-1">
                <Field type="text" name="Father Name" id="father_name"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-300 sm:leading-6" />
                <ErrorMessage name="Father Name" class="text-xs text-red-600" />
              </div>
            </div>
            <div class="sm:col-span-2">
              <label for="grandfather_name" class="block font-medium leading-6 text-gray-900">Grandfater's Name</label>
              <div class="mt-1">
                <Field type="text" name="Grand Father's Name" id="grandfather_name"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-300 sm:leading-6" />
                <ErrorMessage name="Grand Father's Name" class="text-xs text-red-600" />
              </div>
            </div>
            <div class="sm:col-span-2">
              <label for="birthDate" class="block font-medium leading-6 text-gray-900">Birth Date</label>
              <div class="mt-1">
                <Field type="date" name="Birth Date" id="birthdate"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-300 sm:leading-6" />
                <ErrorMessage name="Birth Date" class="text-xs text-red-600" />
              </div>
            </div>
            <div class="sm:col-span-2">
              <label for="gender" class="block text-xl font-medium leading-6 text-gray-900">Gender</label>
              <div class="mt-2">
                <Field as="select" name="Gender" id="gender"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-xl sm:leading-6">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </Field>
                <ErrorMessage name="Gender" class="text-xs text-red-600" />
              </div>
            </div>
            <div class="sm:col-span-2">
              <label for="title" class="block text-xl font-medium leading-6 text-gray-900">Title</label>
              <div class="mt-2">
                <Field as="select" name="Title" id="title"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-xl sm:leading-6">
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                </Field>
                <ErrorMessage name="Title" class="text-xs text-red-600" />
              </div>
            </div>

            <div class="sm:col-span-6 text-lg font-semibold bg-gray-100 px-2">
              Address
            </div>

            <div class="sm:col-span-2">
              <label for="city" class="block font-medium leading-6 text-gray-900">City</label>
              <div class="mt-1">
                <Field type="text" name="City" id="city"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-300 sm:leading-6" />
                <ErrorMessage name="City" class="text-xs text-red-600" />
              </div>
            </div>

            <div class="sm:col-span-2">
              <label for="subcity" class="block font-medium leading-6 text-gray-900">Sub-City</label>
              <div class="mt-1">
                <Field type="text" name="Sub-city" id="subcity"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-300 sm:leading-6" />
                <ErrorMessage name="Sub-city" class="text-xs text-red-600" />
              </div>
            </div>
            <div class="sm:col-span-2">
              <label for="woreda" class="block font-medium leading-6 text-gray-900">Woreda</label>
              <div class="mt-1">
                <Field type="text" name="Woreda" id="woreda"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-300 sm:leading-6" />
                <ErrorMessage name="Woreda" class="text-xs text-red-600" />
              </div>
            </div>
            <div class="sm:col-span-2">
              <label for="region" class="block font-medium leading-6 text-gray-900">Region</label>
              <div class="mt-1">
                <Field type="text" name="Region" id="region"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-300 sm:leading-6" />
                <ErrorMessage name="Region" class="text-xs text-red-600" />
              </div>
            </div>
            <div class="sm:col-span-2">
              <label for="country" class="block font-medium leading-6 text-gray-900">Country</label>
              <div class="mt-1">
                <Field type="text" name="Country" id="country"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-300 sm:leading-6" />
                <ErrorMessage name="Country" class="text-xs text-red-600" />
              </div>
            </div>
            <div class="sm:col-span-2">
              <label for="branch_office" class="block font-medium leading-6 text-gray-900">Branch Office</label>
              <div class="mt-1">
                <Field type="text" name="Branch Office" id="branch_office"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-300 sm:leading-6" />
                <ErrorMessage name="Branch Office" class="text-xs text-red-600" />
              </div>
            </div>
            <div class="sm:col-span-2">
              <label for="phone" class="block font-medium leading-6 text-gray-900">Phone</label>
              <div class="mt-1">
                <Field type="text" name="Phone" id="phone"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-300 sm:leading-6" />
                <ErrorMessage name="Phone" class="text-xs text-red-600" />
              </div>
            </div>
            <div class="sm:col-span-2">
              <label for="email" class="block font-medium leading-6 text-gray-900">Email</label>
              <div class="mt-1">
                <Field type="text" name="Email" id="email"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-300 sm:leading-6" />
                <ErrorMessage name="Email" class="text-xs text-red-600" />
              </div>
            </div>
            <div class="sm:col-span-2">
              <label for="id_number" class="block font-medium leading-6 text-gray-900">ID Number</label>
              <div class="mt-1">
                <Field type="text" name="Id Number" id="id_number"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-300 sm:leading-6" />
                <ErrorMessage name="Id Number" class="text-xs text-red-600" />
              </div>
            </div>

            <div class="sm:col-span-6 text-lg font-semibold bg-gray-100 px-2">
              Effective Date
            </div>

            <div class="sm:col-span-3">
              <label for="beginDate" class="block font-medium leading-6 text-gray-900">Effective Date</label>
              <div class="mt-1">
                <Field type="date" name="Begin Date" id="beginDate"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-300 sm:leading-6" />
                <ErrorMessage name="Begin Date" class="text-xs text-red-600" />
              </div>
            </div>
            <div class="sm:col-span-3">
              <label for="endDate" class="block font-medium leading-6 text-gray-900">End Date</label>
              <div class="mt-1">
                <Field type="date" name="End Date" id="endDate"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-300 sm:leading-6" />
                <ErrorMessage name="End Date" class="text-xs text-red-600" />
              </div>
            </div>

            <div class="sm:col-span-6 text-lg font-semibold bg-gray-100 px-2">
              Covered Benefits
            </div>
            <div class="sm:col-span-3">
              <label for="insuranceId" class="block font-medium leading-6 text-gray-900">Group Policy Number</label>
              <div class="mt-1">
                <Field type="text" name="Group Policy Number" id="insuranceId"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-300 sm:leading-6" />
                <ErrorMessage name="Group Policy Number" class="text-xs text-red-600" />
              </div>
            </div>

            <div class="sm:col-span-3">
              <label for="position" class="block font-medium leading-6 text-gray-900">Position</label>
              <div class="mt-1">
                <Field type="text" name="Position" id="position"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-300 sm:leading-6" />
                <ErrorMessage name="Position" class="text-xs text-red-600" />
              </div>
            </div>

            <div class="sm:col-span-3">
              <label for="premium" class="block font-medium leading-6 text-gray-900">Premium</label>
              <div class="mt-1">
                <Field type="number" name="Premium" id="premium"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-300 sm:leading-6" />
                <ErrorMessage name="Premium" class="text-xs text-red-600" />
              </div>
            </div>

            <div class="col-span-6 flex items-center justify-center gap-x-6 border-gray-900/10 py-3">
              <button type="submit"
                class="rounded-md bg-indigo-600 px-10 py-2 text-xl font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                Submit
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
