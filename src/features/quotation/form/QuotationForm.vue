<template>
  <div class="qb-wrap">
    <!-- Header -->
    <div class="qb-header">
      <div>
        <h3 class="qb-title">Benefit Configuration</h3>
        <p class="qb-subtitle">Configure plan types, descriptions, and coverages for each benefit group.</p>
      </div>
      <button v-if="!readOnlyRows && !inclusionMode" type="button" @click="addGroupRow" class="btn btn-primary">
        <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Add Benefit Group
      </button>
    </div>

    <!-- Groups -->
    <div class="qb-groups">
      <div v-for="(row, rowIndex) in groupRows" :key="row.id" class="qb-card">

        <!-- Card Header row: packages / actions -->
        <div class="qb-card-header">
          <div class="qb-field-group-header">
            <div class="qb-header-inputs">
              <!-- Packages multi-select dropdown -->
              <div
                class="qb-field package-dropdown-wrapper"
                :data-rowid="row.id"
                :style="{ zIndex: openDropdownRowId === row.id ? 50 : 1 }"
              >
                <label class="qb-label">
                  Benefits / Packages
                  <span v-if="row.selectedPackageUuuids.length === 1" class="qb-header-limit">
                    (Limit: {{ getRangeDisplayForPackage(row.selectedPackageUuuids[0]) }})
                  </span>
                </label>
                <button
                  type="button"
                  :ref="el => { if (el) pkgBtnRefs[row.id] = el }"
                  :disabled="readOnlyRows || inclusionMode"
                  @click="toggleDropdown(row.id)"
                  class="qb-pkg-btn"
                  :class="{ 'qb-pkg-btn--open': openDropdownRowId === row.id }"
                >
                  <span class="qb-pkg-btn__text">{{ getSelectedPackagesLabel(row.selectedPackageUuuids) }}</span>
                  <svg class="qb-pkg-btn__chevron" :class="{ rotated: openDropdownRowId === row.id }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                <!-- Teleported dropdown -->
                <Teleport to="body">
                  <div
                    v-if="openDropdownRowId === row.id"
                    class="qb-pkg-dropdown"
                    :style="getDropdownStyle(row.id)"
                  >
                    <div
                      v-for="pkg in allPackages"
                      :key="pkg.packageUuid"
                      class="qb-pkg-option"
                      :class="{ 'qb-pkg-option--checked': row.selectedPackageUuuids.includes(pkg.packageUuid) }"
                      @click="togglePackageInRow(row, pkg.packageUuid)"
                    >
                      <span class="qb-pkg-checkbox">
                        <svg v-if="row.selectedPackageUuuids.includes(pkg.packageUuid)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                        </svg>
                      </span>
                      <div>
                        <p class="qb-pkg-name">{{ pkg.packageName }}</p>
                        <p class="qb-pkg-cat">{{ pkg.packageCategory }} <span v-if="pkg.gender && pkg.gender !== 'BOTH'" class="qb-gender-badge">{{ pkg.gender }}</span></p>
                      </div>
                    </div>
                  </div>
                </Teleport>
              </div>

              <!-- Description -->
              <div class="qb-field">
                <label class="qb-label">Description</label>
                <select
                  v-model="row.description"
                  :disabled="readOnlyRows || !row.selectedPackageUuuids.length"
                  class="qb-select"
                  :class="{ 'qb-select--error': getDescriptionError(row) && (row.descriptionTouched || attemptedSubmit) }"
                  @change="() => { row.descriptionTouched = true; handleRowChange(row); }"
                >
                  <option value="" disabled>Select description</option>
                  <option
                    v-for="opt in getDescriptionOptionsForPackages(row.selectedPackageUuuids, getGroupPlanTypeForDescOptions(row))"
                    :key="opt.value"
                    :value="opt.value"
                  >{{ opt.label }}</option>
                </select>
                <div v-if="getDescriptionError(row) && (row.descriptionTouched || attemptedSubmit)" class="qb-error-hint">
                  {{ getDescriptionError(row) }}
                </div>
              </div>

              <!-- Number of Employees -->
              <div class="qb-field">
                <label class="qb-label">Number of Employees</label>
                <input
                  v-model="row.numberOfInsured"
                  type="number"
                  min="0"
                  :disabled="readOnlyRows || !row.description"
                  class="qb-input qb-input--center"
                  :class="{ 'qb-input--error': getEmployeesError(row) && (row.employeesTouched || attemptedSubmit) }"
                  placeholder="0"
                  @input="() => { row.employeesTouched = true; handleRowChange(row); }"
                />
                <div v-if="getEmployeesError(row) && (row.employeesTouched || attemptedSubmit)" class="qb-error-hint">
                  {{ getEmployeesError(row) }}
                </div>
              </div>
            </div>

            <!-- Row Actions -->
            <div class="qb-row-actions">
              <button
                v-if="!readOnlyRows && groupRows.length > 1"
                @click="removeGroupRow(rowIndex)"
                class="qb-action-btn qb-action-btn--danger"
                title="Remove Group"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
              <button
                v-if="!readOnlyRows && !inclusionMode"
                @click="duplicateGroupRow(row)"
                class="qb-action-btn qb-action-btn--primary"
                title="Duplicate Group"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"/>
                </svg>
              </button>
            </div>

          </div><!-- /.qb-field-group-header -->
        </div><!-- /.qb-card-header -->

        <!-- Package detail rows -->
        <div class="qb-pkg-list">
          <div v-if="row.selectedPackageUuuids.length === 0" class="qb-empty">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 12H4"/>
            </svg>
            <p>No packages selected. Use the dropdown above to add packages.</p>
          </div>

          <div
            v-for="pkgUuid in row.selectedPackageUuuids"
            :key="pkgUuid"
            class="qb-pkg-row"
          >
            <!-- Package name & Plan Type column -->
            <div class="qb-pkg-info-col">
              <div class="qb-pkg-info">
                <span class="qb-pkg-bar"></span>
                <div>
                  <p class="qb-pkg-row-name">{{ getPackageName(pkgUuid) }}</p>
                  <p v-if="row.selectedPackageUuuids.length >= 2" class="qb-pkg-row-hint">
                    Sum Insured Limit: {{ getRangeDisplayForPackage(pkgUuid) }}
                    <span v-if="getPackageGender(pkgUuid) !== 'BOTH'" class="qb-gender-badge">{{ getPackageGender(pkgUuid) }}</span>
                  </p>
                </div>
              </div>
              
              <!-- Plan Type Select -->
              <div class="qb-pkg-field qb-plan-type-field">
                <label class="qb-label">Plan Type</label>
                <select
                  v-model="row.packageConfigs[pkgUuid].planType"
                  :disabled="readOnlyRows || inclusionMode"
                  class="qb-select"
                  :class="{ 'qb-select--error': getPlanTypeError(row, pkgUuid) && (row.packageConfigs[pkgUuid].planTypeTouched || attemptedSubmit) }"
                  @change="() => { 
                    row.packageConfigs[pkgUuid].planTypeTouched = true;
                    handlePackagePlanTypeChange(row, pkgUuid); 
                  }"
                >
                  <option value="" disabled>Select plan type</option>
                  <option
                    v-for="opt in getPlanOptionsForPackages([pkgUuid])"
                    :key="opt.value"
                    :value="opt.value"
                  >{{ opt.label }}</option>
                </select>
                <div v-if="getPlanTypeError(row, pkgUuid) && (row.packageConfigs[pkgUuid].planTypeTouched || attemptedSubmit)" class="qb-error-hint">
                  {{ getPlanTypeError(row, pkgUuid) }}
                </div>
              </div>

              <!-- Gender-specific input (below Plan Type) -->
              <div v-if="getPackageGender(pkgUuid) !== 'BOTH'" class="qb-pkg-field">
                <label class="qb-label qb-label--colored">
                  {{ getPackageGender(pkgUuid) === 'FEMALE' ? 'Number of Adult Females' : 'Number of Adult Males' }}
                </label>
                <input
                  :value="getGenderCountForPackage(row, pkgUuid)"
                  @input="(e) => handleGenderCountInput(row, pkgUuid, e.target.value)"
                  type="number"
                  min="0"
                  :max="row.numberOfInsured"
                  :disabled="readOnlyRows || !row.description"
                  class="qb-input qb-input--center"
                  :class="{ 'qb-input--error': getGenderError(row, pkgUuid) && (getGenderTouchedForPackage(row, pkgUuid) || attemptedSubmit) }"
                  placeholder="0"
                />
                <p class="qb-input-hint">{{ getPackageGender(pkgUuid) === 'FEMALE' ? 'Female' : 'Male' }} employees covered</p>
                <div v-if="getGenderError(row, pkgUuid) && (getGenderTouchedForPackage(row, pkgUuid) || attemptedSubmit)" class="qb-error-hint">
                  {{ getGenderError(row, pkgUuid) }}
                </div>
              </div>
            </div>

            <!-- Cascade Coverage List Column -->
            <div class="qb-pkg-cascade-col">
              <!-- INDIVIDUAL PLAN -->
              <template v-if="isIndividualPlan(row.packageConfigs[pkgUuid].planType)">
                <!-- Employee Sum Assured Row -->
                <div class="qb-cascade-row" :class="{ 'qb-cascade-row--error': getSumAssuredError(row, pkgUuid, 'employee') && (row.packageConfigs[pkgUuid].sumAssuredTouched || attemptedSubmit) }">
                  <div class="qb-pkg-field">
                    <label class="qb-label qb-label--colored">Employee Sum Assured</label>
                    <input
                      v-model="row.packageConfigs[pkgUuid].sumAssured"
                      type="number" min="0"
                      :disabled="readOnlyRows || !row.numberOfInsured"
                      class="qb-input qb-input--right"
                      :class="{ 'qb-input--error': getSumAssuredError(row, pkgUuid, 'employee') && (row.packageConfigs[pkgUuid].sumAssuredTouched || attemptedSubmit) }"
                      placeholder="Enter amount"
                      @input="() => { 
                        row.packageConfigs[pkgUuid].sumAssuredTouched = true;
                        recalculateRowPackage(row, pkgUuid); 
                      }"
                    />
                    <p class="qb-input-hint">Limit: {{ getRangeDisplayForPackage(pkgUuid) }}</p>
                    <div v-if="getSumAssuredError(row, pkgUuid, 'employee') && (row.packageConfigs[pkgUuid].sumAssuredTouched || attemptedSubmit)" class="qb-error-hint qb-error-hint--inline">
                      {{ getSumAssuredError(row, pkgUuid, 'employee') }}
                    </div>
                  </div>
                  <div class="qb-pkg-field qb-meta-field">
                    <label class="qb-label">Rate</label>
                    <input
                      :value="formatRate(row.packageConfigs[pkgUuid].employeeRate)"
                      type="text" disabled
                      class="qb-input qb-input--right qb-input--muted"
                    />
                    <p class="qb-input-hint">Applied rate</p>
                  </div>
                  <div class="qb-pkg-field qb-meta-field">
                    <label class="qb-label">Premium</label>
                    <input
                      :value="formatCurrency(row.packageConfigs[pkgUuid].employeePremium)"
                      type="text" disabled
                      class="qb-input qb-input--right qb-input--premium"
                    />
                    <p class="qb-input-hint qb-input-hint--green">Calculated premium</p>
                  </div>
                </div>

                <!-- Dependent Sum Assured Row -->
                <div v-if="!isMemberOnly(row.description)" class="qb-cascade-row" :class="{ 'qb-cascade-row--error': getSumAssuredError(row, pkgUuid, 'dependent') && (row.packageConfigs[pkgUuid].depSumAssuredTouched || attemptedSubmit) }">
                  <div class="qb-pkg-field">
                    <label class="qb-label qb-label--colored">Dependent Sum Assured</label>
                    <input
                      v-model="row.packageConfigs[pkgUuid].depSumAssured"
                      type="number" min="0"
                      :disabled="readOnlyRows || !row.numberOfInsured"
                      class="qb-input qb-input--right"
                      :class="{ 'qb-input--error': getSumAssuredError(row, pkgUuid, 'dependent') && (row.packageConfigs[pkgUuid].depSumAssuredTouched || attemptedSubmit) }"
                      placeholder="Enter amount"
                      @input="() => { 
                        row.packageConfigs[pkgUuid].depSumAssuredTouched = true;
                        recalculateRowPackage(row, pkgUuid); 
                      }"
                    />
                    <p class="qb-input-hint">Limit: {{ getRangeDisplayForPackage(pkgUuid) }}</p>
                    <div v-if="getSumAssuredError(row, pkgUuid, 'dependent') && (row.packageConfigs[pkgUuid].depSumAssuredTouched || attemptedSubmit)" class="qb-error-hint qb-error-hint--inline">
                      {{ getSumAssuredError(row, pkgUuid, 'dependent') }}
                    </div>
                  </div>
                  <div class="qb-pkg-field qb-meta-field">
                    <label class="qb-label">Rate</label>
                    <input
                      :value="formatRate(row.packageConfigs[pkgUuid].dependentRate)"
                      type="text" disabled
                      class="qb-input qb-input--right qb-input--muted"
                    />
                    <p class="qb-input-hint">Applied rate</p>
                  </div>
                  <div class="qb-pkg-field qb-meta-field">
                    <label class="qb-label">Premium</label>
                    <input
                      :value="formatCurrency(row.packageConfigs[pkgUuid].dependentPremium)"
                      type="text" disabled
                      class="qb-input qb-input--right qb-input--premium"
                    />
                    <p class="qb-input-hint qb-input-hint--green">Calculated premium</p>
                  </div>
                </div>
              </template>

              <!-- DUAL PREMIUM DEPENDENT SHARED -->
              <template v-else-if="isDualPremiumPlan(row.packageConfigs[pkgUuid].planType)">
                <!-- Employee Sum Assured Row -->
                <div class="qb-cascade-row" :class="{ 'qb-cascade-row--error': getSumAssuredError(row, pkgUuid, 'employee') && (row.packageConfigs[pkgUuid].sumAssuredTouched || attemptedSubmit) }">
                  <div class="qb-pkg-field">
                    <label class="qb-label qb-label--colored">Employee Sum Assured</label>
                    <input
                      v-model="row.packageConfigs[pkgUuid].sumAssured"
                      type="number" min="0"
                      :disabled="readOnlyRows || !row.numberOfInsured"
                      class="qb-input qb-input--right"
                      :class="{ 'qb-input--error': getSumAssuredError(row, pkgUuid, 'employee') && (row.packageConfigs[pkgUuid].sumAssuredTouched || attemptedSubmit) }"
                      placeholder="Enter amount"
                      @input="() => { 
                        row.packageConfigs[pkgUuid].sumAssuredTouched = true;
                        recalculateRowPackage(row, pkgUuid); 
                      }"
                    />
                    <p class="qb-input-hint">Limit: {{ getRangeDisplayForPackage(pkgUuid) }}</p>
                    <div v-if="getSumAssuredError(row, pkgUuid, 'employee') && (row.packageConfigs[pkgUuid].sumAssuredTouched || attemptedSubmit)" class="qb-error-hint qb-error-hint--inline">
                      {{ getSumAssuredError(row, pkgUuid, 'employee') }}
                    </div>
                  </div>
                  <div class="qb-pkg-field qb-meta-field">
                    <label class="qb-label">Rate</label>
                    <input
                      :value="formatRate(row.packageConfigs[pkgUuid].employeeRate)"
                      type="text" disabled
                      class="qb-input qb-input--right qb-input--muted"
                    />
                    <p class="qb-input-hint">Applied rate</p>
                  </div>
                  <div class="qb-pkg-field qb-meta-field">
                    <label class="qb-label">Premium</label>
                    <input
                      :value="formatCurrency(row.packageConfigs[pkgUuid].employeePremium)"
                      type="text" disabled
                      class="qb-input qb-input--right qb-input--premium"
                    />
                    <p class="qb-input-hint qb-input-hint--green">Calculated premium</p>
                  </div>
                </div>

                <!-- Spouse Sum Assured Row -->
                <div class="qb-cascade-row" :class="{ 'qb-cascade-row--error': getSumAssuredError(row, pkgUuid, 'spouse') && (row.packageConfigs[pkgUuid].spouseSumAssuredTouched || attemptedSubmit) }">
                  <div class="qb-pkg-field">
                    <label class="qb-label qb-label--colored">Spouse Sum Assured</label>
                    <input
                      v-model="row.packageConfigs[pkgUuid].spouseSumAssured"
                      type="number" min="0"
                      :disabled="readOnlyRows || !row.numberOfInsured"
                      class="qb-input qb-input--right"
                      :class="{ 'qb-input--error': getSumAssuredError(row, pkgUuid, 'spouse') && (row.packageConfigs[pkgUuid].spouseSumAssuredTouched || attemptedSubmit) }"
                      placeholder="Enter amount"
                      @input="() => { 
                        row.packageConfigs[pkgUuid].spouseSumAssuredTouched = true;
                        recalculateRowPackage(row, pkgUuid); 
                      }"
                    />
                    <p class="qb-input-hint">Limit: {{ getRangeDisplayForPackage(pkgUuid) }}</p>
                    <div v-if="getSumAssuredError(row, pkgUuid, 'spouse') && (row.packageConfigs[pkgUuid].spouseSumAssuredTouched || attemptedSubmit)" class="qb-error-hint qb-error-hint--inline">
                      {{ getSumAssuredError(row, pkgUuid, 'spouse') }}
                    </div>
                  </div>
                  <div class="qb-pkg-field qb-meta-field">
                    <label class="qb-label">Rate</label>
                    <input
                      :value="formatRate(row.packageConfigs[pkgUuid].spouseRate)"
                      type="text" disabled
                      class="qb-input qb-input--right qb-input--muted"
                    />
                    <p class="qb-input-hint">Applied rate</p>
                  </div>
                  <div class="qb-pkg-field qb-meta-field">
                    <label class="qb-label">Premium</label>
                    <input
                      :value="formatCurrency(row.packageConfigs[pkgUuid].spousePremium)"
                      type="text" disabled
                      class="qb-input qb-input--right qb-input--premium"
                    />
                    <p class="qb-input-hint qb-input-hint--green">Calculated premium</p>
                  </div>
                </div>

                <!-- Dependent Sum Assured Row -->
                <div v-if="!isMemberPlusOne(row.description)" class="qb-cascade-row" :class="{ 'qb-cascade-row--error': getSumAssuredError(row, pkgUuid, 'dependent') && (row.packageConfigs[pkgUuid].depSumAssuredTouched || attemptedSubmit) }">
                  <div class="qb-pkg-field">
                    <label class="qb-label qb-label--colored">Dependent Sum Assured</label>
                    <input
                      v-model="row.packageConfigs[pkgUuid].depSumAssured"
                      type="number" min="0"
                      :disabled="readOnlyRows || !row.numberOfInsured"
                      class="qb-input qb-input--right"
                      :class="{ 'qb-input--error': getSumAssuredError(row, pkgUuid, 'dependent') && (row.packageConfigs[pkgUuid].depSumAssuredTouched || attemptedSubmit) }"
                      placeholder="Enter amount"
                      @input="() => { 
                        row.packageConfigs[pkgUuid].depSumAssuredTouched = true;
                        recalculateRowPackage(row, pkgUuid); 
                      }"
                    />
                    <p class="qb-input-hint">Limit: {{ getRangeDisplayForPackage(pkgUuid) }}</p>
                    <div v-if="getSumAssuredError(row, pkgUuid, 'dependent') && (row.packageConfigs[pkgUuid].depSumAssuredTouched || attemptedSubmit)" class="qb-error-hint qb-error-hint--inline">
                      {{ getSumAssuredError(row, pkgUuid, 'dependent') }}
                    </div>
                  </div>
                  <div class="qb-pkg-field qb-meta-field">
                    <label class="qb-label">Rate</label>
                    <input
                      :value="formatRate(row.packageConfigs[pkgUuid].dependentRate)"
                      type="text" disabled
                      class="qb-input qb-input--right qb-input--muted"
                    />
                    <p class="qb-input-hint">Applied rate</p>
                  </div>
                  <div class="qb-pkg-field qb-meta-field">
                    <label class="qb-label">Premium</label>
                    <input
                      :value="formatCurrency(row.packageConfigs[pkgUuid].dependentPremium)"
                      type="text" disabled
                      class="qb-input qb-input--right qb-input--premium"
                    />
                    <p class="qb-input-hint qb-input-hint--green">Calculated premium</p>
                  </div>
                </div>
              </template>

              <!-- DEPENDENT SHARED PLAN -->
              <template v-else-if="isDependentSharedPlan(row.packageConfigs[pkgUuid].planType)">
                <!-- Employee Sum Assured Row -->
                <div class="qb-cascade-row" :class="{ 'qb-cascade-row--error': getSumAssuredError(row, pkgUuid, 'employee') && (row.packageConfigs[pkgUuid].sumAssuredTouched || attemptedSubmit) }">
                  <div class="qb-pkg-field">
                    <label class="qb-label qb-label--colored">Employee Sum Assured</label>
                    <input
                      v-model="row.packageConfigs[pkgUuid].sumAssured"
                      type="number" min="0"
                      :disabled="readOnlyRows || !row.numberOfInsured"
                      class="qb-input qb-input--right"
                      :class="{ 'qb-input--error': getSumAssuredError(row, pkgUuid, 'employee') && (row.packageConfigs[pkgUuid].sumAssuredTouched || attemptedSubmit) }"
                      placeholder="Enter amount"
                      @input="() => { 
                        row.packageConfigs[pkgUuid].sumAssuredTouched = true;
                        recalculateRowPackage(row, pkgUuid); 
                      }"
                    />
                    <p class="qb-input-hint">Limit: {{ getRangeDisplayForPackage(pkgUuid) }}</p>
                    <div v-if="getSumAssuredError(row, pkgUuid, 'employee') && (row.packageConfigs[pkgUuid].sumAssuredTouched || attemptedSubmit)" class="qb-error-hint qb-error-hint--inline">
                      {{ getSumAssuredError(row, pkgUuid, 'employee') }}
                    </div>
                  </div>
                  <div class="qb-pkg-field qb-meta-field">
                    <label class="qb-label">Rate</label>
                    <input
                      :value="formatRate(row.packageConfigs[pkgUuid].employeeRate)"
                      type="text" disabled
                      class="qb-input qb-input--right qb-input--muted"
                    />
                    <p class="qb-input-hint">Applied rate</p>
                  </div>
                  <div class="qb-pkg-field qb-meta-field">
                    <label class="qb-label">Premium</label>
                    <input
                      :value="formatCurrency(row.packageConfigs[pkgUuid].employeePremium)"
                      type="text" disabled
                      class="qb-input qb-input--right qb-input--premium"
                    />
                    <p class="qb-input-hint qb-input-hint--green">Calculated premium</p>
                  </div>
                </div>

                <!-- Dependent Sum Assured Row -->
                <div class="qb-cascade-row" :class="{ 'qb-cascade-row--error': getSumAssuredError(row, pkgUuid, 'dependent') && (row.packageConfigs[pkgUuid].depSumAssuredTouched || attemptedSubmit) }">
                  <div class="qb-pkg-field">
                    <label class="qb-label qb-label--colored">Dependent Sum Assured</label>
                    <input
                      v-model="row.packageConfigs[pkgUuid].depSumAssured"
                      type="number" min="0"
                      :disabled="readOnlyRows || !row.numberOfInsured"
                      class="qb-input qb-input--right"
                      :class="{ 'qb-input--error': getSumAssuredError(row, pkgUuid, 'dependent') && (row.packageConfigs[pkgUuid].depSumAssuredTouched || attemptedSubmit) }"
                      placeholder="Enter amount"
                      @input="() => { 
                        row.packageConfigs[pkgUuid].depSumAssuredTouched = true;
                        recalculateRowPackage(row, pkgUuid); 
                      }"
                    />
                    <p class="qb-input-hint">Limit: {{ getRangeDisplayForPackage(pkgUuid) }}</p>
                    <div v-if="getSumAssuredError(row, pkgUuid, 'dependent') && (row.packageConfigs[pkgUuid].depSumAssuredTouched || attemptedSubmit)" class="qb-error-hint qb-error-hint--inline">
                      {{ getSumAssuredError(row, pkgUuid, 'dependent') }}
                    </div>
                  </div>
                  <div class="qb-pkg-field qb-meta-field">
                    <label class="qb-label">Rate</label>
                    <input
                      :value="formatRate(row.packageConfigs[pkgUuid].dependentRate)"
                      type="text" disabled
                      class="qb-input qb-input--right qb-input--muted"
                    />
                    <p class="qb-input-hint">Applied rate</p>
                  </div>
                  <div class="qb-pkg-field qb-meta-field">
                    <label class="qb-label">Premium</label>
                    <input
                      :value="formatCurrency(row.packageConfigs[pkgUuid].dependentPremium)"
                      type="text" disabled
                      class="qb-input qb-input--right qb-input--premium"
                    />
                    <p class="qb-input-hint qb-input-hint--green">Calculated premium</p>
                  </div>
                </div>
              </template>

              <!-- FAMILY SHARED OR OTHER -->
              <template v-else>
                <div class="qb-cascade-row" :class="{ 'qb-cascade-row--error': getCoverageError(row, pkgUuid) && (row.packageConfigs[pkgUuid].coverageTouched || attemptedSubmit) }">
                  <div class="qb-pkg-field">
                    <label class="qb-label qb-label--colored">Coverage Amount</label>
                    <input
                      v-model="row.packageConfigs[pkgUuid].coverage"
                      type="number" min="0"
                      :disabled="readOnlyRows || !row.numberOfInsured"
                      class="qb-input qb-input--right"
                      :class="{ 'qb-input--error': getCoverageError(row, pkgUuid) && (row.packageConfigs[pkgUuid].coverageTouched || attemptedSubmit) }"
                      placeholder="Enter amount"
                      @input="() => { 
                        row.packageConfigs[pkgUuid].coverageTouched = true;
                        recalculateRowPackage(row, pkgUuid); 
                      }"
                    />
                    <p class="qb-input-hint">Limit: {{ getRangeDisplayForPackage(pkgUuid) }}</p>
                    <div v-if="getCoverageError(row, pkgUuid) && (row.packageConfigs[pkgUuid].coverageTouched || attemptedSubmit)" class="qb-error-hint qb-error-hint--inline">
                      {{ getCoverageError(row, pkgUuid) }}
                    </div>
                  </div>
                  <div class="qb-pkg-field qb-meta-field">
                    <label class="qb-label">Rate</label>
                    <input
                      :value="formatRate(row.packageConfigs[pkgUuid].rate)"
                      type="text" disabled
                      class="qb-input qb-input--right qb-input--muted"
                    />
                    <p class="qb-input-hint">Applied rate</p>
                  </div>
                  <div class="qb-pkg-field qb-meta-field">
                    <label class="qb-label">Premium</label>
                    <input
                      :value="formatCurrency(row.packageConfigs[pkgUuid].premium)"
                      type="text" disabled
                      class="qb-input qb-input--right qb-input--premium"
                    />
                    <p class="qb-input-hint qb-input-hint--green">Calculated premium</p>
                  </div>
                </div>
              </template>
            </div>

            <!-- Total Premium Badge Column -->
            <div class="qb-pkg-total-col">
              <div class="qb-pkg-field">
                <label class="qb-label">Premium</label>
                <div class="qb-pkg-total-badge">
                  {{ formatCurrency(row.packageConfigs[pkgUuid].premium) }}
                </div>
                <p class="qb-pkg-total-hint">Calculated premium</p>
              </div>
            </div>
          </div><!-- /.qb-pkg-row -->
        </div><!-- /.qb-pkg-list -->

      </div><!-- /.qb-card -->
    </div><!-- /.qb-groups -->

    <!-- Validation Summary (only shown after attempted submit) -->
    <div v-if="attemptedSubmit && validationErrors.length > 0" class="qb-validation-summary">
      <div class="qb-validation-summary__header">
        <svg class="qb-validation-summary__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span>Please fix the following issues before proceeding:</span>
      </div>
      <ul class="qb-validation-summary__list">
        <li v-for="(error, idx) in validationErrors" :key="idx">
          {{ error }}
        </li>
      </ul>
    </div>

    <!-- Footer -->
    <div v-if="!hideFooterActions" class="qb-footer">
      <div class="qb-footer-summary">
        <p class="qb-footer-count">{{ groupRows.length }} benefit group{{ groupRows.length > 1 ? 's' : '' }} configured</p>
        <p class="qb-footer-total">
          Total Premium:
          <span class="qb-footer-amount">{{ formatCurrency(totalPremium) }}</span>
        </p>
      </div>

      <div class="qb-footer-actions">
        <!-- Inclusion-specific footer buttons -->
        <template v-if="inclusionMode">
          <button
            type="button"
            :disabled="!!pendingAction || (!formIsValid && !readOnlyRows)"
            @click="submitAction('save')"
            class="btn btn-outline"
          >
            <span v-if="pendingAction === 'save'" class="flex gap-2 items-center">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing…
            </span>
            <span v-else>Save Inclusion</span>
          </button>
          
          <button
            type="button"
            :disabled="!!pendingAction || (!formIsValid && !readOnlyRows)"
            @click="submitAction('issue')"
            class="btn btn-primary"
          >
            <span v-if="pendingAction === 'issue'" class="flex gap-2 items-center">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing…
            </span>
            <span v-else>Create Inclusion</span>
          </button>
        </template>

        <!-- Amend button -->
        <button
          v-else-if="showAmendButton"
          type="button"
          :disabled="!!pendingAction"
          @click="$emit('amend')"
          class="btn btn-outline"
        >
          <span v-if="pendingAction === 'amend'" class="flex gap-2 items-center">
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing…
          </span>
          <span v-else>Amend Quotation</span>
        </button>

        <!-- Issue premium advice button -->
        <button
          v-else-if="showIssuePremiumAdvice"
          type="button"
          :disabled="!!pendingAction || (!formIsValid && !readOnlyRows)"
          @click.prevent="submitAction('issuePremiumAdvice')"
          class="btn btn-purple"
        >
          <span v-if="pendingAction === 'issuePremiumAdvice'" class="flex gap-2 items-center">
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing…
          </span>
          <span v-else>Issue Premium Advice</span>
        </button>

        <!-- Issue mode buttons (accept/reject) -->
        <template v-else-if="issueMode">
          <button type="button" :disabled="!!pendingAction || !formIsValid" @click="submitAction('accept')" class="btn btn-green">
            <span v-if="pendingAction === 'accept'" class="flex gap-2 items-center">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing…
            </span>
            <span v-else>{{ acceptLabel }}</span>
          </button>
        </template>

        <!-- Normal mode (create quotation) save/issue buttons -->
        <template v-else-if="!acceptMode">
          <button type="button" :disabled="!!pendingAction || (!formIsValid && !readOnlyRows)" @click="submitAction('save')" class="btn btn-outline">
            <span v-if="pendingAction === 'save'" class="flex gap-2 items-center">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving…
            </span>
            <span v-else>Save Draft</span>
          </button>
          
          <button type="button" :disabled="!!pendingAction || (!formIsValid && !readOnlyRows)" @click="submitAction('issue')" class="btn btn-primary">
            <span v-if="pendingAction === 'issue'" class="flex gap-2 items-center">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Issuing…
            </span>
            <span v-else>Issue Quotation</span>
          </button>
        </template>

        <!-- Accept mode save/issue buttons -->
        <template v-else>
          <button type="button" :disabled="!!pendingAction || (!formIsValid && !readOnlyRows)" @click="submitAction('save')" class="btn btn-soft">
            <span v-if="pendingAction === 'save'" class="flex gap-2 items-center">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving…
            </span>
            <span v-else>Save Changes</span>
          </button>
          
          <button type="button" :disabled="!!pendingAction || (!formIsValid && !readOnlyRows)" @click="submitAction('issue')" class="btn btn-primary">
            <span v-if="pendingAction === 'issue'" class="flex gap-2 items-center">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Issuing…
            </span>
            <span v-else>Issue Saved</span>
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {
  allMemberTYpes,
  SharedlMemberTYpes,
  MaternityMemberTypes,
  isFemaleOnlyPackage,
  Plan,
} from "@/types/interface";
import { formatCurrency, formatNumber, genId, generateUUID } from "@/utils/utils"; 
import { getPackageRate } from "@/features/quotation/api/quotationApi";
import { getPackageRatesPerCover } from "@/features/product_settings/api/benefitRangeApi";

