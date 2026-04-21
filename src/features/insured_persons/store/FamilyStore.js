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
    return {
      serviceQuotedUuid: item.serviceQuotedUuid || item.allowedUuid || '',
      packageUuid: item.packageUuid || null,
      packageName: item.packageName || null,
      numberOfInsured: Number(item.numberOfInsured) || 0,
      numberOfDependants: Number(item.numberOfDependants) || 0,
      description: item.description ?? null,
      rate: Number(item.rate) || 0,
      premium: Number(item.premium) || 0,
      coverage: Number(item.coverage) || 0,
      planType: item.planType || 'Individual_Plan',
      individualType: item.individualType ?? null,
      spouse: !!item.spouse,
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
    serviceQuotedUuid: data.serviceQuotedUuid || crypto.randomUUID(),
    packageUuid: data.packageUuid || null,
    packageName: data.packageName || null,
    numberOfInsured: Number(data.numberOfInsured) || 0,
    numberOfDependants: Number(data.numberOfDependants) || 0,
    description: data.description ?? null,
    rate: Number(data.rate) || 0,
    premium: Number(data.premium) || 0,
    coverage: Number(data.coverage) || 0,
    planType: data.planType || 'Individual_Plan',
    individualType: data.individualType ?? null,
    spouse: !!data.spouse,
  };

  family.value.unshift(mappedItem);
}

function update(id, data) {
  console.log(`Updating family benefit with UUID: ${id}`, data);

  const idx = family.value.findIndex((el) => el.serviceQuotedUuid === id);
  if (idx === -1) {
    console.warn(`[Family Store] No family benefit found with UUID: ${id}`);
    if (data.serviceQuotedUuid) {
      console.log("Family benefit not found for update, adding instead:", data);
      add(data);
    }
    return;
  }

  const updatedItem = {
    ...family.value[idx],
    ...data,
    packageUuid: data.packageUuid || family.value[idx].packageUuid,
    packageName: data.packageName || family.value[idx].packageName,
    serviceQuotedUuid: data.serviceQuotedUuid || family.value[idx].serviceQuotedUuid,
    numberOfInsured: data.numberOfInsured ?? family.value[idx].numberOfInsured,
    numberOfDependants: data.numberOfDependants ?? family.value[idx].numberOfDependants,
    description: data.description ?? family.value[idx].description,
    rate: data.rate ?? family.value[idx].rate,
    premium: data.premium ?? family.value[idx].premium,
    coverage: data.coverage ?? family.value[idx].coverage,
    planType: data.planType ?? family.value[idx].planType,
    individualType: data.individualType ?? family.value[idx].individualType,
    spouse: data.spouse ?? family.value[idx].spouse,
  };

  family.value.splice(idx, 1, updatedItem);
  console.log("Family benefit updated successfully");
}

  function remove(id) {
    const idx = family.value.findIndex((el) => el.serviceQuotedUuid === id);
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
