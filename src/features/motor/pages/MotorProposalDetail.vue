<template>
  <div class="mpd-root">

    <!-- Custom Toast Notification -->
    <div v-if="toastMsg" class="fixed top-6 right-6 z-[99999] bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 transform transition-all duration-300 print:hidden" style="animation: slideIn 0.3s ease-out forwards;">
      <svg v-if="toastType === 'error'" class="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      <svg v-else class="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      <span class="font-bold text-sm">{{ toastMsg }}</span>
    </div>

    <!-- Top Nav & Back -->
    <div class="mpd-topnav">
      <router-link to="/motor/proposals" class="mpd-back-link">
        <svg class="mpd-icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        Back to Proposals Queue
      </router-link>
      <div class="mpd-uuid">Proposal UUID: {{ proposal.proposalUuid || '—' }}</div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="mpd-loading">
      <div class="mpd-skel mpd-skel-title"></div>
      <div class="mpd-skel mpd-skel-card"></div>
    </div>

    <!-- Error Alert -->
    <div v-else-if="error" class="mpd-alert">
      <svg class="mpd-icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 8v4m0 4h.01"/></svg>
      {{ error }}
    </div>

    <div v-else class="space-y-6">
      <!-- Main Header Banner -->
      <div class="mpd-header-card">
        <div class="mpd-header-info">
          <div class="flex items-center gap-3">
            <h1 class="mpd-title">{{ proposal.proposalNumber }}</h1>
            <span :class="['mpd-status-badge', statusMeta(proposal.status).cls]">
              {{ statusMeta(proposal.status).label }}
            </span>
          </div>
          <p class="mpd-subtitle">
            Insured: <strong class="text-ink">{{ proposal.insuredName }}</strong> ({{ proposal.insuredPhone || '—' }}) • 
            Plate: <strong class="text-blue-700 font-mono">{{ proposal.vehiclePlateNumber }}</strong>
          </p>
        </div>

        <div class="mpd-header-actions">
          <RoleSwitcher />
          <!-- SUBMITTED: underwriter decides -->
          <template v-if="uiStatus === 'SUBMITTED'">
            <button type="button" v-if="isUnderwriter" class="mpd-issue-btn" :disabled="isActing" @click="handleApprove">
              <svg class="mpd-icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              {{ isActing ? 'Working…' : 'Approve Proposal' }}
            </button>
            <button type="button" v-if="isUnderwriter" class="mpd-reject-btn" :disabled="isActing" @click="handleReject">Reject</button>
            <div v-else class="mpd-issued-pill mpd-pill-amber">Awaiting underwriter review</div>
          </template>

          <!-- APPROVED / PENDING_PAYMENT: customer pays on mobile -->
          <div v-else-if="uiStatus === 'APPROVED' || uiStatus === 'PENDING_PAYMENT'" class="mpd-issued-pill mpd-pill-amber">
            <svg class="mpd-icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 6v6l4 2"/></svg>
            {{ uiStatus === 'PENDING_PAYMENT' ? 'Customer is paying' : 'Approved — awaiting customer payment' }}
            <span v-if="gatewayLabel" class="opacity-70">via {{ gatewayLabel }}</span>
          </div>

          <!-- PAID: issue the certificate -->
          <button
            v-else-if="uiStatus === 'PAID'"
            type="button"
            class="mpd-issue-btn"
            :disabled="isIssuing || !canIssueContract"
            :title="!canIssueContract ? 'Requires Underwriter Privilege' : ''"
            @click="handleIssueContract"
          >
            <svg class="mpd-icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            {{ isIssuing ? 'Issuing…' : canIssueContract ? 'Issue Official Contract & Certificate' : 'Issue Contract (Underwriter Only)' }}
          </button>

          <div v-else-if="uiStatus === 'ACTIVE'" class="mpd-issued-pill">
            <svg class="mpd-icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            Contract Issued & Certificate Ready
          </div>

          <div v-else-if="uiStatus === 'REJECTED'" class="mpd-issued-pill mpd-pill-red">
            Rejected{{ proposal.rejectionReason ? ' — ' + proposal.rejectionReason : '' }}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column: Vehicle & Inspection Panel -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Vehicle Specification Card -->
          <div class="mpd-card">
            <div class="mpd-card-header">
              <svg class="mpd-header-icon-svg text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
              <span>Vehicle & Coverage Specification</span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 p-5">
              <div class="mpd-spec-box">
                <div class="mpd-spec-label">Make & Model</div>
                <div class="mpd-spec-value">{{ proposal.carName }} {{ proposal.carModel }}</div>
              </div>
              <div class="mpd-spec-box">
                <div class="mpd-spec-label">Vehicle Type</div>
                <div class="mpd-spec-value">{{ proposal.carType || 'Private vehicles' }}</div>
              </div>
              <div class="mpd-spec-box">
                <div class="mpd-spec-label">Manufacture Year</div>
                <div class="mpd-spec-value">{{ proposal.makeYear || '—' }}</div>
              </div>
              <div class="mpd-spec-box">
                <div class="mpd-spec-label">Chassis Number</div>
                <div class="mpd-spec-value font-mono">{{ proposal.chassisNumber || '—' }}</div>
              </div>
              <div class="mpd-spec-box">
                <div class="mpd-spec-label">Engine Number</div>
                <div class="mpd-spec-value font-mono">{{ proposal.engineNumber || '—' }}</div>
              </div>
              <div class="mpd-spec-box">
                <div class="mpd-spec-label">Sum Insured (OD)</div>
                <div class="mpd-spec-value text-emerald-700 font-extrabold">ETB {{ formatMoney(proposal.sumInsured) }}</div>
                <div v-if="proposal.vehicleValue && Number(proposal.vehicleValue) !== Number(proposal.sumInsured)" class="text-[10px] text-ink-subtle mt-1">Customer declared: ETB {{ formatMoney(proposal.vehicleValue) }}</div>
              </div>
              <div class="mpd-spec-box">
                <div class="mpd-spec-label">Engine CC / Power</div>
                <div class="mpd-spec-value">{{ proposal.engineCc ? proposal.engineCc + ' cc' : '—' }}<span v-if="proposal.horsePower" class="text-ink-subtle font-normal"> · {{ proposal.horsePower }} HP</span></div>
              </div>
              <div class="mpd-spec-box">
                <div class="mpd-spec-label">Seats / Capacity</div>
                <div class="mpd-spec-value">{{ proposal.numberOfSeats ? proposal.numberOfSeats + ' seats' : '—' }}<span v-if="proposal.carryingCapacityQuintals" class="text-ink-subtle font-normal"> · {{ proposal.carryingCapacityQuintals }} q</span></div>
              </div>
              <div class="mpd-spec-box">
                <div class="mpd-spec-label">Colour / Plate Code</div>
                <div class="mpd-spec-value">{{ proposal.vehicleColor || '—' }}<span v-if="proposal.licensePlateCode" class="text-ink-subtle font-normal"> · code {{ proposal.licensePlateCode }}</span></div>
              </div>
              <div class="mpd-spec-box">
                <div class="mpd-spec-label">Usage</div>
                <div class="mpd-spec-value">{{ proposal.usageType || '—' }}</div>
              </div>
              <div class="mpd-spec-box">
                <div class="mpd-spec-label">Owner on Libre</div>
                <div class="mpd-spec-value">{{ proposal.libreOwnerName || '—' }}</div>
              </div>
            </div>

            <div class="px-5 pb-5 pt-1">
              <div class="text-xs font-semibold text-ink-subtle mb-2">Selected Endorsements & Add-ons:</div>
              <div class="flex flex-wrap gap-2">
                <span v-for="end in parsedEndorsements" :key="end" class="mpd-endorsement-pill">
                  {{ end }}
                </span>
                <span v-if="parsedEndorsements.length === 0" class="text-xs text-ink-subtle italic">Standard coverage only (No endorsements)</span>
              </div>
            </div>
          </div>

          <!-- Vehicle Photos Panel -->
          <div v-if="photoImages && photoImages.length > 0" class="mpd-card">
            <div class="mpd-card-header">
              <svg class="mpd-header-icon-svg text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <span>Uploaded Vehicle Photos</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5">
               <div v-for="img in photoImages" :key="img.imageUuid" class="flex flex-col items-center">
                 <div v-if="!img.src" class="w-full h-24 rounded border border-dashed border-line-strong flex items-center justify-center text-[10px] text-ink-subtle">Unavailable</div>
                 <img v-else :src="img.src" class="w-full h-24 object-cover rounded shadow border border-line cursor-pointer hover:opacity-90 transition-opacity" @click="openImage(img.src)" />
                 <span class="text-xs font-bold text-ink-muted mt-2 uppercase">{{ img.imageName || img.imageType }}</span>
               </div>
            </div>
          </div>

          <!-- Libre Documents Panel -->
          <div v-if="libreImages && libreImages.length > 0" class="mpd-card">
            <div class="mpd-card-header">
              <svg class="mpd-header-icon-svg text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <span>Libre Documents</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5">
               <div v-for="img in libreImages" :key="img.imageUuid" class="flex flex-col items-center">
                 <div v-if="!img.src" class="w-full h-24 rounded border border-dashed border-line-strong flex items-center justify-center text-[10px] text-ink-subtle">Unavailable</div>
                 <img v-else :src="img.src" class="w-full h-24 object-cover rounded shadow border border-line cursor-pointer hover:opacity-90 transition-opacity" @click="openImage(img.src)" />
                 <span class="text-xs font-bold text-ink-muted mt-2 uppercase">{{ img.imageName || img.imageType }}</span>
               </div>
            </div>
          </div>

          <!-- Libre Data Panel (customer-confirmed OCR fields, persisted on the proposal) -->
          <div v-if="libreDataEntries.length" class="mpd-card">
            <div class="mpd-card-header">
              <svg class="mpd-header-icon-svg text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <span>Libre Data (as confirmed by customer)</span>
              <span class="ml-auto text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" :class="ocrSourceBadge.cls">{{ ocrSourceBadge.label }}</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 p-5 text-xs">
               <div v-for="[key, val] in libreDataEntries" :key="key">
                 <span class="text-ink-subtle block uppercase tracking-wide">{{ libreLabel(key) }}</span>
                 <strong class="text-ink font-mono break-all">{{ val }}</strong>
               </div>
            </div>
          </div>

          <!-- Customer PDF Proposal Form Questionnaire Card -->
          <div class="mpd-card">
            <div class="mpd-card-header">
              <svg class="mpd-header-icon-svg text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <span>Customer Proposal Form Questionnaire Answers (Standard Insurance PDF)</span>
            </div>

            <div class="p-5 space-y-4 text-xs">
              <!-- Proposer & Driving Profile -->
              <div>
                <div class="font-bold text-ink mb-2 text-xs uppercase tracking-wider text-amber-800">1. Proposer & Driving License Profile</div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-surface-muted p-3.5 rounded-xl border border-line">
                  <div><span class="text-ink-subtle block">Proposer Age:</span><strong class="text-ink">{{ proposal.proposerAge ? (proposal.proposerAge + ' years') : '—' }}</strong></div>
                  <div><span class="text-ink-subtle block">Residential Address:</span><strong class="text-ink">{{ proposal.proposerAddress || '—' }}</strong></div>
                  <div><span class="text-ink-subtle block">P.O. Box:</span><strong class="text-ink">{{ proposal.poBox || '—' }}</strong></div>
                  <div><span class="text-ink-subtle block">Trade / Profession:</span><strong class="text-ink">{{ proposal.tradeProfession || '—' }}</strong></div>
                  <div><span class="text-ink-subtle block">Driving License No:</span><strong class="text-ink font-mono">{{ proposal.licenseNo || '—' }}</strong></div>
                  <div><span class="text-ink-subtle block">License Issue Date:</span><strong class="text-ink">{{ proposal.licenseIssueDate || '—' }}</strong></div>
                </div>
              </div>

              <!-- Vehicle Usage & Interest -->
              <div>
                <div class="font-bold text-ink mb-2 text-xs uppercase tracking-wider text-amber-800">2. Usage, Parking & Insurable Interest</div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-surface-muted p-3.5 rounded-xl border border-line">
                  <div><span class="text-ink-subtle block">Vehicle Category:</span><strong class="text-blue-700 font-semibold">{{ proposal.categoryName || '—' }}</strong></div>
                  <div><span class="text-ink-subtle block">Body Type:</span><strong class="text-ink">{{ proposal.bodyType || '—' }}</strong></div>
                  <div><span class="text-ink-subtle block">Overnight Parking:</span><strong class="text-ink">{{ proposal.overnightParking || '—' }}</strong></div>
                  <div><span class="text-ink-subtle block">Sole Property:</span><strong class="text-ink">{{ proposal.isSoleProperty === true ? 'YES' : (proposal.isSoleProperty === false ? 'NO' : '—') }}</strong></div>
                  <div><span class="text-ink-subtle block">Hire Purchase / Financier:</span><strong class="text-ink">{{ proposal.isHirePurchase === true ? (proposal.financierNameAddress || 'YES') : (proposal.isHirePurchase === false ? 'NO' : '—') }}</strong></div>
                  <div><span class="text-ink-subtle block">Private Purpose Only:</span><strong class="text-ink">{{ proposal.privatePurposeOnly === true ? 'YES' : (proposal.privatePurposeOnly === false ? 'NO' : '—') }}</strong></div>
                </div>
              </div>

              <!-- Driving & Physical Declarations -->
              <div>
                <div class="font-bold text-ink mb-2 text-xs uppercase tracking-wider text-amber-800">3. Driving Record & Safety Declarations</div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-surface-muted p-3.5 rounded-xl border border-line">
                  <div><span class="text-ink-subtle block">Self Driving Experience:</span><strong class="text-ink">{{ proposal.drivingYearsSelf ? (proposal.drivingYearsSelf + ' Years') : '—' }}</strong></div>
                  <div><span class="text-ink-subtle block">Physical Infirmity / Defective Vision:</span><strong class="text-ink">{{ proposal.hasPhysicalInfirmity === true ? (proposal.physicalInfirmityDetails || 'YES') : (proposal.hasPhysicalInfirmity === false ? 'NONE (Good Health)' : '—') }}</strong></div>
                  <div><span class="text-ink-subtle block">Driving Convictions:</span><strong class="text-ink">{{ proposal.hasDrivingConvictions === true ? (proposal.convictionDetails || 'YES') : (proposal.hasDrivingConvictions === false ? 'NONE' : '—') }}</strong></div>
                  <div><span class="text-ink-subtle block">Audio / Radio Accessories:</span><strong class="text-ink">{{ proposal.hasRadioAccessories === true ? (proposal.radioDetailsValue || 'YES') : (proposal.hasRadioAccessories === false ? 'NO' : '—') }}</strong></div>
                  <div><span class="text-ink-subtle block">Paid Driver & Assistant PA:</span><strong class="text-ink">{{ proposal.insurePaidDriverAssistant === true ? 'COVERED' : (proposal.insurePaidDriverAssistant === false ? 'NOT COVERED' : '—') }}</strong></div>
                  <div><span class="text-ink-subtle block">Passenger PA Cover:</span><strong class="text-ink">{{ proposal.insurePassengersPa === true ? 'COVERED' : (proposal.insurePassengersPa === false ? 'NOT COVERED' : '—') }}</strong></div>
                </div>
              </div>

              <!-- Dynamic EAV Fields -->
              <div v-if="Object.keys(filteredQuestionnaire).length > 0">
                <div class="font-bold text-ink mb-2 text-xs uppercase tracking-wider text-amber-800">4. Additional Form Responses</div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-amber-50/50 p-3.5 rounded-xl border border-amber-100">
                  <div v-for="(val, key) in filteredQuestionnaire" :key="key">
                    <span class="text-ink-subtle block text-[11px] uppercase tracking-wide">{{ key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim() }}:</span>
                    <strong class="text-ink" style="word-break: break-word;">
                      <span v-if="val === true" class="text-emerald-700">YES</span>
                      <span v-else-if="val === false" class="text-red-700">NO</span>
                      <span v-else-if="val === 'true'">YES</span>
                      <span v-else-if="val === 'false'">NO</span>
                      <span v-else>{{ val || '—' }}</span>
                    </strong>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Adjustor Inspection Panel -->
          <div class="mpd-card">
            <div class="mpd-card-header">
              <svg class="mpd-header-icon-svg text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 02 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              <span>Pre-Insurance Adjustor Inspection</span>
            </div>

            <div class="p-5 space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Assign Adjustor (Underwriter Only) -->
                <div v-if="isUnderwriter" class="mpd-form-box">
                  <div class="flex items-center justify-between">
                    <div class="mpd-form-title">Assign Field Adjustor</div>
                    <span class="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">Underwriter Action</span>
                  </div>
                  <select v-model="selectedAdjustor" class="mpd-select">
                    <option value="ADJ-100">Solomon Tadesse (Vehicle Adjustor)</option>
                    <option value="ADJ-101">Dawit Tesfaye (Senior Adjustor)</option>
                    <option value="ADJ-102">Almaz Wolde (Field Adjustor)</option>
                    <option value="ADJ-103">Yonas Hailu (Motor Adjustor)</option>
                  </select>
                  <button type="button" @click="handleAssignAdjustor" class="mpd-sec-btn">
                    Save Adjustor Assignment
                  </button>
                </div>

                <!-- Record Inspection Finding (Adjustor Only) -->
                <div v-if="isAdjustor" class="mpd-form-box">
                  <div class="flex items-center justify-between">
                    <div class="mpd-form-title">Record Inspection Finding</div>
                    <span class="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-bold">Adjustor Action</span>
                  </div>
                  <select v-model="inspectionStatus" class="mpd-select">
                    <option value="PASSED">PASSED — Vehicle Condition Verified Clean</option>
                    <option value="FAILED">FAILED — Pre-existing Damage Found</option>
                  </select>
                  <button type="button" @click="handleSubmitInspection" class="mpd-suc-btn">
                    Submit Inspection Finding
                  </button>
                </div>
              </div>

              <div v-if="proposal.inspectionNotes" class="mpd-report-box">
                <div class="font-bold text-purple-900 mb-1">Adjustor Inspection Report:</div>
                <p>{{ proposal.inspectionNotes }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Gateways & Certificates -->
        <div class="space-y-6">
          <!-- Premium (persisted breakdown) & customer payment -->
          <div class="mpd-card">
            <div class="mpd-card-header">
              <span>Premium & Payment</span>
              <span v-if="proposal.coverageType" class="ml-auto text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{{ coverageLabel }}</span>
            </div>

            <div class="p-5 space-y-4">
              <div v-if="!proposal.coverageType" class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                The customer has not selected a coverage yet — the premium will appear here as soon as they do.
              </div>

              <div v-else class="space-y-2.5 text-xs">
                <template v-if="premiumBreakdown?.tp">
                  <div class="text-[10px] font-extrabold uppercase tracking-wide text-ink-subtle pt-1">Third Party (Reg. 554/2024)</div>
                  <div class="flex justify-between"><span class="text-ink-muted">Government tariff</span><span class="font-mono">ETB {{ formatMoney(premiumBreakdown.tp.tariff) }}</span></div>
                  <div class="flex justify-between"><span class="text-ink-muted">Passenger liability ({{ premiumBreakdown.tp.passengerSeats }} × {{ premiumBreakdown.tp.passengerRate }})</span><span class="font-mono">ETB {{ formatMoney(premiumBreakdown.tp.passengerLiability) }}</span></div>
                  <div class="flex justify-between"><span class="text-ink-muted">VAT 15% · DDR 1% · Levy 10% · Stamp</span><span class="font-mono">ETB {{ formatMoney(Number(premiumBreakdown.tp.vat) + Number(premiumBreakdown.tp.ddr) + Number(premiumBreakdown.tp.governmentLevy) + Number(premiumBreakdown.tp.stampDuty)) }}</span></div>
                  <div class="flex justify-between font-bold border-b border-line pb-2"><span>TP total</span><span class="font-mono">ETB {{ formatMoney(premiumBreakdown.tp.total) }}</span></div>
                </template>
                <template v-if="premiumBreakdown?.od">
                  <div class="text-[10px] font-extrabold uppercase tracking-wide text-ink-subtle pt-1">Own Damage (Rate Guide Feb 2024)</div>
                  <div class="flex justify-between"><span class="text-ink-muted">{{ premiumBreakdown.od.ratePercent }}% × ETB {{ formatMoney(premiumBreakdown.sumInsured) }} <span class="text-ink-subtle">({{ premiumBreakdown.od.rateRule }})</span></span><span class="font-mono">ETB {{ formatMoney(premiumBreakdown.od.basic) }}</span></div>
                  <div v-if="Number(premiumBreakdown.od.dutyFreeLoading) > 0" class="flex justify-between"><span class="text-ink-muted">Duty-free loading 30%</span><span class="font-mono">ETB {{ formatMoney(premiumBreakdown.od.dutyFreeLoading) }}</span></div>
                  <div class="flex justify-between"><span class="text-ink-muted">DDR 1% · VAT 15% · Stamp</span><span class="font-mono">ETB {{ formatMoney(Number(premiumBreakdown.od.ddr) + Number(premiumBreakdown.od.vat) + Number(premiumBreakdown.od.stampDuty)) }}</span></div>
                  <div class="flex justify-between font-bold border-b border-line pb-2"><span>OD total</span><span class="font-mono">ETB {{ formatMoney(premiumBreakdown.od.total) }}</span></div>
                  <div class="text-[11px] text-ink-subtle">Compulsory excess: {{ premiumBreakdown.od.excessType }}</div>
                </template>
                <template v-if="!premiumBreakdown">
                  <div class="flex justify-between"><span class="text-ink-muted">Third Party</span><span class="font-mono">ETB {{ formatMoney(proposal.tpPremiumAmount) }}</span></div>
                  <div class="flex justify-between"><span class="text-ink-muted">Own Damage</span><span class="font-mono">ETB {{ formatMoney(proposal.odPremiumAmount) }}</span></div>
                </template>
                <div class="flex justify-between items-center pt-1 font-extrabold text-sm">
                  <span class="text-ink">Total Payable</span>
                  <span class="font-mono text-emerald-700">ETB {{ formatMoney(proposal.totalPremiumAmount) }}</span>
                </div>
              </div>

              <!-- Payment status (customer pays on mobile at the gateway mandated by the coverage) -->
              <div class="mpd-gateway-box">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-ink">Customer payment{{ gatewayLabel ? ' · ' + gatewayLabel : '' }}</span>
                  <span :class="paymentMeta.cls" class="font-bold">{{ paymentMeta.label }}</span>
                </div>
                <div v-if="payment" class="mt-2 space-y-1 text-[11px] text-ink-muted">
                  <div class="font-mono">Txn: {{ payment.txRef }}<span v-if="payment.bankCode && payment.gateway !== 'TELEBIRR'"> · {{ payment.bankCode }}</span></div>
                  <div v-if="payment.receiptNumber">Receipt: <span class="font-mono">{{ payment.receiptNumber }}</span> · Ref <span class="font-mono">{{ payment.gatewayReference }}</span></div>
                  <div v-if="payment.confirmedAt">Confirmed {{ formatDateTime(payment.confirmedAt) }} · ETB {{ formatMoney(payment.amount) }}</div>
                  <div v-if="payment.failureReason" class="text-red-600">{{ payment.failureReason }}</div>
                </div>
                <div v-else-if="uiStatus === 'APPROVED'" class="text-[11px] text-amber-600 mt-1 font-medium">Awaiting customer payment via the mobile app</div>
                <div v-else-if="uiStatus === 'SUBMITTED'" class="text-[11px] text-ink-subtle mt-1">Payment opens for the customer after approval</div>
              </div>
            </div>
          </div>

          <!-- Documents Card -->
          <div class="mpd-card">
            <div class="mpd-card-header">
              <span>Generated Regulatory & Policy Documents</span>
            </div>

            <div class="p-5">
              <div v-if="uiStatus === 'ACTIVE'" class="space-y-3">
                <!-- Document 1: Official Certificate (Sticker) -->
                <div v-if="proposal.coverageType === 'COMPREHENSIVE' || proposal.coverageType === 'THIRD_PARTY'" class="mpd-doc-box">
                  <div class="flex items-center gap-3">
                    <svg class="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <div>
                      <div class="text-xs font-bold text-ink">Official Certificate (Reg 554/2024)</div>
                      <div class="text-[11px] text-ink-subtle">Compulsory Government TP Insurance Sticker</div>
                    </div>
                  </div>
                  <button type="button" @click="showCertModal = true" class="mpd-view-doc-btn whitespace-nowrap flex-shrink-0">
                    View Sticker
                  </button>
                </div>

                <!-- Document 2: Official Policy Schedule -->
                <div v-if="proposal.coverageType === 'COMPREHENSIVE' || proposal.coverageType === 'OWN_DAMAGE'" class="mpd-doc-box">
                  <div class="flex items-center gap-3">
                    <svg class="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    <div>
                      <div class="text-xs font-bold text-ink">{{ proposal.coverageType === 'OWN_DAMAGE' ? 'Standalone OD Policy Schedule' : 'Comprehensive Motor Policy Schedule' }}</div>
                      <div class="text-[11px] text-ink-subtle">Official Standard Contract Terms, Rates & Excesses</div>
                    </div>
                  </div>
                  <button type="button" @click="showScheduleModal = true" class="mpd-view-doc-btn whitespace-nowrap flex-shrink-0">
                    View Schedule
                  </button>
                </div>
              </div>

              <div v-else class="p-4 bg-surface-muted rounded-xl border border-line text-center text-xs text-ink-subtle">
                Official documents will be generated automatically when contract is issued.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCertModal" class="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm overflow-y-auto print:bg-transparent">
      <div class="min-h-full py-8 sm:py-12 px-4 sm:px-6 flex justify-center">
        <div class="bg-[#FFFEE0] text-ink border-4 border-amber-500/60 rounded-2xl shadow-2xl max-w-4xl w-full p-6 sm:p-8 font-sans relative print:m-0 print:p-8 print:border-0 print:shadow-none print:bg-[#FFFEE0]">
        
        <!-- Action Buttons (Print / Close) -->
        <div class="flex items-center justify-between border-b border-amber-300 pb-3 mb-4 print:hidden">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 bg-amber-200 text-amber-900 text-xs font-bold rounded-lg border border-amber-400">
              DOCUMENT 1: REGULATORY STICKER CERTIFICATE
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" @click="printCertificate" class="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              Print / Export Sticker
            </button>
            <button type="button" @click="showCertModal = false" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer">
              Close
            </button>
          </div>
        </div>

        <!-- Certificate Header (FDRE Left, Standard Right) -->
        <div class="border-b-2 border-slate-800 pb-4 mb-4">
          <div class="flex items-start justify-between">
            <!-- Left: FDRE Transport Ministry Header -->
            <div class="text-[11px] leading-tight font-bold text-ink max-w-xs space-y-0.5">
              <div>በኢ.ፌ.ዴ.ሪ</div>
              <div>የትራንስፖርት እና ሎጅስቲክስ ሚኒስቴር</div>
              <div>የመንገድ ደህንነትና መድን ፈንድ አገልግሎት</div>
              <div class="font-extrabold text-blue-900 text-[11px] pt-1">FDRE MINISTRY OF TRANSPORT</div>
              <div class="font-extrabold text-blue-900 text-[11px]">LOGISTICS ROAD SAFETY &</div>
              <div class="font-extrabold text-blue-900 text-[11px]">INSURANCE FUND SERVICE</div>
              <div class="font-extrabold underline text-xs pt-1.5 text-ink">የመድን ምስክር ወረቀት<br/>CERTIFICATE OF INSURANCE</div>
            </div>

            <!-- Right: Standard Insurance Logo & Header -->
            <div class="text-right flex flex-col items-end">
              <img src="/standard_logo.png" alt="Standard Insurance Logo" class="h-16 object-contain mb-1" />
              <div class="text-lg font-black text-blue-950 tracking-tight">ስታንዳርድ ኢንሹራንስ አ.ማ.</div>
              <div class="text-xs font-bold text-blue-900">Standard Insurance S.C.</div>
              <div class="text-[11px] font-semibold italic text-amber-900 pt-0.5">"Your trust, our standard"</div>
              <div class="text-[10px] font-semibold text-ink-muted">"የተሻለ ጥበቃ ለተሻለ ህይወት!"</div>
            </div>
          </div>
        </div>

        <!-- Certificate Fields Grid (100% Mirroring sample certificate.pdf) -->
        <div class="space-y-3.5 text-xs font-semibold text-ink">
          <div class="grid grid-cols-2 gap-6 border-b border-line-strong pb-2">
            <div>
              <span class="text-ink-muted block text-[11px]">የስርቲፊኬት ቁጥር / CERTIFICATE NUMBER:</span>
              <span class="font-bold font-mono text-sm text-blue-950 underline">{{ proposal.proposalNumber || 'CN-24072104017' }}</span>
            </div>
            <div>
              <span class="text-ink-muted block text-[11px]">የተሰጠበት ቀን / DATE OF ISSUANCE:</span>
              <span class="font-bold text-sm text-ink underline">09-Jul-2024</span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4 border-b border-line-strong pb-2">
            <div>
              <span class="text-ink-muted block text-[11px]">የመድኑ ገዢው ስም / NAME OF INSURED:</span>
              <span class="font-bold text-sm text-ink underline">{{ proposal.insuredName || 'Biruk Hagoss' }}</span>
            </div>
            <div>
              <span class="text-ink-muted block text-[11px]">አድራሻ: ክልል/አስተዳደር / Address:REGION:</span>
              <span class="font-bold text-ink underline">Addis Ababa</span>
            </div>
            <div>
              <span class="text-ink-muted block text-[11px]">ከተማ / CITY:</span>
              <span class="font-bold text-ink underline">Addis Ababa</span>
            </div>
          </div>

          <div class="grid grid-cols-5 gap-3 border-b border-line-strong pb-2">
            <div>
              <span class="text-ink-muted block text-[10px]">ክፍለ ከተማ SUB CITY:</span>
              <span class="font-bold text-ink underline">Bole</span>
            </div>
            <div>
              <span class="text-ink-muted block text-[10px]">ወረዳ WEREDA:</span>
              <span class="font-bold text-ink underline">09</span>
            </div>
            <div>
              <span class="text-ink-muted block text-[10px]">ቀበሌ KEBELE:</span>
              <span class="font-bold text-ink underline">09</span>
            </div>
            <div>
              <span class="text-ink-muted block text-[10px]">የቤት/ቁ HOUSE No.:</span>
              <span class="font-bold text-ink underline">2694</span>
            </div>
            <div>
              <span class="text-ink-muted block text-[10px]">ሞባይል PHONE:</span>
              <span class="font-bold font-mono text-ink underline">{{ proposal.insuredPhone || '0963048258' }}</span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4 border-b border-line-strong pb-2">
            <div>
              <span class="text-ink-muted block text-[11px]">የሰሌዳ ቁጥር / PLATE NUMBER:</span>
              <span class="font-bold font-mono text-sm text-blue-950 underline">{{ proposal.vehiclePlateNumber || '3-A98123' }}</span>
            </div>
            <div>
              <span class="text-ink-muted block text-[11px]">የሞተር ቁጥር / ENGINE NUMBER:</span>
              <span class="font-bold font-mono text-ink underline">{{ proposal.engineNumber || 'ENG-WD615-9921' }}</span>
            </div>
            <div>
              <span class="text-ink-muted block text-[11px]">የቻሲስ ቁጥር / CHASSIS NUMBER:</span>
              <span class="font-bold font-mono text-ink underline">{{ proposal.chassisNumber || 'CHAS-881923091' }}</span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4 border-b border-line-strong pb-2">
            <div>
              <span class="text-ink-muted block text-[11px]">የተሽከርካሪ አይነት / VEHICLE TYPE:</span>
              <span class="font-bold text-ink underline">{{ proposal.carType || 'Private Saloon / SUV' }}</span>
            </div>
            <div>
              <span class="text-ink-muted block text-[11px]">የመጫን አቅም / CARRYING CAPACITY:</span>
              <span class="font-bold text-ink underline">-</span>
            </div>
            <div>
              <span class="text-ink-muted block text-[11px]">ሰዎች / PERSONS:</span>
              <span class="font-bold text-ink underline">5</span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4 border-b border-line-strong pb-2">
            <div>
              <span class="text-ink-muted block text-[11px]">የመድኑ ፖሊሲ ቁጥር INSURER POLICY No.:</span>
              <span class="font-bold font-mono text-blue-950 underline">NYA-MOT-POL-881923</span>
            </div>
            <div>
              <span class="text-ink-muted block text-[11px]">ፖሊሲው ዘመን ከ POLICY PERIOD FROM:</span>
              <span class="font-bold text-ink underline">03-Jan-2026</span>
            </div>
            <div>
              <span class="text-ink-muted block text-[11px]">እስከ TO:</span>
              <span class="font-bold text-ink underline">02-Jan-2027</span>
            </div>
          </div>

          <div class="space-y-2 border-b border-line-strong pb-2">
            <div>
              <span class="text-ink-muted block text-[11px]">የመድኑ ፖሊሲው የተሰጡባቸው ሁኔታዎች / CONDITIONS SUBJECT TO WHICH THE POLICY ISSUED:</span>
              <span class="font-bold text-ink underline">MAP/1261/26/BG</span>
            </div>
            <div>
              <span class="text-ink-muted block text-[11px]">በመድኑ ፖሊሲው ተጠቃሚ የሚሆኑ ሰዎች ወይም ወገኖች / PERSONS ENTITLED TO USE/DRIVE:</span>
              <span class="font-bold text-ink underline">ANY PERSON DRIVING WITH VALID ETHIOPIAN DRIVER LICENSE</span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4 border-b border-line-strong pb-2">
            <div class="col-span-2">
              <span class="text-ink-muted block text-[11px]">የመድኑ ሰጪው ስም / NAME OF INSURER:</span>
              <span class="font-bold text-sm text-blue-950 underline">Standard Insurance S.C.</span>
            </div>
            <div>
              <span class="text-ink-muted block text-[11px]">የአረቦን መጠን / PREMIUM TARIF:</span>
              <span class="font-bold font-mono text-sm text-emerald-950 underline">ETB {{ formatMoney(proposal.tpPremiumAmount) }}</span>
            </div>
          </div>

          <div class="pt-2 text-center space-y-2 relative">
            <div class="text-[11px] font-bold text-ink">
              NAME OF AUTHORIZED PERSON __________________________________________________
            </div>

            <div class="font-black text-ink text-sm tracking-wide pt-1">ማረጋገጫ / DECLARATION</div>
            <div class="text-[11px] text-ink max-w-xl mx-auto leading-tight font-bold">
              የምስክር ወረቀቱ የተሰጠበት የመድን ፖሊሲ በአዋጅ ቁጥር 799/2005 የተደነገጉትን መስፈርቶች የሚያሟላ ነው<br/>
              THE POLICY TO WHICH THE CERTIFICATE IS ISSUED COMPLIES WITH THE REQUIREMENTS OF PROCLAMATION No. 799/2013 & REGULATION No. 554/2024
            </div>

            <!-- Official Standard Digital Stamp Seal -->
            <div class="mt-4 flex flex-col items-center justify-center relative">
              <img src="/standard-seal.png" alt="Standard Stamp Seal" class="w-36 h-36 object-contain transform -rotate-6 opacity-90 drop-shadow-md" />
              <div class="text-[10px] font-extrabold text-blue-950 mt-1">OFFICIAL STANDARD CORPORATE SEAL</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>


    <div v-if="showScheduleModal" class="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm overflow-y-auto print:bg-transparent">
      <div class="min-h-full py-8 sm:py-12 px-4 sm:px-6 flex justify-center">
        <div class="bg-white text-ink border border-line-strong rounded-2xl shadow-2xl max-w-4xl w-full p-6 sm:p-10 pb-12 sm:pb-16 font-sans relative print:m-0 print:px-8 print:py-4 print:border-0 print:shadow-none">
        <!-- Action Buttons (Print / Close) -->
        <div class="flex items-center justify-between border-b border-line pb-3 mb-5 print:hidden">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 bg-blue-100 text-blue-900 text-xs font-bold rounded-lg border border-blue-300">
              DOCUMENT 2: COMPREHENSIVE POLICY SCHEDULE
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" @click="printCertificate" class="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              Print / Export Schedule
            </button>
            <button type="button" @click="showScheduleModal = false" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer">
              Close
            </button>
          </div>
        </div>

        <!-- Schedule Header (Standard Logo, Motto & Corporate Head Office Info) -->
        <div class="border-b-2 border-slate-900 pb-4 mb-6 print:mb-3 print:pb-2">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <img src="/standard_logo.png" alt="Standard Insurance Logo" class="h-16 object-contain" />
              <div>
                <h1 class="text-xl font-black text-blue-950 tracking-tight">ስታንዳርድ ኢንሹራንስ አ.ማ.</h1>
                <h2 class="text-sm font-bold text-blue-900">STANDARD INSURANCE S.C.</h2>
                <p class="text-xs font-bold text-amber-800 italic">"Your trust, our standard"</p>
                <p class="text-[11px] text-ink-subtle font-medium">Head Office: Addis Ababa, Ethiopia</p>
              </div>
            </div>
            <div class="text-right">
              <div class="text-xs font-bold text-ink-muted uppercase tracking-widest">Policy Schedule</div>
              <div class="text-sm font-black font-mono text-blue-950">{{ proposal.policyNumber || proposal.proposalNumber }}</div>
              <div class="text-xs text-ink-subtle font-medium">Issue Date: {{ new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }}</div>
              <div class="text-xs text-emerald-700 font-bold mt-1">Status: ACTIVE & FULLY PAID</div>
            </div>
          </div>
        </div>

        <!-- Document Title Banner -->
        <div class="bg-blue-950 text-white text-center py-2.5 rounded-xl font-black text-sm uppercase tracking-wider mb-6 print:mb-3">
          {{ proposal.coverageType === 'OWN_DAMAGE' ? 'STANDALONE OWN DAMAGE (OD) POLICY SCHEDULE' : 'COMPREHENSIVE MOTOR INSURANCE POLICY SCHEDULE' }}
        </div>

        <!-- Schedule Sections -->
        <div class="space-y-6 print:space-y-3 text-xs text-ink">
          
          <!-- Section 1: Policyholder Information -->
          <div class="border border-line rounded-xl overflow-hidden">
            <div class="bg-surface-raised px-4 py-2 font-bold text-ink border-b border-line">
              1. INSURED POLICYHOLDER DETAILS
            </div>
            <div class="p-4 grid grid-cols-3 gap-4">
              <div>
                <span class="text-ink-subtle block text-[11px]">Insured Full Name:</span>
                <span class="font-bold text-ink">{{ proposal.insuredName }}</span>
              </div>
              <div>
                <span class="text-ink-subtle block text-[11px]">Phone Number:</span>
                <span class="font-bold font-mono text-ink">{{ proposal.insuredPhone }}</span>
              </div>
              <div>
                <span class="text-ink-subtle block text-[11px]">Email Address:</span>
                <span class="font-bold text-ink">{{ proposal.insuredEmail }}</span>
              </div>
              <div>
                <span class="text-ink-subtle block text-[11px]">Business / Occupation:</span>
                <span class="font-bold text-ink">Private Executive</span>
              </div>
              <div>
                <span class="text-ink-subtle block text-[11px]">Region & City:</span>
                <span class="font-bold text-ink">Addis Ababa, Bole Sub-City</span>
              </div>
              <div>
                <span class="text-ink-subtle block text-[11px]">Underwriting Branch:</span>
                <span class="font-bold text-blue-900">Bole Main Branch</span>
              </div>
            </div>
          </div>

          <!-- Section 2: Insured Vehicle Specifications -->
          <div class="border border-line rounded-xl overflow-hidden">
            <div class="bg-surface-raised px-4 py-2 font-bold text-ink border-b border-line">
              2. INSURED VEHICLE SPECIFICATIONS
            </div>
            <div class="p-4 grid grid-cols-4 gap-4">
              <div>
                <span class="text-ink-subtle block text-[11px]">Make & Model:</span>
                <span class="font-bold text-ink">{{ proposal.carName }} {{ proposal.carModel }}</span>
              </div>
              <div>
                <span class="text-ink-subtle block text-[11px]">Plate Number:</span>
                <span class="font-bold font-mono text-blue-950">{{ proposal.vehiclePlateNumber }}</span>
              </div>
              <div>
                <span class="text-ink-subtle block text-[11px]">Chassis Number:</span>
                <span class="font-bold font-mono text-ink">{{ proposal.chassisNumber }}</span>
              </div>
              <div>
                <span class="text-ink-subtle block text-[11px]">Engine Number:</span>
                <span class="font-bold font-mono text-ink">{{ proposal.engineNumber }}</span>
              </div>
              <div>
                <span class="text-ink-subtle block text-[11px]">Year of Manufacture:</span>
                <span class="font-bold text-ink">{{ proposal.makeYear }}</span>
              </div>
              <div>
                <span class="text-ink-subtle block text-[11px]">Body / Vehicle Type:</span>
                <span class="font-bold text-ink">{{ proposal.carType }}</span>
              </div>
              <div>
                <span class="text-ink-subtle block text-[11px]">Seating Capacity:</span>
                <span class="font-bold text-ink">7 Passengers</span>
              </div>
              <div>
                <span class="text-ink-subtle block text-[11px]">Vehicle Sum Insured:</span>
                <span class="font-bold font-mono text-blue-950 text-sm">ETB {{ formatMoney(proposal.sumInsured) }}</span>
              </div>
            </div>
          </div>

          <!-- Section 2B: Dynamic Questionnaire Fields -->
          <div v-if="Object.keys(filteredQuestionnaire).length > 0" class="border border-line rounded-xl overflow-hidden mt-6">
            <div class="bg-surface-raised px-4 py-2 font-bold text-ink border-b border-line">
              INSURED VEHICLE QUESTIONNAIRE & CUSTOM DATA
            </div>
            <div class="p-4 grid grid-cols-3 gap-4">
              <div v-for="(val, key) in filteredQuestionnaire" :key="key">
                <span class="text-ink-subtle block text-[11px] uppercase tracking-wide">{{ key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim() }}:</span>
                <span class="font-bold text-ink" style="word-break: break-word;">{{ val || '—' }}</span>
              </div>
            </div>
          </div>

          <!-- Section 3: Premium Calculation Breakdown -->
          <div class="border border-line rounded-xl overflow-hidden">
            <div class="bg-surface-raised px-4 py-2 font-bold text-ink border-b border-line">
              3. PREMIUM BREAKDOWN & TARIFF SCHEDULE
            </div>
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-surface-muted border-b border-line text-ink-muted font-bold uppercase text-[10px]">
                  <th class="py-2.5 px-4">Coverage Description</th>
                  <th class="py-2.5 px-4">Payment Rail / Gateway</th>
                  <th class="py-2.5 px-4">Status</th>
                  <th class="py-2.5 px-4 text-right">Amount (ETB)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-line font-medium">
                <tr>
                  <td class="py-2.5 px-4 font-bold text-ink">1. Standard Own Damage (OD) Premium</td>
                  <td class="py-2.5 px-4">EthiSwitch National Gateway</td>
                  <td class="py-2.5 px-4 text-emerald-700 font-bold">PAID</td>
                  <td class="py-2.5 px-4 text-right font-mono font-bold">ETB {{ formatMoney(proposal.odPremiumAmount) }}</td>
                </tr>
                <tr v-if="proposal.coverageType !== 'OWN_DAMAGE'">
                  <td class="py-2.5 px-4 font-bold text-ink">2. Compulsory Third Party (TP) Fund</td>
                  <td class="py-2.5 px-4">EthioTelecom Telebirr Rail</td>
                  <td class="py-2.5 px-4 text-emerald-700 font-bold">PAID</td>
                  <td class="py-2.5 px-4 text-right font-mono font-bold">ETB {{ formatMoney(proposal.tpPremiumAmount) }}</td>
                </tr>
                <tr class="bg-surface-muted font-bold">
                  <td colspan="3" class="py-2.5 px-4 text-right uppercase text-ink-muted">Total Policy Premium Paid:</td>
                  <td class="py-2.5 px-4 text-right font-mono text-sm text-blue-950 font-black">ETB {{ formatMoney(proposal.totalPremiumAmount) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Section 4: Policy Conditions & Excess / Deductibles -->
          <div class="border border-line rounded-xl p-4 bg-surface-muted space-y-2">
            <h4 class="font-bold text-ink text-xs uppercase tracking-wide">4. POLICY TERMS & EXCESS CONDITIONS</h4>
            <ul class="list-disc list-inside space-y-1 text-[11px] text-ink-muted leading-relaxed font-medium">
              <li><strong>Own Damage Excess:</strong> Insured pays 10% of total repair claim (Minimum ETB 5,000) per accident.</li>
              <li><strong>Compulsory TP Coverage:</strong> Complies strictly with FDRE Proclamation No. 799/2013 and Regulation No. 554/2024.</li>
              <li><strong>Authorized Drivers:</strong> Any person driving with valid Ethiopian Driver License.</li>
              <li><strong>24/7 Toll-Free Motor Claims Center Hotline:</strong> 9222</li>
            </ul>
          </div>

          <!-- Section 5: Authorized Signatures & Seal -->
          <div class="pt-6 pb-4 print:pt-2 print:pb-0 flex items-end justify-between border-t border-line-strong">
            <div>
              <p class="text-[11px] font-bold text-ink">Issued by Standard Insurance S.C.</p>
              <p class="text-[10px] text-ink-subtle">Authorized Underwriter: Solomon Tadesse</p>
              <div class="mt-3 font-mono text-xs font-bold text-ink border-b-2 border-slate-800 w-56 pb-1">
                Solomon Tadesse (Underwriter)
              </div>
            </div>

            <div class="flex flex-col items-center relative">
              <img src="/standard-seal.png" alt="Standard Official Corporate Seal" class="w-32 h-32 print:w-20 print:h-20 object-contain transform -rotate-6 opacity-90 drop-shadow-md" />
              <span class="text-[10px] font-extrabold text-blue-950 mt-1">OFFICIAL STANDARD CORPORATE SEAL</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    </div>
  </div>

  <!-- Image Modal (Top level root node) -->
  <div v-if="previewImageUrl" class="fixed inset-0 z-[99999] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4" @click="closeImage()" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;">
    <div class="relative w-full max-w-5xl h-auto max-h-screen flex flex-col items-center justify-center" @click.stop>
      <button @click.stop="closeImage()" class="absolute -top-14 right-0 m-2 p-3 bg-white/10 hover:bg-white/30 text-white rounded-full transition-all duration-200 z-50 shadow-lg">
        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
      <img :src="previewImageUrl" class="w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" @click.stop />
      <p class="text-white/60 text-xs mt-3">Click outside or press Esc to close</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { getActingRole } from '@/utils/actingRole';
import {
  fetchMotorProposalDetail,
  assignProposalAdjustor,
  submitProposalInspection,
  approveProposal,
  rejectProposal,
  fetchProposalPayment,
  issueProposalContract,
} from '@/features/motor/claims/api/digitalChannelApi';
import { useRoleContext } from '../composables/useRoleContext';
import RoleSwitcher from '@/components/RoleSwitcher.vue';
import { listCarImages, fetchCarImageByUuid } from '@/features/motor/api/motorApi';
import { revokeObjectUrls } from '@/utils/imageBlob';

const route = useRoute();
const { activeRole, setRole, ROLES } = useRoleContext();

const proposal = ref({});
const loading = ref(false);
const error = ref('');
const selectedAdjustor = ref('ADJ-100');
const inspectionStatus = ref('PASSED');

const toastMsg = ref('');
const toastType = ref('success');
function showToast(msg, type = 'success') {
  toastMsg.value = msg;
  toastType.value = type;
  setTimeout(() => { toastMsg.value = ''; }, 4000);
}

const isIssuing = ref(false);
const isActing = ref(false);
const payment = ref(null);

// ── One state machine shared with mobile: SUBMITTED → APPROVED → PENDING_PAYMENT → PAID → ACTIVE (or REJECTED)
const LEGACY_STATUS = {
  REGISTERED: 'SUBMITTED', ADJUSTOR_ASSIGNED: 'SUBMITTED', INSPECTION_PENDING: 'SUBMITTED',
  INSPECTION_DONE: 'APPROVED', COVERAGE_SELECTED: 'APPROVED', PASSED: 'APPROVED',
  TP_PAID: 'PAID', OD_PAID: 'PAID', CONTRACT_ISSUED: 'ACTIVE', CANCELLED: 'REJECTED',
};
const uiStatus = computed(() => {
  const s = String(proposal.value?.status || 'SUBMITTED').toUpperCase();
  return LEGACY_STATUS[s] || s;
});
const coverageLabel = computed(() => ({ THIRD_PARTY: 'Third Party', OWN_DAMAGE: 'Own Damage', COMPREHENSIVE: 'Comprehensive' })[proposal.value?.coverageType] || proposal.value?.coverageType || '');
const gatewayLabel = computed(() => {
  const g = proposal.value?.paymentGateway || ({ THIRD_PARTY: 'TELEBIRR', OWN_DAMAGE: 'BANK', COMPREHENSIVE: 'ETSWITCH' })[proposal.value?.coverageType];
  return ({ TELEBIRR: 'Telebirr', BANK: 'Bank transfer', ETSWITCH: 'ETSwitch' })[g] || '';
});
const premiumBreakdown = computed(() => {
  const raw = proposal.value?.premiumBreakdownJson;
  if (!raw) return null;
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (_) { return null; }
});
const paymentMeta = computed(() => {
  const st = payment.value?.status;
  if (st === 'SUCCESS' || uiStatus.value === 'PAID' || uiStatus.value === 'ACTIVE') return { label: 'PAID', cls: 'text-emerald-700' };
  if (st === 'INITIATED' || uiStatus.value === 'PENDING_PAYMENT') return { label: 'IN PROGRESS', cls: 'text-blue-700' };
  if (st === 'FAILED' || st === 'EXPIRED') return { label: st, cls: 'text-red-600' };
  return { label: 'PENDING', cls: 'text-amber-600' };
});
function formatDateTime(v) {
  try { return new Date(v).toLocaleString(); } catch (_) { return v; }
}
async function loadPayment() {
  if (!proposal.value?.proposalUuid || !proposal.value?.coverageType) { payment.value = null; return; }
  const res = await fetchProposalPayment(proposal.value.proposalUuid);
  payment.value = res?.payment || null;
}
const showCertModal = ref(false);
const showScheduleModal = ref(false);
const carImages = ref([]);
const previewImageUrl = ref(null);

const libreImages = computed(() => {
  return carImages.value.filter(img => img.imageName && img.imageName.toLowerCase().includes('libre'));
});

const photoImages = computed(() => {
  return carImages.value.filter(img => !img.imageName || !img.imageName.toLowerCase().includes('libre'));
});

// Libre data as [key, value] pairs, skipping empties and internal fields (raw OCR preview, source).
const LIBRE_HIDDEN_KEYS = new Set(['rawTextPreview', 'ocrSource']);
const LIBRE_LABELS = {
  plateNumber: 'Plate Number', licensePlateCode: 'Plate Code', vehicleType: 'Vehicle Type', manufacturer: 'Make',
  model: 'Model', yearOfManufacture: 'Year of Manufacture', chassisNumber: 'Chassis Number', engineNumber: 'Engine Number',
  color: 'Colour', horsePower: 'Horse Power', weight: 'Weight (kg)', carryingCapacity: 'Carrying Capacity (q)',
  numberOfCylinders: 'Cylinders', engineCC: 'Engine CC', numberOfSeats: 'Seats', ownerName: 'Owner Name',
  location: 'Location', phone: 'Phone',
};
const libreDataEntries = computed(() => {
  const data = proposal.value?.libreData;
  if (!data || typeof data !== 'object') return [];
  return Object.entries(data).filter(([k, v]) => !LIBRE_HIDDEN_KEYS.has(k) && v !== null && v !== undefined && String(v).trim() !== '' && v !== 0);
});
function libreLabel(key) {
  return LIBRE_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim();
}
const ocrSourceBadge = computed(() => {
  const src = (proposal.value?.ocrSource || proposal.value?.libreData?.ocrSource || '').toUpperCase();
  if (src === 'ML_KIT') return { label: 'On-device OCR', cls: 'bg-emerald-100 text-emerald-700' };
  if (src === 'TESSERACT') return { label: 'Standard OCR', cls: 'bg-indigo-100 text-indigo-700' };
  if (src === 'MANUAL') return { label: 'Typed by customer', cls: 'bg-amber-100 text-amber-700' };
  return { label: 'Source unknown', cls: 'bg-slate-100 text-slate-600' };
});

// Role Permissions
const normRole = computed(() => {
  const roleFromStorage = getActingRole() || activeRole.value || '';
  return roleFromStorage.toUpperCase().replace('ROLE_', '');
});
const isUnderwriter = computed(() => normRole.value === 'UNDERWRITER' || normRole.value === 'SUPER_ADMIN');
const isAdjustor = computed(() => normRole.value === 'ADJUSTOR');
const isProductManager = computed(() => normRole.value === 'PRODUCT_MANAGER');
const canAssignAdjustor = computed(() => isUnderwriter.value);
const canSubmitInspection = computed(() => isAdjustor.value);
const canIssueContract = computed(() => isUnderwriter.value || normRole.value === 'SUPER_ADMIN');

function formatMoney(num) {
  if (num === null || num === undefined) return '0.00';
  return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Auto-refresh: poll proposal status every 8s so mobile payment/inspection changes appear instantly ──
let pollInterval = null;
const isPollingPaused = ref(false);

function openImage(url) {
  previewImageUrl.value = url;
  document.body.style.overflow = 'hidden';
}

function closeImage() {
  previewImageUrl.value = null;
  document.body.style.overflow = '';
}

let imagesLoading = false;
let imagesLoadedFor = null;

// Images are fetched with the auth token and rendered from blob: URLs (see utils/imageBlob.js).
async function loadImages(carUuid) {
  if (!carUuid || imagesLoading || imagesLoadedFor === carUuid) return;
  imagesLoading = true;
  try {
    const list = await listCarImages(carUuid);
    const loaded = await Promise.all(list.map(async img => ({ ...img, src: await fetchCarImageByUuid(img.imageUuid) })));
    revokeObjectUrls(carImages.value.map(i => i.src));
    carImages.value = loaded;
    imagesLoadedFor = carUuid;
  } catch (err) {
    console.error('Failed to load car images', err);
  } finally {
    imagesLoading = false;
  }
}

async function loadProposal() {
  if (isPollingPaused.value) return;
  try {
    const fresh = await fetchMotorProposalDetail(route.params.proposalUuid);
    if (isPollingPaused.value) return;
    // Only update if data actually changed (avoids UI flicker)
    if (JSON.stringify(fresh) !== JSON.stringify(proposal.value)) {
      proposal.value = fresh;
    }
  } catch (e) {
    if (!proposal.value?.proposalUuid) {
      error.value = e?.response?.data?.message || e.message || 'Failed to load proposal details';
    }
  }
}

onMounted(async () => {
  loading.value = true;
  await loadProposal();
  loading.value = false;

  document.addEventListener('keydown', handleKeyDown);

  // Load car images if carUuid is available on the proposal
  if (proposal.value?.carUuid) {
    loadImages(proposal.value.carUuid);
  }

  // Start polling every 8 seconds for live status updates
  await loadPayment();
  pollInterval = setInterval(async () => {
    await loadProposal();
    if (['APPROVED', 'PENDING_PAYMENT', 'PAID'].includes(uiStatus.value)) await loadPayment();
    // Also refresh images if carUuid is present but images haven't loaded yet
    if (proposal.value?.carUuid && imagesLoadedFor !== proposal.value.carUuid) {
      loadImages(proposal.value.carUuid);
    }
  }, 8000);
});

onBeforeUnmount(() => {
  if (pollInterval) clearInterval(pollInterval);
  document.removeEventListener('keydown', handleKeyDown);
  document.body.style.overflow = '';
  revokeObjectUrls(carImages.value.map(i => i.src));
});

function handleKeyDown(e) {
  if (e.key === 'Escape' && previewImageUrl.value) closeImage();
}

function printCertificate() {
  const originalTitle = document.title;
  if (showCertModal.value) {
    document.title = `Standard_Insurance_Motor_Sticker_Certificate_${proposal.value.proposalNumber || 'PROP_2026_001'}`;
  } else if (showScheduleModal.value) {
    document.title = `Standard_Insurance_Motor_Policy_Schedule_${proposal.value.proposalNumber || 'PROP_2026_001'}`;
  } else {
    document.title = `Standard_Insurance_Motor_Document_${proposal.value.proposalNumber || 'PROP_2026_001'}`;
  }
  window.print();
  setTimeout(() => {
    document.title = originalTitle;
  }, 1000);
}

const parsedEndorsements = computed(() => {
  try {
    return JSON.parse(proposal.value.endorsementsJson || '[]');
  } catch (e) {
    return [];
  }
});

const parsedQuestionnaire = computed(() => {
  try {
    if (!proposal.value.questionnaireAnswersJson) return {};
    return JSON.parse(proposal.value.questionnaireAnswersJson);
  } catch (e) {
    return {};
  }
});

const filteredQuestionnaire = computed(() => {
  const allAnswers = parsedQuestionnaire.value;
  const excludeKeys = [
    'proposerAge', 'proposerAddress', 'poBox', 'tradeProfession', 'licenseNo', 'licenseIssueDate',
    'categoryName', 'bodyType', 'overnightParking', 'isSoleProperty', 'isHirePurchase', 'privatePurposeOnly',
    'drivingYearsSelf', 'hasPhysicalInfirmity', 'hasDrivingConvictions', 'hasRadioAccessories',
    'insurePaidDriverAssistant', 'insurePassengersPa', 'questionnaireAnswers'
  ];
  const filtered = {};
  for (const key in allAnswers) {
    if (!excludeKeys.includes(key)) {
      filtered[key] = allAnswers[key];
    }
  }
  return filtered;
});

function statusMeta(st) {
  const map = {
    SUBMITTED:       { cls: 'mpd-st-submitted', label: 'Submitted' },
    APPROVED:        { cls: 'mpd-st-approved',  label: 'Approved · awaiting payment' },
    PENDING_PAYMENT: { cls: 'mpd-st-approved',  label: 'Payment in progress' },
    PAID:            { cls: 'mpd-st-paid',      label: 'Paid · issue certificate' },
    ACTIVE:          { cls: 'mpd-st-active',    label: 'Active' },
    REJECTED:        { cls: 'mpd-st-rejected',  label: 'Rejected' },
  };
  const key = LEGACY_STATUS[String(st || '').toUpperCase()] || String(st || '').toUpperCase();
  return map[key] || { cls: 'mpd-st-submitted', label: st || '—' };
}

async function handleAssignAdjustor() {
  isPollingPaused.value = true;
  const adjustorMap = {
    'ADJ-100': 'Solomon Tadesse (Vehicle Adjustor)',
    'ADJ-101': 'Dawit Tesfaye (Senior Adjustor)',
    'ADJ-102': 'Almaz Wolde (Field Adjustor)',
    'ADJ-103': 'Yonas Hailu (Motor Adjustor)'
  };
  const name = adjustorMap[selectedAdjustor.value] || 'Dawit Tesfaye (Senior Adjustor)';
  await assignProposalAdjustor(proposal.value.proposalUuid, {
    adjustorUuid: selectedAdjustor.value,
    adjustorName: name
  });
  const fresh = await fetchMotorProposalDetail(route.params.proposalUuid);
  proposal.value = fresh;
  showToast('Adjustor assigned successfully!');
  isPollingPaused.value = false;
}

async function handleSubmitInspection() {
  isPollingPaused.value = true;
  const res = await submitProposalInspection(proposal.value.proposalUuid, {
    status: inspectionStatus.value,
    notes: inspectionStatus.value === 'PASSED' ? 'Vehicle physical pre-inspection completed cleanly.' : 'Pre-existing damage found at inspection.'
  });
  proposal.value = await fetchMotorProposalDetail(route.params.proposalUuid);
  await loadPayment();
  showToast(res.success ? (inspectionStatus.value === 'PASSED' ? 'Inspection passed — proposal approved.' : 'Inspection failed — proposal rejected.') : res.message, res.success ? 'success' : 'error');
  isPollingPaused.value = false;
}

async function handleApprove() {
  isActing.value = true;
  isPollingPaused.value = true;
  try {
    const res = await approveProposal(proposal.value.proposalUuid, 'Approved by underwriter');
    proposal.value = await fetchMotorProposalDetail(route.params.proposalUuid);
    showToast(res.success ? 'Proposal approved — the customer can now pay in the app.' : res.message, res.success ? 'success' : 'error');
  } finally {
    isActing.value = false;
    isPollingPaused.value = false;
  }
}

async function handleReject() {
  const reason = window.prompt('Reason for rejecting this proposal (shown to the customer):', '');
  if (reason === null) return;
  isActing.value = true;
  isPollingPaused.value = true;
  try {
    const res = await rejectProposal(proposal.value.proposalUuid, reason || 'Declined by underwriter');
    proposal.value = await fetchMotorProposalDetail(route.params.proposalUuid);
    showToast(res.success ? 'Proposal rejected.' : res.message, res.success ? 'success' : 'error');
  } finally {
    isActing.value = false;
    isPollingPaused.value = false;
  }
}

async function handleIssueContract() {
  isIssuing.value = true;
  isPollingPaused.value = true;
  try {
    const res = await issueProposalContract(proposal.value.proposalUuid);
    proposal.value = await fetchMotorProposalDetail(route.params.proposalUuid);
    showToast(res.success ? `Policy ${res.policyNumber} issued — certificate ready.` : res.message, res.success ? 'success' : 'error');
  } catch (e) {
    showToast(e?.response?.data?.message || 'Failed to issue contract', 'error');
  } finally {
    isIssuing.value = false;
    isPollingPaused.value = false;
  }
}
</script>

<style scoped>
.mpd-root { padding: 1.75rem 2rem; min-height: 100%; background: #f8fafc; color: #0f172a; font-sans: inherit; }
.mpd-topnav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
.mpd-back-link { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-weight: 700; color: #1d4ed8; text-decoration: none; transition: color 0.15s; }
.mpd-back-link:hover { color: #1e40af; text-decoration: underline; }
.mpd-uuid { font-size: 0.74rem; font-family: monospace; color: #64748b; }
.mpd-icon-sm { width: 15px; height: 15px; }

/* Header Card */
.mpd-header-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 0.85rem; padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; box-shadow: 0 4px 14px rgba(0,0,0,0.03); }
.mpd-title { font-size: 1.35rem; font-weight: 800; color: #0f172a; margin: 0; }
.mpd-subtitle { font-size: 0.8rem; color: #64748b; margin-top: 0.25rem; }

/* Status Badges */
.mpd-status-badge { display: inline-flex; align-items: center; padding: 0.25rem 0.65rem; border-radius: 9999px; font-size: 0.68rem; font-weight: 800; white-space: nowrap; }
.mpd-st-submitted  { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
.mpd-st-assigned   { background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; }
.mpd-st-inspected  { background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; }
.mpd-st-issued     { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.mpd-st-default    { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }

.mpd-issue-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.55rem 1.2rem; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #fff; border: none; border-radius: 0.6rem; font-size: 0.8rem; font-weight: 800; cursor: pointer; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25); transition: transform 0.15s, opacity 0.15s; }
.mpd-issue-btn:hover:not(:disabled) { transform: translateY(-1px); opacity: 0.95; }
.mpd-issue-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.mpd-reject-btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.55rem 0.9rem; background: #fff; color: #b91c1c; border: 1px solid #fecaca; border-radius: 0.6rem; font-size: 0.78rem; font-weight: 800; cursor: pointer; }
.mpd-reject-btn:hover { background: #fef2f2; }
.mpd-pill-amber { background: #fffbeb !important; color: #b45309 !important; border-color: #fde68a !important; }
.mpd-pill-red { background: #fef2f2 !important; color: #b91c1c !important; border-color: #fecaca !important; }
.mpd-st-submitted { background:#eff6ff; color:#1d4ed8; }
.mpd-st-approved { background:#fffbeb; color:#b45309; }
.mpd-st-paid { background:#ecfdf5; color:#047857; }
.mpd-st-active { background:#f0fdf4; color:#15803d; }
.mpd-st-rejected { background:#fee2e2; color:#b91c1c; }
.mpd-issued-pill { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.9rem; background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; border-radius: 0.6rem; font-size: 0.75rem; font-weight: 800; }

/* Cards & Components */
.mpd-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 0.85rem; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.03); }
.mpd-card-header { display: flex; align-items: center; gap: 0.55rem; padding: 0.85rem 1.25rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; font-weight: 800; color: #1e293b; }
.mpd-header-icon-svg { width: 18px; height: 18px; }

.mpd-spec-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.75rem; border-radius: 0.6rem; }
.mpd-spec-label { font-size: 0.68rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
.mpd-spec-value { font-size: 0.82rem; font-weight: 700; color: #0f172a; margin-top: 0.2rem; }

.mpd-endorsement-pill { font-size: 0.72rem; font-weight: 700; color: #1d4ed8; background: #eff6ff; border: 1px solid #bfdbfe; padding: 0.2rem 0.6rem; border-radius: 6px; }

/* Form Boxes */
.mpd-form-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.65rem; padding: 0.85rem; display: flex; flex-direction: column; gap: 0.55rem; }
.mpd-form-title { font-size: 0.75rem; font-weight: 800; color: #1e293b; }
.mpd-select { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 0.5rem; padding: 0.45rem 0.65rem; font-size: 0.76rem; color: #334155; outline: none; }
.mpd-sec-btn { padding: 0.45rem; background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; border-radius: 0.5rem; font-size: 0.74rem; font-weight: 700; cursor: pointer; transition: background 0.15s; }
.mpd-sec-btn:hover { background: #ede9fe; }
.mpd-suc-btn { padding: 0.45rem; background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; border-radius: 0.5rem; font-size: 0.74rem; font-weight: 700; cursor: pointer; transition: background 0.15s; }
.mpd-suc-btn:hover { background: #dcfce7; }
.mpd-report-box { background: #f5f3ff; border: 1px solid #ede9fe; border-radius: 0.6rem; padding: 0.85rem; font-size: 0.78rem; color: #4c1d95; }

/* Gateway & Document Boxes */
.mpd-gateway-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.65rem; padding: 0.85rem; }
.mpd-gw-btn { width: 100%; margin-top: 0.5rem; padding: 0.4rem; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; border-radius: 0.5rem; font-size: 0.74rem; font-weight: 700; cursor: pointer; }
.mpd-gw-btn:hover { background: #dbeafe; }
.mpd-gw-btn-suc { width: 100%; margin-top: 0.5rem; padding: 0.4rem; background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; border-radius: 0.5rem; font-size: 0.74rem; font-weight: 700; cursor: pointer; }
.mpd-gw-btn-suc:hover { background: #dcfce7; }

.mpd-doc-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.65rem; padding: 0.75rem 0.85rem; display: flex; align-items: center; justify-content: space-between; }
.mpd-view-doc-btn { padding: 0.3rem 0.75rem; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; border-radius: 0.45rem; font-size: 0.72rem; font-weight: 800; cursor: pointer; }
.mpd-view-doc-btn:hover { background: #2563eb; color: #ffffff; }

/* Skeleton & Loading */
.mpd-loading { padding: 2rem; display: flex; flex-direction: column; gap: 1rem; }
.mpd-skel { background: #e2e8f0; border-radius: 0.5rem; animation: mpd-shimmer 1.4s infinite; }
.mpd-skel-title { height: 32px; width: 220px; }
.mpd-skel-card { height: 180px; width: 100%; }
@keyframes mpd-shimmer { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
.mpd-alert { padding: 1rem; background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 0.6rem; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
</style>

<style>
@media print {
  @page {
    margin: 0;
  }
  body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
</style>
