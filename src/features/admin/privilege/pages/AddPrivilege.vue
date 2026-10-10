<script setup>
import PrivilegeForm from "../form/PrivilegeForm.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { usePrivilege } from "../store/privilegeStore";
import { toasted } from "@/utils/utils";
import { createPrivilege } from "../Api/PrivilegeApi";
import { useRouter } from "vue-router";
import { useForm } from "@/components/new_form_builder/useForm";
import Button from "@/components/Button.vue";
import { ref } from "vue";

const req = useApiRequest();
const privilegeStore = usePrivilege();
const router = useRouter();
const { submit } = useForm("privilegeForm");
const bulkData = [
  {
    privilegeName: "Privilage",
    privilegeDescription: "Privilages",
    privilegeCategory: "Settings"
  },
  {
    privilegeName: "Roles",
    privilegeDescription: "Roles",
    privilegeCategory: "Settings"
  },
  {
    privilegeName: "Users",
    privilegeDescription: "Users",
    privilegeCategory: "Settings"
  },
  {
    privilegeName: "Benefits",
    privilegeDescription: "Benefits",
    privilegeCategory: "Product Settings"
  },
  {
    privilegeName: "Authorization",
    privilegeDescription: "Authorization",
    privilegeCategory: "Authorization"
  },
  {
    privilegeName: "Expired Contracts",
    privilegeDescription: "Provider Contracts",
    privilegeCategory: "Provider Contracts"
  },
  {
    privilegeName: "Suspended Contract",
    privilegeDescription: "Provider Contracts",
    privilegeCategory: "Provider Contracts"
  },
  {
    privilegeName: "Active Contract",
    privilegeDescription: "Provider Contracts",
    privilegeCategory: "Provider Contracts"
  },
  {
    privilegeName: "Create Contract",
    privilegeDescription: "Provider Contracts",
    privilegeCategory: "Provider Contracts"
  },
  {
    privilegeName: "Inactive Providers",
    privilegeDescription: "Provider Settings",
    privilegeCategory: "Provider Settings"
  },
  {
    privilegeName: "Active Providers",
    privilegeDescription: "Provider Settings",
    privilegeCategory: "Provider Settings"
  },
  {
    privilegeName: "Add Provider",
    privilegeDescription: "Provider Settings",
    privilegeCategory: "Provider Settings"
  },
  {
    privilegeName: "Claim Level Limits",
    privilegeDescription: "Claim",
    privilegeCategory: "Claim"
  },
  {
    privilegeName: "Completed Claims",
    privilegeDescription: "Claim",
    privilegeCategory: "Claim"
  },
  {
    privilegeName: "Approve Claim L3",
    privilegeDescription: "Claim",
    privilegeCategory: "Claim"
  },
  {
    privilegeName: "Approve Claim L2",
    privilegeDescription: "Claim",
    privilegeCategory: "Claim"
  },
  {
    privilegeName: "Approve Claim L1",
    privilegeDescription: "Claim",
    privilegeCategory: "Claim"
  },
  {
    privilegeName: "Rejected Claims",
    privilegeDescription: "Claim",
    privilegeCategory: "Claim"
  },
  {
    privilegeName: "Verify Claims",
    privilegeDescription: "Claim",
    privilegeCategory: "Claim"
  },
  {
    privilegeName: "Process Claims",
    privilegeDescription: "Claim",
    privilegeCategory: "Claim"
  },
  {
    privilegeName: "Credit Services",
    privilegeDescription: "Claim",
    privilegeCategory: "Claim"
  },
  {
    privilegeName: "Create Cash Claims",
    privilegeDescription: "Claim",
    privilegeCategory: "Claim"
  },
  {
    privilegeName: "Cash Services",
    privilegeDescription: "Claim",
    privilegeCategory: "Claim"
  },
  {
    privilegeName: "Amend Policy",
    privilegeDescription: "Underwriting",
    privilegeCategory: "Underwriting"
  },
  {
    privilegeName: "Issued Policy",
    privilegeDescription: "Underwriting",
    privilegeCategory: "Underwriting"
  }
];
async function uploadAllPrivileges() {
  const seen = new Set();

  for (const item of bulkData) {
    const key = item.privilegeName + "-" + item.privilegeCategory;

    if (seen.has(key)) continue;
    seen.add(key);

    try {
      const res = await createPrivilege(item);

      if (res.success) {
        privilegeStore.add(res.data || res.data?.content);
      } else {
        console.warn("⚠️ Failed:", item.privilegeName, res.error);
      }
    } catch (err) {
      console.error("❌ Error:", item.privilegeName, err.response?.data || err.message);
    }
  }

  toasted(true, "Bulk upload completed");
}
function create({ values, reset }) {
  req.send(
    () => {
      return createPrivilege(values);
    },
    (res) => {
      if (res.success) {
        
        privilegeStore.add(res.data || res.data?.content);
        if (reset) reset();
        
        toasted(res.success, "Privilege Created Successfully", res.error);
        router.push("/privileges");
      } else {
        toasted(false, "", res.error || "Failed to create privilege");
      }
    }
  );
}




</script>
<template>
  <div class="p-4 min-h-screen bg-gradient-to-br from-surface-muted to-surface-muted sm:p-6 lg:p-8">
    <div class="mx-auto max-w-8xl">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-ink sm:text-4xl">Add New Privilege</h1>
        <p class="mt-2 text-ink-muted">Create a new privilege with detailed permissions and settings</p>
      </div>

      <!-- Form Card -->
      <div class="overflow-hidden bg-white rounded-2xl shadow-lg">
        <!-- Form Header -->
        <div class="px-6 py-4 bg-gradient-to-r from-primary/5 to-primary/5 border-b border-line sm:px-8">
          <h2 class="text-lg font-semibold text-ink">Privilege Details</h2>
        </div>

        <!-- Form Content -->
        <div class="p-6 space-y-6 sm:p-8">
          <PrivilegeForm />

          <!-- Info Alert -->
          <div class="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div class="flex gap-3">
              <svg class="flex-shrink-0 mt-0.5 w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
              <div>
                <p class="text-sm font-medium text-primary-hover">
                  <strong>Field Requirements:</strong>
                </p>
                <ul class="mt-2 space-y-1 text-sm list-disc list-inside text-primary-hover">
                  <li>All fields must be at least 3 characters long</li>
                  <li>Privilege Name and Category must be less than 50 characters</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col gap-3 pt-4 sm:flex-row">
            <Button
              size="md"
              class="flex flex-1 gap-2 justify-center items-center font-semibold text-white rounded-lg transition-all duration-200 bg-primary hover:bg-primary/90"
              :pending="req.pending.value"
              @click.prevent="submit(create)"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Privilege
            </Button>
            <!-- <button
  @click="uploadAllPrivileges"
  class="flex flex-1 gap-2 justify-center items-center px-6 py-3 font-semibold text-white bg-success rounded-lg transition-all duration-200 hover:bg-success-strong"
>
  🚀 Bulk Upload Privileges
</button> -->
            <button
              @click="$router.back()"
              class="flex flex-1 gap-2 justify-center items-center px-6 py-3 font-semibold text-ink-muted bg-surface-muted rounded-lg transition-all duration-200 hover:bg-line"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
