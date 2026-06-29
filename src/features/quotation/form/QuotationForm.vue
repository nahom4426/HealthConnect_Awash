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
                  <span v-if="row.selectedPackageUuuids.length === 1 && row.description" class="qb-header-limit">
                    (Limit: {{ getRangeDisplayForPackage(row.selectedPackageUuuids[0], getGroupPlanTypeForDescOptions(row), row.description) }})
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
                <!-- Teleported dropdown with search -->
                <Teleport to="body">
                  <div
                    v-if="openDropdownRowId === row.id"
                    class="qb-pkg-dropdown"
                    :style="getDropdownStyle(row.id)"
                    @click.stop
                    @mousedown.stop
                  >
                    <!-- Search input -->
                    <div class="qb-pkg-search-wrapper">
                      <svg class="qb-pkg-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                      </svg>
                      <input
                        type="text"
                        :value="getSearchQuery(row.id)"
                        @input="(e) => setSearchQuery(row.id, e.target.value)"
                        placeholder="Search packages..."
                        class="qb-pkg-search-input"
                        @click.stop
                        @mousedown.stop
                        @keydown.stop
                      />
                    </div>
                    
                    <!-- Package list -->
                    <div class="qb-pkg-options-list" @click.stop @mousedown.stop>
                      <div
                        v-for="pkg in filteredPackages(row.id)"
                        :key="pkg.packageUuid"
                        class="qb-pkg-option"
                        :class="{ 'qb-pkg-option--checked': row.selectedPackageUuuids.includes(pkg.packageUuid) }"
                        @click.stop="togglePackageInRow(row, pkg.packageUuid)"
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
                      <div v-if="filteredPackages(row.id).length === 0" class="qb-pkg-no-results">
                        No packages found matching your search.
                      </div>
                    </div>

                    <!-- Bulk actions -->
                    <div v-if="filteredPackages(row.id).length > 0" class="qb-pkg-bulk-actions" @click.stop @mousedown.stop>
                      <button 
                        type="button" 
                        @click.stop="selectAllFiltered(row)"
                        class="qb-pkg-bulk-btn"
                      >
                        Select All
                      </button>
                      <button 
                        type="button" 
                        @click.stop="clearAllFiltered(row)"
                        class="qb-pkg-bulk-btn"
                      >
                        Clear All
                      </button>
                      <span class="qb-pkg-bulk-count">
                        {{ filteredPackages(row.id).length }} package{{ filteredPackages(row.id).length > 1 ? 's' : '' }}
                      </span>
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
                    Sum Insured Limit: {{ getRangeDisplayForPackage(pkgUuid, row.packageConfigs[pkgUuid].planType, row.description) }}
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
                <!-- Same Sum Assured toggle -->
                <div class="qb-same-sa-toggle">
                  <label class="qb-toggle-wrap">
                    <input
                      type="checkbox"
                      v-model="row.packageConfigs[pkgUuid].sameSumAssured"
                      :disabled="readOnlyRows"
                      @change="handleSameSumAssuredToggle(row, pkgUuid)"
                      class="qb-toggle-checkbox"
                    />
                    <span class="qb-toggle-slider"></span>
                    <span class="qb-toggle-text">Same Sum Assured for all members</span>
                  </label>
                </div>

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
                        handleSameSumAssuredSync(row, pkgUuid);
                        recalculateRowPackage(row, pkgUuid); 
                      }"
                    />
                    <p class="qb-input-hint">{{ getLimitDisplayForMember(pkgUuid, row.packageConfigs[pkgUuid].planType, 'employee', row.description) }}</p>
                    <div v-if="getSumAssuredError(row, pkgUuid, 'employee') && (row.packageConfigs[pkgUuid].sumAssuredTouched || attemptedSubmit)" class="qb-error-hint qb-error-hint--inline">
                      {{ getSumAssuredError(row, pkgUuid, 'employee') }}
                    </div>
                  </div>
                  <div class="qb-pkg-field qb-meta-field">
                    <label class="qb-label">Rate</label>
                    <input
                      :value="formatRate(row.packageConfigs[pkgUuid].employeeRate) + '%'"
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

                <!-- Spouse Sum Assured Row (Member+1 or more) -->
                <div
                  v-if="!isMemberOnly(row.description)"
                  class="qb-cascade-row"
                  :class="{ 'qb-cascade-row--error': getSumAssuredError(row, pkgUuid, 'spouse') && (row.packageConfigs[pkgUuid].spouseSumAssuredTouched || attemptedSubmit) }"
                >
                  <div class="qb-pkg-field">
                    <label class="qb-label qb-label--colored">Spouse Sum Assured</label>
                    <input
                      v-model="row.packageConfigs[pkgUuid].spouseSumAssured"
                      type="number" min="0"
                      :disabled="readOnlyRows || !row.numberOfInsured || row.packageConfigs[pkgUuid].sameSumAssured"
                      class="qb-input qb-input--right"
                      :class="{ 'qb-input--error': getSumAssuredError(row, pkgUuid, 'spouse') && (row.packageConfigs[pkgUuid].spouseSumAssuredTouched || attemptedSubmit), 'qb-input--muted': row.packageConfigs[pkgUuid].sameSumAssured }"
                      placeholder="Enter amount"
                      @input="() => { 
                        row.packageConfigs[pkgUuid].spouseSumAssuredTouched = true;
                        recalculateRowPackage(row, pkgUuid); 
                      }"
                    />
                    <p class="qb-input-hint">{{ getLimitDisplayForMember(pkgUuid, row.packageConfigs[pkgUuid].planType, 'spouse', row.description) }}</p>
                    <div v-if="getSumAssuredError(row, pkgUuid, 'spouse') && (row.packageConfigs[pkgUuid].spouseSumAssuredTouched || attemptedSubmit)" class="qb-error-hint qb-error-hint--inline">
                      {{ getSumAssuredError(row, pkgUuid, 'spouse') }}
                    </div>
                  </div>
                  <div class="qb-pkg-field qb-meta-field">
                    <label class="qb-label">Rate</label>
                    <input
                      :value="formatRate(row.packageConfigs[pkgUuid].spouseRate) + '%'"
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

                <!-- Dependent Sum Assured Row (Member+2 or more) -->
                <div
                  v-if="!isMemberOnly(row.description) && !isMemberPlusOne(row.description)"
                  class="qb-cascade-row"
                  :class="{ 'qb-cascade-row--error': getSumAssuredError(row, pkgUuid, 'dependent') && (row.packageConfigs[pkgUuid].depSumAssuredTouched || attemptedSubmit) }"
                >
                  <div class="qb-pkg-field">
                    <label class="qb-label qb-label--colored">Dependent Sum Assured</label>
                    <input
                      v-model="row.packageConfigs[pkgUuid].depSumAssured"
                      type="number" min="0"
                      :disabled="readOnlyRows || !row.numberOfInsured || row.packageConfigs[pkgUuid].sameSumAssured"
                      class="qb-input qb-input--right"
                      :class="{ 'qb-input--error': getSumAssuredError(row, pkgUuid, 'dependent') && (row.packageConfigs[pkgUuid].depSumAssuredTouched || attemptedSubmit), 'qb-input--muted': row.packageConfigs[pkgUuid].sameSumAssured }"
                      placeholder="Enter amount"
                      @input="() => { 
                        row.packageConfigs[pkgUuid].depSumAssuredTouched = true;
                        recalculateRowPackage(row, pkgUuid); 
                      }"
                    />
                    <p class="qb-input-hint">{{ getLimitDisplayForMember(pkgUuid, row.packageConfigs[pkgUuid].planType, 'dependent', row.description) }}</p>
                    <div v-if="getSumAssuredError(row, pkgUuid, 'dependent') && (row.packageConfigs[pkgUuid].depSumAssuredTouched || attemptedSubmit)" class="qb-error-hint qb-error-hint--inline">
                      {{ getSumAssuredError(row, pkgUuid, 'dependent') }}
                    </div>
                  </div>
                  <div class="qb-pkg-field qb-meta-field">
                    <label class="qb-label">Rate</label>
                    <input
                      :value="formatRate(row.packageConfigs[pkgUuid].dependentRate) + '%'"
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
                    <p class="qb-input-hint">{{ getLimitDisplayForMember(pkgUuid, row.packageConfigs[pkgUuid].planType, 'employee', row.description) }}</p>
                    <div v-if="getSumAssuredError(row, pkgUuid, 'employee') && (row.packageConfigs[pkgUuid].sumAssuredTouched || attemptedSubmit)" class="qb-error-hint qb-error-hint--inline">
                      {{ getSumAssuredError(row, pkgUuid, 'employee') }}
                    </div>
                  </div>
                  <div class="qb-pkg-field qb-meta-field">
                    <label class="qb-label">Rate</label>
                    <input
                      :value="formatRate(row.packageConfigs[pkgUuid].employeeRate) + '%'"
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
                    <p class="qb-input-hint">{{ getLimitDisplayForMember(pkgUuid, row.packageConfigs[pkgUuid].planType, 'spouse', row.description) }}</p>
                    <div v-if="getSumAssuredError(row, pkgUuid, 'spouse') && (row.packageConfigs[pkgUuid].spouseSumAssuredTouched || attemptedSubmit)" class="qb-error-hint qb-error-hint--inline">
                      {{ getSumAssuredError(row, pkgUuid, 'spouse') }}
                    </div>
                  </div>
                  <div class="qb-pkg-field qb-meta-field">
                    <label class="qb-label">Rate</label>
                    <input
                      :value="formatRate(row.packageConfigs[pkgUuid].spouseRate) + '%'"
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
                    <p class="qb-input-hint">{{ getLimitDisplayForMember(pkgUuid, row.packageConfigs[pkgUuid].planType, 'dependent', row.description) }}</p>
                    <div v-if="getSumAssuredError(row, pkgUuid, 'dependent') && (row.packageConfigs[pkgUuid].depSumAssuredTouched || attemptedSubmit)" class="qb-error-hint qb-error-hint--inline">
                      {{ getSumAssuredError(row, pkgUuid, 'dependent') }}
                    </div>
                  </div>
                  <div class="qb-pkg-field qb-meta-field">
                    <label class="qb-label">Rate</label>
                    <input
                      :value="formatRate(row.packageConfigs[pkgUuid].dependentRate) + '%'"
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
                    <p class="qb-input-hint">{{ getLimitDisplayForMember(pkgUuid, row.packageConfigs[pkgUuid].planType, 'employee', row.description) }}</p>
                    <div v-if="getSumAssuredError(row, pkgUuid, 'employee') && (row.packageConfigs[pkgUuid].sumAssuredTouched || attemptedSubmit)" class="qb-error-hint qb-error-hint--inline">
                      {{ getSumAssuredError(row, pkgUuid, 'employee') }}
                    </div>
                  </div>
                  <div class="qb-pkg-field qb-meta-field">
                    <label class="qb-label">Rate</label>
                    <input
                      :value="formatRate(row.packageConfigs[pkgUuid].employeeRate) + '%'"
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
                    <p class="qb-input-hint">{{ getLimitDisplayForMember(pkgUuid, row.packageConfigs[pkgUuid].planType, 'dependent', row.description) }}</p>
                    <div v-if="getSumAssuredError(row, pkgUuid, 'dependent') && (row.packageConfigs[pkgUuid].depSumAssuredTouched || attemptedSubmit)" class="qb-error-hint qb-error-hint--inline">
                      {{ getSumAssuredError(row, pkgUuid, 'dependent') }}
                    </div>
                  </div>
                  <div class="qb-pkg-field qb-meta-field">
                    <label class="qb-label">Rate</label>
                    <input
                      :value="formatRate(row.packageConfigs[pkgUuid].dependentRate) + '%'"
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
                    <p class="qb-input-hint">Limit: {{ getRangeDisplayForPackage(pkgUuid, row.packageConfigs[pkgUuid].planType, row.description) }}</p>
                    <div v-if="getCoverageError(row, pkgUuid) && (row.packageConfigs[pkgUuid].coverageTouched || attemptedSubmit)" class="qb-error-hint qb-error-hint--inline">
                      {{ getCoverageError(row, pkgUuid) }}
                    </div>
                  </div>
                  <div class="qb-pkg-field qb-meta-field">
                    <label class="qb-label">Rate</label>
                    <input
                      :value="formatRate(row.packageConfigs[pkgUuid].rate) + '%'"
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
                <p class="qb-pkg-total-hint">
                  Calculated premium
                  <span v-if="activeDiscountMap[pkgUuid] > 0" class="qb-discount-note">
                    ({{ activeDiscountMap[pkgUuid] }}% discount applied)
                  </span>
                </p>
              </div>
            </div>
          </div><!-- /.qb-pkg-row -->
        </div><!-- /.qb-pkg-list -->

      </div><!-- /.qb-card -->
    </div><!-- /.qb-groups -->

    <!-- Discount Panel -->
    <div v-if="!readOnlyRows" class="qb-discount-panel">
      <button type="button" class="qb-discount-toggle-btn" @click="discountPanelOpen = !discountPanelOpen">
        <svg class="qb-discount-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M17 17h.01M6.5 17.5l11-11M9 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm6 6a2.5 2.5 0 100 5 2.5 2.5 0 000-5z"/>
        </svg>
        <span>Discount Configuration</span>
        <span v-if="Object.values(activeDiscountMap).some(d => d > 0)" class="qb-discount-active-badge">Active</span>
        <svg class="qb-pkg-btn__chevron" :class="{ rotated: discountPanelOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      <div v-if="discountPanelOpen && allSelectedPackageUuids.length > 0" class="qb-discount-body">
        <p class="qb-discount-hint">Set discount percentage per package. Discounts apply across all benefit groups using the same package.</p>
        <div class="qb-discount-list">
          <div v-for="pkgUuid in allSelectedPackageUuids" :key="pkgUuid" class="qb-discount-item">
            <div class="qb-discount-item-info">
              <span class="qb-pkg-bar"></span>
              <span class="qb-discount-pkg-name">{{ getPackageName(pkgUuid) }}</span>
            </div>
            <div class="qb-discount-controls">
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                :data-pkg="pkgUuid"
                :style="{ '--val': activeDiscountMap[pkgUuid] || 0 }"
                :value="activeDiscountMap[pkgUuid] || 0"
                @input="(e) => setDiscount(pkgUuid, e.target.value)"
                class="qb-discount-slider"
              />
              <div class="qb-discount-input-wrap">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  :value="activeDiscountMap[pkgUuid] || 0"
                  @input="(e) => setDiscount(pkgUuid, e.target.value)"
                  class="qb-input qb-input--center qb-discount-number"
                />
                <span class="qb-discount-pct">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="discountPanelOpen && allSelectedPackageUuids.length === 0" class="qb-discount-body qb-discount-empty">
        <p>No packages selected yet. Add packages to benefit groups first.</p>
      </div>
    </div>

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
    sameSumAssured: false,
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
    discountMap:          { type: Object, default: () => ({}) },
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
      discountPanelOpen: false,
      internalDiscountMap: {},
      packageSearchQuery: {},
    };
  },

  computed: {
    allPackages() { return this.packages; },

    allSelectedPackageUuids() {
      const seen = new Set();
      this.groupRows.forEach(row =>
        row.selectedPackageUuuids.forEach(u => seen.add(u))
      );
      return Array.from(seen);
    },
  
    activeDiscountMap() {
      return { ...this.discountMap, ...this.internalDiscountMap };
    },
    
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

          const planType = this.normalizeValue(config.planType);
          const description = this.normalizeValue(row.description);
          
          let empMinLimit, empMaxLimit, spouseMinLimit, spouseMaxLimit, depMinLimit, depMaxLimit;
          
          if (this.isIndividualPlan(planType)) {
            empMinLimit = this.getMinLimitForPlanType(pkgUuid, "Individual_Plan", 1);
            empMaxLimit = this.getMaxLimitForPlanType(pkgUuid, "Individual_Plan", 1);
            spouseMinLimit = empMinLimit;
            spouseMaxLimit = empMaxLimit;
            depMinLimit = empMinLimit;
            depMaxLimit = empMaxLimit;
          } else if (this.isDualPremiumPlan(planType)) {
            empMinLimit = this.getMinLimitForPlanType(pkgUuid, "Individual_Plan", 1);
            empMaxLimit = this.getMaxLimitForPlanType(pkgUuid, "Individual_Plan", 1);
            spouseMinLimit = empMinLimit;
            spouseMaxLimit = empMaxLimit;
            const depFamilySize = Math.max(1, (Number(description) || 1) - 2);
            depMinLimit = this.getMinLimitForPlanType(pkgUuid, "Family_Shared_Plan", depFamilySize);
            depMaxLimit = this.getMaxLimitForPlanType(pkgUuid, "Family_Shared_Plan", depFamilySize);
          } else if (this.isDependentSharedPlan(planType)) {
            empMinLimit = this.getMinLimitForPlanType(pkgUuid, "Individual_Plan", 1);
            empMaxLimit = this.getMaxLimitForPlanType(pkgUuid, "Individual_Plan", 1);
            const depFamilySize = Math.max(1, (Number(description) || 1) - 1);
            depMinLimit = this.getMinLimitForPlanType(pkgUuid, "Family_Shared_Plan", depFamilySize);
            depMaxLimit = this.getMaxLimitForPlanType(pkgUuid, "Family_Shared_Plan", depFamilySize);
          } else {
            empMinLimit = this.getPackageMinLimit(pkgUuid, config.planType, row.description);
            empMaxLimit = this.getPackageMaxLimit(pkgUuid, config.planType, row.description);
          }

          const empRangeText = `${this.formatNumber(empMinLimit)} – ${this.formatNumber(empMaxLimit)}`;

          if (this.isIndividualPlan(planType)) {
            const emp = Number(config.sumAssured);
            if (!emp || emp <= 0) {
              errors.push(`${this.getPackageName(pkgUuid)}: Employee Sum Assured is required (Limit: ${empRangeText}).`);
            } else if (emp < empMinLimit || emp > empMaxLimit) {
              errors.push(`${this.getPackageName(pkgUuid)}: Employee Sum Assured must be between ${empRangeText}. Current value: ${this.formatNumber(emp)}.`);
            }
            
            if (!this.isMemberOnly(row.description)) {
              const spouse = Number(config.spouseSumAssured);
              if (!spouse || spouse <= 0) {
                errors.push(`${this.getPackageName(pkgUuid)}: Spouse Sum Assured is required (Limit: ${empRangeText}).`);
              } else if (spouse < spouseMinLimit || spouse > spouseMaxLimit) {
                errors.push(`${this.getPackageName(pkgUuid)}: Spouse Sum Assured must be between ${empRangeText}. Current value: ${this.formatNumber(spouse)}.`);
              }
            }
            
            if (!this.isMemberOnly(row.description) && !this.isMemberPlusOne(row.description)) {
              const dep = Number(config.depSumAssured);
              if (!dep || dep <= 0) {
                errors.push(`${this.getPackageName(pkgUuid)}: Dependent Sum Assured is required (Limit: ${empRangeText}).`);
              } else if (dep < depMinLimit || dep > depMaxLimit) {
                errors.push(`${this.getPackageName(pkgUuid)}: Dependent Sum Assured must be between ${empRangeText}. Current value: ${this.formatNumber(dep)}.`);
              }
            }
          } else if (this.isDualPremiumPlan(planType)) {
            const emp = Number(config.sumAssured);
            const spouse = Number(config.spouseSumAssured);
            const depRangeText = `${this.formatNumber(depMinLimit)} – ${this.formatNumber(depMaxLimit)}`;
            
            if (!emp || emp <= 0) {
              errors.push(`${this.getPackageName(pkgUuid)}: Employee Sum Assured is required (Limit: ${empRangeText}).`);
            } else if (emp < empMinLimit || emp > empMaxLimit) {
              errors.push(`${this.getPackageName(pkgUuid)}: Employee Sum Assured must be between ${empRangeText}. Current value: ${this.formatNumber(emp)}.`);
            }
            
            if (!spouse || spouse <= 0) {
              errors.push(`${this.getPackageName(pkgUuid)}: Spouse Sum Assured is required (Limit: ${empRangeText}).`);
            } else if (spouse < spouseMinLimit || spouse > spouseMaxLimit) {
              errors.push(`${this.getPackageName(pkgUuid)}: Spouse Sum Assured must be between ${empRangeText}. Current value: ${this.formatNumber(spouse)}.`);
            }
            
            if (!this.isMemberPlusOne(row.description)) {
              const dep = Number(config.depSumAssured);
              if (!dep || dep <= 0) {
                errors.push(`${this.getPackageName(pkgUuid)}: Dependent Sum Assured is required (Limit: ${depRangeText}).`);
              } else if (dep < depMinLimit || dep > depMaxLimit) {
                errors.push(`${this.getPackageName(pkgUuid)}: Dependent Sum Assured must be between ${depRangeText}. Current value: ${this.formatNumber(dep)}.`);
              }
            }
          } else if (this.isDependentSharedPlan(planType)) {
            const emp = Number(config.sumAssured);
            const dep = Number(config.depSumAssured);
            const depRangeText = `${this.formatNumber(depMinLimit)} – ${this.formatNumber(depMaxLimit)}`;
            
            if (!emp || emp <= 0) {
              errors.push(`${this.getPackageName(pkgUuid)}: Employee Sum Assured is required (Limit: ${empRangeText}).`);
            } else if (emp < empMinLimit || emp > empMaxLimit) {
              errors.push(`${this.getPackageName(pkgUuid)}: Employee Sum Assured must be between ${empRangeText}. Current value: ${this.formatNumber(emp)}.`);
            }
            
            if (!dep || dep <= 0) {
              errors.push(`${this.getPackageName(pkgUuid)}: Dependent Sum Assured is required (Limit: ${depRangeText}).`);
            } else if (dep < depMinLimit || dep > depMaxLimit) {
              errors.push(`${this.getPackageName(pkgUuid)}: Dependent Sum Assured must be between ${depRangeText}. Current value: ${this.formatNumber(dep)}.`);
            }
          } else {
            const coverage = Number(this.normalizeValue(config.coverage));
            if (!Number.isFinite(coverage) || coverage <= 0) {
              errors.push(`${this.getPackageName(pkgUuid)}: Coverage amount is required (Limit: ${empRangeText}).`);
            } else if ((empMinLimit > 0 || empMaxLimit > 0) && (coverage < empMinLimit || coverage > empMaxLimit)) {
              errors.push(`${this.getPackageName(pkgUuid)}: Coverage amount must be between ${empRangeText}. Current value: ${this.formatNumber(coverage)}.`);
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
    discountMap: {
      handler(newVal) {
        this.internalDiscountMap = newVal ? { ...newVal } : {};
      },
      immediate: true,
      deep: true,
    },
  },

  mounted() {
    this.clickOutsideHandler = (e) => {
      const isInsideDropdown = e.target.closest(".qb-pkg-dropdown");
      const isInsideButton = e.target.closest(".qb-pkg-btn");
      const isInsideWrapper = e.target.closest(".package-dropdown-wrapper");
      
      if (this.openDropdownRowId && !isInsideDropdown && !isInsideButton && !isInsideWrapper) {
        const rowId = this.openDropdownRowId;
        this.openDropdownRowId = null;
        this.packageSearchQuery[rowId] = '';
      }
    };
    this.scrollHandler = () => { 
      if (this.openDropdownRowId) {
        const rowId = this.openDropdownRowId;
        this.openDropdownRowId = null;
        this.packageSearchQuery[rowId] = '';
      }
    };
    document.addEventListener("click", this.clickOutsideHandler);
    window.addEventListener("scroll", this.scrollHandler, true);
  },

  beforeUnmount() {
    document.removeEventListener("click", this.clickOutsideHandler);
    window.removeEventListener("scroll", this.scrollHandler, true);
  },

  methods: {
    // ── Format Rate as Percentage ─────────────────────────────
   formatRate(rate) { 
  if (!rate && rate !== 0) return "0.0000";
  
  // Convert to percentage
  const percentage = Number(rate) * 100;
  
  // Use toFixed with 10 decimal places to handle floating point precision
  let formatted = percentage.toFixed(10);
  
  // Remove trailing zeros but keep at least 4 decimal places
  let parts = formatted.split('.');
  let decimalPart = parts[1];
  
  // Find where significant digits end
  let significantEnd = decimalPart.length;
  for (let i = decimalPart.length - 1; i >= 4; i--) {
    if (decimalPart[i] !== '0') {
      significantEnd = i + 1;
      break;
    }
  }
  
  // Keep at least 4 decimal places
  if (significantEnd < 4) significantEnd = 4;
  
  decimalPart = decimalPart.substring(0, significantEnd);
  formatted = parts[0] + '.' + decimalPart;
  
  // If all decimal places are zeros, remove the decimal point
  if (decimalPart.replace(/0/g, '').length === 0) {
    formatted = parts[0];
  }
  
  return formatted;
},

    // ── Search methods ──────────────────────────────────────
    getSearchQuery(rowId) {
      return this.packageSearchQuery[rowId] || '';
    },

    setSearchQuery(rowId, value) {
      this.packageSearchQuery = { ...this.packageSearchQuery, [rowId]: value };
    },

    filteredPackages(rowId) {
      const query = this.getSearchQuery(rowId);
      if (!query.trim()) return this.allPackages;
      
      const lowerQuery = query.toLowerCase().trim();
      return this.allPackages.filter(pkg => 
        pkg.packageName.toLowerCase().includes(lowerQuery) ||
        pkg.packageCategory.toLowerCase().includes(lowerQuery)
      );
    },

    selectAllFiltered(row) {
      const filtered = this.filteredPackages(row.id);
      filtered.forEach(pkg => {
        if (!row.selectedPackageUuuids.includes(pkg.packageUuid)) {
          row.selectedPackageUuuids.push(pkg.packageUuid);
          const newConfig = emptyConfig();
          newConfig.genderCount = 0;
          newConfig.genderTouched = false;
          row.packageConfigs = { ...row.packageConfigs, [pkg.packageUuid]: newConfig };
          this.ensureRatesLoaded(pkg.packageUuid);
        }
      });
      row.selectedPackageUuuids.forEach(pkgUuid => {
        this.setRateFromCacheForPackage(row, pkgUuid);
        this._calcPremium(row, pkgUuid);
      });
      this.handleRowChange(row);
    },

    clearAllFiltered(row) {
      const filtered = this.filteredPackages(row.id);
      filtered.forEach(pkg => {
        const idx = row.selectedPackageUuuids.indexOf(pkg.packageUuid);
        if (idx > -1) {
          row.selectedPackageUuuids.splice(idx, 1);
          delete row.packageConfigs[pkg.packageUuid];
        }
      });
      this.handleRowChange(row);
    },

    // ── Same Sum Assured methods ────────────────────────────────
    handleSameSumAssuredToggle(row, pkgUuid) {
      const config = row.packageConfigs[pkgUuid];
      if (!config) return;
      if (config.sameSumAssured && config.sumAssured) {
        config.spouseSumAssured = config.sumAssured;
        config.depSumAssured    = config.sumAssured;
        config.spouseSumAssuredTouched = true;
        config.depSumAssuredTouched    = true;
      }
      this.recalculateRowPackage(row, pkgUuid);
    },

    handleSameSumAssuredSync(row, pkgUuid) {
      const config = row.packageConfigs[pkgUuid];
      if (!config) return;
      if (config.sameSumAssured) {
        config.spouseSumAssured = config.sumAssured;
        config.depSumAssured    = config.sumAssured;
      }
    },

    setDiscount(pkgUuid, value) {
      const v = Math.min(100, Math.max(0, Number(value) || 0));
      this.internalDiscountMap = { ...this.internalDiscountMap, [pkgUuid]: v };
      
      this.$nextTick(() => {
        document.querySelectorAll('.qb-discount-slider').forEach(el => {
          el.style.setProperty('--val', String(this.activeDiscountMap[el.dataset.pkg] || 0));
        });
      });
      this.groupRows.forEach(row => {
        if (row.selectedPackageUuuids.includes(pkgUuid)) {
          this.setRateFromCacheForPackage(row, pkgUuid);
          this._calcPremium(row, pkgUuid);
        }
      });
    },

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

    // ── New helper methods for limits ──────────────────────────
    getMinLimitForPlanType(uuid, planType, familySize) {
      const rates = this.getRatesForPackage(uuid);
      let filteredRates = rates.filter(r => 
        r.planType === planType && Number(r.familySize) === familySize
      );
      
      if (!filteredRates.length) {
        filteredRates = rates.filter(r => r.planType === planType);
      }
      
      if (filteredRates.length) {
        const mins = filteredRates.map(r => r.minBalance ?? r.minLimit).filter(x => x != null);
        return mins.length ? Math.min(...mins) : 0;
      }
      return 0;
    },

    getMaxLimitForPlanType(uuid, planType, familySize) {
      const rates = this.getRatesForPackage(uuid);
      let filteredRates = rates.filter(r => 
        r.planType === planType && Number(r.familySize) === familySize
      );
      
      if (!filteredRates.length) {
        filteredRates = rates.filter(r => r.planType === planType);
      }
      
      if (filteredRates.length) {
        const maxs = filteredRates.map(r => r.maxBalance ?? r.maxLimit).filter(x => x != null);
        return maxs.length ? Math.max(...maxs) : 0;
      }
      return 0;
    },

    getLimitDisplayForMember(pkgUuid, planType, memberType, description) {
      const desc = Number(description) || 1;
      
      if (memberType === 'employee' || memberType === 'spouse') {
        const min = this.getMinLimitForPlanType(pkgUuid, "Individual_Plan", 1);
        const max = this.getMaxLimitForPlanType(pkgUuid, "Individual_Plan", 1);
        return `Individual Plan: ${this.formatNumber(min)} – ${this.formatNumber(max)}`;
      } else if (memberType === 'dependent') {
        if (this.isDualPremiumPlan(planType)) {
          const depSize = Math.max(1, desc - 2);
          const min = this.getMinLimitForPlanType(pkgUuid, "Family_Shared_Plan", depSize);
          const max = this.getMaxLimitForPlanType(pkgUuid, "Family_Shared_Plan", depSize);
          return `Family Shared (size ${depSize}): ${this.formatNumber(min)} – ${this.formatNumber(max)}`;
        } else if (this.isDependentSharedPlan(planType)) {
          const depSize = Math.max(1, desc - 1);
          const min = this.getMinLimitForPlanType(pkgUuid, "Family_Shared_Plan", depSize);
          const max = this.getMaxLimitForPlanType(pkgUuid, "Family_Shared_Plan", depSize);
          return `Family Shared (size ${depSize}): ${this.formatNumber(min)} – ${this.formatNumber(max)}`;
        } else {
          const min = this.getMinLimitForPlanType(pkgUuid, "Individual_Plan", 1);
          const max = this.getMaxLimitForPlanType(pkgUuid, "Individual_Plan", 1);
          return `Individual Plan: ${this.formatNumber(min)} – ${this.formatNumber(max)}`;
        }
      }
      return '';
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
      
      const planType = this.normalizeValue(config.planType);
      const description = this.normalizeValue(row.description);
      const desc = Number(description) || 1;
      
      let minLimit, maxLimit;
      
      if (type === 'employee' || type === 'spouse') {
        minLimit = this.getMinLimitForPlanType(pkgUuid, "Individual_Plan", 1);
        maxLimit = this.getMaxLimitForPlanType(pkgUuid, "Individual_Plan", 1);
      } else if (type === 'dependent') {
        if (this.isDualPremiumPlan(planType)) {
          const depSize = Math.max(1, desc - 2);
          minLimit = this.getMinLimitForPlanType(pkgUuid, "Family_Shared_Plan", depSize);
          maxLimit = this.getMaxLimitForPlanType(pkgUuid, "Family_Shared_Plan", depSize);
        } else if (this.isDependentSharedPlan(planType)) {
          const depSize = Math.max(1, desc - 1);
          minLimit = this.getMinLimitForPlanType(pkgUuid, "Family_Shared_Plan", depSize);
          maxLimit = this.getMaxLimitForPlanType(pkgUuid, "Family_Shared_Plan", depSize);
        } else {
          minLimit = this.getMinLimitForPlanType(pkgUuid, "Individual_Plan", 1);
          maxLimit = this.getMaxLimitForPlanType(pkgUuid, "Individual_Plan", 1);
        }
      }
      
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
      
      const minLimit = this.getPackageMinLimit(pkgUuid, config.planType, row.description);
      const maxLimit = this.getPackageMaxLimit(pkgUuid, config.planType, row.description);
      
      if ((minLimit > 0 || maxLimit > 0) && (coverage < minLimit || coverage > maxLimit)) {
        return `Must be between ${this.formatNumber(minLimit)} – ${this.formatNumber(maxLimit)}`;
      }
      
      return null;
    },

    // ── Dropdown ──────────────────────────────────────────────
    toggleDropdown(rowId) {
      if (this.openDropdownRowId === rowId) { 
        this.openDropdownRowId = null;
        this.packageSearchQuery[rowId] = '';
        return; 
      }
      
      if (this.openDropdownRowId) {
        const oldRowId = this.openDropdownRowId;
        this.packageSearchQuery[oldRowId] = '';
      }
      
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
      this.packageSearchQuery = { ...this.packageSearchQuery, [rowId]: '' };
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

    getPackageMinLimit(uuid, planType = null, description = null) {
      const pkg = this.packages.find(p => p.packageUuid === uuid);
      const v = Number(
        pkg?.minBalance ?? pkg?.minLimit ?? pkg?.min_limit ?? pkg?.minimumLimit ?? pkg?.minimum_limit ?? pkg?.minCoverage ?? pkg?.min_coverage ?? 0
      );
      if (v > 0) return v;
      
      const rates = this.getRatesForPackage(uuid);
      if (rates.length) {
        let filteredRates = rates;
        if (planType) {
          const apiPlanType = this.mapPlanTypeToApi(planType);
          filteredRates = filteredRates.filter(r => r.planType === apiPlanType);
        }
        if (description) {
          const familySize = Number(description) || 1;
          filteredRates = filteredRates.filter(r => Number(r.familySize) === familySize);
        }
        
        if (filteredRates.length) {
          const mins = filteredRates.map(r => r.minBalance ?? r.minLimit).filter(x => x != null);
          return mins.length ? Math.min(...mins) : 0;
        }
      }
      return 0;
    },

    getPackageMaxLimit(uuid, planType = null, description = null) {
      const pkg = this.packages.find(p => p.packageUuid === uuid);
      const v = Number(
        pkg?.maxBalance ?? pkg?.maxLimit ?? pkg?.max_limit ?? pkg?.maximumLimit ?? pkg?.maximum_limit ?? pkg?.maxCoverage ?? pkg?.max_coverage ?? 0
      );
      if (v > 0) return v;
      
      const rates = this.getRatesForPackage(uuid);
      if (rates.length) {
        let filteredRates = rates;
        if (planType) {
          const apiPlanType = this.mapPlanTypeToApi(planType);
          filteredRates = filteredRates.filter(r => r.planType === apiPlanType);
        }
        if (description) {
          const familySize = Number(description) || 1;
          filteredRates = filteredRates.filter(r => Number(r.familySize) === familySize);
        }
        
        if (filteredRates.length) {
          const maxs = filteredRates.map(r => r.maxBalance ?? r.maxLimit).filter(x => x != null);
          return maxs.length ? Math.max(...maxs) : 0;
        }
      }
      return 0;
    },

    getRangeDisplayForPackage(uuid, planType = null, description = null) {
      return `${this.formatNumber(this.getPackageMinLimit(uuid, planType, description))} – ${this.formatNumber(this.getPackageMaxLimit(uuid, planType, description))}`;
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
      
      const planType = this.normalizeValue(config.planType);
      const description = this.normalizeValue(row.description);
      const desc = Number(description) || 1;
      
      let empMinLimit, empMaxLimit, depMinLimit, depMaxLimit;
      
      if (this.isDualPremiumPlan(planType)) {
        empMinLimit = this.getMinLimitForPlanType(packageUuid, "Individual_Plan", 1);
        empMaxLimit = this.getMaxLimitForPlanType(packageUuid, "Individual_Plan", 1);
        const depFamilySize = Math.max(1, desc - 2);
        depMinLimit = this.getMinLimitForPlanType(packageUuid, "Family_Shared_Plan", depFamilySize);
        depMaxLimit = this.getMaxLimitForPlanType(packageUuid, "Family_Shared_Plan", depFamilySize);
      } else if (this.isDependentSharedPlan(planType)) {
        empMinLimit = this.getMinLimitForPlanType(packageUuid, "Individual_Plan", 1);
        empMaxLimit = this.getMaxLimitForPlanType(packageUuid, "Individual_Plan", 1);
        const depFamilySize = Math.max(1, desc - 1);
        depMinLimit = this.getMinLimitForPlanType(packageUuid, "Family_Shared_Plan", depFamilySize);
        depMaxLimit = this.getMaxLimitForPlanType(packageUuid, "Family_Shared_Plan", depFamilySize);
      } else {
        empMinLimit = this.getMinLimitForPlanType(packageUuid, "Individual_Plan", 1);
        empMaxLimit = this.getMaxLimitForPlanType(packageUuid, "Individual_Plan", 1);
        depMinLimit = empMinLimit;
        depMaxLimit = empMaxLimit;
      }
      
      let wasClamped = false;
      
      if (config.sumAssured != null && config.sumAssured !== "") {
        const clamped = clamp(config.sumAssured, empMinLimit, empMaxLimit);
        if (clamped !== Number(config.sumAssured)) {
          wasClamped = true;
          config.sumAssured = clamped;
        }
      }
      if (config.spouseSumAssured != null && config.spouseSumAssured !== "") {
        const clamped = clamp(config.spouseSumAssured, empMinLimit, empMaxLimit);
        if (clamped !== Number(config.spouseSumAssured)) {
          wasClamped = true;
          config.spouseSumAssured = clamped;
        }
      }
      if (config.depSumAssured != null && config.depSumAssured !== "") {
        const clamped = clamp(config.depSumAssured, depMinLimit, depMaxLimit);
        if (clamped !== Number(config.depSumAssured)) {
          wasClamped = true;
          config.depSumAssured = clamped;
        }
      }
      
      if (wasClamped && (config.sumAssuredTouched || config.depSumAssuredTouched || config.spouseSumAssuredTouched)) {
        this.showToast(`Value adjusted to within limit`, 'warning');
      }
      
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
        const ratesToUse = matched.length > 0 ? matched : rates.filter(r => r.planType === "Individual_Plan");
        
        config.employeeRate = this.findRateForAmount(ratesToUse, config.sumAssured);
        config.spouseRate = this.findRateForAmount(ratesToUse, config.spouseSumAssured || config.sumAssured);
        config.dependentRate = this.findRateForAmount(ratesToUse, config.depSumAssured || config.sumAssured);
        config.rate = config.employeeRate || config.spouseRate || config.dependentRate;

      } else if (this.isFamilySharedPlan(planType)) {
        const familySize = desc;
        const matched = rates.filter(r => 
          r.planType === "Family_Shared_Plan" && Number(r.familySize) === familySize
        );
        const ratesToUse = matched.length > 0 ? matched : rates.filter(r => r.planType === "Family_Shared_Plan");
        config.rate = this.findRateForAmount(ratesToUse, config.coverage);

      } else if (this.isDependentSharedPlan(planType)) {
        const dependentFamilySize = Math.max(1, desc - 1);
        
        const empMatched = rates.filter(r => 
          r.planType === "Individual_Plan" && Number(r.familySize) === 1
        );
        const depMatched = rates.filter(r => 
          r.planType === "Family_Shared_Plan" && Number(r.familySize) === dependentFamilySize
        );
        
        const empRatesToUse = empMatched.length > 0 ? empMatched : rates.filter(r => r.planType === "Individual_Plan");
        const depRatesToUse = depMatched.length > 0 ? depMatched : rates.filter(r => r.planType === "Family_Shared_Plan");
        
        config.employeeRate = this.findRateForAmount(empRatesToUse, config.sumAssured);
        config.dependentRate = this.findRateForAmount(depRatesToUse, config.depSumAssured);
        config.rate = (config.employeeRate + config.dependentRate) / 2;

      } else if (this.isDualPremiumPlan(planType)) {
        const dependentFamilySize = Math.max(1, desc - 2);
        
        const empMatched = rates.filter(r => 
          r.planType === "Individual_Plan" && Number(r.familySize) === 1
        );
        const depMatched = rates.filter(r => 
          r.planType === "Family_Shared_Plan" && Number(r.familySize) === dependentFamilySize
        );
        
        const empRatesToUse = empMatched.length > 0 ? empMatched : rates.filter(r => r.planType === "Individual_Plan");
        const depRatesToUse = depMatched.length > 0 ? depMatched : rates.filter(r => r.planType === "Family_Shared_Plan");
        
        config.employeeRate = this.findRateForAmount(empRatesToUse, config.sumAssured);
        config.spouseRate = this.findRateForAmount(empRatesToUse, config.spouseSumAssured);
        config.dependentRate = this.findRateForAmount(depRatesToUse, config.depSumAssured);
        
        if (this.isMemberPlusOne(description)) {
          config.dependentRate = 0;
          config.rate = (config.employeeRate + config.spouseRate) / 2;
        } else {
          config.rate = (config.employeeRate + config.spouseRate + config.dependentRate) / 3;
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

      let baseEmployeePremium = 0;
      let baseSpousePremium = 0;
      let baseDependentPremium = 0;
      let baseTotalPremium = 0;

      if (this.isIndividualPlan(planType)) {
        const empCov = Number(config.sumAssured) || 0;
        const spouseCov = Number(config.spouseSumAssured) || 0;
        const depCov = Number(config.depSumAssured) || 0;
        const empRate = config.employeeRate || 0;
        const spouseRate = config.spouseRate || empRate;
        const depRate = config.dependentRate || empRate;
        const isMO = this.isMemberOnly(description);
        const isMPO = this.isMemberPlusOne(description);

        baseEmployeePremium = empCov * effectiveCount * empRate;

        if (isMO) {
          baseSpousePremium = 0;
          baseDependentPremium = 0;
          config.sumInsured = empCov * effectiveCount;
        } else if (isMPO) {
          baseSpousePremium = spouseCov * effectiveCount * spouseRate;
          baseDependentPremium = 0;
          config.sumInsured = (empCov + spouseCov) * effectiveCount;
        } else {
          const numberOfDependents = (Number(description) - 2) || 0;
          baseSpousePremium = spouseCov * effectiveCount * spouseRate;
          baseDependentPremium = depCov * effectiveCount * numberOfDependents * depRate;
          config.sumInsured = (empCov * effectiveCount) + (spouseCov * effectiveCount) + (depCov * effectiveCount * numberOfDependents);
        }
        baseTotalPremium = baseEmployeePremium + baseSpousePremium + baseDependentPremium;

      } else if (this.isDependentSharedPlan(planType)) {
        const empCov = Number(config.sumAssured) || 0;
        const depCov = Number(config.depSumAssured) || 0;
        const empRate = config.employeeRate || 0;
        const depRate = config.dependentRate || 0;
        
        baseEmployeePremium = empCov * effectiveCount * empRate;
        baseDependentPremium = depCov * effectiveCount * depRate;
        
        config.sumInsured = (empCov * effectiveCount) + (depCov * effectiveCount);
        baseTotalPremium = baseEmployeePremium + baseDependentPremium;

      } else if (this.isDualPremiumPlan(planType)) {
        const empCov = Number(config.sumAssured) || 0;
        const spouseCov = Number(config.spouseSumAssured) || 0;
        const depCov = Number(config.depSumAssured) || 0;
        const empRate = config.employeeRate || 0;
        const spouseRate = config.spouseRate || empRate || 0;
        const depRate = config.dependentRate || 0;
        const isMemberPlusOne = this.isMemberPlusOne(description);
        
        baseEmployeePremium = empCov * effectiveCount * empRate;
        baseSpousePremium = spouseCov * effectiveCount * spouseRate;
        
        if (isMemberPlusOne) {
          baseDependentPremium = 0;
          config.sumInsured = (empCov * effectiveCount) + (spouseCov * effectiveCount);
        } else {
          baseDependentPremium = depCov * effectiveCount * depRate;
          config.sumInsured = (empCov * effectiveCount) + (spouseCov * effectiveCount) + (depCov * effectiveCount);
        }
        baseTotalPremium = baseEmployeePremium + baseSpousePremium + baseDependentPremium;

      } else if (this.isFamilySharedPlan(planType)) {
        const coverage = Number(config.coverage) || 0;
        const rate = config.rate || 0;
        
        config.sumInsured = coverage * effectiveCount;
        baseTotalPremium = coverage * effectiveCount * rate;
      }

      const disc = Number(this.activeDiscountMap[packageUuid]) || 0;
      if (disc > 0) {
        config.employeePremium  = baseEmployeePremium * (1 - disc / 100);
        config.spousePremium    = baseSpousePremium * (1 - disc / 100);
        config.dependentPremium = baseDependentPremium * (1 - disc / 100);
        config.premium          = baseTotalPremium * (1 - disc / 100);
      } else {
        config.employeePremium  = baseEmployeePremium;
        config.spousePremium    = baseSpousePremium;
        config.dependentPremium = baseDependentPremium;
        config.premium          = baseTotalPremium;
      }
    },

    setRateFromCacheForPackage(row, packageUuid) {
      const config = row.packageConfigs[packageUuid];
      if (!config) return false;
      
      const planType = this.normalizeValue(config.planType);
      const description = this.normalizeValue(row.description);
      const desc = Number(description) || 1;
      const rates = this.getRatesForPackage(packageUuid);
      let found = false;

      if (this.isIndividualPlan(planType)) {
        const matched = rates.filter(r => 
          r.planType === "Individual_Plan" && Number(r.familySize) === 1
        );
        const ratesToUse = matched.length > 0 ? matched : rates.filter(r => r.planType === "Individual_Plan");
        
        if (ratesToUse.length) { 
          config.employeeRate = this.findRateForAmount(ratesToUse, config.sumAssured);
          config.spouseRate = this.findRateForAmount(ratesToUse, config.spouseSumAssured || config.sumAssured);
          config.dependentRate = this.findRateForAmount(ratesToUse, config.depSumAssured || config.sumAssured);
          config.rate = config.employeeRate || config.spouseRate || config.dependentRate;
          found = true;
        }
      } else if (this.isFamilySharedPlan(planType)) {
        const familySize = desc;
        const matched = rates.filter(r => 
          r.planType === "Family_Shared_Plan" && Number(r.familySize) === familySize
        );
        const ratesToUse = matched.length > 0 ? matched : rates.filter(r => r.planType === "Family_Shared_Plan");
        if (ratesToUse.length) { 
          config.rate = this.findRateForAmount(ratesToUse, config.coverage);
          found = true;
        }
      } else if (this.isDependentSharedPlan(planType)) {
        const dependentFamilySize = Math.max(1, desc - 1);
        
        const empMatched = rates.filter(r => 
          r.planType === "Individual_Plan" && Number(r.familySize) === 1
        );
        const depMatched = rates.filter(r => 
          r.planType === "Family_Shared_Plan" && Number(r.familySize) === dependentFamilySize
        );
        
        const empRatesToUse = empMatched.length > 0 ? empMatched : rates.filter(r => r.planType === "Individual_Plan");
        const depRatesToUse = depMatched.length > 0 ? depMatched : rates.filter(r => r.planType === "Family_Shared_Plan");
        
        if (empRatesToUse.length) {
          config.employeeRate = this.findRateForAmount(empRatesToUse, config.sumAssured);
          found = true;
        }
        if (depRatesToUse.length) {
          config.dependentRate = this.findRateForAmount(depRatesToUse, config.depSumAssured);
          found = true;
        }
        if (empRatesToUse.length || depRatesToUse.length) {
          config.rate = (config.employeeRate + config.dependentRate) / 2;
        }
      } else if (this.isDualPremiumPlan(planType)) {
        const dependentFamilySize = Math.max(1, desc - 2);
        
        const empMatched = rates.filter(r => 
          r.planType === "Individual_Plan" && Number(r.familySize) === 1
        );
        const depMatched = rates.filter(r => 
          r.planType === "Family_Shared_Plan" && Number(r.familySize) === dependentFamilySize
        );
        
        const empRatesToUse = empMatched.length > 0 ? empMatched : rates.filter(r => r.planType === "Individual_Plan");
        const depRatesToUse = depMatched.length > 0 ? depMatched : rates.filter(r => r.planType === "Family_Shared_Plan");
        
        if (empRatesToUse.length) {
          config.employeeRate = this.findRateForAmount(empRatesToUse, config.sumAssured);
          config.spouseRate = this.findRateForAmount(empRatesToUse, config.spouseSumAssured);
          found = true;
        }
        if (depRatesToUse.length) {
          config.dependentRate = this.findRateForAmount(depRatesToUse, config.depSumAssured);
          found = true;
        }
        if (empRatesToUse.length || depRatesToUse.length) {
          if (this.isMemberPlusOne(description)) {
            config.rate = (config.employeeRate + config.spouseRate) / 2;
          } else {
            config.rate = (config.employeeRate + config.spouseRate + config.dependentRate) / 3;
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
      config.sameSumAssured = false;
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
                conf.rate = (conf.employeeRate + conf.spouseRate) / 2;
              } else {
                conf.rate = (conf.employeeRate + conf.spouseRate + conf.dependentRate) / 3;
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
            spouseSumAssuredValue = s.spouseSumAssured ?? "";
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

          const discountPercent = Number(s.discount) || 0;
          const discountMultiplier = discountPercent > 0 ? (1 - discountPercent / 100) : 1;
          
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
            rate: discountMultiplier < 1 ? (Number(s.rate || 0) / discountMultiplier) : (Number(s.rate) || 0),
            premium: discountMultiplier < 1 ? (Number(s.premium || 0) / discountMultiplier) : (Number(s.premium) || 0),
            sumInsured: s.sumInsured || 0,
            employeeRate: discountMultiplier < 1 ? (Number(s.employeeRate || s.rate || 0) / discountMultiplier) : (Number(s.employeeRate || s.rate) || 0),
            dependentRate: s.dependentRate || s.rate || 0,
            spouseRate: s.spouseRate || s.rate || 0,
            employeePremium: discountMultiplier < 1 ? (Number(s.employeePremium || 0) / discountMultiplier) : (Number(s.employeePremium) || 0),
            dependentPremium: discountMultiplier < 1 ? (Number(s.dependentPremium || 0) / discountMultiplier) : (Number(s.dependentPremium) || 0),
            spousePremium: discountMultiplier < 1 ? (Number(s.spousePremium || 0) / discountMultiplier) : (Number(s.spousePremium) || 0),
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
            discount: Number(this.activeDiscountMap[packageUuid]) || 0,
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
  max-height: 22rem;
  overflow: hidden;
  min-width: 280px;
  display: flex;
  flex-direction: column;
}

/* ── Package dropdown search ─────────────────────────────────── */
.qb-pkg-search-wrapper {
  position: relative;
  padding: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.qb-pkg-search-icon {
  position: absolute;
  left: 1.25rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: #94a3b8;
  pointer-events: none;
}

.qb-pkg-search-input {
  width: 100%;
  height: 2.25rem;
  padding: 0 0.875rem 0 2.25rem;
  font-size: 0.875rem;
  color: #334155;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.625rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}

.qb-pkg-search-input:focus {
  border-color: var(--color-primary, #6366f1);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary, #6366f1) 15%, transparent);
}

.qb-pkg-search-input::placeholder {
  color: #94a3b8;
}

/* ── Package options list with scrollbar ────────────────────── */
.qb-pkg-options-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.25rem 0.5rem;
  max-height: 14rem;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

/* WebKit scrollbar styles */
.qb-pkg-options-list::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.qb-pkg-options-list::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 10px;
}

.qb-pkg-options-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
  transition: background 0.2s;
}

.qb-pkg-options-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Firefox scrollbar */
.qb-pkg-options-list {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

/* ── Package option items ────────────────────────────────────── */
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

.qb-pkg-option:hover { 
  background: #f8fafc; 
}

.qb-pkg-option--checked { 
  background: color-mix(in srgb, var(--color-primary,#6366f1) 6%, transparent); 
}

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

.qb-pkg-checkbox svg { 
  width: .7rem; 
  height: .7rem; 
  stroke: #fff; 
}

.qb-pkg-name { 
  font-size: .8125rem; 
  font-weight: 600; 
  color: #1e293b; 
}

.qb-pkg-cat { 
  font-size: .6875rem; 
  color: #94a3b8; 
  margin-top: .1rem; 
}

.qb-pkg-no-results {
  padding: 1.5rem 0.75rem;
  text-align: center;
  font-size: 0.8125rem;
  color: #94a3b8;
  font-weight: 500;
}

/* ── Bulk actions ────────────────────────────────────────────── */
.qb-pkg-bulk-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 0 0 1rem 1rem;
  flex-shrink: 0;
}

.qb-pkg-bulk-btn {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-primary, #6366f1);
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background 0.15s;
}

.qb-pkg-bulk-btn:hover {
  background: color-mix(in srgb, var(--color-primary, #6366f1) 8%, transparent);
}

.qb-pkg-bulk-count {
  margin-left: auto;
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
}

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

.qb-discount-note {
  color: #9333ea;
  font-weight: 700;
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

/* ── Same Sum Assured toggle ─────────────────────────────────── */
.qb-same-sa-toggle {
  margin-bottom: 0.5rem;
}
.qb-toggle-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  cursor: pointer;
  user-select: none;
}
.qb-toggle-checkbox { display: none; }
.qb-toggle-slider {
  position: relative;
  width: 2.25rem;
  height: 1.25rem;
  background: #cbd5e1;
  border-radius: 9999px;
  transition: background 0.2s;
  flex-shrink: 0;
}
.qb-toggle-slider::after {
  content: '';
  position: absolute;
  top: 0.1875rem;
  left: 0.1875rem;
  width: 0.875rem;
  height: 0.875rem;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.qb-toggle-checkbox:checked + .qb-toggle-slider {
  background: var(--color-primary, #6366f1);
}
.qb-toggle-checkbox:checked + .qb-toggle-slider::after {
  transform: translateX(1rem);
}
.qb-toggle-text {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
}

/* ── Discount panel ──────────────────────────────────────────── */
.qb-discount-panel {
  border: 1.5px solid #e2e8f0;
  border-radius: 1.25rem;
  overflow: hidden;
  background: #fff;
}
.qb-discount-toggle-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 1rem 1.25rem;
  background: #f8fafc;
  border: none;
  cursor: pointer;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #334155;
  text-align: left;
  transition: background 0.15s;
}
.qb-discount-toggle-btn:hover { background: #f1f5f9; }
.qb-discount-icon { width: 1.25rem; height: 1.25rem; color: #6366f1; flex-shrink: 0; }
.qb-discount-active-badge {
  margin-left: 0.25rem;
  padding: 0.125rem 0.5rem;
  background: #fef9c3;
  color: #92400e;
  font-size: 0.6875rem;
  font-weight: 700;
  border-radius: 9999px;
  border: 1px solid #fde68a;
}
.qb-discount-body {
  padding: 1.25rem;
  border-top: 1px solid #f1f5f9;
}
.qb-discount-hint {
  font-size: 0.8125rem;
  color: #94a3b8;
  margin: 0 0 1rem;
}
.qb-discount-empty {
  color: #94a3b8;
  font-size: 0.8125rem;
  font-style: italic;
}
.qb-discount-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.qb-discount-item {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
  background: #f8fafc;
  border-radius: 0.875rem;
  border: 1px solid #e2e8f0;
}
@media (min-width: 640px) {
  .qb-discount-item {
    grid-template-columns: 1fr auto;
  }
}
.qb-discount-item-info {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-width: 0;
}
.qb-discount-pkg-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.qb-discount-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}
.qb-discount-slider {
  width: 10rem;
  height: 0.375rem;
  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(
    to right,
    var(--color-primary, #6366f1) 0%,
    var(--color-primary, #6366f1) calc(var(--val, 0) * 1%),
    #e2e8f0 calc(var(--val, 0) * 1%),
    #e2e8f0 100%
  );
  border-radius: 9999px;
  outline: none;
  cursor: pointer;
}
.qb-discount-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 1.125rem;
  height: 1.125rem;
  border-radius: 50%;
  background: var(--color-primary, #6366f1);
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(99,102,241,0.4);
  cursor: pointer;
}
.qb-discount-slider::-moz-range-thumb {
  width: 1.125rem;
  height: 1.125rem;
  border-radius: 50%;
  background: var(--color-primary, #6366f1);
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(99,102,241,0.4);
  cursor: pointer;
}
.qb-discount-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.qb-discount-number {
  width: 4.5rem !important;
  height: 2.25rem !important;
  font-size: 0.875rem !important;
}
.qb-discount-pct {
  font-size: 0.875rem;
  font-weight: 700;
  color: #64748b;
}

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