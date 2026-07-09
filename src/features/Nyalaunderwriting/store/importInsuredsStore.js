import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useImportInsuredsStore = defineStore("importInsureds", () => {
  // ─── State ───────────────────────────────────────────────────────────────
  /** @type {import('vue').Ref<import('../types/importInsureds.types').BenefitPackage[]>} */
  const benefitGroups = ref([]);

  /** @type {import('vue').Ref<import('../types/importInsureds.types').BenefitPackage|null>} */
  const selectedBenefitGroup = ref(null);

  /** @type {import('vue').Ref<import('../types/importInsureds.types').InsuredPerson[]>} */
  const previousInsureds = ref([]);

  /** @type {import('vue').Ref<import('../types/importInsureds.types').InsuredPerson[]>} */
  const currentInsureds = ref([]);

  /**
   * Map of insuredUuid → { insured, dependents: string[] (dependantUuid[]) }
   * @type {import('vue').Ref<Map<string, import('../types/importInsureds.types').SelectedInsuredEntry>>}
   */
  const selectedInsureds = ref(new Map());

  const isLoading = ref(false);
  const error = ref(null);

  // ─── Computed ─────────────────────────────────────────────────────────────
  const availableSlots = computed(() => {
    if (!selectedBenefitGroup.value) return 0;
    return (
      selectedBenefitGroup.value.maxAllowedSlots -
      selectedBenefitGroup.value.enrolledSlotsCount
    );
  });

  /** Total number of selected employees (families) */
  const selectedCount = computed(() => {
    return selectedInsureds.value.size;
  });

  const maxAllowed = computed(() => {
    return selectedBenefitGroup.value?.maxAllowedSlots ?? 0;
  });

  const familySize = computed(() => {
    return selectedBenefitGroup.value?.familySize ?? 1;
  });

  /** Set<insuredUuid> of all insured persons already in the current contract */
  const currentInsuredUuids = computed(() => {
    return new Set(currentInsureds.value.map((i) => i.insuredUuid));
  });

  // ─── Actions ──────────────────────────────────────────────────────────────
  function setBenefitGroups(groups) {
    benefitGroups.value = groups;
  }

  function selectBenefitGroup(group) {
    selectedBenefitGroup.value = group;
    selectedInsureds.value.clear();
  }

  function setPreviousInsureds(insureds) {
    previousInsureds.value = insureds;
  }

  function setCurrentInsureds(insureds) {
    currentInsureds.value = insureds;
  }

  /**
   * Toggle an employee's selection.
   * If they are already selected → remove them (and all their dependents).
   * If not selected → add them (no dependents auto-selected).
   * @param {import('../types/importInsureds.types').InsuredPerson} insured
   */
  function toggleInsured(insured) {
    const map = selectedInsureds.value;
    if (map.has(insured.insuredUuid)) {
      map.delete(insured.insuredUuid);
    } else {
      map.set(insured.insuredUuid, { insured, dependents: [] });
    }
    // trigger reactivity
    selectedInsureds.value = new Map(map);
  }

  /**
   * Toggle an individual dependent's selection.
   * If their parent employee is not yet selected, auto-select the employee too.
   * @param {import('../types/importInsureds.types').InsuredPerson} insured
   * @param {import('../types/importInsureds.types').Dependent} dependent
   */
  function toggleDependent(insured, dependent) {
    const map = selectedInsureds.value;
    let entry = map.get(insured.insuredUuid);

    if (!entry) {
      // Auto-select the employee when a dependent is checked
      entry = { insured, dependents: [] };
      map.set(insured.insuredUuid, entry);
    }

    const idx = entry.dependents.indexOf(dependent.dependantUuid);
    if (idx > -1) {
      entry.dependents.splice(idx, 1);
      // If no dependents left AND employee was only here because of a dependent, keep them selected
      // (employee stays selected even with 0 dependents — user must uncheck manually)
    } else {
      entry.dependents.push(dependent.dependantUuid);
    }

    selectedInsureds.value = new Map(map);
  }

  /** Select all employees (no dependents auto-selected) */
  function selectAllEmployees() {
    const map = new Map();
    for (const insured of previousInsureds.value) {
      if (!currentInsuredUuids.value.has(insured.insuredUuid)) {
        const existing = selectedInsureds.value.get(insured.insuredUuid);
        map.set(insured.insuredUuid, {
          insured,
          dependents: existing?.dependents ?? [],
        });
      }
    }
    selectedInsureds.value = map;
  }

  /** Select all dependents across all non-duplicate insureds */
  function selectAllDependents() {
    const map = new Map(selectedInsureds.value);
    for (const insured of previousInsureds.value) {
      if (currentInsuredUuids.value.has(insured.insuredUuid)) continue;
      const deps = (insured.dependantResponses || []).map((d) => d.dependantUuid);
      if (deps.length === 0) continue;
      const entry = map.get(insured.insuredUuid);
      if (entry) {
        entry.dependents = deps;
      } else {
        map.set(insured.insuredUuid, { insured, dependents: deps });
      }
    }
    selectedInsureds.value = new Map(map);
  }

  /**
   * Select employees that have exactly `count` dependents, and select all their dependents.
   * @param {number} count
   */
  function selectEmployeesWithExactDependents(count) {
    const map = new Map(selectedInsureds.value);
    for (const insured of previousInsureds.value) {
      if (currentInsuredUuids.value.has(insured.insuredUuid)) continue;
      const deps = insured.dependantResponses || [];
      if (deps.length === count) {
        map.set(insured.insuredUuid, {
          insured,
          dependents: deps.map(d => d.dependantUuid)
        });
      }
    }
    selectedInsureds.value = new Map(map);
  }

  function clearAll() {
    selectedInsureds.value = new Map();
  }

  function reset() {
    benefitGroups.value = [];
    selectedBenefitGroup.value = null;
    previousInsureds.value = [];
    currentInsureds.value = [];
    selectedInsureds.value = new Map();
    isLoading.value = false;
    error.value = null;
  }

  return {
    // State
    benefitGroups,
    selectedBenefitGroup,
    previousInsureds,
    currentInsureds,
    selectedInsureds,
    isLoading,
    error,

    // Computed
    availableSlots,
    selectedCount,
    maxAllowed,
    familySize,
    currentInsuredUuids,

    // Actions
    setBenefitGroups,
    selectBenefitGroup,
    setPreviousInsureds,
    setCurrentInsureds,
    toggleInsured,
    toggleDependent,
    selectAllEmployees,
    selectAllDependents,
    selectEmployeesWithExactDependents,
    clearAll,
    reset,
  };
});
