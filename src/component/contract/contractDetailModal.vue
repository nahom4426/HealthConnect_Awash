<script setup>
const props = defineProps({
  contract: {
    type: Object,
    default: {},
  },
});
</script>

<template>
  <div class="w-[50vw]">
    <div class="px-4 sm:px-0">
      <p class="mt-1 max-w-2xl text-xl leading-6 text-gray-500">
        Full Contract Info.
      </p>
    </div>
    <div class="mt-6 border-t border-gray-100">
      <dl class="divide-y divide-gray-100">
        <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
          <dt class="text-xl font-medium leading-6 text-gray-900">
            Institution Name
          </dt>
          <dd class="mt-1 text-xl leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            {{ contract.institutionName }}
          </dd>
        </div>
        <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
          <dt class="text-xl font-medium leading-6 text-gray-900">
            Institution Description
          </dt>
          <dd class="mt-1 text-xl leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            {{ contract.institutionDescription }}
          </dd>
        </div>
        <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
          <dt class="text-xl font-medium leading-6 text-gray-900">
            Contract Name
          </dt>
          <dd class="mt-1 text-xl leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            {{ contract.contractName }}
          </dd>
        </div>
        <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
          <dt class="text-xl font-medium leading-6 text-gray-900">
            Institution Email address
          </dt>
          <dd class="mt-1 text-xl leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            {{ contract.institutionEmail }}
          </dd>
        </div>
        <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
          <dt class="text-xl font-medium leading-6 text-gray-900">
            Insurance Coverage
          </dt>
          <dd class="mt-1 text-xl leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            {{ contract.insuranceCoverage }}
          </dd>
        </div>
        <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
          <dt class="text-xl font-medium leading-6 text-gray-900">
            Contract Description
          </dt>
          <dd class="mt-1 text-xl leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            {{ contract.contractDescription }}
          </dd>
        </div>
        <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0" v-if="status">
          <dt class="text-xl font-medium leading-6 text-gray-900">Status</dt>
          <dd class="mt-1 text-xl leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
            {{ contract.status }}
          </dd>
        </div>
        <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
          <dt class="text-xl font-medium leading-6 text-gray-900">Date</dt>
          <dd class="mt-2 text-xl text-gray-900 sm:col-span-2 sm:mt-0">
            <ul role="list" class="divide-y divide-gray-100 rounded-md border border-gray-200">
              <li class="flex items-center justify-between py-4 pl-4 pr-5 text-xl leading-6">
                <div class="flex gap-7">
                  <span class="font-semibold">Begin Date</span>
                  {{ contract.beginDate }}
                </div>
              </li>
              <li class="flex items-center justify-between py-4 pl-4 pr-5 text-xl leading-6">
                <div class="grid gap-7 grid-cols-2">
                  <span class="font-semibold flex-1">End Date</span>
                  {{ contract.endDate }}
                </div>
              </li>
            </ul>
          </dd>
        </div>
      </dl>
    </div>
  </div>
</template>
