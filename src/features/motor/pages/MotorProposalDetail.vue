<template>
  <div class="mpd-root">

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
            v-if="proposal.status !== 'CONTRACT_ISSUED'"
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
                  <button @click="handleAssignAdjustor" class="mpd-sec-btn">
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
                  <button @click="handleSubmitInspection" class="mpd-suc-btn">
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
                  <span :class="proposal.tpPaymentStatus === 'PAID' ? 'text-emerald-700 font-bold' : 'text-amber-600 font-bold'">
                    {{ proposal.tpPaymentStatus || 'PENDING' }}
                  </span>
                </div>
                <div v-if="proposal.tpPaymentRef" class="text-[11px] font-mono text-slate-500 mt-1">
                  Ref: {{ proposal.tpPaymentRef }}
                </div>
                <button 
                  v-if="proposal.tpPaymentStatus !== 'PAID'"
                  @click="handlePayTp"
                  class="mpd-gw-btn"
                >
                  Simulate EthioTelecom Payment
                </button>
              </div>

              <!-- EthiSwitch OD Gateway -->
              <div class="mpd-gateway-box">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-800">2. EthiSwitch (Nyala OD)</span>
                  <span :class="proposal.odPaymentStatus === 'PAID' ? 'text-emerald-700 font-bold' : 'text-amber-600 font-bold'">
                    {{ proposal.odPaymentStatus || 'PENDING' }}
                  </span>
                </div>
                <div v-if="proposal.odPaymentRef" class="text-[11px] font-mono text-slate-500 mt-1">
                  Ref: {{ proposal.odPaymentRef }}
                </div>
                <button 
                  v-if="proposal.odPaymentStatus !== 'PAID' && proposal.coverageType !== 'THIRD_PARTY'"
                  @click="handlePayOd"
                  class="mpd-gw-btn-suc"
                >
                  Simulate EthiSwitch Gateway Payment
                </button>
              </div>
            </div>
          </div>

          <!-- Documents Card -->
          <div class="mpd-card">
            <div class="mpd-card-header">
              <span>Generated Regulatory & Policy Documents</span>
            </div>

            <div class="p-5">
              <div v-if="proposal.status === 'CONTRACT_ISSUED'" class="space-y-3">
                <!-- Document 1: Official Certificate (Sticker) -->
                <div class="mpd-doc-box">
                  <div class="flex items-center gap-3">
                    <svg class="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <div>
                      <div class="text-xs font-bold text-slate-900">Official Yellow Certificate (Reg 554/2024)</div>
                      <div class="text-[11px] text-slate-500">Compulsory Government TP Insurance Sticker</div>
                    </div>
                  </div>
                  <button @click="showCertModal = true" class="mpd-view-doc-btn">
                    View & Print Sticker
                  </button>
                </div>

                <!-- Document 2: Official Comprehensive Policy Schedule -->
                <div class="mpd-doc-box">
                  <div class="flex items-center gap-3">
                    <svg class="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    <div>
                      <div class="text-xs font-bold text-slate-900">Comprehensive Motor Policy Schedule</div>
                      <div class="text-[11px] text-slate-500">Official Nyala Contract Terms, Rates & Excesses</div>
                    </div>
                  </div>
                  <button @click="showScheduleModal = true" class="mpd-view-doc-btn">
                    View & Print Schedule
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

    <!-- ─── DOCUMENT 1: Official Yellow Certificate Sticker Modal (Reg 554/2024) ─── -->
    <div v-if="showCertModal" class="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto flex items-start justify-center">
      <div class="bg-[#FFFEE0] text-slate-900 border-4 border-amber-500/60 rounded-2xl shadow-2xl max-w-4xl w-full p-6 sm:p-8 font-sans relative my-6 print:m-0 print:p-0 print:border-0 print:bg-white print:shadow-none">
        
        <!-- Action Buttons (Print / Close) -->
        <div class="flex items-center justify-between border-b border-amber-300 pb-3 mb-4 print:hidden">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 bg-amber-200 text-amber-900 text-xs font-bold rounded-lg border border-amber-400">
              DOCUMENT 1: REGULATORY STICKER CERTIFICATE
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button @click="printCertificate" class="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              Print / Export Sticker
            </button>
            <button @click="showCertModal = false" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer">
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
              <span class="font-bold font-mono text-sm text-emerald-950 underline">ETB {{ formatMoney(proposal.tpPremiumAmount || 1250) }}</span>
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
            <div class="mt-4 flex flex-col items-center justify-center">
              <div class="w-36 h-36 rounded-full border-4 border-blue-900 p-2 flex flex-col items-center justify-center text-center text-blue-950 font-black text-[10px] transform -rotate-6 opacity-90 shadow-sm bg-blue-100/50">
                <img src="/nyala_logo.png" class="h-6 object-contain mb-0.5 opacity-80" />
                <div class="border-b border-blue-900 pb-0.5 w-full text-[9px] uppercase font-extrabold">Nyala Insurance S.C.</div>
                <div class="py-0.5 text-[8px] font-bold">OFFICIAL STAMP SEAL</div>
                <div class="border-t border-blue-900 pt-0.5 w-full text-[8px]">ADDIS ABABA, ETHIOPIA</div>
              </div>
              <div class="text-[10px] font-extrabold text-blue-950 mt-1">OFFICIAL DIGITAL SEAL</div>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- ─── DOCUMENT 2: Official Comprehensive Policy Schedule Modal ─── -->
    <div v-if="showScheduleModal" class="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto flex items-start justify-center">
      <div class="bg-white text-slate-900 border border-slate-300 rounded-2xl shadow-2xl max-w-4xl w-full p-6 sm:p-8 font-sans relative my-6 print:m-0 print:p-0 print:border-0 print:shadow-none">
        
        <!-- Action Buttons (Print / Close) -->
        <div class="flex items-center justify-between border-b border-slate-200 pb-3 mb-5 print:hidden">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 bg-blue-100 text-blue-900 text-xs font-bold rounded-lg border border-blue-300">
              DOCUMENT 2: COMPREHENSIVE POLICY SCHEDULE
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button @click="printCertificate" class="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              Print / Export Schedule
            </button>
            <button @click="showScheduleModal = false" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer">
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
              <div class="text-sm font-black font-mono text-blue-950">NYA-MOT-POL-881923</div>
              <div class="text-xs text-slate-500 font-medium">Issue Date: 03-Jan-2026</div>
              <div class="text-xs text-emerald-700 font-bold mt-1">Status: ACTIVE & FULLY PAID</div>
            </div>
          </div>
        </div>

        <!-- Document Title Banner -->
        <div class="bg-blue-950 text-white text-center py-2.5 rounded-xl font-black text-sm uppercase tracking-wider mb-6">
          COMPREHENSIVE MOTOR INSURANCE POLICY SCHEDULE
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
                <span class="font-bold text-slate-950">{{ proposal.insuredName || 'Abraham Addisu' }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[11px]">Phone Number:</span>
                <span class="font-bold font-mono text-slate-950">{{ proposal.insuredPhone || '0963048258' }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[11px]">Email Address:</span>
                <span class="font-bold text-slate-950">{{ proposal.insuredEmail || 'abroid.et@gmail.com' }}</span>
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
                <span class="font-bold text-slate-950">{{ proposal.carName || 'Toyota' }} {{ proposal.carModel || 'Land Cruiser 300 V6' }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[11px]">Plate Number:</span>
                <span class="font-bold font-mono text-blue-950">{{ proposal.vehiclePlateNumber || '3-A98123' }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[11px]">Chassis Number:</span>
                <span class="font-bold font-mono text-slate-950">{{ proposal.chassisNumber || 'CHAS-881923091' }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[11px]">Engine Number:</span>
                <span class="font-bold font-mono text-slate-950">{{ proposal.engineNumber || 'ENG-WD615-9921' }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[11px]">Year of Manufacture:</span>
                <span class="font-bold text-slate-950">{{ proposal.makeYear || '2023' }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[11px]">Body / Vehicle Type:</span>
                <span class="font-bold text-slate-950">{{ proposal.carType || 'SUV / Station Wagon' }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[11px]">Seating Capacity:</span>
                <span class="font-bold text-slate-950">7 Passengers</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[11px]">Vehicle Sum Insured:</span>
                <span class="font-bold font-mono text-blue-950 text-sm">ETB {{ formatMoney(proposal.sumInsured || 18500000) }}</span>
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
                  <td class="py-2.5 px-4 font-bold text-slate-900">1. Basic Own Damage (OD) Premium</td>
                  <td class="py-2.5 px-4">EthiSwitch National Gateway</td>
                  <td class="py-2.5 px-4 text-emerald-700 font-bold">PAID</td>
                  <td class="py-2.5 px-4 text-right font-mono font-bold">ETB {{ formatMoney(proposal.odPremiumAmount || 407000) }}</td>
                </tr>
                <tr>
                  <td class="py-2.5 px-4 font-bold text-slate-900">2. Compulsory Third Party (TP) Government Fund</td>
                  <td class="py-2.5 px-4">EthioTelecom Payment Rail</td>
                  <td class="py-2.5 px-4 text-emerald-700 font-bold">PAID</td>
                  <td class="py-2.5 px-4 text-right font-mono font-bold">ETB {{ formatMoney(proposal.tpPremiumAmount || 1250) }}</td>
                </tr>
                <tr class="bg-slate-50 font-bold">
                  <td colspan="3" class="py-2.5 px-4 text-right uppercase text-slate-700">Total Policy Premium Paid:</td>
                  <td class="py-2.5 px-4 text-right font-mono text-sm text-blue-950 font-black">ETB {{ formatMoney(proposal.totalPremiumAmount || 408250) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Section 4: Policy Conditions & Excess / Deductibles -->
          <div class="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
            <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wide">4. Policy Terms & Excess Conditions:</h4>
            <ul class="list-disc list-inside space-y-1 text-[11px] text-slate-700 leading-relaxed font-medium">
              <li><strong>Own Damage Excess:</strong> Insured pays 10% of total repair claim (Minimum ETB 5,000) per accident.</li>
              <li><strong>Compulsory TP Coverage:</strong> Complies strictly with FDRE Proclamation No. 799/2013 and Regulation No. 554/2024.</li>
              <li><strong>Authorized Drivers:</strong> Any person driving with valid Ethiopian Driver License under permission of the Insured.</li>
              <li><strong>Emergency Hotline:</strong> 24/7 Motor Claims Center Hotline: <strong>9222</strong> (Toll Free).</li>
            </ul>
          </div>

          <!-- Section 5: Authorized Signatures & Seal -->
          <div class="pt-4 flex items-end justify-between border-t border-slate-300">
            <div>
              <p class="text-[11px] font-bold text-slate-800">Issued by Nyala Insurance Company S.C.</p>
              <p class="text-[10px] text-slate-500">Underwriting Manager Signature & Date</p>
              <div class="mt-3 font-mono text-xs font-bold text-slate-950 border-b-2 border-slate-800 w-56 pb-1">
                Solomon Tadesse (Underwriter)
              </div>
            </div>

            <div class="flex flex-col items-center">
              <div class="w-32 h-32 rounded-full border-4 border-blue-900 p-2 flex flex-col items-center justify-center text-center text-blue-950 font-black text-[9px] transform -rotate-6 opacity-90 shadow-sm bg-blue-50">
                <img src="/nyala_logo.png" class="h-5 object-contain mb-0.5" />
                <div class="border-b border-blue-900 pb-0.5 w-full text-[8px] uppercase font-bold">Nyala Insurance S.C.</div>
                <div class="py-0.5 text-[7px] font-extrabold">OFFICIAL POLICY SEAL</div>
                <div class="border-t border-blue-900 pt-0.5 w-full text-[7px]">ADDIS ABABA</div>
              </div>
              <span class="text-[10px] font-bold text-blue-950 mt-1">OFFICIAL DIGITAL STAMP</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
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
const selectedAdjustor = ref('ADJ-101');
const inspectionStatus = ref('PASSED');
const isIssuing = ref(false);
const showCertModal = ref(false);
const showScheduleModal = ref(false);

// Role Permissions
const normRole = computed(() => (activeRole.value || '').toUpperCase().replace('ROLE_', ''));
const isUnderwriter = computed(() => normRole.value === 'UNDERWRITER' || normRole.value === 'SUPER_ADMIN');
const isAdjustor = computed(() => normRole.value === 'ADJUSTOR' || normRole.value === 'SUPER_ADMIN');
const canAssignAdjustor = computed(() => isUnderwriter.value);
const canSubmitInspection = computed(() => isAdjustor.value);
const canIssueContract = computed(() => isUnderwriter.value);

function formatMoney(num) {
  if (num === null || num === undefined) return '0.00';
  return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

onMounted(async () => {
  loading.value = true;
  try {
    proposal.value = await fetchMotorProposalDetail(route.params.proposalUuid);
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || 'Failed to load proposal details';
  } finally {
    loading.value = false;
  }
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
  proposal.value.assignedAdjustorName = name;
  proposal.value.status = 'ADJUSTOR_ASSIGNED';
  alert('Adjustor assigned successfully!');
}

async function handleSubmitInspection() {
  await submitProposalInspection(proposal.value.proposalUuid, {
    status: inspectionStatus.value,
    notes: 'Vehicle physical pre-inspection completed cleanly.'
  });
  proposal.value.inspectionStatus = inspectionStatus.value;
  proposal.value.status = 'INSPECTION_DONE';
  proposal.value.inspectionNotes = 'Vehicle physical pre-inspection completed cleanly.';
  alert('Inspection finding recorded!');
}

async function handlePayTp() {
  const res = await payTpEthioTelecom(proposal.value.proposalUuid);
  proposal.value.tpPaymentStatus = 'PAID';
  proposal.value.tpPaymentRef = res.txnRef;
  alert('EthioTelecom TP Payment simulated successfully!');
}

async function handlePayOd() {
  const res = await payOdEthiSwitch(proposal.value.proposalUuid, { bankCode: 'CBE' });
  proposal.value.odPaymentStatus = 'PAID';
  proposal.value.odPaymentRef = res.txRef;
  alert('EthiSwitch OD Payment simulated successfully!');
}

async function handleIssueContract() {
  isIssuing.value = true;
  try {
    const res = await issueProposalContract(proposal.value.proposalUuid);
    proposal.value.status = 'CONTRACT_ISSUED';
    alert('Policy Contract & Digital Certificate Issued!');
  } catch (e) {
    alert(e?.response?.data?.message || 'Failed to issue contract');
  } finally {
    isIssuing.value = false;
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
.mpd-alert { padding: 1rem; background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 0.6rem; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
</style>
