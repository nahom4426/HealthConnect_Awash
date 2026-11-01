<script setup>
// Printable copy of Standard Insurance's "Notification of Motor Accident" form
// (Motor-Claims-Notification-Form.pdf), filled with a claim's answers. Wording, item
// numbers and the two-page layout copy the PDF exactly, typos included; the declaration's names
// and date print on their lines and the signatures stay blank for handwriting.
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchClaimByUuid } from '@/features/motor/claims/api/digitalChannelApi';
import { loadNotificationForm, emptyNotificationForm, formatFormDate, drivingReasonLabel } from '@/features/motor/claims/notificationForm';
import logoUrl from '@/assets/img/standard-notification-logo.jpg';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const claim = ref(null);
const form = ref(emptyNotificationForm());
const source = ref('blank');

const claimUuid = computed(() => route.params.claimUuid || '');

const sourceNote = computed(() => ({
  local: "Printed from this browser's saved copy of the form; the server did not return it.",
  partial: 'Only the basic claim fields were found. The rest of the form prints blank for handwriting.',
  missing: 'Claim not found. Printing a blank form.',
}[source.value] || ''));

// The paper form has three rows for injured persons; print at least that many.
const injuredRows = computed(() => {
  const rows = form.value.injuries.filter(p => p.name || p.address || p.identity);
  while (rows.length < 3) rows.push({ name: '', address: '', identity: '' });
  return rows;
});

const ph = computed(() => form.value.policyHolder);
const veh = computed(() => form.value.vehicle);
const drv = computed(() => form.value.driver);
const acc = computed(() => form.value.accident);
const other = computed(() => form.value.accident.otherParty);
const dmg = computed(() => form.value.damage);
const decl = computed(() => form.value.declaration);

function loadEthiopicFont() {
  if (document.getElementById('noto-sans-ethiopic')) return;
  const link = document.createElement('link');
  link.id = 'noto-sans-ethiopic';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;700&display=swap';
  document.head.appendChild(link);
}

async function printForm() {
  try { await document.fonts?.ready; } catch { /* print anyway */ }
  window.print();
}

function goBack() {
  if (window.history.length > 1) router.back();
  else router.push(claimUuid.value ? `/motor/claims/detail/${claimUuid.value}` : '/motor/claims/new');
}

onMounted(async () => {
  loadEthiopicFont();
  if (claimUuid.value) {
    claim.value = await fetchClaimByUuid(claimUuid.value);
    const loaded = loadNotificationForm(claim.value);
    form.value = loaded.form;
    source.value = claim.value ? loaded.source : 'missing';
  }
  loading.value = false;
});
</script>

