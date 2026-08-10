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
            Insured: <strong class="text-slate-900">{{ proposal.insuredName }}</strong> ({{ proposal.insuredPhone || '—' }}) • 
            Plate: <strong class="text-blue-700 font-mono">{{ proposal.vehiclePlateNumber }}</strong>
          </p>
        </div>

        <div class="mpd-header-actions">
          <button 
            type="button"
            v-if="proposal.status !== 'CONTRACT_ISSUED' && proposal.status !== 'ACTIVE'"
            @click="handleIssueContract" 
            :disabled="isIssuing || !canIssueContract"
            :title="!canIssueContract ? 'Requires Underwriter Privilege' : ''"
            class="mpd-issue-btn"
          >
            <svg class="mpd-icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            {{ canIssueContract ? 'Issue Official Contract & Certificate' : 'Issue Contract (Underwriter Only)' }}
          </button>
          <div v-else class="mpd-issued-pill">
            <svg class="mpd-icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            Contract Issued & Certificate Ready
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
              </div>
            </div>

            <div class="px-5 pb-5 pt-1">
              <div class="text-xs font-semibold text-slate-500 mb-2">Selected Endorsements & Add-ons:</div>
              <div class="flex flex-wrap gap-2">
                <span v-for="end in parsedEndorsements" :key="end" class="mpd-endorsement-pill">
                  {{ end }}
                </span>
                <span v-if="parsedEndorsements.length === 0" class="text-xs text-slate-400 italic">Standard coverage only (No endorsements)</span>
              </div>
            </div>
          </div>

          <!-- Customer PDF Proposal Form Questionnaire Card -->
          <div class="mpd-card">
            <div class="mpd-card-header">
              <svg class="mpd-header-icon-svg text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <span>Customer Proposal Form Questionnaire Answers (Nyala PDF Standard)</span>
            </div>

            <div class="p-5 space-y-4 text-xs">
              <!-- Proposer & Driving Profile -->
              <div>
                <div class="font-bold text-slate-900 mb-2 text-xs uppercase tracking-wider text-amber-800">1. Proposer & Driving License Profile</div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div><span class="text-slate-500 block">Proposer Age:</span><strong class="text-slate-900">{{ proposal.proposerAge ? (proposal.proposerAge + ' years') : '—' }}</strong></div>
                  <div><span class="text-slate-500 block">Residential Address:</span><strong class="text-slate-900">{{ proposal.proposerAddress || '—' }}</strong></div>
                  <div><span class="text-slate-500 block">P.O. Box:</span><strong class="text-slate-900">{{ proposal.poBox || '—' }}</strong></div>
                  <div><span class="text-slate-500 block">Trade / Profession:</span><strong class="text-slate-900">{{ proposal.tradeProfession || '—' }}</strong></div>
                  <div><span class="text-slate-500 block">Driving License No:</span><strong class="text-slate-900 font-mono">{{ proposal.licenseNo || '—' }}</strong></div>
                  <div><span class="text-slate-500 block">License Issue Date:</span><strong class="text-slate-900">{{ proposal.licenseIssueDate || '—' }}</strong></div>
                </div>
              </div>

              <!-- Vehicle Usage & Interest -->
              <div>
                <div class="font-bold text-slate-900 mb-2 text-xs uppercase tracking-wider text-amber-800">2. Usage, Parking & Insurable Interest</div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div><span class="text-slate-500 block">Vehicle Category:</span><strong class="text-blue-700 font-semibold">{{ proposal.categoryName || '—' }}</strong></div>
                  <div><span class="text-slate-500 block">Body Type:</span><strong class="text-slate-900">{{ proposal.bodyType || '—' }}</strong></div>
                  <div><span class="text-slate-500 block">Overnight Parking:</span><strong class="text-slate-900">{{ proposal.overnightParking || '—' }}</strong></div>
                  <div><span class="text-slate-500 block">Sole Property:</span><strong class="text-slate-900">{{ proposal.isSoleProperty === true ? 'YES' : (proposal.isSoleProperty === false ? 'NO' : '—') }}</strong></div>
                  <div><span class="text-slate-500 block">Hire Purchase / Financier:</span><strong class="text-slate-900">{{ proposal.isHirePurchase === true ? (proposal.financierNameAddress || 'YES') : (proposal.isHirePurchase === false ? 'NO' : '—') }}</strong></div>
                  <div><span class="text-slate-500 block">Private Purpose Only:</span><strong class="text-slate-900">{{ proposal.privatePurposeOnly === true ? 'YES' : (proposal.privatePurposeOnly === false ? 'NO' : '—') }}</strong></div>
                </div>
              </div>

              <!-- Driving & Physical Declarations -->
              <div>
                <div class="font-bold text-slate-900 mb-2 text-xs uppercase tracking-wider text-amber-800">3. Driving Record & Safety Declarations</div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div><span class="text-slate-500 block">Self Driving Experience:</span><strong class="text-slate-900">{{ proposal.drivingYearsSelf ? (proposal.drivingYearsSelf + ' Years') : '—' }}</strong></div>
                  <div><span class="text-slate-500 block">Physical Infirmity / Defective Vision:</span><strong class="text-slate-900">{{ proposal.hasPhysicalInfirmity === true ? (proposal.physicalInfirmityDetails || 'YES') : (proposal.hasPhysicalInfirmity === false ? 'NONE (Good Health)' : '—') }}</strong></div>
                  <div><span class="text-slate-500 block">Driving Convictions:</span><strong class="text-slate-900">{{ proposal.hasDrivingConvictions === true ? (proposal.convictionDetails || 'YES') : (proposal.hasDrivingConvictions === false ? 'NONE' : '—') }}</strong></div>
                  <div><span class="text-slate-500 block">Audio / Radio Accessories:</span><strong class="text-slate-900">{{ proposal.hasRadioAccessories === true ? (proposal.radioDetailsValue || 'YES') : (proposal.hasRadioAccessories === false ? 'NO' : '—') }}</strong></div>
                  <div><span class="text-slate-500 block">Paid Driver & Assistant PA:</span><strong class="text-slate-900">{{ proposal.insurePaidDriverAssistant === true ? 'COVERED' : (proposal.insurePaidDriverAssistant === false ? 'NOT COVERED' : '—') }}</strong></div>
                  <div><span class="text-slate-500 block">Passenger PA Cover:</span><strong class="text-slate-900">{{ proposal.insurePassengersPa === true ? 'COVERED' : (proposal.insurePassengersPa === false ? 'NOT COVERED' : '—') }}</strong></div>
                </div>
              </div>

              <!-- Dynamic EAV Fields -->
              <div v-if="Object.keys(filteredQuestionnaire).length > 0">
                <div class="font-bold text-slate-900 mb-2 text-xs uppercase tracking-wider text-amber-800">4. Additional Dynamic Form Responses (EAV)</div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-amber-50/50 p-3.5 rounded-xl border border-amber-100">
                  <div v-for="(val, key) in filteredQuestionnaire" :key="key">
                    <span class="text-slate-500 block text-[11px] uppercase tracking-wide">{{ key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim() }}:</span>
                    <strong class="text-slate-900" style="word-break: break-word;">
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
          <!-- Premium & Gateways -->
          <div class="mpd-card">
            <div class="mpd-card-header">
              <span>Premium Breakdown & Gateways</span>
            </div>

            <div class="p-5 space-y-4">
              <div class="space-y-2.5 text-xs">
                <div class="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span class="text-slate-600 font-medium">Compulsory Third Party (TP)</span>
                  <span class="font-mono font-bold text-slate-800">ETB {{ formatMoney(proposal.tpPremiumAmount) }}</span>
                </div>
                <div class="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span class="text-slate-600 font-medium">Own Damage Premium (OD)</span>
                  <span class="font-mono font-bold text-slate-800">ETB {{ formatMoney(proposal.odPremiumAmount) }}</span>
                </div>
                <div class="flex justify-between items-center pt-1 font-extrabold text-sm">
                  <span class="text-slate-900">Total Payable</span>
                  <span class="font-mono text-emerald-700">ETB {{ formatMoney(proposal.totalPremiumAmount) }}</span>
                </div>
              </div>

              <!-- EthioTelecom TP Gateway -->
              <div class="mpd-gateway-box">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-800">1. EthioTelecom (Govt TP)</span>
                  <span :class="proposal.tpPaymentStatus === 'PAID' || proposal.tpPaymentStatus === 'PAID_ETHIOTELECOM' ? 'text-emerald-700 font-bold' : 'text-amber-600 font-bold'">
                    {{ proposal.tpPaymentStatus || 'PENDING' }}
                  </span>
                </div>
                <div v-if="proposal.tpPaymentRef" class="text-[11px] font-mono text-slate-500 mt-1">
                  Ref: {{ proposal.tpPaymentRef }}
                </div>
                <div v-if="proposal.tpPaymentStatus !== 'PAID' && proposal.tpPaymentStatus !== 'PAID_ETHIOTELECOM'" class="text-[11px] text-amber-600 mt-1 font-medium">
                  Awaiting customer payment via Mobile App
                </div>
              </div>

              <!-- EthiSwitch OD Gateway -->
              <div class="mpd-gateway-box">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-800">2. EthiSwitch (Nyala OD)</span>
                  <span :class="proposal.odPaymentStatus === 'PAID' || proposal.odPaymentStatus === 'PAID_ETHISWITCH' ? 'text-emerald-700 font-bold' : 'text-amber-600 font-bold'">
                    {{ proposal.odPaymentStatus || 'PENDING' }}
                  </span>
                </div>
                <div v-if="proposal.odPaymentRef" class="text-[11px] font-mono text-slate-500 mt-1">
                  Ref: {{ proposal.odPaymentRef }}
                </div>
                <div v-if="proposal.odPaymentStatus !== 'PAID' && proposal.odPaymentStatus !== 'PAID_ETHISWITCH' && proposal.coverageType !== 'THIRD_PARTY'" class="text-[11px] text-amber-600 mt-1 font-medium">
                  Awaiting customer payment via Mobile App
                </div>
              </div>
            </div>
          </div>

          <!-- Documents Card -->
          <div class="mpd-card">
            <div class="mpd-card-header">
              <span>Generated Regulatory & Policy Documents</span>
            </div>

            <div class="p-5">
              <div v-if="proposal.status === 'CONTRACT_ISSUED' || proposal.status === 'ACTIVE'" class="space-y-3">
                <!-- Document 1: Official Certificate (Sticker) -->
                <div v-if="proposal.coverageType === 'COMPREHENSIVE' || proposal.coverageType === 'THIRD_PARTY'" class="mpd-doc-box">
                  <div class="flex items-center gap-3">
                    <svg class="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <div>
                      <div class="text-xs font-bold text-slate-900">Official Certificate (Reg 554/2024)</div>
                      <div class="text-[11px] text-slate-500">Compulsory Government TP Insurance Sticker</div>
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
                      <div class="text-xs font-bold text-slate-900">{{ proposal.coverageType === 'OWN_DAMAGE' ? 'Standalone OD Policy Schedule' : 'Comprehensive Motor Policy Schedule' }}</div>
                      <div class="text-[11px] text-slate-500">Official Nyala Contract Terms, Rates & Excesses</div>
                    </div>
                  </div>
                  <button type="button" @click="showScheduleModal = true" class="mpd-view-doc-btn whitespace-nowrap flex-shrink-0">
                    View Schedule
                  </button>
                </div>
              </div>

              <div v-else class="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                Official documents will be generated automatically when contract is issued.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCertModal" class="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto flex items-start justify-center print:bg-transparent">
      <div class="bg-[#FFFEE0] text-slate-900 border-4 border-amber-500/60 rounded-2xl shadow-2xl max-w-4xl w-full p-6 sm:p-8 font-sans relative my-6 print:m-0 print:p-8 print:border-0 print:shadow-none print:bg-[#FFFEE0]">
        
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

        <!-- Certificate Header (FDRE Left, Nyala Right) -->
        <div class="border-b-2 border-slate-800 pb-4 mb-4">
          <div class="flex items-start justify-between">
            <!-- Left: FDRE Transport Ministry Header -->
            <div class="text-[11px] leading-tight font-bold text-slate-900 max-w-xs space-y-0.5">
              <div>በኢ.ፌ.ዴ.ሪ</div>
              <div>የትራንስፖርት እና ሎጅስቲክስ ሚኒስቴር</div>
              <div>የመንገድ ደህንነትና መድን ፈንድ አገልግሎት</div>
              <div class="font-extrabold text-blue-900 text-[11px] pt-1">FDRE MINISTRY OF TRANSPORT</div>
              <div class="font-extrabold text-blue-900 text-[11px]">LOGISTICS ROAD SAFETY &</div>
              <div class="font-extrabold text-blue-900 text-[11px]">INSURANCE FUND SERVICE</div>
              <div class="font-extrabold underline text-xs pt-1.5 text-slate-950">የመድን ምስክር ወረቀት<br/>CERTIFICATE OF INSURANCE</div>
            </div>

            <!-- Right: Nyala Insurance Logo & Header -->
            <div class="text-right flex flex-col items-end">
              <img src="/nyala_logo.png" alt="Nyala Insurance Logo" class="h-16 object-contain mb-1" />
              <div class="text-lg font-black text-blue-950 tracking-tight">ኒያላ ኢንሹራንስ አ.ማ.</div>
              <div class="text-xs font-bold text-blue-900">Nyala Insurance Company S.C.</div>
              <div class="text-[11px] font-semibold italic text-amber-900 pt-0.5">"Protecting Your Future with Security & Trust!"</div>
              <div class="text-[10px] font-semibold text-slate-700">"የተሻለ ጥበቃ ለተሻለ ህይወት!"</div>
            </div>
          </div>
        </div>

        <!-- Certificate Fields Grid (100% Mirroring sample certificate.pdf) -->
        <div class="space-y-3.5 text-xs font-semibold text-slate-900">
          <div class="grid grid-cols-2 gap-6 border-b border-slate-400 pb-2">
            <div>
              <span class="text-slate-700 block text-[11px]">የስርቲፊኬት ቁጥር / CERTIFICATE NUMBER:</span>
              <span class="font-bold font-mono text-sm text-blue-950 underline">{{ proposal.proposalNumber || 'CN-24072104017' }}</span>
            </div>
            <div>
              <span class="text-slate-700 block text-[11px]">የተሰጠበት ቀን / DATE OF ISSUANCE:</span>
              <span class="font-bold text-sm text-slate-950 underline">09-Jul-2024</span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4 border-b border-slate-400 pb-2">
            <div>
              <span class="text-slate-700 block text-[11px]">የመድኑ ገዢው ስም / NAME OF INSURED:</span>
              <span class="font-bold text-sm text-slate-950 underline">{{ proposal.insuredName || 'Biruk Hagoss' }}</span>
            </div>
            <div>
              <span class="text-slate-700 block text-[11px]">አድራሻ: ክልል/አስተዳደር / Address:REGION:</span>
              <span class="font-bold text-slate-950 underline">Addis Ababa</span>
            </div>
            <div>
              <span class="text-slate-700 block text-[11px]">ከተማ / CITY:</span>
              <span class="font-bold text-slate-950 underline">Addis Ababa</span>
            </div>
          </div>

          <div class="grid grid-cols-5 gap-3 border-b border-slate-400 pb-2">
            <div>
              <span class="text-slate-700 block text-[10px]">ክፍለ ከተማ SUB CITY:</span>
              <span class="font-bold text-slate-950 underline">Bole</span>
            </div>
            <div>
              <span class="text-slate-700 block text-[10px]">ወረዳ WEREDA:</span>
              <span class="font-bold text-slate-950 underline">09</span>
            </div>
            <div>
              <span class="text-slate-700 block text-[10px]">ቀበሌ KEBELE:</span>
              <span class="font-bold text-slate-950 underline">09</span>
            </div>
            <div>
              <span class="text-slate-700 block text-[10px]">የቤት/ቁ HOUSE No.:</span>
              <span class="font-bold text-slate-950 underline">2694</span>
            </div>
            <div>
              <span class="text-slate-700 block text-[10px]">ሞባይል PHONE:</span>
              <span class="font-bold font-mono text-slate-950 underline">{{ proposal.insuredPhone || '0963048258' }}</span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4 border-b border-slate-400 pb-2">
            <div>
              <span class="text-slate-700 block text-[11px]">የሰሌዳ ቁጥር / PLATE NUMBER:</span>
              <span class="font-bold font-mono text-sm text-blue-950 underline">{{ proposal.vehiclePlateNumber || '3-A98123' }}</span>
            </div>
            <div>
              <span class="text-slate-700 block text-[11px]">የሞተር ቁጥር / ENGINE NUMBER:</span>
              <span class="font-bold font-mono text-slate-950 underline">{{ proposal.engineNumber || 'ENG-WD615-9921' }}</span>
            </div>
            <div>
              <span class="text-slate-700 block text-[11px]">የቻሲስ ቁጥር / CHASSIS NUMBER:</span>
              <span class="font-bold font-mono text-slate-950 underline">{{ proposal.chassisNumber || 'CHAS-881923091' }}</span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4 border-b border-slate-400 pb-2">
            <div>
              <span class="text-slate-700 block text-[11px]">የተሽከርካሪ አይነት / VEHICLE TYPE:</span>
              <span class="font-bold text-slate-950 underline">{{ proposal.carType || 'Private Saloon / SUV' }}</span>
            </div>
            <div>
              <span class="text-slate-700 block text-[11px]">የመጫን አቅም / CARRYING CAPACITY:</span>
              <span class="font-bold text-slate-950 underline">-</span>
            </div>
            <div>
              <span class="text-slate-700 block text-[11px]">ሰዎች / PERSONS:</span>
              <span class="font-bold text-slate-950 underline">5</span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4 border-b border-slate-400 pb-2">
            <div>
              <span class="text-slate-700 block text-[11px]">የመድኑ ፖሊሲ ቁጥር INSURER POLICY No.:</span>
              <span class="font-bold font-mono text-blue-950 underline">NYA-MOT-POL-881923</span>
            </div>
            <div>
              <span class="text-slate-700 block text-[11px]">ፖሊሲው ዘመን ከ POLICY PERIOD FROM:</span>
              <span class="font-bold text-slate-950 underline">03-Jan-2026</span>
            </div>
            <div>
              <span class="text-slate-700 block text-[11px]">እስከ TO:</span>
              <span class="font-bold text-slate-950 underline">02-Jan-2027</span>
            </div>
          </div>

          <div class="space-y-2 border-b border-slate-400 pb-2">
            <div>
              <span class="text-slate-700 block text-[11px]">የመድኑ ፖሊሲው የተሰጡባቸው ሁኔታዎች / CONDITIONS SUBJECT TO WHICH THE POLICY ISSUED:</span>
              <span class="font-bold text-slate-950 underline">MAP/1261/26/BG</span>
            </div>
            <div>
              <span class="text-slate-700 block text-[11px]">በመድኑ ፖሊሲው ተጠቃሚ የሚሆኑ ሰዎች ወይም ወገኖች / PERSONS ENTITLED TO USE/DRIVE:</span>
              <span class="font-bold text-slate-950 underline">ANY PERSON DRIVING WITH VALID ETHIOPIAN DRIVER LICENSE</span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4 border-b border-slate-400 pb-2">
            <div class="col-span-2">
              <span class="text-slate-700 block text-[11px]">የመድኑ ሰጪው ስም / NAME OF INSURER:</span>
              <span class="font-bold text-sm text-blue-950 underline">Nyala Insurance Company S.C.</span>
            </div>
            <div>
              <span class="text-slate-700 block text-[11px]">የአረቦን መጠን / PREMIUM TARIF:</span>
              <span class="font-bold font-mono text-sm text-emerald-950 underline">ETB {{ formatMoney(proposal.tpPremiumAmount) }}</span>
            </div>
          </div>

          <div class="pt-2 text-center space-y-2 relative">
            <div class="text-[11px] font-bold text-slate-800">
              NAME OF AUTHORIZED PERSON __________________________________________________
            </div>

            <div class="font-black text-slate-950 text-sm tracking-wide pt-1">ማረጋገጫ / DECLARATION</div>
            <div class="text-[11px] text-slate-900 max-w-xl mx-auto leading-tight font-bold">
              የምስክር ወረቀቱ የተሰጠበት የመድን ፖሊሲ በአዋጅ ቁጥር 799/2005 የተደነገጉትን መስፈርቶች የሚያሟላ ነው<br/>
              THE POLICY TO WHICH THE CERTIFICATE IS ISSUED COMPLIES WITH THE REQUIREMENTS OF PROCLAMATION No. 799/2013 & REGULATION No. 554/2024
            </div>

            <!-- Official Nyala Digital Stamp Seal -->
            <div class="mt-4 flex flex-col items-center justify-center relative">
              <img src="/nyala-sail.png" alt="Nyala Stamp Seal" class="w-36 h-36 object-contain transform -rotate-6 opacity-90 drop-shadow-md" />
              <div class="text-[10px] font-extrabold text-blue-950 mt-1">OFFICIAL NYALA CORPORATE SEAL</div>
            </div>
          </div>
        </div>
      </div>
    </div>


    <div v-if="showScheduleModal" class="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto flex items-start justify-center print:bg-transparent">
      <div class="bg-white text-slate-900 border border-slate-300 rounded-2xl shadow-2xl max-w-4xl w-full p-6 sm:p-8 font-sans relative my-6 print:m-0 print:p-8 print:border-0 print:shadow-none">
        
        <!-- Action Buttons (Print / Close) -->
        <div class="flex items-center justify-between border-b border-slate-200 pb-3 mb-5 print:hidden">
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

        <!-- Schedule Header (Nyala Logo, Motto & Corporate Head Office Info) -->
        <div class="border-b-2 border-slate-900 pb-4 mb-6">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <img src="/nyala_logo.png" alt="Nyala Insurance Logo" class="h-16 object-contain" />
              <div>
                <h1 class="text-xl font-black text-blue-950 tracking-tight">ኒያላ ኢንሹራንስ አ.ማ.</h1>
                <h2 class="text-sm font-bold text-blue-900">NYALA INSURANCE COMPANY S.C.</h2>
                <p class="text-xs font-bold text-amber-800 italic">"Protecting Your Future with Security & Trust!"</p>
                <p class="text-[11px] text-slate-500 font-medium">Head Office: Protection House, Mickey Leland St., P.O.Box 12753, Addis Ababa</p>
              </div>
            </div>
            <div class="text-right">
              <div class="text-xs font-bold text-slate-600 uppercase tracking-widest">Policy Schedule</div>
              <div class="text-sm font-black font-mono text-blue-950">{{ proposal.policyNumber || proposal.proposalNumber }}</div>
              <div class="text-xs text-slate-500 font-medium">Issue Date: {{ new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }}</div>
              <div class="text-xs text-emerald-700 font-bold mt-1">Status: ACTIVE & FULLY PAID</div>
            </div>
          </div>
        </div>

        <!-- Document Title Banner -->
        <div class="bg-blue-950 text-white text-center py-2.5 rounded-xl font-black text-sm uppercase tracking-wider mb-6">
          {{ proposal.coverageType === 'OWN_DAMAGE' ? 'STANDALONE OWN DAMAGE (OD) POLICY SCHEDULE' : 'COMPREHENSIVE MOTOR INSURANCE POLICY SCHEDULE' }}
        </div>

        <!-- Schedule Sections -->
        <div class="space-y-6 text-xs text-slate-800">
          
          <!-- Section 1: Policyholder Information -->
          <div class="border border-slate-200 rounded-xl overflow-hidden">
            <div class="bg-slate-100 px-4 py-2 font-bold text-slate-900 border-b border-slate-200">
              1. INSURED POLICYHOLDER DETAILS
            </div>
            <div class="p-4 grid grid-cols-3 gap-4">
              <div>
                <span class="text-slate-500 block text-[11px]">Insured Full Name:</span>
                <span class="font-bold text-slate-950">{{ proposal.insuredName }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[11px]">Phone Number:</span>
                <span class="font-bold font-mono text-slate-950">{{ proposal.insuredPhone }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[11px]">Email Address:</span>
                <span class="font-bold text-slate-950">{{ proposal.insuredEmail }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[11px]">Business / Occupation:</span>
                <span class="font-bold text-slate-950">Private Executive</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[11px]">Region & City:</span>
                <span class="font-bold text-slate-950">Addis Ababa, Bole Sub-City</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[11px]">Underwriting Branch:</span>
                <span class="font-bold text-blue-900">Bole Main Branch</span>
              </div>
            </div>
          </div>

          <!-- Section 2: Insured Vehicle Specifications -->
          <div class="border border-slate-200 rounded-xl overflow-hidden">
            <div class="bg-slate-100 px-4 py-2 font-bold text-slate-900 border-b border-slate-200">
              2. INSURED VEHICLE SPECIFICATIONS
            </div>
            <div class="p-4 grid grid-cols-4 gap-4">
              <div>
                <span class="text-slate-500 block text-[11px]">Make & Model:</span>
                <span class="font-bold text-slate-950">{{ proposal.carName }} {{ proposal.carModel }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[11px]">Plate Number:</span>
                <span class="font-bold font-mono text-blue-950">{{ proposal.vehiclePlateNumber }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[11px]">Chassis Number:</span>
                <span class="font-bold font-mono text-slate-950">{{ proposal.chassisNumber }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[11px]">Engine Number:</span>
                <span class="font-bold font-mono text-slate-950">{{ proposal.engineNumber }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[11px]">Year of Manufacture:</span>
                <span class="font-bold text-slate-950">{{ proposal.makeYear }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[11px]">Body / Vehicle Type:</span>
                <span class="font-bold text-slate-950">{{ proposal.carType }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[11px]">Seating Capacity:</span>
                <span class="font-bold text-slate-950">7 Passengers</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[11px]">Vehicle Sum Insured:</span>
                <span class="font-bold font-mono text-blue-950 text-sm">ETB {{ formatMoney(proposal.sumInsured) }}</span>
              </div>
            </div>
          </div>

          <!-- Section 2B: Dynamic Questionnaire Fields -->
          <div v-if="Object.keys(filteredQuestionnaire).length > 0" class="border border-slate-200 rounded-xl overflow-hidden mt-6">
            <div class="bg-slate-100 px-4 py-2 font-bold text-slate-900 border-b border-slate-200">
              INSURED VEHICLE QUESTIONNAIRE & CUSTOM DATA
            </div>
            <div class="p-4 grid grid-cols-3 gap-4">
              <div v-for="(val, key) in filteredQuestionnaire" :key="key">
                <span class="text-slate-500 block text-[11px] uppercase tracking-wide">{{ key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim() }}:</span>
                <span class="font-bold text-slate-950" style="word-break: break-word;">{{ val || '—' }}</span>
              </div>
            </div>
          </div>

          <!-- Section 3: Premium Calculation Breakdown -->
          <div class="border border-slate-200 rounded-xl overflow-hidden">
            <div class="bg-slate-100 px-4 py-2 font-bold text-slate-900 border-b border-slate-200">
              3. PREMIUM BREAKDOWN & TARIFF SCHEDULE
            </div>
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <th class="py-2.5 px-4">Coverage Description</th>
                  <th class="py-2.5 px-4">Payment Rail / Gateway</th>
                  <th class="py-2.5 px-4">Status</th>
                  <th class="py-2.5 px-4 text-right">Amount (ETB)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 font-medium">
                <tr>
                  <td class="py-2.5 px-4 font-bold text-slate-900">1. Nyala Own Damage (OD) Premium</td>
                  <td class="py-2.5 px-4">EthiSwitch National Gateway</td>
                  <td class="py-2.5 px-4 text-emerald-700 font-bold">PAID</td>
                  <td class="py-2.5 px-4 text-right font-mono font-bold">ETB {{ formatMoney(proposal.odPremiumAmount) }}</td>
                </tr>
                <tr v-if="proposal.coverageType !== 'OWN_DAMAGE'">
                  <td class="py-2.5 px-4 font-bold text-slate-900">2. Compulsory Third Party (TP) Fund</td>
                  <td class="py-2.5 px-4">EthioTelecom Telebirr Rail</td>
                  <td class="py-2.5 px-4 text-emerald-700 font-bold">PAID</td>
                  <td class="py-2.5 px-4 text-right font-mono font-bold">ETB {{ formatMoney(proposal.tpPremiumAmount) }}</td>
                </tr>
                <tr class="bg-slate-50 font-bold">
                  <td colspan="3" class="py-2.5 px-4 text-right uppercase text-slate-700">Total Policy Premium Paid:</td>
                  <td class="py-2.5 px-4 text-right font-mono text-sm text-blue-950 font-black">ETB {{ formatMoney(proposal.totalPremiumAmount) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Section 4: Policy Conditions & Excess / Deductibles -->
          <div class="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
            <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wide">4. POLICY TERMS & EXCESS CONDITIONS</h4>
            <ul class="list-disc list-inside space-y-1 text-[11px] text-slate-700 leading-relaxed font-medium">
              <li><strong>Own Damage Excess:</strong> Insured pays 10% of total repair claim (Minimum ETB 5,000) per accident.</li>
              <li><strong>Compulsory TP Coverage:</strong> Complies strictly with FDRE Proclamation No. 799/2013 and Regulation No. 554/2024.</li>
              <li><strong>Authorized Drivers:</strong> Any person driving with valid Ethiopian Driver License.</li>
              <li><strong>24/7 Toll-Free Motor Claims Center Hotline:</strong> 9222</li>
            </ul>
          </div>

          <!-- Section 5: Authorized Signatures & Seal -->
          <div class="pt-4 flex items-end justify-between border-t border-slate-300">
            <div>
              <p class="text-[11px] font-bold text-slate-800">Issued by Nyala Insurance Company S.C.</p>
              <p class="text-[10px] text-slate-500">Authorized Underwriter: Solomon Tadesse</p>
              <div class="mt-3 font-mono text-xs font-bold text-slate-950 border-b-2 border-slate-800 w-56 pb-1">
                Solomon Tadesse (Underwriter)
              </div>
            </div>

            <div class="flex flex-col items-center relative">
              <img src="/nyala-sail.png" alt="Nyala Official Corporate Seal" class="w-32 h-32 object-contain transform -rotate-6 opacity-90 drop-shadow-md" />
              <span class="text-[10px] font-extrabold text-blue-950 mt-1">OFFICIAL NYALA CORPORATE SEAL</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { 
  fetchMotorProposalDetail, 
  assignProposalAdjustor, 
  submitProposalInspection, 
  payTpEthioTelecom, 
  payOdEthiSwitch, 
  issueProposalContract 
} from '@/features/digitalChannel/api/digitalChannelApi';
import { useRoleContext } from '../composables/useRoleContext';

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
const showCertModal = ref(false);
const showScheduleModal = ref(false);

// Role Permissions
const normRole = computed(() => {
  const roleFromStorage = localStorage.getItem('nyala_active_testing_role') || localStorage.getItem('user_role') || activeRole.value || '';
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

  // Start polling every 8 seconds for live status updates
  pollInterval = setInterval(loadProposal, 8000);
});

onBeforeUnmount(() => {
  if (pollInterval) clearInterval(pollInterval);
});

function printCertificate() {
  const originalTitle = document.title;
  if (showCertModal.value) {
    document.title = `Nyala_Insurance_Motor_Sticker_Certificate_${proposal.value.proposalNumber || 'PROP_2026_001'}`;
  } else if (showScheduleModal.value) {
    document.title = `Nyala_Insurance_Motor_Policy_Schedule_${proposal.value.proposalNumber || 'PROP_2026_001'}`;
  } else {
    document.title = `Nyala_Insurance_Motor_Document_${proposal.value.proposalNumber || 'PROP_2026_001'}`;
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
    SUBMITTED: { cls: 'mpd-st-submitted', label: 'Submitted' },
    ADJUSTOR_ASSIGNED: { cls: 'mpd-st-assigned', label: 'Adjustor Assigned' },
    INSPECTION_DONE: { cls: 'mpd-st-inspected', label: 'Inspection Done' },
    CONTRACT_ISSUED: { cls: 'mpd-st-issued', label: 'Contract Issued' },
  };
  return map[st] || { cls: 'mpd-st-default', label: st || 'Pending' };
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
  await submitProposalInspection(proposal.value.proposalUuid, {
    status: inspectionStatus.value,
    notes: 'Vehicle physical pre-inspection completed cleanly.'
  });
  const fresh = await fetchMotorProposalDetail(route.params.proposalUuid);
  proposal.value = fresh;
  showToast('Inspection finding recorded!');
  isPollingPaused.value = false;
}

async function handlePayTp() {
  isPollingPaused.value = true;
  const res = await payTpEthioTelecom(proposal.value.proposalUuid);
  const fresh = await fetchMotorProposalDetail(route.params.proposalUuid);
  proposal.value = fresh;
  showToast('EthioTelecom TP Payment simulated successfully!');
  isPollingPaused.value = false;
}

async function handlePayOd() {
  isPollingPaused.value = true;
  const res = await payOdEthiSwitch(proposal.value.proposalUuid, { bankCode: 'CBE' });
  const fresh = await fetchMotorProposalDetail(route.params.proposalUuid);
  proposal.value = fresh;
  showToast('EthiSwitch OD Payment simulated successfully!');
  isPollingPaused.value = false;
}

async function handleIssueContract() {
  isIssuing.value = true;
  isPollingPaused.value = true;
  try {
    const res = await issueProposalContract(proposal.value.proposalUuid);
    const fresh = await fetchMotorProposalDetail(route.params.proposalUuid);
    proposal.value = fresh;
    showToast('Policy Contract & Digital Certificate Issued!');
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
