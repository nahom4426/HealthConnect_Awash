import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "@/toast/store/toast";
import { useImportInsuredsStore } from "../store/importInsuredsStore";
import {
  getBenefitPackages,
  getInsuredsByContract,
  linkInsuredsToGroup,
} from "../api/importInsuredsApi";

/**
 * Business-logic composable for the Import Existing Insureds wizard.
 *
 * @param {string} previousContractUuid - UUID of the contract to import FROM
 * @param {string} currentContractUuid  - UUID of the contract to import INTO
 */
export function useImportInsureds(previousContractUuid, currentContractUuid) {
  const store = useImportInsuredsStore();
  const router = useRouter();
  const { addToast } = useToast();

  const isSubmitting = ref(false);
  const currentStep = ref(1);
  const totalSteps = ref(2);

  // ─── Data Fetching ────────────────────────────────────────────────────────

  function groupByBenefitCode(packages) {
    const grouped = new Map();
    packages.forEach(pkg => {
      const code = pkg.benefitGroupCode;
      if (!grouped.has(code)) {
        grouped.set(code, {
          benefitGroupCode: code,
          packages: [],
          packageNames: [],
          planTypes: [],
          familySize: pkg.familySize,
          maxAllowedSlots: pkg.maxAllowedSlots,
          enrolledSlotsCount: pkg.enrolledSlotsCount,
          numberOfAdultFemale: pkg.numberOfAdultFemale,
          numberOfAdultMale: pkg.numberOfAdultMale,
          policyBenefitPackageUuid: pkg.policyBenefitPackageUuid
        });
      }
      const group = grouped.get(code);
      group.packages.push(pkg);
      if (!group.packageNames.includes(pkg.packageName)) {
        group.packageNames.push(pkg.packageName);
      }
      const formattedPlanType = pkg.planType?.replace(/_/g, ' ') || '';
      if (!group.planTypes.includes(formattedPlanType)) {
        group.planTypes.push(formattedPlanType);
      }
    });
    return Array.from(grouped.values());
  }

  async function fetchBenefitGroups() {
    try {
      store.isLoading = true;
      // Fetch from the CURRENT contract — we need to see which benefit groups
      // exist on the new contract and how many slots are still available.
      // The previous contract's packages are already full (that's why we're renewing).
      const response = await getBenefitPackages(currentContractUuid);

      if (response?.success) {
        const grouped = groupByBenefitCode(response.data || []);
        store.setBenefitGroups(grouped);
      } else {
        addToast({
          type: "error",
          message: response?.error || "Failed to load benefit groups",
        });
      }
    } catch (err) {
      addToast({
        type: "error",
        message: err?.message || "Failed to load benefit groups",
      });
    } finally {
      store.isLoading = false;
    }
  }

  async function fetchPreviousInsureds() {
    try {
      const response = await getInsuredsByContract(previousContractUuid, {
        page: 1,
        limit: 10000,
        hasInstitution: "true",
      });
      if (response?.success) {
        store.setPreviousInsureds(response.data?.content || []);
      }
    } catch (err) {
      addToast({
        type: "error",
        message: err?.message || "Failed to load insureds from previous contract",
      });
    }
  }

  async function fetchCurrentInsureds() {
    try {
      const response = await getInsuredsByContract(currentContractUuid, {
        page: 1,
        limit: 10000,
        hasInstitution: "true",
      });
      if (response?.success) {
        store.setCurrentInsureds(response.data?.content || []);
      }
    } catch (err) {
      // Non-critical — just means duplicate detection won't work
      console.warn("Could not fetch current contract insureds:", err);
    }
  }

  /** Initialize all data in parallel */
  async function init() {
    await Promise.all([
      fetchBenefitGroups(),
      fetchPreviousInsureds(),
      fetchCurrentInsureds(),
    ]);
  }

  // ─── Validation ──────────────────────────────────────────────────────────

  /**
   * Returns an array of validation error/warning messages.
   * An empty array means the selection is valid.
   * @returns {string[]}
   */
  function validateSelection() {
    const errors = [];
    const benefitGroup = store.selectedBenefitGroup;

    if (!benefitGroup) {
      errors.push("No benefit group selected.");
      return errors;
    }

    const total = store.selectedCount;

    if (total === 0) {
      errors.push("Please select at least one insured person.");
      return errors;
    }

    if (total > benefitGroup.maxAllowedSlots) {
      errors.push(
        `Selected ${total} member(s) exceeds the maximum of ${benefitGroup.maxAllowedSlots} slots.`
      );
    }

    for (const [, entry] of store.selectedInsureds) {
      const { insured, dependents } = entry;

      // Gender restriction
      if (
        benefitGroup.numberOfAdultFemale > 0 &&
        insured.gender !== "Female"
      ) {
        errors.push(
          `"${insured.firstName} ${insured.fatherName}" — this benefit group requires female members only.`
        );
      }

      // Family size mismatch warning (soft)
      const memberCount = 1 + dependents.length;
      if (memberCount > benefitGroup.familySize) {
        errors.push(
          `"${insured.firstName} ${insured.fatherName}" — ${memberCount} members selected but family size is ${benefitGroup.familySize}.`
        );
      }
    }

    return errors;
  }

  // ─── Per-insured helpers ──────────────────────────────────────────────────

  /**
   * Returns true if the insured is already enrolled in the current contract.
   * @param {string} insuredUuid
   */
  function isExistingInsured(insuredUuid) {
    return store.currentInsuredUuids.has(insuredUuid);
  }

  /**
   * Returns a warning string for an insured, or null.
   * @param {import('../types/importInsureds.types').InsuredPerson} insured
   * @returns {string|null}
   */
  function getWarning(insured) {
    if (isExistingInsured(insured.insuredUuid)) {
      return "Already enrolled in current policy";
    }
    const bg = store.selectedBenefitGroup;
    if (bg && bg.numberOfAdultFemale > 0 && insured.gender !== "Female") {
      return "Benefit group requires female members only";
    }
    return null;
  }

  // ─── Submission ───────────────────────────────────────────────────────────

  async function submitImport() {
    const errors = validateSelection();
    if (errors.length > 0) {
      errors.forEach((msg) => addToast({ type: "error", message: msg }));
      return;
    }

    try {
      isSubmitting.value = true;

      // Build payload with new backend structure:
      // [{ insureds: [{ insuredUuid, dependentUuids }], benefitGroupCode }]
      const insureds = Array.from(store.selectedInsureds.entries()).map(([insuredUuid, entry]) => ({
        insuredUuid,
        dependentUuids: entry.dependents,
      }));
      const payload = [
        {
          insureds,
          benefitGroupCode: store.selectedBenefitGroup.benefitGroupCode,
        },
      ];

      const response = await linkInsuredsToGroup(currentContractUuid, payload);

      if (response?.success) {
        addToast({
          type: "success",
          message: `${insureds.length} insured(s) imported successfully!`,
        });
        store.reset();
        // Go back to the Insured Persons page
        router.back();
      } else {
        addToast({
          type: "error",
          message: response?.error || "Failed to import insureds. Please try again.",
        });
      }
    } catch (err) {
      addToast({
        type: "error",
        message: err?.message || "An unexpected error occurred during import.",
      });
    } finally {
      isSubmitting.value = false;
    }
  }

  // ─── Navigation ──────────────────────────────────────────────────────────

  function nextStep() {
    if (currentStep.value === 1) {
      if (!store.selectedBenefitGroup) {
        addToast({
          type: "error",
          message: "Please select a benefit group before continuing.",
        });
        return;
      }
    }

    if (currentStep.value < totalSteps.value) {
      currentStep.value++;
    } else {
      submitImport();
    }
  }

  function previousStep() {
    if (currentStep.value > 1) {
      currentStep.value--;
    }
  }

  // ─── Exposed ──────────────────────────────────────────────────────────────
  return {
    // State (reactive refs from store)
    currentStep,
    totalSteps,
    isSubmitting,
    isLoading: computed(() => store.isLoading),
    benefitGroups: computed(() => store.benefitGroups),
    selectedBenefitGroup: computed(() => store.selectedBenefitGroup),
    previousInsureds: computed(() => store.previousInsureds),
    selectedInsureds: computed(() => store.selectedInsureds),
    selectedCount: computed(() => store.selectedCount),
    maxAllowed: computed(() => store.maxAllowed),
    availableSlots: computed(() => store.availableSlots),
    currentInsuredUuids: computed(() => store.currentInsuredUuids),

    // Actions
    init,
    nextStep,
    previousStep,
    isExistingInsured,
    getWarning,
    validateSelection,

    // Store actions (proxied for template convenience)
    selectBenefitGroup: store.selectBenefitGroup,
    toggleInsured: store.toggleInsured,
    toggleDependent: store.toggleDependent,
    selectAllEmployees: store.selectAllEmployees,
    selectAllDependents: store.selectAllDependents,
    selectEmployeesWithExactDependents: store.selectEmployeesWithExactDependents,
    clearAll: store.clearAll,
  };
}
