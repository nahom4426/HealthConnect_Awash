<script setup>
import { computed, onMounted, ref, shallowRef, watch, nextTick } from 'vue';
import { getPackages, getPackageDropdown } from '@/features/product_settings/api/coverageApi';
import { useRoute } from 'vue-router';
import { onUnmounted } from 'vue';

const route = useRoute();
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  label: { type: String, default: '' },
  validation: { type: String, default: '' },
  insuredPersonUuid: { type: String, default: '' },
  dependantUuid: { type: String, default: null },
  memberGender: { type: [String, null], default: null },
  internalScroll: { type: Boolean, default: true },
  readOnly: { type: Boolean, default: false },
  showSumAssured: { type: Boolean, default: true },
  showUsed: { type: Boolean, default: true },
  showDepSumAssuredForIndividual: { type: Boolean, default: false },
  showStatus: { type: Boolean, default: true },
  showPlanType: { type: Boolean, default: true },
  showExcessAmount: { type: Boolean, default: true }
});

const emit = defineEmits(['update:modelValue']);

// Use shallowRef for large arrays
const packagesWithSumAssured = shallowRef([]);
const allPackages = shallowRef([]);
const preSelectedPackages = shallowRef([]);
const insuredEligiblePackages = shallowRef([]);

const loading = ref(false);
const initialized = ref(false);
// Track expanded packages - all pre-selected start expanded by default
const expandedPackages = ref(new Set());

// Cache for computed values
const statusOptions = shallowRef([
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'PENDING', label: 'Pending' }
]);

const insuredPlanTypeOptions = shallowRef([
  { value: 'Individual_Plan', label: 'Individual Plan' },
  { value: 'Family_Shared_Plan', label: 'Family Shared Plan' },
]);

const dependentExtraPlanTypeOptions = shallowRef([
  { value: 'Dependent_Shared_Plan', label: 'Dependent Shared Plan' },
  { value: 'Dual_Premium_dependent_Shared_Plan', label: 'Dual Premium Dependent Shared Plan' },
]);

const allSelectedPackages = computed(() => {
  return (packagesWithSumAssured.value || []).filter(p => !!p?.isSelected);
});

// Computed properties
const pinnedPackages = computed(() => {
  if (!packagesWithSumAssured.value?.length) return [];
  const preSelected = preSelectedPackages.value;
  if (!preSelected?.length) return [];
  
  const preSelectedMap = new Map(preSelected.map(p => [p.packageUuid, true]));
  return packagesWithSumAssured.value.filter(p => preSelectedMap.has(p.packageUuid));
});

const selectablePackages = computed(() => {
  if (!packagesWithSumAssured.value?.length) return [];
  const preSelected = preSelectedPackages.value;
  if (!preSelected?.length) return packagesWithSumAssured.value;
  
  const preSelectedMap = new Map(preSelected.map(p => [p.packageUuid, true]));
  return packagesWithSumAssured.value.filter(p => !preSelectedMap.has(p.packageUuid));
});

// Cache for lookups
const planTypeCache = new Map();
const sumAssuredCache = new Map();

function normalizePlanType(value) {
  if (!value) return null;
  const cacheKey = String(value);
  if (planTypeCache.has(cacheKey)) return planTypeCache.get(cacheKey);
  
  const normalized = String(value).trim();
  const allowed = new Set(['Individual_Plan', 'Family_Shared_Plan', 'Dependent_Shared_Plan', 'Dual_Premium_dependent_Shared_Plan']);
  const result = allowed.has(normalized) ? normalized : null;
  planTypeCache.set(cacheKey, result);
  return result;
}

function getInsuredPackagePlanTypeByPackageUuid(packageUuid) {
  if (!packageUuid || !insuredEligiblePackages.value?.length) return null;
  
  const cacheKey = `type_${packageUuid}`;
  if (planTypeCache.has(cacheKey)) return planTypeCache.get(cacheKey);
  
  const match = insuredEligiblePackages.value.find(p => p?.packageUuid === packageUuid);
  const result = normalizePlanType(match?.planType) || normalizePlanType(match?.plan_type) || null;
  planTypeCache.set(cacheKey, result);
  return result;
}

function getInsuredPackageSumAssuredByPackageUuid(packageUuid) {
  if (!packageUuid || !insuredEligiblePackages.value?.length) return null;
  
  const cacheKey = `sum_${packageUuid}`;
  if (sumAssuredCache.has(cacheKey)) return sumAssuredCache.get(cacheKey);
  
  const match = insuredEligiblePackages.value.find(p => p?.packageUuid === packageUuid);
  const num = Number(match?.sumAssured);
  const result = Number.isFinite(num) ? num : null;
  sumAssuredCache.set(cacheKey, result);
  return result;
}

// Helper functions
function isPreSelected(pkg) {
  if (!pkg?.packageUuid || !preSelectedPackages.value?.length) return false;
  return preSelectedPackages.value.some(p => p?.packageUuid === pkg.packageUuid);
}

function isFamilySharedPlan(planType) {
  return normalizePlanType(planType) === 'Family_Shared_Plan';
}

function isDependentSharedPlan(planType) {
  const pt = normalizePlanType(planType);
  return pt === 'Dependent_Shared_Plan' || pt === 'Dual_Premium_dependent_Shared_Plan';
}

function normalizeGender(value) {
  const g = String(value || '').trim().toLowerCase();
  if (!g) return null;
  // Important: check female before male because "female" contains the substring "male".
  if (g === 'f' || g === 'female' || /\bfemale\b/.test(g) || g.includes('female')) return 'FEMALE';
  if (g === 'm' || g === 'male' || /\bmale\b/.test(g) || g.includes(' male')) return 'MALE';
  if (g === 'both' || g.includes('both')) return 'BOTH';
  return null;
}

function shouldIncludePackageForMemberGender(pkg) {
  const memberG = normalizeGender(props.memberGender);
  if (!memberG) return true;
  const pkgG = normalizeGender(pkg?.gender);
  if (!pkgG) return true;
  return pkgG === 'BOTH' || pkgG === memberG;
}

function isDependentFamilyShared(pkg) {
  if (!props.dependantUuid || !pkg?.packageUuid) return false;
  return isFamilySharedPlan(getInsuredPackagePlanTypeByPackageUuid(pkg.packageUuid));
}

function isDependentSharedFromInsured(pkg) {
  if (!props.dependantUuid || !pkg?.packageUuid) return false;
  return isDependentSharedPlan(getInsuredPackagePlanTypeByPackageUuid(pkg.packageUuid));
}