// ── helpers ─────────────────────────────────────────────────────
function localNormalizeDescription(raw) {
  const val = typeof raw === "object" && raw !== null ? (raw.value ?? raw.id ?? raw) : raw;
  let descNum;
  if (typeof val === "string") {
    const v = val.toLowerCase().trim();
    if (v === "member" || v === "main member" || v === "member only") descNum = 1;
    else if (v === "spouse") descNum = 2;
    else if (v === "children" || v === "child") descNum = 3;
    else descNum = Number.parseInt(val, 10);
  } else {
    descNum = Number(val);
  }
  return Number.isFinite(descNum) && !Number.isNaN(descNum) ? descNum : 0;
}

function emptyConfig() {
  return { 
    planType: "",
    planTypeTouched: false,
    coverage: "", 
    coverageTouched: false,
    sumAssured: "", 
    sumAssuredTouched: false,
    depSumAssured: "", 
    depSumAssuredTouched: false,
    spouseSumAssured: "", 
    spouseSumAssuredTouched: false,
    rate: 0, 
    premium: 0,
    sumInsured: 0,
    employeeRate: 0,
    dependentRate: 0,
    spouseRate: 0,
    employeePremium: 0,
    dependentPremium: 0,
    spousePremium: 0,
    genderCount: 0,
    genderTouched: false,
  };
}