<template>
  <div class="np-screen">
    <div class="np-toolbar">
      <button type="button" class="np-btn" @click="goBack">← Back</button>
      <div class="np-toolbar-text">
        <strong>Notification of Motor Accident</strong>
        <span v-if="claim?.claimNumber"> · Claim {{ claim.claimNumber }}</span>
        <span v-else-if="!claimUuid"> · Blank form</span>
        <p v-if="sourceNote" class="np-note">{{ sourceNote }}</p>
      </div>
      <button type="button" class="np-btn np-primary" :disabled="loading" @click="printForm">Print</button>
    </div>

    <div v-if="loading" class="np-loading">Loading claim…</div>

    <template v-else>
      <!-- ───────────── Page 1 ───────────── -->
      <div class="np-sheet">
        <div v-if="claim?.claimNumber" class="np-claimno">Claim No. {{ claim.claimNumber }}</div>
        <img :src="logoUrl" alt="Standard Insurance S.C." class="np-logo" />

        <h1 class="np-title-am">የተሽከርካሪ አደጋ መግለጫ</h1>
        <h2 class="np-title-en">NOTIFICATION OF MOTOR ACCIDENT</h2>

        <div class="np-intro">
          <p class="b">ውድ ደንበኛችን</p>
          <p class="am-para">የኩባንያችን ዓላማ ካሣ መክፈል ብቻ ሳይሆን የእርስዎን ደህንነት መጠበቅና መርዳትም ጭምር ነው፤ ይህን ማድረግ እንድንችልም ከዚህ በታች ለተዘረዘሩት መጠይቆች ምላሽ በሚሰጡበት ጊዜ ከፍተኛ ጥንቃቄ ማድረግና የሚሰጡትንም ማንኛውም ቃል ወይም መግለጫ እውነተኛና ትክክል መሆኑን ማረጋገጥ እጅግ በጣም አስፈላጊ ነው፡፡ የካሳ ሂደቱን አስቸጋሪ ስለሚያደርገው ማንኛውንም የክፍያ ስምምነት ከመፈፀም ወይም ኃላፊነትን ከመቀበል ድርጊት እንዲቆጠቡ እንዲሁም ማንኛውም አይነት ደብዳቤ ወይም ሰነድ (ለምሳሌ የካሣ ክፍያ ጥያቄ ወይም የፍ/ቤት መጥሪያ ትዕዛዝ … ወዘተ) የሚደርስዎ ቢሆን ምንም ዓይነት ምላሽ ከመስጠትዎ በፊት ከነሙሉ ዝርዝሩ ለኩባንያው እንዲያስተላልፉ እናሳስባለን፡ ለትብብርዎ እናመሰግናለን፡፡</p>
          <p class="b">Dear policy Holder:</p>
          <p class="en-para">&nbsp;Our aim is not only to pay your claims but also to protect and assist you. It is necessary therefore, that feat care be taken in supplying the information set out below and the statement given need be strictly accurate. Please do not make any offer or promise of payment or admit liability in any way, as by so doing you may prejudice your position and make settlement a difficult matter.&nbsp; If you have received any communication (eg. Claim document, court summon, etc), please inform us by forwarding all details without replying thereto.</p>
          <p>We thank you for your co-operation.</p>
        </div>

        <!-- 1) -->
        <div class="sec">
          <div class="sec-am">1)&nbsp; ስለ መድን ገቢው መግለጫ</div>
          <div class="sec-en">Particular's of policy Holder</div>
        </div>
        <div class="row ind-1">
          <div class="c" style="width:332pt"><div class="am"><span class="no">1.1)</span> ሙሉ ስም</div><div class="en ind-n">Name in Full<span class="u">{{ ph.fullName }}</span></div></div>
          <div class="c" style="flex:1"><div class="am">ስራው ወይም ሙያው</div><div class="en">Profession<span class="u">{{ ph.profession }}</span></div></div>
        </div>
        <div class="row ind-1">
          <div class="c" style="width:112pt"><div class="am"><span class="no">1.2)</span> አድራሻ</div><div class="en ind-n">Address<span class="u">{{ ph.address }}</span></div></div>
          <div class="c" style="width:70pt"><div class="am">ክ/ከተማ</div><div class="en">Sub-City<span class="u">{{ ph.subCity }}</span></div></div>
          <div class="c" style="width:84pt"><div class="am">ቀበሌ</div><div class="en">Kebele<span class="u">{{ ph.kebele }}</span></div></div>
          <div class="c" style="width:86pt"><div class="am">የቤት ቁጥር</div><div class="en">House No<span class="u">{{ ph.houseNo }}</span></div></div>
          <div class="c" style="flex:1"><div class="am">ስልክ ቁጥር</div><div class="en">Phone No<span class="u">{{ ph.phone }}</span></div></div>
        </div>
        <div class="row ind-1">
          <div class="c" style="flex:1"><div class="am"><span class="no">1.3)</span> የተጨማሪ እሴት ታክስ ተመዝጋቢ ነዎት?</div><div class="en ind-n">Are you registered for Value Added tax (VAT)?</div></div>
        </div>
        <div class="vat">
          <div class="vat-opt"><div><div class="am">አዎ</div><div class="en">Yes</div></div><span class="box">{{ ph.vatRegistered === true ? '✓' : '' }}</span></div>
          <div class="vat-opt"><div><div class="am">አይደለም</div><div class="en">No</div></div><span class="box">{{ ph.vatRegistered === false ? '✓' : '' }}</span></div>
        </div>
        <p class="am-para">&nbsp;በተራ ቁጥር 1.3 ለተጠየቀው ጥያቄ መልስዎ አዎ ከሆነ የተጨማሪ እሴት ታክስ መለያ ቁጥር ይጥቀሱ እንዲሁም የተጨማሪ እሴት ታክስ ምዝገባ የምስክር ወረቀቱን ቅጂ ያያይዙ</p>
        <div class="row" style="padding-left:4pt"><div class="c" style="width:300pt"><div class="am line">የተጨማሪ እሰሴት ታክስ መለያ ቁጥር <span class="u">{{ ph.vatNumber }}</span></div></div></div>
        <p class="en-para tight">If your answer to question item 1.3 is yes, Please state your VAT Registration Number and attach copy of VAT Registration Certificate</p>
        <div class="row" style="padding-left:22pt"><div class="c" style="width:308pt"><div class="en">VAT Registration No.&nbsp;<span class="u">{{ ph.vatNumber }}</span></div></div></div>

        <!-- 2) -->
        <div class="sec">
          <div class="sec-am">2)&nbsp; ስለ ፖሊስ ውና ተሸከርካሪው መግለጫ</div>
          <div class="sec-en">Particulars of policy and Vehicle</div>
        </div>
        <div class="row ind-1">
          <div class="c" style="width:170pt"><div class="am"><span class="no">2.1)</span> የፖሊሲ ቁጥር</div><div class="en ind-n">Policy No<span class="u">{{ veh.policyNo }}</span></div></div>
          <div class="c" style="width:60pt"></div>
          <div class="c" style="width:142pt"><div class="am"><span class="no">2.2)</span> የሰሌዳ ቁጥር</div><div class="en">Plate No<span class="u">{{ veh.plateNo }}</span></div></div>
        </div>
        <div class="row ind-1">
          <div class="c" style="width:190pt"><div class="am"><span class="no">2.3)</span> የተሸከርካሪው ዓይነት</div><div class="en ind-n2">Type &amp; Make of Vehicle<span class="u">{{ veh.typeAndMake }}</span></div></div>
          <div class="c" style="width:22pt"></div>
          <div class="c" style="width:154pt"><div class="am" style="padding-left:32pt">የአገልግሎት ዓይነት</div><div class="en">Use of Vehicle<span class="u">{{ veh.use }}</span></div></div>
          <div class="c" style="width:13pt"></div>
          <div class="c" style="width:110pt"><div class="am" style="padding-left:36pt">የተሰራበት ዘመን</div><div class="en">Year of Make<span class="u">{{ veh.yearOfMake }}</span></div></div>
        </div>

        <!-- 3) -->
        <div class="sec">
          <div class="sec-am">3)&nbsp; ስለ አሽከርካሪው መግለጫ</div>
          <div class="sec-en">Particulars of Driver</div>
        </div>
        <div class="row ind-1">
          <div class="c" style="width:368pt"><div class="am line"><span class="no">3.1)</span> ተሸከርካሪውን ይነዳው የነበረው ሰው ሙሉ ስም<span class="u"></span></div><div class="en ind-n3">Drivers Name in Full&nbsp;<span class="u">{{ drv.fullName }}</span></div></div>
        </div>
        <div class="row ind-1">
          <div class="c" style="width:112pt"><div class="am"><span class="no">3.2)</span> አድራሻ</div><div class="en">Addres<span class="u">{{ drv.address }}</span></div></div>
          <div class="c" style="width:70pt"><div class="am">ክ/ከተማ</div><div class="en">Sub-City<span class="u">{{ drv.subCity }}</span></div></div>
          <div class="c" style="width:84pt"><div class="am" style="padding-left:16pt">ቀበሌ</div><div class="en">&nbsp; Kebele<span class="u">{{ drv.kebele }}</span></div></div>
          <div class="c" style="width:84pt"><div class="am" style="padding-left:10pt">የቤት ቁጥር</div><div class="en">&nbsp; House No<span class="u">{{ drv.houseNo }}</span></div></div>
          <div class="c" style="flex:1"><div class="am" style="padding-left:30pt">ስልክ ቁጥር</div><div class="en" style="padding-left:60pt">Phone No<span class="u">{{ drv.phone }}</span></div></div>
        </div>
        <div class="row ind-1">
          <div class="c" style="width:440pt"><div class="am"><span class="no">3.3)</span> ተሸከርካሪውን ለመንዳት ያስቻለው ምክንያት&nbsp; (በቅጥር/ በባለቤትነት/በኪራይ /በሌላ ምክንያት ይግለፁ)</div><div class="en">Reason for driving the vehicle (Ownership/Employed/Rent /Other Specify<span class="u">{{ drivingReasonLabel(form) }}</span></div></div>
        </div>
        <div class="row ind-1">
          <div class="c" style="width:250pt"><div class="am"><span class="no">3.4)</span> ስራ ወይም ሙያ</div><div class="en">Profession/Occupation<span class="u">{{ drv.profession }}</span></div></div>
          <div class="c" style="width:76pt"></div>
          <div class="c" style="width:68pt"><div class="am">ዕድሜ</div><div class="en">Age<span class="u">{{ drv.age }}</span></div></div>
        </div>
        <div class="row ind-1">
          <div class="c" style="flex:1">
            <div class="am line"><span class="no">3.5)</span>&nbsp; የመንጃ ፈቃድ ቁጥር <span class="u" style="flex:0 0 70pt"></span>ደረጃ <span class="u" style="flex:0 0 46pt"></span>&nbsp;ፈቃዱ የተሠጠበት ቀን <span class="u" style="flex:0 0 40pt"></span>&nbsp;&nbsp; ፈቃዱ የሚያልቅበት ቀን<span class="u" style="flex:0 0 46pt"></span></div>
            <div class="en ind-n3">Driving License No<span class="u" style="flex:0 0 70pt">{{ drv.licenceNo }}</span>Grade<span class="u" style="flex:0 0 46pt">{{ drv.grade }}</span>Issue Date&nbsp;<span class="u" style="flex:0 0 62pt">{{ formatFormDate(drv.licenceIssueDate) }}</span>&nbsp;&nbsp; Expiry Date<span class="u" style="flex:0 0 62pt">{{ formatFormDate(drv.licenceExpiryDate) }}</span></div>
          </div>
        </div>

        <!-- 4) -->
        <div class="sec">
          <div class="sec-am">4)&nbsp; ስለ አደጋው መግለጫ</div>
          <div class="sec-en b">Details of Accident</div>
        </div>
        <div class="row ind-1">
          <div class="c" style="width:180pt"><div class="am"><span class="no">4.1)</span> የአደጋ ቀን</div><div class="en ind-n">Date<span class="u">{{ formatFormDate(acc.date) }}</span></div></div>
          <div class="c" style="width:14pt"></div>
          <div class="c" style="width:96pt"><div class="am" style="padding-left:28pt">ሰዓት</div><div class="en">Time<span class="u">{{ acc.time }}</span></div></div>
          <div class="c" style="width:26pt"></div>
          <div class="c" style="flex:1"><div class="am" style="padding-left:50pt">ቦታ</div><div class="en">Place<span class="u">{{ acc.place }}</span></div></div>
        </div>
        <div class="row ind-1">
          <div class="c" style="width:230pt"><div class="am"><span class="no">4.2)</span> ተሽከርካሪው የነበረው ፍጥነት</div><div class="en ind-n">What was the speed of vehicle?&nbsp;<span class="u">{{ acc.speed }}</span></div></div>
          <div class="c" style="width:32pt"></div>
          <div class="c" style="width:174pt"><div class="am">ከመንገድ ጠርዝ የነበረው ርቀት</div><div class="en">How far was it from road side?&nbsp;<span class="u">{{ acc.distanceFromRoadSide }}</span></div></div>
        </div>
      </div>

      <!-- ───────────── Page 2 ───────────── -->
      <div class="np-sheet p2">
        <div class="row ind-1">
          <div class="c" style="flex:1; min-width:450pt; margin-right:20pt"><div class="am"><span class="no">4.3)</span> ስለተሽከርካሪው ጥሩንባ ፤መብራቶች እና ስለ ተሸከርካሪው ጠቅላላ ሁኔታ ይግለፁ</div><div class="en ind-n">State Condition of Horn, Brake and Lights and general conditions of the vehicle<span class="u">{{ acc.vehicleCondition }}</span></div></div>
        </div>
        <div class="row ind-1">
          <div class="c" style="flex:1; min-width:456pt; margin-right:20pt"><div class="am"><span class="no">4.4)</span> ተሸከርካሪው ላይ ስለ ነበረው የጭነት መጠን እና ዓይነት በዝርዝር ይግለፁ</div><div class="en ind-n">State in detail nature of weight and volume of goods carried by vehicle<span class="u">{{ acc.goodsCarried }}</span></div></div>
        </div>
        <div class="item ind-1">
          <div class="am i"><span class="no">4.5)</span>&nbsp; ስለአደጋው አደራረስሁኔታ ዝርዝር መግለጫ ይስጡ</div>
          <div class="ruled" style="--n:3; padding-left:8pt"><span class="lbl">Description of the accident&nbsp;&nbsp;</span>{{ acc.description }}</div>
        </div>

        <div class="item ind-1">
          <div class="am i"><span class="no">4.6)</span> በአደጋው የተጎዳ የሌላ ወገን ተሸከርካሪ ወይም ንብረት ካለ ንብረቱን የሹፌሩን ስም ከነአድራሻው ይግለፁ</div>
          <div class="en ind-n4">Give names and addresses of Owner and Driver of other Vehicle(s) or other properties involved</div>
        </div>
        <div class="row small ind-4">
          <div class="c" style="width:143pt"><div class="am">የባለቤቱ ስም</div><div class="en">Owner<span class="u">{{ other.ownerName }}</span></div></div>
          <div class="c" style="width:10pt"></div>
          <div class="c" style="width:84pt"><div class="am">ክ/ከተማ</div><div class="en">Sub-City&nbsp;<span class="u">{{ other.ownerSubCity }}</span></div></div>
          <div class="c" style="width:7pt"></div>
          <div class="c" style="width:78pt"><div class="am">ወረዳ</div><div class="en">Worda&nbsp;<span class="u">{{ other.ownerWoreda }}</span></div></div>
          <div class="c" style="width:14pt"></div>
          <div class="c" style="width:54pt"><div class="am">ቀበሌ</div><div class="en">Kebele&nbsp;<span class="u">{{ other.ownerKebele }}</span></div></div>
          <div class="c" style="width:6pt"></div>
          <div class="c" style="flex:1"><div class="am">የቤት ቁጥር</div><div class="en">Phone No<span class="u">{{ other.ownerPhone }}</span></div></div>
        </div>
        <div class="row small ind-4">
          <div class="c" style="width:143pt"><div class="am">&nbsp;የሰሌዳ</div><div class="en">&nbsp;Plate No<span class="u">{{ other.plateNo }}</span></div></div>
        </div>
        <div class="row small ind-4">
          <div class="c" style="width:137pt"><div class="am">የአሽከርካረው ስም</div><div class="en">Driver's Name<span class="u">{{ other.driverName }}</span></div></div>
          <div class="c" style="width:3pt"></div>
          <div class="c" style="width:82pt"><div class="am">ክ/ከተማ</div><div class="en">&nbsp;Sub-City<span class="u">{{ other.driverSubCity }}</span></div></div>
          <div class="c" style="width:8pt"></div>
          <div class="c" style="width:69pt"><div class="am">ወረዳ</div><div class="en">woreda<span class="u">{{ other.driverWoreda }}</span></div></div>
          <div class="c" style="width:10pt"></div>
          <div class="c" style="width:62pt"><div class="am">ቀበሌ</div><div class="en">kebele<span class="u">{{ other.driverKebele }}</span></div></div>
          <div class="c" style="width:13pt"></div>
          <div class="c" style="width:87pt"><div class="am">የቤት ቁጥር</div><div class="en">HouseNo<span class="u">{{ other.driverHouseNo }}</span></div></div>
        </div>

        <div class="row ind-1">
          <div class="c" style="width:340pt"><div class="am"><span class="no">4.7)</span> ጥፋቱ የማን ይመስሎታል?</div><div class="en ind-n">Who is responsible for the accident?&nbsp;<span class="u">{{ acc.responsible }}</span></div></div>
        </div>
        <div class="item ind-1">
          <div class="am"><span class="no">4.8)</span>&nbsp; ይህን አደጋ በተመለከተ ሌላ የመድን ዋስትና አለዎት ካለዎት ይግለፁ</div>
          <div class="en ind-n4">Do you hold more than one policy in respect of this motor vehicle? if so, give particulars</div>
          <div class="ruled" style="--n:1; margin-right:50pt; padding-left:8pt">{{ acc.otherPolicies }}</div>
        </div>
        <div class="item ind-1">
          <div class="am"><span class="no">4.9)</span> የአደጋው ዝርዝር ሁኔታ በፖሊስ ተመዝግቧል? ከተመዘገበ የጣቢያውን ስም የፖሊሱን ስም እና መታወቂያ ቁጥሩን ይግለፁ</div>
          <div class="en ind-n">Were particulars taken by police? if so, give police station, officers name and identification No</div>
          <div class="ruled" style="--n:2; margin-left:23pt">{{ acc.police }}</div>
        </div>
        <div class="item ind-1">
          <div class="am"><span class="no">4.10)</span> በአደጋው ጊዜ በእርስዎ ተሸከርካሪ ውስጥ የነበሩትን ሰዎች ስም እና አድራሻ ይለግፁ</div>
          <div class="en ind-n4">Give name and addresses of persons in your vehicle</div>
          <div class="ruled" style="--n:1; margin-left:23pt">{{ acc.passengers }}</div>
        </div>
        <div class="item ind-1">
          <div class="am small"><span class="no">4.11)</span> ከተሳፋሪዎች በስተቀር በአቅራቢያው የነበሩ ምስክሮች ስምና አድራሻ ይግለፁ የምስክሮች ስም የልወሰዱ ከሆነ ምክንያቱን ያስረዱ</div>
          <div class="en small ind-n4">Give name and addresses of Independent witnesses. if not taken Please state why</div>
          <div class="ruled" style="--n:1; margin-left:23pt">{{ acc.witnesses }}</div>
        </div>

        <!-- 5) -->
        <div class="sec p2-sec">
          <div class="sec-am">5)&nbsp; ስለደረሰው ጉዳት መግለጫ</div>
          <div class="sec-en">Details of Damage/Injury</div>
        </div>
        <div class="item ind-5">
          <div class="am"><span class="no">5.1)</span> መድን በተገባለት ተሽከርካሪ ላይ የደረሰውን ጉዳት ይግለፁ</div>
          <div class="ruled" style="--n:2; padding-left:19pt"><span class="lbl">Details of damage to insured vehicle&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>{{ dmg.insuredVehicle }}</div>
        </div>
        <div class="item ind-5">
          <div class="am"><span class="no">5.2)</span> በሶስተኛው ወገን ተሸከርካሪ ወይም ንብረት ላይ የደረሰውን ጉዳት ይግለፁ</div>
          <div class="ruled" style="--n:2; padding-left:19pt"><span class="lbl">Details of damage to other vehicle or Property&nbsp;&nbsp;</span>{{ dmg.otherProperty }}</div>
        </div>

        <!-- 6) -->
        <div class="sec p2-sec">
          <div class="sec-am">6)&nbsp; በአደጋው ስለተገዱ ሰዎች መግለጫ ይስጡ</div>
          <div class="sec-en">Details of Injuries to persons (give names &amp; addresses of such persons)</div>
        </div>
        <div class="injured">
          <div class="inj-head"><span>የተጎጂው ስም</span><span>አድራሻ</span><span>የተጎጂው ማንነት</span></div>
          <div v-for="(p, idx) in injuredRows" :key="idx" class="inj-row">
            <span class="rl">{{ p.name }}</span><span class="rl">{{ p.address }}</span><span class="rl">{{ p.identity }}</span>
          </div>
        </div>

        <p class="am-para decl">እኔ/እኛ ከዚህ በላይ ለቀረቡልኝ /ለቀረቡልን ጥያቄዎች የሰጠሁት/የስጠነው ቃል /ዝርዘር መግለጭ /እውነተኛ እና ትክክለኛ መሆኑን እየገለፅኩ/እየገለፅን ከዚህ በተጨማሪ ኩባንያው በበኩሉ ለሚወስደው ማንኛውም እርምጃ ተገቢውን እርዳታ እና ድጋፍ የምሰጥ መሆኑን አሳውቃለሁ/የምንስጥ መሆኑን እናሳውቃለን፡፡</p>
        <p class="en-para decl">I/We declare the forgoing particulars to be true and correct in every respect, and underetake to the company every assistance in my/our power in dealing with the claim.</p>

        <div class="sign">
          <div class="sign-col">
            <div class="am i" style="padding-left:18pt">ቀን</div>
            <div class="en">Date <span class="sl" style="width:152pt; margin-left:34pt">{{ formatFormDate(decl.date) }}</span></div>
            <div class="am i" style="margin-top:6pt">መድን ገቢው ስምና ፊርማ</div>
            <div class="en">Insured's Name &amp; Signature. <span class="sl" style="width:126pt">{{ decl.insuredName }}</span></div>
          </div>
          <div class="sign-col">
            <div class="am i">የአሽከርካሪው ስምና ፊርማ</div>
            <div class="en">Driver's Name and signature <span class="sl" style="width:102pt; margin-left:22pt">{{ decl.driverName }}</span></div>
            <div class="am" style="margin-top:4pt">ይህ መግለጫ ሲሞላ የነበሩ</div>
            <div class="en" style="padding-left:5pt">Witness</div>
            <div class="en" style="margin-left:-10pt">1.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="sl" style="width:186pt">{{ decl.witness1 }}</span></div>
            <div class="en" style="padding-left:16pt"><span class="sl" style="width:186pt">{{ decl.witness2 }}</span></div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Screen chrome */
