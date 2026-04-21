import { defineStore } from "pinia";
import { ref } from "vue";

export type Status = "ACTIVE" | "INACTIVE" | "PENDING";

export interface Dependent {
  dependantUuid: string;
  insuredPersonUuid: string;
  firstName: string;
  fatherName: string;
  grandFatherName: string;
  birthDate: string;
  relationship: string;
  phone: string | null;
  status: Status;
  profilePictureBase64?: string;
  gender: string;
  title?: string | null;
}

export const useDependentStore = defineStore("dependentStore", () => {
  // Changed to store by dependent UUID for easier access
  const dependents = ref<Record<string, Dependent>>({});
  
  // Store dependents by insured person UUID for easy lookup
  const dependentsByInsured = ref<Record<string, string[]>>({});

  // Add or update a dependent
  function set(dependent: Dependent): void {
    dependents.value[dependent.dependantUuid] = dependent;
    
    // Maintain the insured person -> dependents mapping
    if (!dependentsByInsured.value[dependent.insuredPersonUuid]) {
      dependentsByInsured.value[dependent.insuredPersonUuid] = [];
    }
    
    if (!dependentsByInsured.value[dependent.insuredPersonUuid].includes(dependent.dependantUuid)) {
      dependentsByInsured.value[dependent.insuredPersonUuid].push(dependent.dependantUuid);
    }
  }

  // Set multiple dependents
  function setAll(dependentsList: Dependent[]): void {
    dependentsList.forEach(dep => set(dep));
  }

  // Get by dependent UUID
  function get(dependantUuid: string): Dependent | undefined {
    return dependents.value[dependantUuid];
  }

  // Get all dependents for an insured person
  function getByInsuredId(insuredPersonUuid: string): Dependent[] {
    return dependentsByInsured.value[insuredPersonUuid]?.map(
      uuid => dependents.value[uuid]
    ) || [];
  }

  // Get all dependents
  function getAll(): Dependent[] {
    return Object.values(dependents.value);
  }

  // Update a dependent
  function update(dependantUuid: string, data: Partial<Dependent>): void {
    if (dependents.value[dependantUuid]) {
      dependents.value[dependantUuid] = {
        ...dependents.value[dependantUuid],
        ...data
      };
    }
  }

  // Remove a dependent
  function remove(dependantUuid: string): void {
    const dependent = dependents.value[dependantUuid];
    if (dependent) {
      // Remove from insured person mapping
      const insuredDependents = dependentsByInsured.value[dependent.insuredPersonUuid];
      if (insuredDependents) {
        dependentsByInsured.value[dependent.insuredPersonUuid] = insuredDependents.filter(
          uuid => uuid !== dependantUuid
        );
      }
      // Remove from main store
      delete dependents.value[dependantUuid];
    }
  }

  // Update status
  function updateStatus(dependantUuid: string, status: Status): void {
    update(dependantUuid, { status });
  }

  return {
    dependents,
    dependentsByInsured,
    set,
    setAll,
    get,
    getByInsuredId,
    getAll,
    update,
    updateStatus,
    remove
  };
});