export default {
  name: "QuotationBuilder",

  props: {
    pending:              { type: Boolean, default: false },
    hideFooterActions:    { type: Boolean, default: false },
    pendingAction:        { type: String,  default: "" },
    quotations:           Object,
    packages:             { type: Array,   required: true },
    onSubmit:             { type: Function },
    prefill:              { type: Array,   required: false, default: undefined },
    showHeaderControls:   { type: Boolean, default: true },
    readOnlyRows:         { type: Boolean, default: false },
    acceptMode:           { type: Boolean, default: false },
    issueMode:            { type: Boolean, default: false },
    acceptLabel:          { type: String,  default: "Accept" },
    quotationUuid:        { type: String,  default: "" },
    viewIssued:           { type: Object,  default: () => ({}) },
    viewAccepted:         { type: Object,  default: () => ({}) },
    viewSaved:            { type: Object,  default: () => ({}) },
    viewAcccepted:        { type: Object,  default: () => ({}) },
    showIssuePremiumAdvice: { type: Boolean, default: false },
    showAmendButton:        { type: Boolean, default: false },
    inclusionMode:        { type: Boolean, default: false },
    beginDate:            { type: String, default: "" },
    endDate:              { type: String, default: "" },
  },

  emits: ["amend", "submit"],

  data() {
    return {
      groupRows: [],
      openDropdownRowId: null,
      dropdownAnchorMap: {},
      pkgBtnRefs: {},
      packageRatesCache: {},
      loadingRates: {},
      pendingRateRequests: {},
      Plan,
      clickOutsideHandler: null,
      scrollHandler: null,
      attemptedSubmit: false,
    };
  },

  computed: {
    allPackages() { return this.packages; },

    validationErrors() {
      const errors = [];
      if (!Array.isArray(this.groupRows) || this.groupRows.length === 0) {
        errors.push("No benefit groups configured.");
        return errors;
      }
      
      for (const row of this.groupRows) {
        if (!row.selectedPackageUuuids?.length) {
          errors.push("Select at least one package for each benefit group.");
          continue;
        }

        const insured = Number(this.normalizeValue(row.numberOfInsured));
        if (!Number.isFinite(insured) || insured <= 0) {
          errors.push(`Benefit group: Number of employees must be greater than 0.`);
        }
        
        if (row.description === "" || row.description == null) {
          errors.push(`Benefit group: Please select a description.`);
        }

        for (const pkgUuid of row.selectedPackageUuuids) {
          const config = row.packageConfigs[pkgUuid];
          if (!config) continue;

          const pkgGender = this.getPackageGender(pkgUuid);
          if (pkgGender !== 'BOTH') {
            const genderCount = Number(config.genderCount) || 0;
            if (genderCount <= 0) {
              errors.push(`${this.getPackageName(pkgUuid)}: Number of adult ${pkgGender.toLowerCase()}s is required.`);
            } else if (genderCount > insured) {
              errors.push(`${this.getPackageName(pkgUuid)}: Number of adult ${pkgGender.toLowerCase()}s (${genderCount}) cannot exceed total employees (${insured}).`);
            }
          }

          if (!config.planType) {
            errors.push(`${this.getPackageName(pkgUuid)}: Please select a plan type.`);
            continue;
          }

          const minLimit = this.getPackageMinLimit(pkgUuid);
          const maxLimit = this.getPackageMaxLimit(pkgUuid);
          const rangeText = `${this.formatNumber(minLimit)} – ${this.formatNumber(maxLimit)}`;

          if (this.isIndividualPlan(config.planType)) {
            const emp = Number(config.sumAssured);
            if (!emp || emp <= 0) {
              errors.push(`${this.getPackageName(pkgUuid)}: Employee Sum Assured is required (Limit: ${rangeText}).`);
            } else if (emp < minLimit || emp > maxLimit) {
              errors.push(`${this.getPackageName(pkgUuid)}: Employee Sum Assured must be between ${rangeText}. Current value: ${this.formatNumber(emp)}.`);
            }
            
            if (!this.isMemberOnly(row.description)) {
              const dep = Number(config.depSumAssured);
              if (!dep || dep <= 0) {
                errors.push(`${this.getPackageName(pkgUuid)}: Dependent Sum Assured is required (Limit: ${rangeText}).`);
              } else if (dep < minLimit || dep > maxLimit) {
                errors.push(`${this.getPackageName(pkgUuid)}: Dependent Sum Assured must be between ${rangeText}. Current value: ${this.formatNumber(dep)}.`);
              }
            }
          } else if (this.isDualPremiumPlan(config.planType)) {
            const emp = Number(config.sumAssured);
            const spouse = Number(config.spouseSumAssured);
            
            if (!emp || emp <= 0) {
              errors.push(`${this.getPackageName(pkgUuid)}: Employee Sum Assured is required (Limit: ${rangeText}).`);
            } else if (emp < minLimit || emp > maxLimit) {
              errors.push(`${this.getPackageName(pkgUuid)}: Employee Sum Assured must be between ${rangeText}. Current value: ${this.formatNumber(emp)}.`);
            }
            
            if (!spouse || spouse <= 0) {
              errors.push(`${this.getPackageName(pkgUuid)}: Spouse Sum Assured is required (Limit: ${rangeText}).`);
            } else if (spouse < minLimit || spouse > maxLimit) {
              errors.push(`${this.getPackageName(pkgUuid)}: Spouse Sum Assured must be between ${rangeText}. Current value: ${this.formatNumber(spouse)}.`);
            }
            
            if (!this.isMemberPlusOne(row.description)) {
              const dep = Number(config.depSumAssured);
              if (!dep || dep <= 0) {
                errors.push(`${this.getPackageName(pkgUuid)}: Dependent Sum Assured is required (Limit: ${rangeText}).`);
              } else if (dep < minLimit || dep > maxLimit) {
                errors.push(`${this.getPackageName(pkgUuid)}: Dependent Sum Assured must be between ${rangeText}. Current value: ${this.formatNumber(dep)}.`);
              }
            }
          } else if (this.isDependentSharedPlan(config.planType)) {
            const emp = Number(config.sumAssured);
            const dep = Number(config.depSumAssured);
            
            if (!emp || emp <= 0) {
              errors.push(`${this.getPackageName(pkgUuid)}: Employee Sum Assured is required (Limit: ${rangeText}).`);
            } else if (emp < minLimit || emp > maxLimit) {
              errors.push(`${this.getPackageName(pkgUuid)}: Employee Sum Assured must be between ${rangeText}. Current value: ${this.formatNumber(emp)}.`);
            }
            
            if (!dep || dep <= 0) {
              errors.push(`${this.getPackageName(pkgUuid)}: Dependent Sum Assured is required (Limit: ${rangeText}).`);
            } else if (dep < minLimit || dep > maxLimit) {
              errors.push(`${this.getPackageName(pkgUuid)}: Dependent Sum Assured must be between ${rangeText}. Current value: ${this.formatNumber(dep)}.`);
            }
          } else {
            const coverage = Number(this.normalizeValue(config.coverage));
            if (!Number.isFinite(coverage) || coverage <= 0) {
              errors.push(`${this.getPackageName(pkgUuid)}: Coverage amount is required (Limit: ${rangeText}).`);
            } else if ((minLimit > 0 || maxLimit > 0) && (coverage < minLimit || coverage > maxLimit)) {
              errors.push(`${this.getPackageName(pkgUuid)}: Coverage amount must be between ${rangeText}. Current value: ${this.formatNumber(coverage)}.`);
            }
          }

          const rate = Number(config.rate);
          if (!Number.isFinite(rate) || rate <= 0) {
            errors.push(`${this.getPackageName(pkgUuid)}: Rate calculation failed. Please check your coverage amounts.`);
          }
        }
      }
      return errors;
    },

    formIsValid() {
      return this.validationErrors.length === 0;
    },

    totalPremium() {
      let total = 0;
      this.groupRows.forEach(row =>
        row.selectedPackageUuuids.forEach(pkgUuid => {
          total += Number(row.packageConfigs[pkgUuid]?.premium) || 0;
        })
      );
      return total;
    },
  },

  watch: {
    prefill: {
      handler(newVal) {
        if (newVal?.length) this.initializeFromPrefill(newVal);
        else if (!this.groupRows?.length) this.initializeDefaultRow();
      },
      immediate: true,
      deep: true,
    },
  },

  mounted() {
    this.clickOutsideHandler = (e) => {
      if (this.openDropdownRowId && !e.target.closest(".package-dropdown-wrapper") && !e.target.closest(".qb-pkg-dropdown")) {
        this.openDropdownRowId = null;
      }
    };
    this.scrollHandler = () => { if (this.openDropdownRowId) this.openDropdownRowId = null; };
    document.addEventListener("click", this.clickOutsideHandler);
    window.addEventListener("scroll", this.scrollHandler, true);
  },

  beforeUnmount() {
    document.removeEventListener("click", this.clickOutsideHandler);
    window.removeEventListener("scroll", this.scrollHandler, true);
  },

  methods: {
    // ── Gender-related methods ───────────────────────────────
    getPackageGender(packageUuid) {
      const pkg = this.packages.find(p => p.packageUuid === packageUuid);
      return pkg?.gender || "BOTH";
    },

    getGenderCountForPackage(row, packageUuid) {
      const config = row.packageConfigs[packageUuid];
      if (!config) return 0;
      return config.genderCount;
    },

    getGenderTouchedForPackage(row, packageUuid) {
      const config = row.packageConfigs[packageUuid];
      if (!config) return false;
      return config.genderTouched;
    },

    handleGenderCountInput(row, packageUuid, value) {
      const config = row.packageConfigs[packageUuid];
      if (config) {
        config.genderCount = value;
        config.genderTouched = true;
        this.handleRowChange(row);
      }
    },

    getGenderError(row, packageUuid) {
      const config = row.packageConfigs[packageUuid];
      if (!config) return null;
      
      const pkgGender = this.getPackageGender(packageUuid);
      if (pkgGender === 'BOTH') return null;
      
      const count = Number(config.genderCount) || 0;
      if (count <= 0) {
        return `Number of adult ${pkgGender.toLowerCase()}s is required`;
      }
      
      const insured = Number(this.normalizeValue(row.numberOfInsured)) || 0;
      if (count > insured) {
        return `Cannot exceed total employees (${insured})`;
      }
      
      return null;
    },

    // ── Helpers ───────────────────────────────────────────────
    isMemberOnly(description) {
      const desc = this.normalizeValue(description);
      return desc === 1 || desc === "1" || desc === "Member Only" || desc === "member only";
    },

    isMemberPlusOne(description) {
      const desc = this.normalizeValue(description);
      return desc === 2 || desc === "2" || desc === "Member + 1 Dependent";
    },

    isIndividualPlan(planType) {
      return this.normalizeValue(planType) === Plan["Individual Plan"];
    },
    isDualPremiumPlan(planType) {
      return this.normalizeValue(planType) === Plan["Dual Premium Dependent Shared Plan"];
    },
    isFamilySharedPlan(planType) {
      return this.normalizeValue(planType) === Plan["Family Shared Plan"];
    },
    isDependentSharedPlan(planType) {
      return this.normalizeValue(planType) === Plan["Dependent Shared Plan"];
    },

    // ── Validation Error Methods ───────────────────────────────
    getDescriptionError(row) {
      if (row.description === "" || row.description == null) {
        return "Description is required";
      }
      return null;
    },

    getEmployeesError(row) {
      const insured = Number(this.normalizeValue(row.numberOfInsured));
      if (!Number.isFinite(insured) || insured <= 0) {
        return "Number of employees must be greater than 0";
      }
      return null;
    },

    getPlanTypeError(row, pkgUuid) {
      const config = row.packageConfigs[pkgUuid];
      if (!config || !config.planType) {
        return "Plan type is required";
      }
      return null;
    },

    getSumAssuredError(row, pkgUuid, type) {
      const config = row.packageConfigs[pkgUuid];
      if (!config) return null;
      
      let value;
      if (type === 'employee') value = Number(config.sumAssured);
      else if (type === 'dependent') value = Number(config.depSumAssured);
      else if (type === 'spouse') value = Number(config.spouseSumAssured);
      else return null;
      
      if (!value || value <= 0) {
        return `${type.charAt(0).toUpperCase() + type.slice(1)} sum assured is required`;
      }
      
      const minLimit = this.getPackageMinLimit(pkgUuid);
      const maxLimit = this.getPackageMaxLimit(pkgUuid);
      
      if (value < minLimit || value > maxLimit) {
        return `Must be between ${this.formatNumber(minLimit)} – ${this.formatNumber(maxLimit)}`;
      }
      
      return null;
    },

    getCoverageError(row, pkgUuid) {
      const config = row.packageConfigs[pkgUuid];
      if (!config) return null;
      
      const coverage = Number(this.normalizeValue(config.coverage));
      if (!Number.isFinite(coverage) || coverage <= 0) {
        return "Coverage amount is required";
      }
      
      const minLimit = this.getPackageMinLimit(pkgUuid);
      const maxLimit = this.getPackageMaxLimit(pkgUuid);
      
      if ((minLimit > 0 || maxLimit > 0) && (coverage < minLimit || coverage > maxLimit)) {
        return `Must be between ${this.formatNumber(minLimit)} – ${this.formatNumber(maxLimit)}`;
      }
      
      return null;
    },

    // ── Dropdown ──────────────────────────────────────────────
    toggleDropdown(rowId) {
      if (this.openDropdownRowId === rowId) { this.openDropdownRowId = null; return; }
      const btn = this.pkgBtnRefs[rowId];
      if (btn) {
        const rect = btn.getBoundingClientRect();
        this.dropdownAnchorMap[rowId] = {
          top:   rect.bottom + window.scrollY + 4,
          left:  rect.left   + window.scrollX,
          width: Math.max(rect.width, 280),
        };
      }
      this.openDropdownRowId = rowId;
    },

    getDropdownStyle(rowId) {
      const a = this.dropdownAnchorMap[rowId];
      if (!a) return {};
      return { position: "absolute", top: a.top + "px", left: a.left + "px", width: a.width + "px", zIndex: 9999 };
    },

    getSelectedPackagesLabel(uuids) {
      if (!uuids?.length) return "Select packages";
      return uuids.map(u => this.packages.find(p => p.packageUuid === u)?.packageName).filter(Boolean).join(", ");
    },

    // ── Rates cache with deduplication ──────────────────────
    async ensureRatesLoaded(packageUuid) {
      if (!packageUuid) return;
      
      if (this.packageRatesCache[packageUuid]) {
        return this.packageRatesCache[packageUuid];
      }
      
      if (this.pendingRateRequests[packageUuid]) {
        return this.pendingRateRequests[packageUuid];
      }
      
      this.pendingRateRequests[packageUuid] = this._fetchRates(packageUuid);
      
      try {
        const result = await this.pendingRateRequests[packageUuid];
        return result;
      } finally {
        delete this.pendingRateRequests[packageUuid];
      }
    },

    async _fetchRates(packageUuid) {
      this.loadingRates = { ...this.loadingRates, [packageUuid]: true };
      try {
        const res = await getPackageRatesPerCover(packageUuid);
        const data = res?.data || res || [];
        this.packageRatesCache = { ...this.packageRatesCache, [packageUuid]: Array.isArray(data) ? data : [] };
        return this.packageRatesCache[packageUuid];
      } catch (e) {
        console.error("Failed to load package rates:", e);
        this.packageRatesCache = { ...this.packageRatesCache, [packageUuid]: [] };
        throw e;
      } finally {
        this.loadingRates = { ...this.loadingRates, [packageUuid]: false };
      }
    },

    getRatesForPackage(uuid) { 
      return this.packageRatesCache[uuid] || []; 
    },
    
    getPackageName(uuid) { 
      return this.packages.find(p => p.packageUuid === uuid)?.packageName || ""; 
    },

    getPackageMinLimit(uuid) {
      const pkg = this.packages.find(p => p.packageUuid === uuid);
      const v = Number(
        pkg?.minBalance ??
        pkg?.minLimit ??
        pkg?.min_limit ??
        pkg?.minimumLimit ??
        pkg?.minimum_limit ??
        pkg?.minCoverage ??
        pkg?.min_coverage ??
        0
      );
      if (v > 0) return v;
      const rates = this.getRatesForPackage(uuid);
      if (rates.length) {
        const mins = rates.map(r => r.minBalance ?? r.minLimit).filter(x => x != null);
        return mins.length ? Math.min(...mins) : 0;
      }
      return 0;
    },

    getPackageMaxLimit(uuid) {
      const pkg = this.packages.find(p => p.packageUuid === uuid);
      const v = Number(
        pkg?.maxBalance ??
        pkg?.maxLimit ??
        pkg?.max_limit ??
        pkg?.maximumLimit ??
        pkg?.maximum_limit ??
        pkg?.maxCoverage ??
        pkg?.max_coverage ??
        0
      );
      if (v > 0) return v;
      const rates = this.getRatesForPackage(uuid);
      if (rates.length) {
        const maxs = rates.map(r => r.maxBalance ?? r.maxLimit).filter(x => x != null);
        return maxs.length ? Math.max(...maxs) : 0;
      }
      return 0;
    },

    getRangeDisplayForPackage(uuid) {
      return `${this.formatNumber(this.getPackageMinLimit(uuid))} – ${this.formatNumber(this.getPackageMaxLimit(uuid))}`;
    },

    // ── Plan/description options ─────────────────────────────
    getPlanOptionsForPackages(uuids) {
      const defaults = [
        { label: "Individual Plan",                        value: Plan["Individual Plan"] },
        { label: "Dependent Shared Plan",                  value: Plan["Dependent Shared Plan"] },
        { label: "Dual Premium Dependent Shared Plan",     value: Plan["Dual Premium Dependent Shared Plan"] },
        { label: "Family Shared Plan",                     value: Plan["Family Shared Plan"] },
      ];
      if (!uuids?.length) return defaults;
      const allTypes = new Set();
      uuids.forEach(uuid => this.getRatesForPackage(uuid).forEach(r => r.planType && allTypes.add(r.planType)));
      const additional = Array.from(allTypes).filter(pt => !defaults.some(d => d.value === this.mapPlanTypeToEnum(pt)));
      const extraOpts = additional.map(pt => ({ label: this.formatPlanTypeLabel(pt), value: this.mapPlanTypeToEnum(pt) }));
      return defaults.concat(extraOpts);
    },

    getDescriptionOptionsForPackages(uuids, planType) {
      const effectivePlan = this.normalizeValue(planType);
      if (!effectivePlan) return [];

      if (effectivePlan === Plan["Individual Plan"]) {
        const maxFamilySize = 5;
        const options = [];
        for (let size = 1; size <= maxFamilySize; size++) {
          let label;
          if (size === 1) label = "Member Only";
          else if (size === 2) label = "Member + 1 Dependent";
          else if (size === 3) label = "Member + 2 Dependents";
          else if (size === 4) label = "Member + 3 Dependents";
          else if (size === 5) label = "Member + 4 Dependents";
          else label = `Member + ${size - 1} Dependents`;
          
          options.push({ label, value: size });
        }
        return options;
      }

      if (Array.isArray(uuids) && uuids.length) {
        const allSizes = new Set();
        uuids.forEach(uuid => {
          this.getRatesForPackage(uuid)
            .filter(r => r.planType === this.mapPlanTypeToApi(effectivePlan))
            .forEach(r => { 
              if (r.familySize != null) allSizes.add(r.familySize); 
            });
        });

        if (allSizes.size) {
          const minSize = (effectivePlan === Plan["Dependent Shared Plan"] || effectivePlan === Plan["Dual Premium Dependent Shared Plan"]) ? 4 : 1;
          return Array.from(allSizes)
            .filter(size => size >= minSize)
            .sort((a, b) => Number(a) - Number(b))
            .map(size => {
              let label;
              if (size === 1) label = "Member Only";
              else if (size === 2) label = "Member + 1 Dependent";
              else if (size === 3) label = "Member + 2 Dependents";
              else if (size === 4) label = "Member + 3 Dependents";
              else if (size === 5) label = "Member + 4 Dependents";
              else label = `Member + ${size - 1} Dependents`;
              
              return { label, value: size };
            });
        }
      }

      if (effectivePlan === Plan["Individual Plan"]) return SharedlMemberTYpes;
      return allMemberTYpes;
    },

    // ── Package toggle ───────────────────────────────────────
    async togglePackageInRow(row, packageUuid) {
      const idx = row.selectedPackageUuuids.indexOf(packageUuid);
      if (idx > -1) {
        row.selectedPackageUuuids.splice(idx, 1);
        delete row.packageConfigs[packageUuid];
      } else {
        row.selectedPackageUuuids.push(packageUuid);
        const newConfig = emptyConfig();
        newConfig.genderCount = 0;
        newConfig.genderTouched = false;
        row.packageConfigs = { ...row.packageConfigs, [packageUuid]: newConfig };
        
        await this.ensureRatesLoaded(packageUuid);
        this.setRateFromCacheForPackage(row, packageUuid);
        this._calcPremium(row, packageUuid);
      }
      
      this.handleRowChange(row);
    },

    // ── Rate/premium calculation ─────────────────────────────
    findRateForAmount(matchedRates, amount) {
      if (!matchedRates || !matchedRates.length) return 0;
      const numAmount = Number(amount) || 0;
      const match = matchedRates.find(r => {
        const min = Number(r.minBalance ?? r.minLimit ?? 0);
        const max = Number(r.maxBalance ?? r.maxLimit ?? 0);
        return numAmount >= min && numAmount <= max;
      });
      return match ? Number(match.rate) || 0 : (Number(matchedRates[0].rate) || 0);
    },

    handleRowChange(row) {
      row.selectedPackageUuuids.forEach(pkgUuid => {
        this.updatePackageRateAndPremium(row, pkgUuid);
      });
    },

    handlePackageRowChange(row, packageUuid) {
      this.updatePackageRateAndPremium(row, packageUuid);
    },

    updatePackageRateAndPremium(row, packageUuid) {
      const config = row.packageConfigs[packageUuid];
      if (!config) return;
      
      const clamp = (val, min, max) => {
        const n = Number(val);
        if (isNaN(n)) return val;
        if (n < min) return min;
        if (n > max) return max;
        return n;
      };
      
      const minLimit = this.getPackageMinLimit(packageUuid);
      const maxLimit = this.getPackageMaxLimit(packageUuid);
      let wasClamped = false;
      
      if (config.sumAssured != null && config.sumAssured !== "") {
        const clamped = clamp(config.sumAssured, minLimit, maxLimit);
        if (clamped !== Number(config.sumAssured)) {
          wasClamped = true;
          config.sumAssured = clamped;
        }
      }
      if (config.depSumAssured != null && config.depSumAssured !== "") {
        const clamped = clamp(config.depSumAssured, minLimit, maxLimit);
        if (clamped !== Number(config.depSumAssured)) {
          wasClamped = true;
          config.depSumAssured = clamped;
        }
      }
      if (config.spouseSumAssured != null && config.spouseSumAssured !== "") {
        const clamped = clamp(config.spouseSumAssured, minLimit, maxLimit);
        if (clamped !== Number(config.spouseSumAssured)) {
          wasClamped = true;
          config.spouseSumAssured = clamped;
        }
      }
      
      if (wasClamped && (config.sumAssuredTouched || config.depSumAssuredTouched || config.spouseSumAssuredTouched)) {
        this.showToast(`Value adjusted to within limit (${this.formatNumber(minLimit)} - ${this.formatNumber(maxLimit)})`, 'warning');
      }
      
      const planType = this.normalizeValue(config.planType);
      const description = this.normalizeValue(row.description);
      const rates = this.getRatesForPackage(packageUuid);
      
      config.employeeRate = 0;
      config.dependentRate = 0;
      config.spouseRate = 0;
      config.rate = 0;
      config.employeePremium = 0;
      config.dependentPremium = 0;
      config.spousePremium = 0;
      config.premium = 0;

      if (this.isIndividualPlan(planType)) {
        const matched = rates.filter(r => 
          r.planType === "Individual_Plan" && Number(r.familySize) === 1
        );
        config.employeeRate = this.findRateForAmount(matched, config.sumAssured);
        config.dependentRate = this.findRateForAmount(matched, config.depSumAssured);
        config.rate = config.employeeRate;

      } else if (this.isFamilySharedPlan(planType)) {
        const familySize = Number(description) || 1;
        const matched = rates.filter(r => 
          r.planType === "Family_Shared_Plan" && Number(r.familySize) === familySize
        );
        config.rate = this.findRateForAmount(matched, config.coverage);

      } else if (this.isDependentSharedPlan(planType)) {
        const familySize = Number(description) || 1;
        const dependentFamilySize = Math.max(1, familySize - 1);
        
        const empMatched = rates.filter(r => 
          r.planType === "Individual_Plan" && Number(r.familySize) === 1
        );
        const depMatched = rates.filter(r => 
          r.planType === "Family_Shared_Plan" && Number(r.familySize) === dependentFamilySize
        );
        
        config.employeeRate = this.findRateForAmount(empMatched, config.sumAssured);
        config.dependentRate = this.findRateForAmount(depMatched, config.depSumAssured);
        config.rate = (config.employeeRate + config.dependentRate) / 2;

      } else if (this.isDualPremiumPlan(planType)) {
        const familySize = Number(description) || 1;
        const dependentFamilySize = Math.max(1, familySize - 2);
        
        const empMatched = rates.filter(r => 
          r.planType === "Individual_Plan" && Number(r.familySize) === 1
        );
        const depMatched = rates.filter(r => 
          r.planType === "Family_Shared_Plan" && Number(r.familySize) === dependentFamilySize
        );
        
        config.employeeRate = this.findRateForAmount(empMatched, config.sumAssured);
        config.spouseRate = this.findRateForAmount(empMatched, config.spouseSumAssured);
        config.dependentRate = this.findRateForAmount(depMatched, config.depSumAssured);
        
        if (this.isMemberPlusOne(description)) {
          config.rate = config.employeeRate;
        } else {
          config.rate = (config.employeeRate * 2 + config.dependentRate) / 3;
        }
      }

      this._calcPremium(row, packageUuid);
    },

    recalculateRowPackage(row, packageUuid) {
      this.setRateFromCacheForPackage(row, packageUuid);
      this._calcPremium(row, packageUuid);
    },

    _calcPremium(row, packageUuid) {
      const config = row.packageConfigs[packageUuid];
      if (!config) return;
      
      const planType = this.normalizeValue(config.planType);
      const insured = Number(row.numberOfInsured) || 0;
      const description = this.normalizeValue(row.description);
      const pkgGender = this.getPackageGender(packageUuid);
      
      let effectiveCount = insured;
      if (pkgGender !== 'BOTH') {
        effectiveCount = Number(config.genderCount) || 0;
      }

      if (this.isIndividualPlan(planType)) {
        const empCov = Number(config.sumAssured) || 0;
        const rate = config.employeeRate || 0;
        const isMemberOnly = this.isMemberOnly(description);
        
        config.employeePremium = empCov * effectiveCount * rate;
        
        if (isMemberOnly) {
          config.dependentPremium = 0;
          config.sumInsured = empCov * effectiveCount;
        } else {
          const depCov = Number(config.depSumAssured) || 0;
          const numberOfDependents = (Number(description) - 1) || 0;
          const depRate = config.dependentRate || rate || 0;
          
          config.dependentPremium = depCov * effectiveCount * numberOfDependents * depRate;
          config.sumInsured = (empCov * effectiveCount) + (depCov * effectiveCount * numberOfDependents);
        }
        config.premium = config.employeePremium + config.dependentPremium;

      } else if (this.isDependentSharedPlan(planType)) {
        const empCov = Number(config.sumAssured) || 0;
        const depCov = Number(config.depSumAssured) || 0;
        const empRate = config.employeeRate || 0;
        const depRate = config.dependentRate || 0;
        
        config.employeePremium = empCov * effectiveCount * empRate;
        config.dependentPremium = depCov * effectiveCount * depRate;
        
        config.sumInsured = (empCov * effectiveCount) + (depCov * effectiveCount);
        config.premium = config.employeePremium + config.dependentPremium;

      } else if (this.isDualPremiumPlan(planType)) {
        const empCov = Number(config.sumAssured) || 0;
        const spouseCov = Number(config.spouseSumAssured) || 0;
        const depCov = Number(config.depSumAssured) || 0;
        const empRate = config.employeeRate || 0;
        const spouseRate = config.spouseRate || empRate || 0;
        const depRate = config.dependentRate || 0;
        const isMemberPlusOne = this.isMemberPlusOne(description);
        
        config.employeePremium = empCov * effectiveCount * empRate;
        config.spousePremium = spouseCov * effectiveCount * spouseRate;
        
        if (isMemberPlusOne) {
          config.dependentPremium = 0;
          config.sumInsured = (empCov * effectiveCount) + (spouseCov * effectiveCount);
        } else {
          config.dependentPremium = depCov * effectiveCount * depRate;
          config.sumInsured = (empCov * effectiveCount) + (spouseCov * effectiveCount) + (depCov * effectiveCount);
        }
        config.premium = config.employeePremium + config.spousePremium + config.dependentPremium;

      } else if (this.isFamilySharedPlan(planType)) {
        const coverage = Number(config.coverage) || 0;
        const rate = config.rate || 0;
        
        config.sumInsured = coverage * effectiveCount;
        config.premium = coverage * effectiveCount * rate;
      }
    },

    setRateFromCacheForPackage(row, packageUuid) {
      const config = row.packageConfigs[packageUuid];
      if (!config) return false;
      
      const planType = this.normalizeValue(config.planType);
      const description = this.normalizeValue(row.description);
      const rates = this.getRatesForPackage(packageUuid);
      let found = false;

      if (this.isIndividualPlan(planType)) {
        const matched = rates.filter(r => 
          r.planType === "Individual_Plan" && Number(r.familySize) === 1
        );
        if (matched.length) { 
          config.employeeRate = this.findRateForAmount(matched, config.sumAssured);
          config.dependentRate = this.findRateForAmount(matched, config.depSumAssured);
          config.rate = config.employeeRate;
          found = true;
        }
      } else if (this.isFamilySharedPlan(planType)) {
        const familySize = Number(description) || 1;
        const matched = rates.filter(r => 
          r.planType === "Family_Shared_Plan" && Number(r.familySize) === familySize
        );
        if (matched.length) { 
          config.rate = this.findRateForAmount(matched, config.coverage);
          found = true;
        }
      } else if (this.isDependentSharedPlan(planType)) {
        const familySize = Number(description) || 1;
        const dependentFamilySize = Math.max(1, familySize - 1);
        
        const empMatched = rates.filter(r => 
          r.planType === "Individual_Plan" && Number(r.familySize) === 1
        );
        const depMatched = rates.filter(r => 
          r.planType === "Family_Shared_Plan" && Number(r.familySize) === dependentFamilySize
        );
        
        if (empMatched.length) {
          config.employeeRate = this.findRateForAmount(empMatched, config.sumAssured);
          found = true;
        }
        if (depMatched.length) {
          config.dependentRate = this.findRateForAmount(depMatched, config.depSumAssured);
          found = true;
        }
        if (empMatched.length || depMatched.length) {
          config.rate = (config.employeeRate + config.dependentRate) / 2;
        }
      } else if (this.isDualPremiumPlan(planType)) {
        const familySize = Number(description) || 1;
        const dependentFamilySize = Math.max(1, familySize - 2);
        
        const empMatched = rates.filter(r => 
          r.planType === "Individual_Plan" && Number(r.familySize) === 1
        );
        const depMatched = rates.filter(r => 
          r.planType === "Family_Shared_Plan" && Number(r.familySize) === dependentFamilySize
        );
        
        if (empMatched.length) {
          config.employeeRate = this.findRateForAmount(empMatched, config.sumAssured);
          config.spouseRate = this.findRateForAmount(empMatched, config.spouseSumAssured);
          found = true;
        }
        if (depMatched.length) {
          config.dependentRate = this.findRateForAmount(depMatched, config.depSumAssured);
          found = true;
        }
        if (empMatched.length || depMatched.length) {
          if (this.isMemberPlusOne(description)) {
            config.rate = config.employeeRate;
          } else {
            config.rate = (config.employeeRate * 2 + config.dependentRate) / 3;
          }
        }
      }

      if (!found) {
        config.rate = 0;
        config.employeeRate = 0;
        config.dependentRate = 0;
        config.spouseRate = 0;
      }
      return found;
    },

    handlePackagePlanTypeChange(row, packageUuid) {
      const config = row.packageConfigs[packageUuid];
      if (!config) return;
      config.sumAssured = "";
      config.depSumAssured = "";
      config.spouseSumAssured = "";
      config.coverage = "";
      config.rate = 0;
      config.employeeRate = 0;
      config.dependentRate = 0;
      config.spouseRate = 0;
      config.employeePremium = 0;
      config.dependentPremium = 0;
      config.spousePremium = 0;
      config.premium = 0;
      config.sumInsured = 0;
    },

    async handlePackageDescriptionChange(row, pkgUuid) {
      const config = row.packageConfigs[pkgUuid];
      if (!config) return;

      const planType = this.normalizeValue(config.planType);
      const description = this.normalizeValue(row.description);
      
      const resolved = this.setRateFromCacheForPackage(row, pkgUuid);
      if (!resolved && !this.getRatesForPackage(pkgUuid).length) {
        try {
          let requests = [];
          
          if (this.isIndividualPlan(planType) || 
              this.isDependentSharedPlan(planType) || 
              this.isDualPremiumPlan(planType)) {
            requests.push(
              getPackageRate({ 
                packageUuid: pkgUuid, 
                planType: "Individual_Plan", 
                familySize: 1 
              })
            );
          }
          
          if (this.isFamilySharedPlan(planType)) {
            const familySize = Number(description) || 1;
            requests.push(
              getPackageRate({ 
                packageUuid: pkgUuid, 
                planType: "Family_Shared_Plan", 
                familySize 
              })
            );
          } else if (this.isDependentSharedPlan(planType)) {
            const dependentFamilySize = Math.max(1, (Number(description) || 1) - 1);
            requests.push(
              getPackageRate({ 
                packageUuid: pkgUuid, 
                planType: "Family_Shared_Plan", 
                familySize: dependentFamilySize 
              })
            );
          } else if (this.isDualPremiumPlan(planType) && !this.isMemberPlusOne(description)) {
            const dependentFamilySize = Math.max(1, (Number(description) || 1) - 2);
            requests.push(
              getPackageRate({ 
                packageUuid: pkgUuid, 
                planType: "Family_Shared_Plan", 
                familySize: dependentFamilySize 
              })
            );
          }
          
          const responses = await Promise.all(requests);
          responses.forEach(resp => {
            const rate = resp?.data?.rate || resp?.rate || 0;
            const planTypeResp = resp?.data?.planType || resp?.planType || "";
            
            if (row.packageConfigs[pkgUuid]) {
              if (planTypeResp === "Individual_Plan") {
                row.packageConfigs[pkgUuid].employeeRate = Number(rate) || 0;
                row.packageConfigs[pkgUuid].spouseRate = Number(rate) || 0;
              } else if (planTypeResp === "Family_Shared_Plan") {
                row.packageConfigs[pkgUuid].dependentRate = Number(rate) || 0;
              }
            }
          });
          
          if (row.packageConfigs[pkgUuid]) {
            const conf = row.packageConfigs[pkgUuid];
            if (this.isIndividualPlan(planType)) {
              conf.rate = conf.employeeRate;
            } else if (this.isFamilySharedPlan(planType)) {
              conf.rate = conf.dependentRate;
            } else if (this.isDependentSharedPlan(planType)) {
              conf.rate = (conf.employeeRate + conf.dependentRate) / 2;
            } else if (this.isDualPremiumPlan(planType)) {
              if (this.isMemberPlusOne(description)) {
                conf.rate = conf.employeeRate;
              } else {
                conf.rate = (conf.employeeRate * 2 + conf.dependentRate) / 3;
              }
            }
          }
        } catch (e) { 
          console.error("Failed to fetch rate:", e); 
        }
      }
      this.recalculateRowPackage(row, pkgUuid);
    },

    getGroupPlanTypeForDescOptions(row) {
      if (row.selectedPackageUuuids?.length) {
        const firstPkg = row.selectedPackageUuuids[0];
        const config = row.packageConfigs[firstPkg];
        if (config?.planType) return config.planType;
      }
      return Plan["Individual Plan"];
    },

    showToast(message, type = 'error') {
      const toast = document.createElement('div');
      toast.textContent = message;
      toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#10b981'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 400px;
        animation: slideIn 0.3s ease;
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    },

    // ── Initialize from prefill ──────────────────────────────
    initializeFromPrefill(prefillData) {
      if (!prefillData) return;
      const services = [];
      prefillData.forEach(item => {
        if (Array.isArray(item?.services)) services.push(...item.services);
        else if (item?.packageUuid) services.push(item);
      });
      if (!services.length) { this.initializeDefaultRow(); return; }

      const groups = {};
      services.forEach(s => {
        const key = s.benefitGroupCode || `${s.planType}_${s.description}_${s.numberOfInsured}`;
        if (!groups[key]) groups[key] = { 
          benefitGroupCode: s.benefitGroupCode || generateUUID(),
          numberOfInsured: s.numberOfInsured, 
          description: s.description,
          services: [] 
        };
        groups[key].services.push(s);
      });

      this.groupRows = Object.values(groups).map(group => {
        const selectedPackageUuuids = [];
        const packageConfigs = {};
        group.services.forEach(s => {
          if (!selectedPackageUuuids.includes(s.packageUuid)) selectedPackageUuuids.push(s.packageUuid);
          
          const normalizedPlanType = this.normalizePlanTypeFromPrefill(s.planType) || "";
          
          let coverageValue = "";
          let sumAssuredValue = "";
          let depSumAssuredValue = "";
          let spouseSumAssuredValue = "";
          
          if (this.isFamilySharedPlan(normalizedPlanType)) {
            coverageValue = s.sumAssured ?? s.coverage ?? "";
            sumAssuredValue = s.sumAssured ?? s.coverage ?? "";
          } else if (this.isIndividualPlan(normalizedPlanType)) {
            sumAssuredValue = s.sumAssured ?? s.sumInsured ?? "";
            depSumAssuredValue = s.depSumAssured ?? "";
            coverageValue = "";
          } else if (this.isDependentSharedPlan(normalizedPlanType)) {
            sumAssuredValue = s.sumAssured ?? s.sumInsured ?? "";
            depSumAssuredValue = s.depSumAssured ?? "";
            coverageValue = "";
          } else if (this.isDualPremiumPlan(normalizedPlanType)) {
            sumAssuredValue = s.sumAssured ?? s.sumInsured ?? "";
            depSumAssuredValue = s.depSumAssured ?? "";
            spouseSumAssuredValue = s.spouseSumAssured ?? "";
            coverageValue = "";
          } else {
            coverageValue = s.coverage ?? "";
            sumAssuredValue = s.sumAssured ?? s.sumInsured ?? "";
            depSumAssuredValue = s.depSumAssured ?? "";
            spouseSumAssuredValue = s.spouseSumAssured ?? "";
          }
          
          let genderCount = 0;
          const pkgGender = this.getPackageGender(s.packageUuid);
          if (pkgGender === 'FEMALE') {
            genderCount = s.numberOfAdultFemale || 0;
          } else if (pkgGender === 'MALE') {
            genderCount = s.numberOfAdultMale || 0;
          }
          
          packageConfigs[s.packageUuid] = {
            ...emptyConfig(),
            planType: normalizedPlanType,
            planTypeTouched: true,
            coverage: coverageValue,
            coverageTouched: !!coverageValue,
            sumAssured: sumAssuredValue,
            sumAssuredTouched: !!sumAssuredValue,
            depSumAssured: depSumAssuredValue,
            depSumAssuredTouched: !!depSumAssuredValue,
            spouseSumAssured: spouseSumAssuredValue,
            spouseSumAssuredTouched: !!spouseSumAssuredValue,
            rate: s.rate || 0,
            premium: s.premium || 0,
            sumInsured: s.sumInsured || 0,
            employeeRate: s.employeeRate || s.rate || 0,
            dependentRate: s.dependentRate || s.rate || 0,
            spouseRate: s.spouseRate || s.rate || 0,
            employeePremium: s.employeePremium || 0,
            dependentPremium: s.dependentPremium || 0,
            spousePremium: s.spousePremium || 0,
            genderCount: genderCount,
            genderTouched: genderCount > 0,
          };
        });
        
        return { 
          id: genId.next().value, 
          benefitGroupCode: group.benefitGroupCode, 
          numberOfInsured: group.numberOfInsured,
          description: group.description,
          descriptionTouched: !!group.description,
          employeesTouched: !!group.numberOfInsured,
          selectedPackageUuuids, 
          packageConfigs 
        };
      });

      const allPackageUuids = new Set();
      this.groupRows.forEach(row => {
        row.selectedPackageUuuids.forEach(uuid => allPackageUuids.add(uuid));
      });

      if (allPackageUuids.size > 0) {
        const loadPromises = Array.from(allPackageUuids).map(uuid => this.ensureRatesLoaded(uuid));
        Promise.all(loadPromises).then(() => {
          this.groupRows.forEach(row => {
            row.selectedPackageUuuids.forEach(pkgUuid => {
              this.setRateFromCacheForPackage(row, pkgUuid);
              this._calcPremium(row, pkgUuid);
            });
          });
        }).catch(err => {
          console.error('Failed to load some package rates:', err);
        });
      }
    },

    initializeDefaultRow() {
      this.groupRows = [{ 
        id: genId.next().value, 
        benefitGroupCode: generateUUID(),
        numberOfInsured: "", 
        employeesTouched: false,
        description: "",
        descriptionTouched: false,
        selectedPackageUuuids: [], 
        packageConfigs: {} 
      }];
    },

    addGroupRow() {
      this.groupRows.push({ 
        id: genId.next().value, 
        benefitGroupCode: generateUUID(),
        numberOfInsured: "", 
        employeesTouched: false,
        description: "",
        descriptionTouched: false,
        selectedPackageUuuids: [], 
        packageConfigs: {} 
      });
    },

    duplicateGroupRow(row) {
      const dup = { 
        id: genId.next().value, 
        benefitGroupCode: generateUUID(),
        numberOfInsured: row.numberOfInsured, 
        employeesTouched: row.employeesTouched,
        description: row.description,
        descriptionTouched: row.descriptionTouched,
        selectedPackageUuuids: [...row.selectedPackageUuuids], 
        packageConfigs: {} 
      };
      row.selectedPackageUuuids.forEach(uuid => { 
        dup.packageConfigs[uuid] = { ...row.packageConfigs[uuid] }; 
      });
      this.groupRows.push(dup);
    },
    
    removeGroupRow(index) {
      if (this.groupRows.length > 1) {
        const id = this.groupRows[index]?.id;
        this.groupRows.splice(index, 1);
        if (id) delete this.pkgBtnRefs[id];
      }
    },

    // ── Payload ──────────────────────────────────────────────
    buildPayload() {
      const servicesList = [];
      this.groupRows.forEach(row => {
        row.selectedPackageUuuids.forEach(packageUuid => {
          const config = row.packageConfigs[packageUuid];
          if (!config) return;
          const planType = this.mapPlanTypeToApi(config.planType);
          const description = this.normalizeValue(row.description);
          let individualType = "NA";
          if (planType === "Individual_Plan") {
            const d = String(description || "").trim().toLowerCase();
            individualType = d === "1" || d === "member" || d === "main member" || d === "member only" ? "Member"
              : d === "2" || d === "spouse" ? "Spouse"
              : d === "3" || d === "children" || d === "child" ? "Children"
              : "Member";
          }
          
          let sumAssured = 0;
          let coverage = 0;
          
          if (this.isFamilySharedPlan(config.planType)) {
            sumAssured = Number(config.coverage) || 0;
            coverage = Number(config.coverage) || 0;
          } else if (this.isIndividualPlan(config.planType)) {
            sumAssured = Number(config.sumAssured) || 0;
            coverage = Number(config.sumAssured) || 0;
          } else {
            sumAssured = Number(config.sumAssured) || 0;
            coverage = Number(config.coverage) || 0;
          }
          
          const pkgGender = this.getPackageGender(packageUuid);
          let numberOfAdultFemale = 0;
          let numberOfAdultMale = 0;
          
          if (pkgGender === 'FEMALE') {
            numberOfAdultFemale = Number(config.genderCount) || 0;
          } else if (pkgGender === 'MALE') {
            numberOfAdultMale = Number(config.genderCount) || 0;
          }
          
          servicesList.push({
            packageUuid,
            benefitGroupCode: row.benefitGroupCode,
            numberOfInsured: Number(row.numberOfInsured) || 0,
            numberOfAdultFemale,
            numberOfAdultMale,
            description: localNormalizeDescription(description),
            rate: Number(config.rate) || 0,
            premium: Number(config.premium) || 0,
            coverage: coverage,
            sumInsured: Number(config.sumInsured) || 0,
            sumAssured: sumAssured,
            depSumAssured: Number(config.depSumAssured) || 0,
            spouseSumAssured: Number(config.spouseSumAssured) || 0,
            planType,
            individualType,
            spouse: individualType === "Spouse",
            employeeRate: Number(config.employeeRate) || 0,
            dependentRate: Number(config.dependentRate) || 0,
            spouseRate: Number(config.spouseRate) || 0,
          });
        });
      });

      const payload = { 
        quoatedServices: servicesList,
        beginDate: this.beginDate ? new Date(this.beginDate).toISOString() : null,
        endDate: this.endDate ? new Date(this.endDate).toISOString() : null
      };
      
      if (this.quotationUuid) payload.quotationUuid = this.quotationUuid;
      const uuids = [...new Set(servicesList.map(s => s.packageUuid))];
      payload.quotations = uuids.map(uuid => ({ 
        packageUuid: uuid, 
        services: servicesList.filter(s => s.packageUuid === uuid) 
      }));
      
      return payload;
    },

    submitAction(action) {
      this.attemptedSubmit = true;
      if (!this.formIsValid && !this.readOnlyRows) {
        this.showToast('Please fix all validation errors before proceeding.', 'error');
        return;
      }
      const payload = { action, data: this.buildPayload() };
      if (typeof this.onSubmit === "function") this.onSubmit(payload);
      this.$emit("submit", payload);
    },

    // ── Mapping helpers ──────────────────────────────────────
    normalizePlanTypeFromPrefill(planType) {
      const v = this.normalizeValue(planType);
      const all = [Plan["Individual Plan"], Plan["Dependent Shared Plan"], Plan["Dual Premium Dependent Shared Plan"], Plan["Family Shared Plan"]];
      if (all.includes(v)) return v;
      if (typeof v === "string") {
        if (v === "Individual Plan"                    || v === "Individual_Plan")                    return Plan["Individual Plan"];
        if (v === "Dependent Shared Plan"              || v === "Dependent_Shared_Plan")              return Plan["Dependent Shared Plan"];
        if (v === "Dual Premium Dependent Shared Plan" || v === "Dual_Premium_dependent_Shared_Plan") return Plan["Dual Premium Dependent Shared Plan"];
        if (v === "Family Shared Plan"                 || v === "Family_Shared_Plan")                 return Plan["Family Shared Plan"];
      }
      return v;
    },

    mapPlanTypeToEnum(planType) {
      const m = { 
        Individual_Plan: Plan["Individual Plan"], 
        Dependent_Shared_Plan: Plan["Dependent Shared Plan"], 
        Dual_Premium_dependent_Shared_Plan: Plan["Dual Premium Dependent Shared Plan"], 
        Family_Shared_Plan: Plan["Family Shared Plan"] 
      };
      return m[planType] || planType;
    },

    mapPlanTypeToApi(planType) {
      const n = this.normalizeValue(planType);
      const m = { 
        [Plan["Individual Plan"]]: "Individual_Plan", 
        [Plan["Dependent Shared Plan"]]: "Dependent_Shared_Plan", 
        [Plan["Dual Premium Dependent Shared Plan"]]: "Dual_Premium_dependent_Shared_Plan", 
        [Plan["Family Shared Plan"]]: "Family_Shared_Plan" 
      };
      return m[n] || n;
    },

    normalizeValue(val) { 
      return typeof val === "object" && val !== null ? (val.value ?? val.id ?? val.label ?? val) : val; 
    },

    formatPlanTypeLabel(pt) {
      const m = { 
        Individual_Plan: "Individual Plan", 
        Dependent_Shared_Plan: "Dependent Shared Plan", 
        Dual_Premium_dependent_Shared_Plan: "Dual Premium Dependent Shared Plan", 
        Family_Shared_Plan: "Family Shared Plan" 
      };
      return m[pt] || String(pt).replace(/_/g, " ");
    },

    formatCurrency,
    formatNumber,
    formatRate(rate) { 
      return (!rate && rate !== 0) ? "0.0000" : Number(rate).toFixed(4); 
    },
  },
};
</script>