/* The app shell fixes html/body/#app to the window with overflow hidden, so this page scrolls itself */
.np-screen { height: 100vh; overflow-y: auto; background: #e5e7eb; padding: 0 0 2rem; font-family: 'Rubik', system-ui, sans-serif; }
.np-toolbar { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; gap: 1rem; padding: .75rem 1.25rem; background: #fff; border-bottom: 1px solid #d1d5db; margin-bottom: 1.5rem; }
.np-toolbar-text { flex: 1; font-size: .85rem; color: #111827; }
.np-note { margin-top: .2rem; font-size: .75rem; color: #b45309; }
.np-btn { padding: .5rem 1rem; border-radius: 8px; border: 1px solid #d1d5db; background: #fff; color: #111827; font-weight: 600; font-size: .85rem; cursor: pointer; }
.np-btn:hover { border-color: #1d4ed8; color: #1d4ed8; }
.np-primary { background: #1d4ed8; border-color: #1d4ed8; color: #fff; }
.np-primary:hover { background: #1e40af; color: #fff; }
.np-primary:disabled { opacity: .6; cursor: wait; }
.np-loading { text-align: center; padding: 3rem; color: #4b5563; }

/* The paper: same size as the PDF (612 x 843 pt) */
.np-sheet {
  --ink: #000; --val: #0b2a6f; --rule: #4472c4;
  position: relative; width: 612pt; min-height: 843pt; margin: 0 auto 1.5rem; box-sizing: border-box;
  padding: 6pt 38pt 24pt 38pt; background: #fff; color: var(--ink);
  box-shadow: 0 2px 12px rgba(0,0,0,.18);
  font-family: Ebrima, 'Noto Sans Ethiopic', 'Segoe UI', 'Noto Sans', Arial, sans-serif;
  font-size: 8.3pt; line-height: 1.25;
}
.np-sheet.p2 { padding-top: 28pt; padding-left: 30pt; }
.np-claimno { position: absolute; top: 8pt; right: 38pt; font-size: 7.5pt; color: var(--val); font-weight: 700; }
.np-logo { display: block; width: 322pt; height: 45pt; margin: 0 auto; }
.np-title-am { text-align: center; font-family: inherit; font-size: 15pt; font-weight: 700; margin: 13pt 0 0; letter-spacing: .5pt; }
.np-title-en { text-align: center; font-family: 'Times New Roman', Times, serif; font-size: 14pt; font-weight: 700; margin: 4pt 0 8pt; }

.b { font-weight: 700; }
.i { font-style: italic; }
.np-intro p { margin: 0; }
.am-para { font-size: 7.6pt; line-height: 1.6; margin: 0; text-align: justify; }
.en-para { font-size: 8pt; line-height: 1.55; margin: 0; text-align: justify; }
.en-para.tight { margin-top: 2pt; }

.sec { margin-top: 9pt; padding-left: 0; }
.sec-am { font-weight: 700; }
.sec-en { padding-left: 12pt; }
.p2-sec { margin-left: 0; }

.row { display: flex; align-items: flex-end; margin-top: 5pt; }
.item { margin-top: 6pt; }
.ind-1 { padding-left: 20pt; }
.ind-4 { padding-left: 51pt; }
.ind-5 { padding-left: 32pt; }
.ind-n { padding-left: 10pt; }
.ind-n2 { padding-left: 13pt; }
.ind-n3 { padding-left: 24pt; }
.ind-n4 { padding-left: 23pt; }
.small { font-size: 7.4pt; }
.c { min-width: 0; }
.am { white-space: nowrap; }
.am .no { margin-right: 2pt; }
.en, .am.line { display: flex; align-items: baseline; white-space: nowrap; }

/* A blank to write on: fills the rest of its cell; the claim's answer sits on the line */
.u {
  flex: 1 1 auto; min-width: 12pt; min-height: 10pt; border-bottom: .6pt solid var(--ink);
  margin-left: 1pt; padding: 0 2pt; color: var(--val); font-family: 'Segoe UI', 'Noto Sans', 'Noto Sans Ethiopic', Arial, sans-serif;
  font-size: 8.3pt; line-height: 1.15; white-space: normal; overflow-wrap: anywhere;
}

/* Blue ruled answer lines (4.5, 4.8–4.11, 5.x) */
.ruled {
  --lh: 14pt;
  min-height: calc(var(--lh) * var(--n, 1)); line-height: var(--lh); white-space: pre-wrap; overflow-wrap: anywhere;
  color: var(--val); font-family: 'Segoe UI', 'Noto Sans', 'Noto Sans Ethiopic', Arial, sans-serif;
  background-image: linear-gradient(to bottom, transparent calc(var(--lh) - .8pt), var(--rule) calc(var(--lh) - .8pt));
  background-size: 100% var(--lh);
}
.ruled .lbl { display: inline-block; height: var(--lh); line-height: var(--lh); background: #fff; color: var(--ink); font-family: Ebrima, 'Noto Sans Ethiopic', 'Segoe UI', 'Noto Sans', Arial, sans-serif; vertical-align: top; }

/* 1.3 VAT boxes */
.vat { display: flex; gap: 0; padding-left: 42pt; margin-top: 4pt; }
.vat-opt { display: flex; align-items: center; gap: 12pt; width: 214pt; }
.vat-opt .en { display: block; }
.box { display: inline-flex; align-items: center; justify-content: center; width: 38pt; height: 13pt; border: 1.2pt solid var(--rule); border-radius: 2pt; color: var(--val); font-weight: 700; margin-bottom: 9pt; }

/* 6) injured persons */
.injured { padding-left: 58pt; margin-top: 8pt; }
.inj-head, .inj-row { display: grid; grid-template-columns: 128pt 128pt 128pt; column-gap: 37pt; }
.inj-head span { padding-left: 18pt; }
.inj-head span:nth-child(2) { padding-left: 36pt; }
.inj-head span:nth-child(3) { padding-left: 32pt; }
.inj-row { margin-top: 2pt; }
.rl { display: block; min-height: 12pt; border-bottom: .8pt solid var(--rule); color: var(--val); font-family: 'Segoe UI', 'Noto Sans', 'Noto Sans Ethiopic', Arial, sans-serif; padding: 0 2pt; overflow-wrap: anywhere; }

.decl { margin-top: 12pt; }
.en-para.decl { margin-top: 6pt; }

.sign { display: flex; margin-top: 4pt; }
.sign-col { width: 284pt; }
.sign-col .en { display: flex; align-items: flex-end; margin-top: 1pt; }
.sl {
  display: inline-block; min-height: 10pt; border-bottom: .8pt solid var(--rule); margin-left: 4pt; padding: 0 2pt;
  color: var(--val); font-family: 'Segoe UI', 'Noto Sans', 'Noto Sans Ethiopic', Arial, sans-serif; font-size: 8.3pt; line-height: 1.15;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
</style>

<style>
@media print {
  @page { size: 612pt 843pt; margin: 0; }
  html, body, #app { height: auto !important; overflow: visible !important; background: #fff !important; }
  body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .np-screen { background: #fff !important; padding: 0 !important; height: auto !important; overflow: visible !important; }
  .np-toolbar { display: none !important; }
  .np-sheet { margin: 0 !important; box-shadow: none !important; break-after: page; page-break-after: always; }
  .np-sheet:last-child { break-after: auto; page-break-after: auto; }
}
</style>