function isDependentSumAssuredLocked(pkg) {
  return props.dependantUuid && (isDependentFamilyShared(pkg) || isDependentSharedFromInsured(pkg));
}

function isDependentRowReadOnly(pkg) {
  if (!props.dependantUuid || !pkg?.planType) return props.readOnly;
  return props.readOnly || normalizePlanType(pkg.planType) !== 'Individual_Plan';
}

function shouldShowDependentLimitInputs(pkg) {
  if (!props.dependantUuid || !pkg?.planType) return false;
  const pt = normalizePlanType(pkg.planType);
  return pt === 'Family_Shared_Plan' || pt === 'Dependent_Shared_Plan' || pt === 'Dual_Premium_dependent_Shared_Plan';
}

function shouldShowDepSharedFields(pkg) {
  // On insured screen: Dependent_Shared_Plan / Dual_Premium_dependent_Shared_Plan has two extra inputs (dep sum assured + dep used benefit)
  if (props.dependantUuid) return false;
  const pt = normalizePlanType(pkg?.planType);
  return pt === 'Dependent_Shared_Plan' || pt === 'Dual_Premium_dependent_Shared_Plan';
}

function shouldShowDepSumAssuredOnly(pkg) {
  if (props.dependantUuid) return false;
  if (!props.showDepSumAssuredForIndividual) return false;
  return normalizePlanType(pkg?.planType) === 'Individual_Plan';
}

function shouldUseDependentMainFields(pkg) {
  // On dependent screen, both Individual_Plan and Dependent_Shared_Plan use depSumAssured/depUsedBenefit.
  if (!props.dependantUuid) return false;
  const pt = normalizePlanType(pkg?.planType);
  return pt === 'Dependent_Shared_Plan' || pt === 'Individual_Plan';
}

function displayedSumAssured(pkg) {
  return shouldUseDependentMainFields(pkg)
    ? Number(pkg?.depSumAssured) || 0
    : Number(pkg?.sumAssured) || 0;
}

function displayedUsed(pkg) {
  if (shouldUseDependentMainFields(pkg)) {
    return Number(pkg?.depUsedBenefit) || Number(pkg?.used) || 0;
  }
  return Number(pkg?.used) || 0;
}

function isUsedDisabled(pkg) {
  if (props.readOnly) return true;
  if (isDependentRowReadOnly(pkg)) return true;

  const initial = shouldUseDependentMainFields(pkg)
    ? (Number(pkg?.initialDepUsedBenefit) || Number(pkg?.initialUsed) || 0)
    : Number(pkg?.initialUsed) || 0;

  return initial !== 0;
}

function isDepUsedBenefitDisabled(pkg) {
  if (props.readOnly) return true;
  if (isDependentRowReadOnly(pkg)) return true;
  return (Number(pkg?.initialDepUsedBenefit) || 0) !== 0;
}

function optionsForPackage(pkg) {
  if (!props.dependantUuid) {
    return [...insuredPlanTypeOptions.value, ...dependentExtraPlanTypeOptions.value];
  }
  
  const insuredPt = getInsuredPackagePlanTypeByPackageUuid(pkg?.packageUuid);
  if (insuredPt === 'Family_Shared_Plan') {
    return insuredPlanTypeOptions.value.filter(o => o.value === 'Family_Shared_Plan');
  }
  if (insuredPt === 'Dependent_Shared_Plan') {
    return dependentExtraPlanTypeOptions.value.filter(o => o.value === 'Dependent_Shared_Plan');
  }
  if (insuredPt === 'Dual_Premium_dependent_Shared_Plan') {
    return dependentExtraPlanTypeOptions.value.filter(o => o.value === 'Dual_Premium_dependent_Shared_Plan');
  }
  return insuredPlanTypeOptions.value.filter(o => o.value === 'Individual_Plan');
}

function getCupPackageOptions(pkg) {
  if (!props.insuredPersonUuid) {
    return (packagesWithSumAssured.value || []).filter(p => p.packageUuid !== pkg.packageUuid);
  }
  return allSelectedPackages.value.filter(p => p.packageUuid !== pkg.packageUuid);
}

// Debounced update function
let updateTimeout = null;
function scheduleUpdate() {
  if (updateTimeout) clearTimeout(updateTimeout);
  updateTimeout = setTimeout(() => {
    emit('update:modelValue', packagesWithSumAssured.value);
    updateTimeout = null;
  }, 100);
}

// Toggle expand/collapse
function toggleExpand(packageUuid, event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  const newExpanded = new Set(expandedPackages.value);
  if (newExpanded.has(packageUuid)) {
    newExpanded.delete(packageUuid);
  } else {
    newExpanded.add(packageUuid);
  }
  expandedPackages.value = newExpanded;
}

// Update functions
function updatePackageField(pkg, field, value) {
  if (props.readOnly || isDependentRowReadOnly(pkg)) return;
  
  const index = packagesWithSumAssured.value.findIndex(p => p.packageUuid === pkg.packageUuid);
  if (index === -1) return;
  
  const newPackages = [...packagesWithSumAssured.value];
  newPackages[index][field] = value;
  packagesWithSumAssured.value = newPackages;
  
  scheduleUpdate();
}

function updatePackageSelection(pkg, isChecked, event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  if (props.readOnly || isDependentRowReadOnly(pkg)) return;
  if (isPreSelected(pkg) && !isChecked) return;

  const index = packagesWithSumAssured.value.findIndex(p => p.packageUuid === pkg.packageUuid);
  if (index === -1) return;

  const newPackages = [...packagesWithSumAssured.value];
  
  if (isChecked) {
    newPackages[index] = {
      ...newPackages[index],
      isSelected: true,
      selectedAt: Date.now(),
      planType: newPackages[index].planType || 'Individual_Plan'
    };
    // Auto-expand when selected
    expandedPackages.value.add(pkg.packageUuid);
  } else {
    newPackages[index] = {
      ...newPackages[index],
      isSelected: false,
      selectedAt: null
    };
    // Remove from expanded when unselected
    expandedPackages.value.delete(pkg.packageUuid);
  }
  
  packagesWithSumAssured.value = newPackages;
  scheduleUpdate();
}

