<script setup>
import { ref, computed } from 'vue';

const roles = [
  {
    name: 'Super Admin',
    title: 'this is super admin role and ...',
  },
  // More roles...
];

const selectedRoles = ref([]);
const indeterminate = computed(
  () =>
    selectedRoles.value.length > 0 && selectedRoles.value.length < roles.length
);
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <p class="mt-2 text-xl text-gray-700">
          A list of all the users in your account including their name, title,
          name and role.
        </p>
      </div>
    </div>
    <div class="mt-8 flow-root bg-white">
      <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div class="relative">
            <div
              v-if="selectedRoles.length > 0"
              class="absolute left-14 top-0 flex h-12 items-center space-x-3 bg-white sm:left-12"
            >
              <button
                type="button"
                class="inline-flex items-center rounded bg-white px-2 py-1 text-xl font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white"
              >
                Bulk edit
              </button>
              <button
                type="button"
                class="inline-flex items-center rounded bg-white px-2 py-1 text-xl font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white"
              >
                Delete all
              </button>
            </div>
            <table class="min-w-full table-fixed divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" class="relative px-7 sm:w-12 sm:px-6">
                    <input
                      type="checkbox"
                      class="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      :checked="
                        indeterminate || selectedRoles.length === roles.length
                      "
                      :indeterminate="indeterminate"
                      @change="
                        selectedRoles = $event.target.checked
                          ? roles.map((p) => p.name)
                          : []
                      "
                    />
                  </th>
                  <th
                    scope="col"
                    class="min-w-[12rem] py-3.5 pr-3 text-left text-xl font-semibold text-gray-900"
                  >
                    Role
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-3.5 text-left text-xl font-semibold text-gray-900"
                  >
                    Description
                  </th>

                  <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                    <span class="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr
                  v-for="role in roles"
                  :key="role.name"
                  :class="[selectedRoles.includes(role.name) && 'bg-gray-50']"
                >
                  <td class="relative px-7 sm:w-12 sm:px-6">
                    <div
                      v-if="selectedRoles.includes(role.name)"
                      class="absolute inset-y-0 left-0 w-0.5 bg-indigo-600"
                    ></div>
                    <input
                      type="checkbox"
                      class="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      :value="role.name"
                      v-model="selectedRoles"
                    />
                  </td>
                  <td
                    :class="[
                      'whitespace-nowrap py-4 pr-3 text-xl font-medium',
                      selectedRoles.includes(role.name)
                        ? 'text-indigo-600'
                        : 'text-gray-900',
                    ]"
                  >
                    {{ role.name }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-xl text-gray-500">
                    {{ role.title }}
                  </td>
                  <td
                    class="whitespace-nowrap py-4 pl-3 pr-4 text-right text-xl font-medium sm:pr-3"
                  >
                    <a href="#" class="text-indigo-600 hover:text-indigo-900">
                      Edit<span class="sr-only">, {{ role.name }}</span>
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
