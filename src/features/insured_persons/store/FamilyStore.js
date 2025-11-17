import { defineStore } from "pinia";
import { ref } from "vue";

export const useFamily = defineStore("familyStore", () => {
  const family = ref([]);

  function getAll() {
    return family.value;
  }

function set(data) {
  console.log("Setting family benefits in store:", data);

  const dataArray = Array.isArray(data)
    ? data
    : data?.content || [];

  if (!dataArray.length) {
    console.error("No valid data provided to set");
    family.value = [];
    return;
  }

  const mappedData = dataArray.map((item) => {
    // Extract first package key/value
    let packageUuid = null;
    let itemName = null;

    if (item.packages && typeof item.packages === "object") {
      const [uuid, name] = Object.entries(item.packages)[0] || [];
      packageUuid = uuid || null;
      itemName = name || null;
    }

    return {
      allowedUuid: item.allowedUuid || '',
      packageUuid, // extracted
      payerInstitutionContractUuid: item.payerInstitutionContractUuid || '',
      item: itemName, // extracted
      description: item.description || null,
      planType: item.planType || 'Individual_Plan',
      maxBenefitForEmployee: item.maxBenefitForEmployee || 0,
      maxBenefitForSpouse: item.maxBenefitForSpouse || 0,
      maxBenefitForChildren: item.maxBenefitForChildren || 0,
      familyPoolBenefit: item.familyPoolBenefit || 0,
      excessAllowed: item.excessAllowed || false,
      maxAllowedDependants: item.maxAllowedDependants || 0,
      maxAllowedDependantAge: item.maxAllowedDependantAge || 0,
      status: item.status || 'ACTIVE',
      packages: item.packages || null, // keep full object too
    };
  });

  console.log("Mapped family benefits data:", mappedData);
  family.value = mappedData;
}


  function setFamilyBenefits(data) {
    console.log("Setting family benefits with setFamilyBenefits:", data);
    set(data);
  }

  function setAll(data) {
    console.log("Setting family benefits with setAll:", data);
    set(data);
  }

function add(data) {
  console.log("Adding family benefit to store:", data);

  const mappedItem = {
    allowedUuid: data.allowedUuid || crypto.randomUUID(),
    packageUuid: data.packageUuid || null,
    payerInstitutionContractUuid: data.payerInstitutionContractUuid || '',
    item: data.item || null,
    description: data.description || null,
    planType: data.planType || 'Individual_Plan',
    maxBenefitForEmployee: data.maxBenefitForEmployee || 0,
    maxBenefitForSpouse: data.maxBenefitForSpouse || 0,
    maxBenefitForChildren: data.maxBenefitForChildren || 0,
    familyPoolBenefit: data.familyPoolBenefit || 0,
    excessAllowed: data.excessAllowed || false,
    maxAllowedDependants: data.maxAllowedDependants || 0,
    maxAllowedDependantAge: data.maxAllowedDependantAge || 0,
    status: data.status || 'ACTIVE',
    packages: data.packages || null,
  };

  family.value.unshift(mappedItem);
}

function update(id, data) {
  console.log(`Updating family benefit with UUID: ${id}`, data);

  const idx = family.value.findIndex((el) => el.allowedUuid === id);
  if (idx === -1) {
    console.warn(`[Family Store] No family benefit found with UUID: ${id}`);
    if (data.allowedUuid) {
      console.log("Family benefit not found for update, adding instead:", data);
      add(data);
    }
    return;
  }

  // Handle packageUuids to packageUuid conversion if needed
  const updatedItem = {
    ...family.value[idx],
    ...data,
    // If packageUuids exists in data, take the first one as packageUuid
    packageUuid: data.packageUuids && data.packageUuids.length > 0 
      ? data.packageUuids[0] 
      : data.packageUuid || null,
    // Keep the packages object if it exists
    packages: data.packages || family.value[idx].packages
  };

  family.value.splice(idx, 1, updatedItem);
  console.log("Family benefit updated successfully");
}

  function remove(id) {
    const idx = family.value.findIndex((el) => el.allowedUuid === id);
    if (idx === -1) {
      console.warn(`[Family Store] No family benefit found with UUID: ${id}`);
      return;
    }

    family.value.splice(idx, 1);
  }

  function updateStatus(id, status) {
    console.log(`Updating status for family benefit with UUID: ${id} to ${status}`);
    update(id, { status });
  }

  return {
    family,
    getAll,
    set,
    setFamilyBenefits,
    setAll,
    add,
    update,
    updateStatus,
    remove,
  };
});