// Batch updates for range inputs
let rangeUpdateTimer = null;
function handleRangeUpdate(pkg, field, value) {
  if (rangeUpdateTimer) clearTimeout(rangeUpdateTimer);
  
  const index = packagesWithSumAssured.value.findIndex(p => p.packageUuid === pkg.packageUuid);
  if (index === -1) return;
  
  const newPackages = [...packagesWithSumAssured.value];
  newPackages[index][field] = Number(value) || 0;
  packagesWithSumAssured.value = newPackages;
  
  rangeUpdateTimer = setTimeout(() => {
    scheduleUpdate();
    rangeUpdateTimer = null;
  }, 300);
}

// Simplified update functions
const updateSumAssured = (pkg, value) => !isDependentSumAssuredLocked(pkg) && updatePackageField(pkg, 'sumAssured', Number(value) || 0);
const updateUsed = (pkg, value) => updatePackageField(pkg, 'used', Number(value) || 0);
const updateDepSumAssured = (pkg, value) => updatePackageField(pkg, 'depSumAssured', Number(value) || 0);
const updateDepUsedBenefit = (pkg, value) => updatePackageField(pkg, 'depUsedBenefit', Number(value) || 0);
const updateStatus = (pkg, value) => updatePackageField(pkg, 'status', value);
const updatePlanType = (pkg, value) => updatePackageField(pkg, 'planType', value);
const updateCupEnabled = (pkg, value) => updatePackageField(pkg, 'cupEnabled', !!value);
const updateCupPackageUuid = (pkg, value) => updatePackageField(pkg, 'cupPackageUuid', value || null);
const updateDepCupEnabled = (pkg, value) => updatePackageField(pkg, 'depCupEnabled', !!value);
const updateDepCupPackageUuid = (pkg, value) => updatePackageField(pkg, 'depCupPackageUuid', value || null);

function updateExcessAllowed(pkg, value, event) {
  event?.stopPropagation();
  const index = packagesWithSumAssured.value.findIndex(p => p.packageUuid === pkg.packageUuid);
  if (index === -1) return;
  
  const newPackages = [...packagesWithSumAssured.value];
  newPackages[index].excessAllowed = !!value;
  if (!value) {
    newPackages[index].excessUnlimited = false;
    newPackages[index].allowedAmount = 0;
    newPackages[index].excessPercentage = 0;
  } else {
    newPackages[index].excessUnlimited = true;
    newPackages[index].allowedAmount = 0;
    newPackages[index].excessPercentage = 0;
  }
  packagesWithSumAssured.value = newPackages;
  scheduleUpdate();
}

function updateExcessUnlimited(pkg, value, event) {
  event?.stopPropagation();
  const index = packagesWithSumAssured.value.findIndex(p => p.packageUuid === pkg.packageUuid);
  if (index === -1) return;
  
  const newPackages = [...packagesWithSumAssured.value];
  newPackages[index].excessUnlimited = !!value;
  if (value) {
    newPackages[index].allowedAmount = 0;
    newPackages[index].excessPercentage = 0;
  } else {
    if (newPackages[index].excessType === 'amount') {
      newPackages[index].allowedAmount = Math.max(1, Number(newPackages[index].allowedAmount) || 1);
      newPackages[index].excessPercentage = 0;
    } else {
      newPackages[index].excessPercentage = Math.max(1, Number(newPackages[index].excessPercentage) || 1);
      newPackages[index].allowedAmount = 0;
    }
  }
  packagesWithSumAssured.value = newPackages;
  scheduleUpdate();
}

function updateExcessType(pkg, value, event) {
  event?.stopPropagation();
  const index = packagesWithSumAssured.value.findIndex(p => p.packageUuid === pkg.packageUuid);
  if (index === -1) return;
  
  const newPackages = [...packagesWithSumAssured.value];
  newPackages[index].excessType = value;
  if (!newPackages[index].excessUnlimited) {
    if (value === 'amount') {
      newPackages[index].excessPercentage = 0;
      newPackages[index].allowedAmount = Math.max(1, Number(newPackages[index].allowedAmount) || 1);
    } else {
      newPackages[index].allowedAmount = 0;
      newPackages[index].excessPercentage = Math.max(1, Number(newPackages[index].excessPercentage) || 1);
    }
  }
  packagesWithSumAssured.value = newPackages;
  scheduleUpdate();
}

const updateAllowedAmount = (pkg, value) => handleRangeUpdate(pkg, 'allowedAmount', value);
const updateExcessPercentage = (pkg, value) => handleRangeUpdate(pkg, 'excessPercentage', value);

function updateDepExcessAllowed(pkg, value, event) {
  event?.stopPropagation();
  const index = packagesWithSumAssured.value.findIndex(p => p.packageUuid === pkg.packageUuid);
  if (index === -1) return;
  
  const newPackages = [...packagesWithSumAssured.value];
  newPackages[index].depExcessAllowed = !!value;
  if (!value) {
    newPackages[index].depExcessUnlimited = false;
    newPackages[index].depAllowedAmount = 0;
    newPackages[index].depExcessPercentage = 0;
  } else {
    newPackages[index].depExcessUnlimited = true;
    newPackages[index].depAllowedAmount = 0;
    newPackages[index].depExcessPercentage = 0;
  }
  packagesWithSumAssured.value = newPackages;
  scheduleUpdate();
}

function updateDepExcessUnlimited(pkg, value, event) {
  event?.stopPropagation();
  const index = packagesWithSumAssured.value.findIndex(p => p.packageUuid === pkg.packageUuid);
  if (index === -1) return;
  
  const newPackages = [...packagesWithSumAssured.value];
  newPackages[index].depExcessUnlimited = !!value;
  if (value) {
    newPackages[index].depAllowedAmount = 0;
    newPackages[index].depExcessPercentage = 0;
  } else {
    if (newPackages[index].depExcessType === 'amount') {
      newPackages[index].depAllowedAmount = Math.max(1, Number(newPackages[index].depAllowedAmount) || 1);
      newPackages[index].depExcessPercentage = 0;
    } else {
      newPackages[index].depExcessPercentage = Math.max(1, Number(newPackages[index].depExcessPercentage) || 1);
      newPackages[index].depAllowedAmount = 0;
    }
  }
  packagesWithSumAssured.value = newPackages;
  scheduleUpdate();
}