<style scoped>
/* ── Wrapper ─────────────────────────────────────────────────── */
.qb-wrap {
  max-width: 72rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
}

/* ── Header ──────────────────────────────────────────────────── */
.qb-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}
.qb-title    { font-size: 1.125rem; font-weight: 700; color: #1e293b; margin: 0 0 .15rem; }
.qb-subtitle { font-size: 0.75rem;  color: #94a3b8; margin: 0; }

/* ── Buttons ─────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  padding: .55rem 1.1rem;
  font-size: .8125rem;
  font-weight: 600;
  border-radius: .75rem;
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: background .15s, box-shadow .15s, opacity .15s;
  white-space: nowrap;
}
.btn:disabled { opacity: .45; cursor: not-allowed; }
.btn-icon { width: 1rem; height: 1rem; }

.btn-primary  { background: var(--color-primary, #6366f1); color: #fff; }
.btn-primary:not(:disabled):hover { background: color-mix(in srgb, var(--color-primary,#6366f1) 85%, #000); box-shadow: 0 2px 8px rgba(99,102,241,.25); }

.btn-green    { background: #16a34a; color: #fff; }
.btn-green:not(:disabled):hover   { background: #15803d; }

.btn-purple   { background: #9333ea; color: #fff; }
.btn-purple:not(:disabled):hover  { background: #7e22ce; }

.btn-outline  { background: #fff; color: #475569; border-color: #cbd5e1; }
.btn-outline:not(:disabled):hover { background: #f8fafc; }

.btn-soft     { background: color-mix(in srgb, var(--color-primary,#6366f1) 10%, transparent); color: var(--color-primary,#6366f1); }
.btn-soft:not(:disabled):hover    { background: color-mix(in srgb, var(--color-primary,#6366f1) 18%, transparent); }

/* ── Gender badge ───────────────────────────────────────────── */
.qb-gender-badge {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  font-size: 0.625rem;
  font-weight: 700;
  border-radius: 0.25rem;
  background: #f1f5f9;
  color: #64748b;
  margin-left: 0.375rem;
  text-transform: uppercase;
}

/* ── Card ────────────────────────────────────────────────────── */
.qb-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 1.25rem;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
  overflow: visible;
  transition: box-shadow .2s;
}
.qb-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.09); }

