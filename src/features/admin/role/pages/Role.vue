<script setup >
import { ref } from 'vue';
import Table from '@/components/Table.vue';
import TableRowSkeleton from '@/components/TableRowSkeleton.vue';
import DefaultPage from "@/components/DefaultPage.vue";
import icons from "@/utils/icons";
import RolesDataProvider from '../components/RolesDataProvider.vue';
import Dropdown from '@/components/new_form_elements/Dropdown.vue';
import { removeRoleById } from '../Api/RoleApi';
import { useApiRequest } from '@/composables/useApiRequest';
import { toasted } from '@/utils/utils';
import { useRouter } from 'vue-router';


const deleteReq = useApiRequest();

function handleDelete(id) {
  if (confirm("Are you sure you want to delete this role? This action cannot be undone.")) {
    deleteReq.send(
      () => removeRoleById(id),
      (res) => {
        if (res.success) {
          toasted(true, "Role deleted successfully");
          // Refresh the data provider
          if (dataProvider.value) {
            dataProvider.value.refresh();
          }
        } else {
          toasted(false, "", res.error || "Failed to delete role");
        }
      }
    );
  }
}

const dataProvider = ref(null);
</script>

<template>
   <DefaultPage  placeholder="Search Roles">
    <template #filter>
      <button
        class="flex justify-center items-center gap-2 rounded-md px-6 py-4 text-primary bg-gray-100"
      >
        <i v-html="icons.filter"></i>
        <p class="text-base">Filters</p>
      </button>
    </template>

    <template #add-action>
      <button
        class="flex justify-center items-center gap-2 rounded-md px-6 py-4 bg-primary text-white"
        @click.prevent="$router.push('/create-role')"
      >
        <i v-html="icons.plus_circle"></i>
        <p class="text-base">Add Role</p>
      </button>
    </template>

    <template #default="{ search }">
      <RolesDataProvider
        ref="dataProvider"
        :search="search"
        v-slot="{ roles, pending,  }"
      >
      
        <Table 
        :pending="pending" 
        :headers="{
          head: [
            'Role Name',
            'Role Description',
            'Actions',
          ],
          row: [
            'roleName',
            'roleDescription',
          ]
        }" 
        :rows="roles"
        :Fallback="TableRowSkeleton"
      >
      <template #actions="{row}">
          <Dropdown v-slot="{ setRef, toggleDropdown }">
        <div
          @click.prevent="toggleDropdown"
          class="flex items-center gap-2 px-5 py-3 rounded-lg cursor-pointer"
        >
          <button>
            <i v-html="icons.threeDots"></i>
          </button>
        </div>
        <div
          class="flex shadow-lg text-base p-2 mt-2 rounded-lg flex-col gap-2 bg-white"
          :ref="setRef"
        >
          <button @click.prevent="$router.push(`/edit_role/${row?.roleUuid}`)"
            class="p-2 flex text-base-clr items-center gap-2 rounded-lg hover:bg-gray-100"
          >
            <i v-html="icons.edits" />
            <span>Edit</span>
          </button>

          <button
          
            class="p-2 flex text-base-clr items-center gap-2 rounded-lg hover:bg-gray-100"
          >
            <i v-html="icons.details" />
            <span>Detal</span>
          </button>
          
          <button
            @click.prevent="handleDelete(row?.roleUuid)"
            class="p-2 flex text-red-500 items-center gap-2 rounded-lg hover:bg-gray-100"
          >
            <i v-html="icons.trash || icons.delete" />
            <span>Delete</span>
          </button>
        </div>
      </Dropdown>
      </template>
         
        </Table>
      </RolesDataProvider>
    </template>
  </DefaultPage>
  </template>