function updateDepExcessType(pkg, value, event) {
  event?.stopPropagation();
  const index = packagesWithSumAssured.value.findIndex(p => p.packageUuid === pkg.packageUuid);
  if (index === -1) return;
  
  const newPackages = [...packagesWithSumAssured.value];
  newPackages[index].depExcessType = value;
  if (!newPackages[index].depExcessUnlimited) {
    if (value === 'amount') {
      newPackages[index].depExcessPercentage = 0;
      newPackages[index].depAllowedAmount = Math.max(1, Number(newPackages[index].depAllowedAmount) || 1);
    } else {
      newPackages[index].depAllowedAmount = 0;
      newPackages[index].depExcessPercentage = Math.max(1, Number(newPackages[index].depExcessPercentage) || 1);
    }
  }
  packagesWithSumAssured.value = newPackages;
  scheduleUpdate();
}

const updateDepAllowedAmount = (pkg, value) => handleRangeUpdate(pkg, 'depAllowedAmount', value);
const updateDepExcessPercentage = (pkg, value) => handleRangeUpdate(pkg, 'depExcessPercentage', value);

// Cleanup
onUnmounted(() => {
  if (updateTimeout) clearTimeout(updateTimeout);
  if (rangeUpdateTimer) clearTimeout(rangeUpdateTimer);
  planTypeCache.clear();
  sumAssuredCache.clear();
});

// Fetch data
async function fetchData() {
  if (loading.value) return;
  
  try {
    loading.value = true;
    initialized.value = false;
    
    const insuredUuid = props.insuredPersonUuid || route.params.insuredPersonUuid;

    const tasks = [getPackages()];
    const canLoadDropdown = !!insuredUuid;
    if (canLoadDropdown) {
      if (props.dependantUuid) {
        tasks.push(getPackageDropdown(insuredUuid));
        tasks.push(getPackageDropdown(insuredUuid, props.dependantUuid));
      } else {
        tasks.push(getPackageDropdown(insuredUuid, props.dependantUuid));
      }
    }

    const results = await Promise.allSettled(tasks);
    
    const allPkgsResponse = results[0].status === 'fulfilled' ? results[0].value : { data: [] };
    const insuredDropdownPkgsResponse =
      canLoadDropdown && props.dependantUuid && results[1]?.status === 'fulfilled' ? results[1].value : null;
    const dropdownPkgsResponse =
      canLoadDropdown
        ? (props.dependantUuid
            ? (results[2]?.status === 'fulfilled' ? results[2].value : { data: [] })
            : (results[1]?.status === 'fulfilled' ? results[1].value : { data: [] }))
        : { data: [] };
    
    planTypeCache.clear();
    sumAssuredCache.clear();
    
    const preSelected = Array.isArray(dropdownPkgsResponse?.data) ? dropdownPkgsResponse.data : [];
    const insuredEligible = Array.isArray(insuredDropdownPkgsResponse?.data) ? insuredDropdownPkgsResponse.data : [];
    insuredEligiblePackages.value = insuredEligible;
    
    // Start collapsed by default (even if pre-selected/active)
    expandedPackages.value = new Set();

    const preSelectedMap = new Map(
      preSelected.map(p => [p.packageUuid, p])
    );

    const allPkgs = Array.isArray(allPkgsResponse?.data) ? allPkgsResponse.data : [];
    const combined = allPkgs.map(pkg => {
      const selectedPkg = preSelected.find(p => p.packageUuid === pkg.packageUuid);
      return buildPackageObject(pkg, selectedPkg);
    });

    packagesWithSumAssured.value = combined;
    
    await nextTick();
    emit('update:modelValue', packagesWithSumAssured.value);
    
  } catch (error) {
    console.error('Error fetching packages:', error);
    packagesWithSumAssured.value = [];
  } finally {
    loading.value = false;
    initialized.value = true;
  }
}

function buildPackageObject(pkg, selectedPkg) {
  const insuredPkgPlanType = props.dependantUuid
    ? getInsuredPackagePlanTypeByPackageUuid(pkg.packageUuid)
    : null;

  const selectedPlanType = normalizePlanType(selectedPkg?.planType);
  const defaultPlanType = props.dependantUuid
    ? (insuredPkgPlanType === 'Family_Shared_Plan' ? 'Family_Shared_Plan' : 
       insuredPkgPlanType === 'Dependent_Shared_Plan' ? 'Dependent_Shared_Plan' :
       insuredPkgPlanType === 'Dual_Premium_dependent_Shared_Plan' ? 'Dual_Premium_dependent_Shared_Plan' : 'Individual_Plan')
    : 'Individual_Plan';

  const insuredSumAssured = props.dependantUuid ? getInsuredPackageSumAssuredByPackageUuid(pkg.packageUuid) : null;
  const shouldLockSumAssured = props.dependantUuid && 
    (isFamilySharedPlan(insuredPkgPlanType) || isDependentSharedPlan(insuredPkgPlanType));

  return {
    quotationUuid: selectedPkg?.quotationUuid || null,
    packageUuid: pkg.packageUuid,
    packageName: pkg.packageName,
    packageCode: pkg.packageCode,
    isSelected: !!selectedPkg,
    sumAssured: shouldLockSumAssured ? (insuredSumAssured ?? 0) : (Number(selectedPkg?.sumAssured) || 0),
    used: Number(selectedPkg?.used) || 0,
    initialUsed: Number(selectedPkg?.used) || 0,
    depSumAssured: Number(selectedPkg?.depSumAssured ?? selectedPkg?.dependentSumAssured ?? selectedPkg?.depSumAssured) || 0,
    depUsedBenefit: Number(selectedPkg?.depUsedBenefit ?? selectedPkg?.dependentUsed ?? selectedPkg?.depUsed) || 0,
    initialDepUsedBenefit: Number(selectedPkg?.depUsedBenefit ?? selectedPkg?.dependentUsed ?? selectedPkg?.depUsed) || 0,
    status: selectedPkg?.status || 'ACTIVE',
    planType: selectedPlanType || defaultPlanType,
    cupEnabled: !!selectedPkg?.cupPackageUuid,
    cupPackageUuid: selectedPkg?.cupPackageUuid || null,
    depCupEnabled: !!selectedPkg?.depCupPackageUuid,
    depCupPackageUuid: selectedPkg?.depCupPackageUuid || null,
    excessAllowed: !!(selectedPkg?.excessAllowed === true || selectedPkg?.excessAllowed === 1),
    excessType: Number(selectedPkg?.excessPercentage) > 0 ? 'percentage' : 'amount',
    excessUnlimited: !!(selectedPkg?.excessAllowed && !selectedPkg?.allowedAmount && !selectedPkg?.excessPercentage),
    allowedAmount: Number(selectedPkg?.allowedAmount) || 0,
    excessPercentage: Number(selectedPkg?.excessPercentage) || 0,
    depExcessAllowed: !!(selectedPkg?.depExcessAllowed === true || selectedPkg?.depExcessAllowed === 1),
    depExcessType: Number(selectedPkg?.depExcessPercentage) > 0 ? 'percentage' : 'amount',
    depExcessUnlimited: !!(selectedPkg?.depExcessAllowed && !selectedPkg?.depExcessAmount && !selectedPkg?.depExcessPercentage),
    depAllowedAmount: Number(selectedPkg?.depExcessAmount) || 0,
    depExcessPercentage: Number(selectedPkg?.depExcessPercentage) || 0,
    shareUsed: Number(selectedPkg?.shareUsed ?? selectedPkg?.used) || 0,
    showShareUsed: false,
    selectedAt: selectedPkg ? Date.now() : null
  };
}