.qb-card-header {
  padding: 1.25rem 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
  border-radius: 1.25rem 1.25rem 0 0;
}

/* ── Field grid inside header ────────────────────────────────── */
.qb-field-group-header {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  align-items: end;
}

/* ── Fields ──────────────────────────────────────────────────── */
.qb-field           { display: flex; flex-direction: column; gap: .375rem; }

/* ── Labels ──────────────────────────────────────────────────── */
.qb-label {
  font-size: .6875rem;
  font-weight: 700;
  letter-spacing: .05em;
  text-transform: uppercase;
  color: #94a3b8;
}
.qb-label--colored { color: color-mix(in srgb, var(--color-primary,#6366f1) 70%, #64748b); }

/* ── Select ──────────────────────────────────────────────────── */
.qb-select {
  height: 2.75rem;
  width: 100%;
  padding: 0 2.5rem 0 .875rem;
  font-size: .875rem;
  font-weight: 500;
  color: #334155;
  background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E") no-repeat right .75rem center / 1rem;
  border: 1.5px solid #e2e8f0;
  border-radius: .75rem;
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  transition: border-color .15s, box-shadow .15s;
  cursor: pointer;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
}
.qb-select:focus {
  border-color: var(--color-primary, #6366f1);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary,#6366f1) 15%, transparent);
  z-index: 2;
}
.qb-select:disabled {
  background-color: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
  border-color: #e2e8f0;
}
.qb-select--error {
  border-color: #ef4444;
  background-color: #fef2f2;
}

/* ── Input ───────────────────────────────────────────────────── */
.qb-input {
  height: 2.75rem;
  width: 100%;
  padding: 0 .875rem;
  font-size: .875rem;
  font-weight: 500;
  color: #334155;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: .75rem;
  outline: none;
  transition: border-color .15s, box-shadow .15s;
  box-sizing: border-box;
}
.qb-input:focus {
  border-color: var(--color-primary, #6366f1);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary,#6366f1) 15%, transparent);
}
.qb-input:disabled       { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }
.qb-input--center        { text-align: center; font-weight: 700; }
.qb-input--right         { text-align: right; }
.qb-input--muted         { background: #f8fafc !important; color: #64748b !important; font-weight: 600; }
.qb-input--premium       { background: #f0fdf4 !important; border-color: #bbf7d0 !important; color: #15803d !important; font-weight: 700; }
.qb-input--error {
  border-color: #ef4444;
  background-color: #fef2f2;
}
.qb-input[type="number"]::-webkit-inner-spin-button,
.qb-input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; }
.qb-input[type="number"] { -moz-appearance: textfield; }

.qb-input-hint            { font-size: .6875rem; color: #94a3b8; text-align: right; margin-top: .2rem; }
.qb-input-hint--green     { color: #16a34a; font-weight: 600; }

/* ── Error hints ─────────────────────────────────────────────── */
.qb-error-hint {
  font-size: 0.6875rem;
  color: #ef4444;
  margin-top: 0.2rem;
  font-weight: 500;
}
.qb-error-hint--inline {
  margin-top: 0.25rem;
}
.qb-cascade-row--error {
  border-color: #ef4444;
  background-color: #fef2f2;
}

/* ── Validation Summary ─────────────────────────────────────── */
.qb-validation-summary {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.75rem;
  padding: 1rem;
  margin: 0.5rem 0;
}
.qb-validation-summary__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #b91c1c;
  margin-bottom: 0.75rem;
}
.qb-validation-summary__icon {
  width: 1.25rem;
  height: 1.25rem;
}
.qb-validation-summary__list {
  margin: 0;
  padding-left: 1.75rem;
  color: #991b1b;
  font-size: 0.8125rem;
}
.qb-validation-summary__list li {
  margin: 0.25rem 0;
}

/* ── Package dropdown button ─────────────────────────────────── */
.package-dropdown-wrapper { position: relative; }

.qb-pkg-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 2.75rem;
  width: 100%;
  padding: 0 .875rem;
  font-size: .875rem;
  font-weight: 500;
  color: #334155;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: .75rem;
  cursor: pointer;
  text-align: left;
  transition: border-color .15s, box-shadow .15s;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
}
.qb-pkg-btn:hover              { border-color: #cbd5e1; }
.qb-pkg-btn--open,
.qb-pkg-btn:focus              { border-color: var(--color-primary,#6366f1); box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary,#6366f1) 15%, transparent); outline: none; z-index: 2; }
.qb-pkg-btn:disabled           { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }
.qb-pkg-btn__text              { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qb-pkg-btn__chevron           { flex-shrink: 0; width: 1rem; height: 1rem; color: #94a3b8; margin-left: .5rem; transition: transform .2s; }
.qb-pkg-btn__chevron.rotated   { transform: rotate(180deg); }

/* ── Teleported dropdown ─────────────────────────────────────── */
.qb-pkg-dropdown {
  position: absolute;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 1rem;
  box-shadow: 0 8px 40px rgba(0,0,0,.15);
  max-height: 18rem;
  overflow-y: auto;
  padding: .4rem;
  min-width: 280px;
}
.qb-pkg-option {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .6rem .75rem;
  border-radius: .75rem;
  cursor: pointer;
  transition: background .1s;
  user-select: none;
}
.qb-pkg-option:hover             { background: #f8fafc; }
.qb-pkg-option--checked          { background: color-mix(in srgb, var(--color-primary,#6366f1) 6%, transparent); }
.qb-pkg-checkbox {
  width: 1.125rem;
  height: 1.125rem;
  border-radius: .3rem;
  border: 1.5px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #fff;
  transition: background .1s, border-color .1s;
}
.qb-pkg-option--checked .qb-pkg-checkbox {
  background: var(--color-primary, #6366f1);
  border-color: var(--color-primary, #6366f1);
}
.qb-pkg-checkbox svg { width: .7rem; height: .7rem; stroke: #fff; }
.qb-pkg-name { font-size: .8125rem; font-weight: 600; color: #1e293b; }
.qb-pkg-cat  { font-size: .6875rem; color: #94a3b8; margin-top: .1rem; }

/* ── Row action buttons ──────────────────────────────────────── */
.qb-row-actions { display: flex; gap: .25rem; align-items: center; justify-content: flex-end; padding-bottom: .1rem; }
.qb-action-btn {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: .625rem;
  border: none;
  cursor: pointer;
  transition: background .15s;
  background: transparent;
}
.qb-action-btn svg            { width: 1.125rem; height: 1.125rem; }
.qb-action-btn--danger        { color: #ef4444; }
.qb-action-btn--danger:hover  { background: #fef2f2; color: #dc2626; }
.qb-action-btn--primary       { color: var(--color-primary, #6366f1); }
.qb-action-btn--primary:hover { background: color-mix(in srgb, var(--color-primary,#6366f1) 10%, transparent); }

/* ── Package list ────────────────────────────────────────────── */
.qb-pkg-list { padding: 0 1.5rem; }

.qb-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 0;
  gap: .5rem;
}
.qb-empty svg { width: 2.25rem; height: 2.25rem; color: #cbd5e1; }
.qb-empty p   { font-size: .8125rem; color: #94a3b8; font-weight: 500; text-align: center; margin: 0; }

.qb-header-inputs {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  width: 100%;
}
@media (min-width: 768px) {
  .qb-header-inputs {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1.5fr) minmax(0, 1fr);
  }
}
.qb-header-limit {
  color: var(--color-primary, #6366f1);
  font-weight: 600;
  text-transform: none;
  margin-left: 0.25rem;
}

.qb-pkg-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  padding: 1.5rem 0;
  border-bottom: 1px solid #f1f5f9;
}
.qb-pkg-row:last-child { border-bottom: none; }

.qb-pkg-info-col {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.qb-pkg-cascade-col {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.qb-cascade-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.75rem;
  border: 1px dashed #e2e8f0;
  transition: all 0.2s ease;
}

@media (min-width: 640px) {
  .qb-cascade-row {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1.2fr);
  }
}

.qb-pkg-total-col {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding-top: 0.25rem;
}

.qb-pkg-total-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2.75rem;
  padding: 0 1rem;
  background: #f0fdf4;
  border: 1.5px solid #bbf7d0;
  border-radius: 0.75rem;
  color: #15803d;
  font-size: 1rem;
  font-weight: 800;
  text-align: center;
}

.qb-pkg-total-hint {
  font-size: 0.6875rem;
  color: #16a34a;
  text-align: center;
  margin-top: 0.25rem;
  font-weight: 600;
}

@media (min-width: 1024px) {
  .qb-pkg-row {
    grid-template-columns: 240px 1fr 180px;
    align-items: start;
  }
}

.qb-pkg-info     { display: flex; align-items: center; gap: .625rem; padding-top: .25rem; }
.qb-pkg-bar      { width: .25rem; height: 1.75rem; border-radius: .25rem; background: var(--color-primary,#6366f1); flex-shrink: 0; }
.qb-pkg-row-name { font-size: .875rem; font-weight: 700; color: #1e293b; }
.qb-pkg-row-hint { font-size: .6875rem; color: #94a3b8; margin-top: .1rem; }

.qb-pkg-field { display: flex; flex-direction: column; gap: .3rem; }

/* ── Footer ──────────────────────────────────────────────────── */
.qb-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}
.qb-footer-summary { display: flex; flex-direction: column; gap: .25rem; }
.qb-footer-count   { font-size: .875rem; font-weight: 600; color: #64748b; margin: 0; }
.qb-footer-total   { font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0; }
.qb-footer-amount  { font-size: 1.25rem; font-weight: 800; color: #16a34a; }
.qb-footer-actions { display: flex; flex-wrap: wrap; gap: .75rem; }

/* ── Animations ───────────────────────────────────────────────── */
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.animate-spin { animation: spin 1s linear infinite; }

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>