<template>
    <div>
        <table class="min-w-full divide-y divide-gray-300">
            <!-- Table Header -->
            <thead>
                <tr>
                    <th v-for="(header, index) in headers" :key="index"
                        class="px-3 py-3.5 text-left text-base uppercase font-semibold text-gray-900">
                        {{ header }}
                    </th>
                </tr>
            </thead>

            <!-- Table Body -->
            <!-- <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-for="(item, index) in paginatedData" :key="index">
                     <td v-for="(header, index) in headers" :key="index"
                        class="whitespace-nowrap px-3 py-2 border-gray-600 text-base">
                        <slot :name="header.value" :item="item">{{ item[header.value] }}</slot>
                    </td> -->
            <!-- <td scope="col" class="py-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8">
                        {{ index + 1 }}
                    </td>
                    <td v-for="(header, i) in headers" :key="i">
                        {{ row[header.value] }}
                    </td>
                </tr>
            </tbody> -->

            <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-for="(item, index) in paginatedData" :key="index">
                    <td scope="col" class="py-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8">
                        {{ index + 1 }}
                    </td>
                    <td v-for="(header, i) in headers" :key="i">
                        <template v-if="header === 'Provider Name'">
                            {{ providerName(item.providerPhone) }}
                        </template>
                        <template v-else-if="header === 'Status'">
                            {{ claimStatus(item) }}
                        </template>
                        <template v-else>
                            {{ item[header] }}
                        </template>
                    </td>
                    <td class="px-3 py-3.5">
                        <slot name="actions" :item="item"></slot>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Pagination -->
        <div>
            <button @click="prevPage">Previous</button>
            <button @click="nextPage">Next</button>
        </div>

        <!-- No Data Available -->
        <div v-if="!data.length">
            <slot name="fallback">No data available</slot>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        data: {
            type: Array,
            required: true
        },
        headers: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            currentPage: 1,
            itemsPerPage: 25
        };
    },
    methods: {
        nextPage() {
            if (this.currentPage * this.itemsPerPage < this.data.length) {
                this.currentPage++;
            }
        },
        prevPage() {
            if (this.currentPage > 1) {
                this.currentPage--;
            }
        }
    },
    computed: {
        paginatedData() {
            const start = (this.currentPage - 1) * this.itemsPerPage;
            const end = start + this.itemsPerPage;
            return this.data.slice(start, end);
        }
    }
};
</script>