// Watch with debounce
watch(() => props.modelValue, (newVal) => {
  if (initialized.value && JSON.stringify(newVal) !== JSON.stringify(packagesWithSumAssured.value)) {
    packagesWithSumAssured.value = newVal || [];
  }
}, { deep: false });

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <label v-if="label" class="block text-sm font-semibold text-gray-800">
      {{ label }}
    </label>
    
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="w-8 h-8 rounded-full border-4 border-blue-200 animate-spin border-t-blue-600"></div>
    </div>
    
    <!-- Content -->
    <div
      v-else
      class="flex flex-col gap-4"
      :class="props.internalScroll ? 'overflow-x-auto overflow-y-auto custom-scrollbar max-h-[60vh]' : ''"
    >
      <!-- Pinned Packages (Pre-selected) - Always show header, details on expand -->
      <div
        v-for="pkg in pinnedPackages"
        :key="pkg.packageUuid"
        class="rounded-xl border border-gray-200 shadow-sm backdrop-blur-md transition-all bg-white/80 hover:shadow-md"
        :class="expandedPackages.has(pkg.packageUuid) ? 'p-4' : 'p-3'"
      >
        <!-- Package header - always visible and clickable -->
        <div 
          class="flex justify-between items-center cursor-pointer select-none"
          @click="toggleExpand(pkg.packageUuid, $event)"
        >
          <div class="flex flex-1 items-center min-w-0">
            <input
              :id="`package-${pkg.packageUuid}`"
              type="checkbox"
              :checked="pkg.isSelected"
              @change="updatePackageSelection(pkg, $event.target.checked, $event)"
              @click.stop
              :disabled="props.readOnly || isDependentRowReadOnly(pkg) || isPreSelected(pkg)"
              class="w-5 h-5 text-blue-600 rounded border-gray-300 transition-all focus:ring-blue-500 shrink-0"
            />
            <label
              :for="`package-${pkg.packageUuid}`"
              class="ml-3 text-sm font-medium text-gray-800 truncate"
              @click.stop
            >
              {{ pkg.packageName }}
              <span class="text-gray-500">({{ pkg.packageCode }})</span>
            </label>
          </div>
          
          <div class="flex gap-3 items-center ml-2 shrink-0">
            <!-- Status badge - only show when expanded or always? Let's show always for pinned -->
            <span
              v-if="showStatus && pkg.isSelected"
              class="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full"
              :class="{
                'bg-green-100 text-green-800': pkg.status === 'ACTIVE',
                'bg-red-100 text-red-800': pkg.status === 'INACTIVE',
                'bg-yellow-100 text-yellow-800': pkg.status === 'PENDING'
              }"
            >
              {{ statusOptions.find(opt => opt.value === pkg.status)?.label }}
            </span>
            
            <!-- Expand/collapse icon -->
            <svg 
              class="w-5 h-5 text-gray-500 transition-transform duration-200"
              :class="{ 'rotate-180': expandedPackages.has(pkg.packageUuid) }"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        <!-- Details - only when expanded -->
        <div v-if="expandedPackages.has(pkg.packageUuid) && pkg.isSelected" class="pt-4 mt-4 border-t border-gray-200">
          <!-- Summary line for quick info when expanded -->
          <div class="grid grid-cols-1 gap-3 mb-4 md:grid-cols-4">
            <div v-if="showSumAssured" class="text-sm">
              <span class="text-gray-600">Sum Assured:</span>
              <span class="ml-2 font-semibold">ETB {{ Number(pkg.sumAssured).toLocaleString() }}</span>
            </div>
            <div v-if="showUsed" class="text-sm">
              <span class="text-gray-600">Used:</span>
              <span class="ml-2 font-semibold">ETB {{ Number(pkg.used).toLocaleString() }}</span>
            </div>
            <div v-if="showPlanType" class="text-sm">
              <span class="text-gray-600">Plan Type:</span>
              <span class="ml-2 font-semibold">{{ 
                insuredPlanTypeOptions.find(opt => opt.value === pkg.planType)?.label || 
                dependentExtraPlanTypeOptions.find(opt => opt.value === pkg.planType)?.label || 
                pkg.planType 
              }}</span>
            </div>
          </div>

          <div v-if="shouldShowDepSharedFields(pkg)" class="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
            <div class="space-y-1">
              <label class="block text-xs font-medium text-gray-600">Dep Sum Assured</label>
              <div class="relative">
                <span class="absolute top-2 left-3 text-sm text-gray-500">ETB</span>
                <input
                  type="number"
                  :value="pkg.depSumAssured"
                  @input="updateDepSumAssured(pkg, $event.target.value)"
                  :disabled="props.readOnly"
                  class="py-2 pr-3 pl-12 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            <div class="space-y-1">
              <label class="block text-xs font-medium text-gray-600">Dep Used Benefit</label>
              <div class="relative">
                <span class="absolute top-2 left-3 text-sm text-gray-500">ETB</span>
                <input
                  type="number"
                  :value="pkg.depUsedBenefit"
                  @input="updateDepUsedBenefit(pkg, $event.target.value)"
                  :disabled="isDepUsedBenefitDisabled(pkg)"
                  class="py-2 pr-3 pl-12 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div v-if="shouldShowDepSumAssuredOnly(pkg)" class="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
            <div class="space-y-1">
              <label class="block text-xs font-medium text-gray-600">Dep Sum Assured</label>
              <div class="relative">
                <span class="absolute top-2 left-3 text-sm text-gray-500">ETB</span>
                <input
                  type="number"
                  :value="pkg.depSumAssured"
                  @input="updateDepSumAssured(pkg, $event.target.value)"
                  :disabled="props.readOnly"
                  class="py-2 pr-3 pl-12 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <!-- Full details grid -->
          <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
            <!-- Sum Assured -->
            <div v-if="showSumAssured" class="space-y-1">
              <label class="block text-xs font-medium text-gray-600">Sum Assured</label>
              <div class="relative">
                <span class="absolute top-2 left-3 text-sm text-gray-500">ETB</span>
                <input
                  type="number"
                  :value="displayedSumAssured(pkg)"
                  @input="shouldUseDependentMainFields(pkg) ? updateDepSumAssured(pkg, $event.target.value) : updateSumAssured(pkg, $event.target.value)"
                  :disabled="props.readOnly || isDependentSumAssuredLocked(pkg)"
                  class="py-2 pr-3 pl-12 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            <!-- Used -->
            <div v-if="showUsed" class="space-y-1">
              <label class="block text-xs font-medium text-gray-600">Used</label>
              <div class="relative">
                <span class="absolute top-2 left-3 text-sm text-gray-500">ETB</span>
                <input
                  type="number"
                  :value="displayedUsed(pkg)"
                  @input="shouldUseDependentMainFields(pkg) ? updateDepUsedBenefit(pkg, $event.target.value) : updateUsed(pkg, $event.target.value)"
                  :disabled="isUsedDisabled(pkg)"
                  class="py-2 pr-3 pl-12 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            <!-- Status Select -->
            <div v-if="showStatus" class="space-y-1">
              <label class="block text-xs font-medium text-gray-600">Status</label>
              <select
                :value="pkg.status"
                @change="updateStatus(pkg, $event.target.value)"
                :disabled="isDependentRowReadOnly(pkg)"
                class="px-3 py-2 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <!-- Plan Type -->
            <div v-if="showPlanType" class="space-y-1">
              <label class="block text-xs font-medium text-gray-600">Plan Type</label>
              <select
                :value="pkg.planType"
                @change="updatePlanType(pkg, $event.target.value)"
                :disabled="isDependentRowReadOnly(pkg)"
                class="px-3 py-2 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option v-for="opt in optionsForPackage(pkg)" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </div>

          <!-- Capped Package Section -->
          <div v-if="!props.dependantUuid" class="mt-4">
            <div class="flex justify-between items-center p-3 rounded-xl border border-gray-200 bg-gray-50/60">
              <div>
                <div class="text-xs font-semibold text-gray-700">Capped Package</div>
                <div class="text-xs text-gray-500">Cap this package with another selected package</div>
              </div>
              <label class="inline-flex relative items-center cursor-pointer">
                <input
                  type="checkbox"
                  class="sr-only peer"
                  :checked="pkg.cupEnabled"
                  @change="updateCupEnabled(pkg, $event.target.checked)"
                  @click.stop
                  :disabled="props.readOnly"
                />
                <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5"></div>
              </label>
            </div>

            <div v-if="pkg.cupEnabled" class="mt-2">
              <select
                :value="pkg.cupPackageUuid"
                @change="updateCupPackageUuid(pkg, $event.target.value)"
                @click.stop
                :disabled="props.readOnly"
                class="px-3 py-2 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select package</option>
                <option
                  v-for="opt in getCupPackageOptions(pkg)"
                  :key="opt.packageUuid"
                  :value="opt.packageUuid"
                >
                  {{ opt.packageName }}
                </option>
              </select>
            </div>
          </div>

          <!-- Excess Amount Section -->
          <div v-if="showExcessAmount && !props.dependantUuid" class="mt-4">
            <div class="flex justify-between items-center p-3 rounded-xl border border-gray-200 bg-gray-50/60">
              <div>
                <div class="text-xs font-semibold text-gray-700">Excess Amount</div>
                <div class="text-xs text-gray-500">Allow excess for this package</div>
              </div>
              <label class="inline-flex relative items-center cursor-pointer">
                <input
                  type="checkbox"
                  class="sr-only peer"
                  :checked="pkg.excessAllowed"
                  @change="updateExcessAllowed(pkg, $event.target.checked, $event)"
                  @click.stop
                  :disabled="props.readOnly"
                />
                <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5"></div>
              </label>
            </div>

            <div v-if="pkg.excessAllowed" class="mt-3 space-y-3">
              <div class="flex gap-2">
                <button
                  type="button"
                  @click="updateExcessUnlimited(pkg, true, $event)"
                  @click.stop
                  :disabled="props.readOnly"
                  class="flex-1 px-3 py-2 text-xs font-semibold rounded-md transition-colors"
                  :class="pkg.excessUnlimited ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'"
                >
                  Unlimited
                </button>
                <button
                  type="button"
                  @click="updateExcessUnlimited(pkg, false, $event)"
                  @click.stop
                  :disabled="props.readOnly"
                  class="flex-1 px-3 py-2 text-xs font-semibold rounded-md transition-colors"
                  :class="!pkg.excessUnlimited ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'"
                >
                  Limited
                </button>
              </div>

              <div v-if="!pkg.excessUnlimited" class="flex gap-2">
                <button
                  type="button"
                  @click="updateExcessType(pkg, 'amount', $event)"
                  @click.stop
                  :disabled="props.readOnly"
                  class="flex-1 px-3 py-2 text-xs font-semibold rounded-md transition-colors"
                  :class="pkg.excessType === 'amount' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'"
                >
                  Amount
                </button>
                <button
                  type="button"
                  @click="updateExcessType(pkg, 'percentage', $event)"
                  @click.stop
                  :disabled="props.readOnly"
                  class="flex-1 px-3 py-2 text-xs font-semibold rounded-md transition-colors"
                  :class="pkg.excessType === 'percentage' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'"
                >
                  Percentage
                </button>
              </div>

              <div v-if="!pkg.excessUnlimited">
                <div v-if="pkg.excessType === 'amount'" class="relative">
                  <span class="absolute top-2 left-3 text-sm text-gray-500">ETB</span>
                  <input
                    type="number"
                    :value="pkg.allowedAmount"
                    @input="updateAllowedAmount(pkg, $event.target.value)"
                    @click.stop
                    :disabled="props.readOnly"
                    class="py-2 pr-3 pl-12 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    placeholder="Enter amount"
                  />
                </div>
                <div v-else class="flex gap-3 items-center">
                  <input
                    type="range"
                    :value="pkg.excessPercentage"
                    @input="updateExcessPercentage(pkg, $event.target.value)"
                    @click.stop
                    :disabled="props.readOnly"
                    class="flex-1 accent-blue-600"
                    min="1"
                    max="100"
                  />
                  <div class="relative w-20">
                    <input
                      type="number"
                      :value="pkg.excessPercentage"
                      @input="updateExcessPercentage(pkg, $event.target.value)"
                      @click.stop
                      :disabled="props.readOnly"
                      class="py-1 pr-6 pl-2 w-full text-xs font-semibold text-center bg-white rounded-lg border border-gray-200"
                      min="1"
                      max="100"
                    />
                    <span class="absolute top-1 right-2 text-xs text-gray-500">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Selectable Packages Grid -->
      <div v-if="selectablePackages.length" class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="pkg in selectablePackages"
          :key="pkg.packageUuid"
          class="rounded-xl border border-gray-200 shadow-sm transition-all bg-white/80 hover:shadow-md"
          :class="expandedPackages.has(pkg.packageUuid) ? 'p-4 md:col-span-3' : 'p-3'"
        >
          <!-- Package header - always visible and clickable when selected -->
          <div 
            class="flex justify-between items-center cursor-pointer select-none"
            @click="pkg.isSelected && toggleExpand(pkg.packageUuid, $event)"
          >
            <div class="flex flex-1 items-center min-w-0">
              <input
                :id="`package-${pkg.packageUuid}`"
                type="checkbox"
                :checked="pkg.isSelected"
                @change="updatePackageSelection(pkg, $event.target.checked, $event)"
                @click.stop
                :disabled="props.readOnly || isDependentRowReadOnly(pkg) || isPreSelected(pkg)"
                class="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 shrink-0"
              />
              <label
                :for="`package-${pkg.packageUuid}`"
                class="ml-3 text-sm font-medium text-gray-800 truncate cursor-pointer"
                @click.stop
              >
                {{ pkg.packageName }}
                <span class="text-gray-500">({{ pkg.packageCode }})</span>
              </label>
            </div>

            <div class="flex gap-2 items-center ml-2 shrink-0">
              <!-- Status badge for selected packages -->
              <span
                v-if="showStatus && pkg.isSelected"
                class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full"
                :class="{
                  'bg-green-100 text-green-800': pkg.status === 'ACTIVE',
                  'bg-red-100 text-red-800': pkg.status === 'INACTIVE',
                  'bg-yellow-100 text-yellow-800': pkg.status === 'PENDING'
                }"
              >
                {{ statusOptions.find(opt => opt.value === pkg.status)?.label }}
              </span>
              
              <!-- Expand/collapse icon - only show when selected -->
              <button
                v-if="pkg.isSelected"
                type="button"
                @click.stop="toggleExpand(pkg.packageUuid, $event)"
                class="p-1 rounded-full transition-colors hover:bg-gray-100"
              >
                <svg 
                  class="w-5 h-5 text-gray-500 transition-transform duration-200"
                  :class="{ 'rotate-180': expandedPackages.has(pkg.packageUuid) }"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Quick summary when selected but not expanded -->
          <div v-if="pkg.isSelected && !expandedPackages.has(pkg.packageUuid)" class="mt-2 text-xs text-gray-500">
            <span v-if="showSumAssured">Sum: ETB {{ Number(displayedSumAssured(pkg)).toLocaleString() }}</span>
            <span v-if="showUsed" class="ml-3">Used: ETB {{ Number(displayedUsed(pkg)).toLocaleString() }}</span>
          </div>

          <!-- Details (only when selected and expanded) -->
          <div v-if="pkg.isSelected && expandedPackages.has(pkg.packageUuid)" class="pt-4 mt-4 border-t border-gray-200">
            <div v-if="shouldShowDepSharedFields(pkg)" class="grid grid-cols-1 gap-4 mt-2 md:grid-cols-2">
              <div class="space-y-1">
                <label class="block text-xs font-medium text-gray-600">Dep Sum Assured</label>
                <div class="relative">
                  <span class="absolute top-2 left-3 text-sm text-gray-500">ETB</span>
                  <input
                    type="number"
                    :value="pkg.depSumAssured"
                    @input="updateDepSumAssured(pkg, $event.target.value)"
                    @click.stop
                    :disabled="props.readOnly"
                    class="py-2 pr-3 pl-12 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>

              <div class="space-y-1">
                <label class="block text-xs font-medium text-gray-600">Dep Used Benefit</label>
                <div class="relative">
                  <span class="absolute top-2 left-3 text-sm text-gray-500">ETB</span>
                  <input
                    type="number"
                    :value="pkg.depUsedBenefit"
                    @input="updateDepUsedBenefit(pkg, $event.target.value)"
                    @click.stop
                    :disabled="isDepUsedBenefitDisabled(pkg)"
                    class="py-2 pr-3 pl-12 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div v-if="shouldShowDepSumAssuredOnly(pkg)" class="grid grid-cols-1 gap-4 mt-2 md:grid-cols-2">
              <div class="space-y-1">
                <label class="block text-xs font-medium text-gray-600">Dep Sum Assured</label>
                <div class="relative">
                  <span class="absolute top-2 left-3 text-sm text-gray-500">ETB</span>
                  <input
                    type="number"
                    :value="pkg.depSumAssured"
                    @input="updateDepSumAssured(pkg, $event.target.value)"
                    @click.stop
                    :disabled="props.readOnly"
                    class="py-2 pr-3 pl-12 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
              <!-- Sum Assured -->
              <div v-if="showSumAssured" class="space-y-1">
                <label class="block text-xs font-medium text-gray-600">Sum Assured</label>
                <div class="relative">
                  <span class="absolute top-2 left-3 text-sm text-gray-500">ETB</span>
                  <input
                    type="number"
                    :value="displayedSumAssured(pkg)"
                    @input="shouldUseDependentMainFields(pkg) ? updateDepSumAssured(pkg, $event.target.value) : updateSumAssured(pkg, $event.target.value)"
                    @click.stop
                    :disabled="props.readOnly || isDependentSumAssuredLocked(pkg)"
                    class="py-2 pr-3 pl-12 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    min="0"
                  />
                </div>
              </div>

              <!-- Used -->
              <div v-if="showUsed" class="space-y-1">
                <label class="block text-xs font-medium text-gray-600">Used</label>
                <div class="relative">
                  <span class="absolute top-2 left-3 text-sm text-gray-500">ETB</span>
                  <input
                    type="number"
                    :value="displayedUsed(pkg)"
                    @input="shouldUseDependentMainFields(pkg) ? updateDepUsedBenefit(pkg, $event.target.value) : updateUsed(pkg, $event.target.value)"
                    @click.stop
                    class="py-2 pr-3 pl-12 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    min="0"
                  />
                </div>
              </div>

              <!-- Status Select -->
              <div v-if="showStatus" class="space-y-1">
                <label class="block text-xs font-medium text-gray-600">Status</label>
                <select
                  :value="pkg.status"
                  @change="updateStatus(pkg, $event.target.value)"
                  @click.stop
                  :disabled="isDependentRowReadOnly(pkg)"
                  class="px-3 py-2 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>

              <!-- Plan Type -->
              <div v-if="showPlanType" class="space-y-1">
                <label class="block text-xs font-medium text-gray-600">Plan Type</label>
                <select
                  :value="pkg.planType"
                  @change="updatePlanType(pkg, $event.target.value)"
                  @click.stop
                  :disabled="isDependentRowReadOnly(pkg)"
                  class="px-3 py-2 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option v-for="opt in optionsForPackage(pkg)" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Capped Package Section (only for non-dependent) -->
            <div v-if="!props.dependantUuid && pkg.isSelected" class="mt-4">
              <div class="flex justify-between items-center p-3 rounded-xl border border-gray-200 bg-gray-50/60">
                <div>
                  <div class="text-xs font-semibold text-gray-700">Capped Package</div>
                  <div class="text-xs text-gray-500">Cap this package with another selected package</div>
                </div>
                <label class="inline-flex relative items-center cursor-pointer">
                  <input
                    type="checkbox"
                    class="sr-only peer"
                    :checked="pkg.cupEnabled"
                    @change="updateCupEnabled(pkg, $event.target.checked)"
                    @click.stop
                    :disabled="props.readOnly"
                  />
                  <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5"></div>
                </label>
              </div>

              <div v-if="pkg.cupEnabled" class="mt-2">
                <select
                  :value="pkg.cupPackageUuid"
                  @change="updateCupPackageUuid(pkg, $event.target.value)"
                  @click.stop
                  :disabled="props.readOnly"
                  class="px-3 py-2 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select package</option>
                  <option
                    v-for="opt in getCupPackageOptions(pkg)"
                    :key="opt.packageUuid"
                    :value="opt.packageUuid"
                  >
                    {{ opt.packageName }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Excess Amount Section (only for non-dependent) -->
            <div v-if="showExcessAmount && !props.dependantUuid && pkg.isSelected" class="mt-4">
              <div class="flex justify-between items-center p-3 rounded-xl border border-gray-200 bg-gray-50/60">
                <div>
                  <div class="text-xs font-semibold text-gray-700">Excess Amount</div>
                  <div class="text-xs text-gray-500">Allow excess for this package</div>
                </div>
                <label class="inline-flex relative items-center cursor-pointer">
                  <input
                    type="checkbox"
                    class="sr-only peer"
                    :checked="pkg.excessAllowed"
                    @change="updateExcessAllowed(pkg, $event.target.checked, $event)"
                    @click.stop
                    :disabled="props.readOnly"
                  />
                  <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5"></div>
                </label>
              </div>

              <div v-if="pkg.excessAllowed" class="mt-3 space-y-3">
                <div class="flex gap-2">
                  <button
                    type="button"
                    @click="updateExcessUnlimited(pkg, true, $event)"
                    @click.stop
                    :disabled="props.readOnly"
                    class="flex-1 px-3 py-2 text-xs font-semibold rounded-md transition-colors"
                    :class="pkg.excessUnlimited ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'"
                  >
                    Unlimited
                  </button>
                  <button
                    type="button"
                    @click="updateExcessUnlimited(pkg, false, $event)"
                    @click.stop
                    :disabled="props.readOnly"
                    class="flex-1 px-3 py-2 text-xs font-semibold rounded-md transition-colors"
                    :class="!pkg.excessUnlimited ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'"
                  >
                    Limited
                  </button>
                </div>

                <div v-if="!pkg.excessUnlimited" class="flex gap-2">
                  <button
                    type="button"
                    @click="updateExcessType(pkg, 'amount', $event)"
                    @click.stop
                    :disabled="props.readOnly"
                    class="flex-1 px-3 py-2 text-xs font-semibold rounded-md transition-colors"
                    :class="pkg.excessType === 'amount' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'"
                  >
                    Amount
                  </button>
                  <button
                    type="button"
                    @click="updateExcessType(pkg, 'percentage', $event)"
                    @click.stop
                    :disabled="props.readOnly"
                    class="flex-1 px-3 py-2 text-xs font-semibold rounded-md transition-colors"
                    :class="pkg.excessType === 'percentage' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'"
                  >
                    Percentage
                  </button>
                </div>

                <div v-if="!pkg.excessUnlimited">
                  <div v-if="pkg.excessType === 'amount'" class="relative">
                    <span class="absolute top-2 left-3 text-sm text-gray-500">ETB</span>
                    <input
                      type="number"
                      :value="pkg.allowedAmount"
                      @input="updateAllowedAmount(pkg, $event.target.value)"
                      @click.stop
                      :disabled="props.readOnly"
                      class="py-2 pr-3 pl-12 w-full text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      placeholder="Enter amount"
                    />
                  </div>
                  <div v-else class="flex gap-3 items-center">
                    <input
                      type="range"
                      :value="pkg.excessPercentage"
                      @input="updateExcessPercentage(pkg, $event.target.value)"
                      @click.stop
                      :disabled="props.readOnly"
                      class="flex-1 accent-blue-600"
                      min="1"
                      max="100"
                    />
                    <div class="relative w-20">
                      <input
                        type="number"
                        :value="pkg.excessPercentage"
                        @input="updateExcessPercentage(pkg, $event.target.value)"
                        @click.stop
                        :disabled="props.readOnly"
                        class="py-1 pr-6 pl-2 w-full text-xs font-semibold text-center bg-white rounded-lg border border-gray-200"
                        min="1"
                        max="100"
                      />
                      <span class="absolute top-1 right-2 text-xs text-gray-500">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!packagesWithSumAssured?.length && !loading" class="py-8 text-center text-gray-500">
        No packages available
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #9ca3af #f3f4f6;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #9ca3af;
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* Reduce animations for low-end devices */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Ensure clickable areas work properly */
button, label, .cursor-pointer {
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
</style>