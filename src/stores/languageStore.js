import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

const translations = {
  en: {
    // General
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    online: 'Online',
    myProfile: 'My Profile',
    signOut: 'Sign out',
    poweredBy: 'Powered by',
    eic: 'Standard Insurance S.C.',
    motto: 'Your trust, our standard',
    platformSubtitle: 'InsureConnect — Standard Insurance Digital Channel',
    greetingName: '{greeting}, <strong>{name}</strong>',
    
    // Module Selector
    selectModule: 'Select your module',
    modulesCount: '{count} Modules',
    selectModuleToGetStarted: 'Select an insurance module to get started',
    
    // Modules
    modules: {
      health: 'Health Insurance',
      healthDesc: 'Define premium tables for individual, family and group medical cover.',
      motor: 'Motor Insurance',
      motorDesc: 'Configure premium rates for private cars, commercial vehicles, motorcycles and fleet.',
      fire: 'Fire Insurance',
      fireDesc: 'Set rates for residential, commercial and industrial property against fire and allied perils.',
      marine: 'Marine & Cargo',
      marineDesc: 'Rate configuration for ocean freight, inland transit and hull insurance.',
      life: 'Life Insurance',
      lifeDesc: 'Configure term life, whole life and endowment premium rate tables by age band.',
      engineering: 'Engineering',
      engineeringDesc: 'Rates for contractors all risk, erection all risk and machinery breakdown.',
      liability: 'Liability',
      liabilityDesc: 'Public liability, employers liability and professional indemnity rate setup.',
      burglary: 'Burglary & Theft',
      burglaryDesc: 'Configure rates based on security grading, location risk and sum insured.'
    },
    badges: {
      active: 'Active',
      mostUsed: 'Most Used',
      new: 'New'
    },
    
    // Dashboard
    dashboard: 'Dashboard',
    claimPipeline: 'Claim Pipeline',
    realTimeAnalytics: 'Real-time {module} analytics',
    switchModule: 'Switch Module',
    rateConfig: 'Rate Config',
    viewAllClaims: 'View all claims',
    activePipeline: 'Active',
    processingStatusOverview: 'Processing status overview',
    
    // KPI Cards
    kpis: {
      'Total Premiums': 'Total Premiums',
      'Active Policies': 'Active Policies',
      'Claims Filed': 'Claims Filed',
      'Vehicles Covered': 'Vehicles Covered',
      'Properties Insured': 'Properties Insured',
      'Shipments Covered': 'Shipments Covered',
      'Lives Covered': 'Lives Covered',
      'Projects Covered': 'Projects Covered',
      'Businesses Covered': 'Businesses Covered',
      'Premises Covered': 'Premises Covered',
      'Travelers Covered': 'Travelers Covered'
    },
    subs: {
      'vs last month': 'vs last month',
      'across all classes': 'across all classes',
      'this month': 'this month',
      'on network': 'on network',
      'residential & commercial': 'residential & commercial',
      'hull & cargo': 'hull & cargo',
      'individual & group': 'individual & group',
      'beneficiaries': 'beneficiaries',
      'contractors & machinery': 'contractors & machinery',
      'active sites': 'active sites',
      'public & employers': 'public & employers',
      'registered entities': 'registered entities',
      'commercial & residential': 'commercial & residential',
      'secured premises': 'secured premises',
      'single & multi-trip': 'single & multi-trip',
      'total insured persons': 'total insured persons'
    },
    
    // Insights
    insights: {
      approvalRate: 'Approval Rate',
      avgClaimValue: 'Avg Claim Value',
      processTime: 'Process Time',
      lossRatio: 'Loss Ratio',
      vsLastMonth: 'vs last month',
      daysFaster: 'days faster',
      faster: 'faster',
      slower: 'slower'
    },
    
    // Pipeline statuses
    pipeline: {
      'Submitted': 'Submitted',
      'In Process': 'In Process',
      'Verified': 'Verified',
      'Approved': 'Approved',
      'Completed': 'Completed'
    },
    
    // Activity
    recentActivity: 'Recent Activity',
    latestEvents: 'Latest events',
    live: 'Live',
    activities: {
      'New policy issued': 'New policy issued',
      'Claim submitted': 'Claim submitted',
      'Rate config updated': 'Rate config updated',
      'Policy renewed': 'Policy renewed',
      'Claim approved': 'Claim approved'
    },
    times: {
      '1 hr ago': '1 hr ago',
      '3 hrs ago': '3 hrs ago',
      'Yesterday': 'Yesterday',
      '2 days ago': '2 days ago',
      '3 days ago': '3 days ago'
    },
    
    // Quick Actions
    quickActions: 'Quick Actions',
    commonTasks: 'Common {module} tasks',
    actions: {
      newClaim: 'New Claim',
      submitClaim: 'Submit a claim',
      processClaims: 'Process Claims',
      reviewPending: 'Review pending claims',
      rateConfiguration: 'Rate Configuration',
      configureRates: 'Configure premium rates',
      switchModuleLabel: 'Switch Module',
      goBackSelect: 'Go back to module select'
    },
    
    // Fallback
    noModuleSelected: 'No module selected.',
    selectAModule: 'Select a module'
  },
  am: {
    // General
    goodMorning: 'ደህና አደሩ',
    goodAfternoon: 'ደህና ዋሉ',
    goodEvening: 'ደህና አመሹ',
    online: 'በመስመር ላይ',
    myProfile: 'የእኔ መገለጫ',
    signOut: 'ውጣ',
    poweredBy: 'የሚሰራው በ',
    eic: 'ስታንዳርድ ኢንሹራንስ አ.ማ',
    motto: 'Your trust, our standard',
    platformSubtitle: 'ኢንሹር-ኮኔክት — የስታንዳርድ ኢንሹራንስ ዲጂታል መድረክ',
    greetingName: '{greeting}፣ <strong>{name}</strong>',
    
    // Module Selector
    selectModule: 'ሞጁልዎን ይምረጡ',
    modulesCount: '{count} ሞጁሎች',
    selectModuleToGetStarted: 'ለመጀመር የመድን ሞጁል ይምረጡ',
    
    // Modules
    modules: {
      health: 'የጤና መድን',
      healthDesc: 'ለግለሰብ፣ ለቤተሰብ እና ለቡድን የህክምና ሽፋን የአረቦን ሰንጠረዦችን ይግለጹ።',
      motor: 'የሞተር ተሽከርካሪ መድን',
      motorDesc: 'ለግል መኪኖች፣ ለንግድ ተሽከርካሪዎች፣ ለሞተር ሳይክሎች እና ለተሽከርካሪዎች ስብስብ የአረቦን ክፍያዎችን ያዋቅሩ።',
      fire: 'የእሳት አደጋ መድን',
      fireDesc: 'የመኖሪያ፣ የንግድ እና የኢንዱስትሪ ንብረቶችን በእሳት እና በተያያዙ አደጋዎች ላይ የአረቦን ተመኖችን ይወስኑ።',
      marine: 'የባህር እና ጭነት መድን',
      marineDesc: 'ለባህር ጭነት፣ ለየብስ ትራንዚት እና ለመርከብ አካል ኢንሹራንስ የክፍያ ተመን ውቅር።',
      life: 'የህይወት መድን',
      lifeDesc: 'በእድሜ ክልል ላይ በመመስረት የጊዜያዊ ህይወት፣ ሙሉ ህይወት እና የኢንዶውመንት አረቦን ሰንጠረዦችን ያዋቅሩ።',
      engineering: 'የምህንድስና መድን',
      engineeringDesc: 'ለኮንትራክተሮች ሙሉ ስጋት፣ ለዕቃ መገጣጠም ሙሉ ስጋት እና ለማሽነሪዎች ብልሽት ክፍያ ተመኖች።',
      liability: 'የሃላፊነት መድን',
      liabilityDesc: 'የህዝብ ሃላፊነት፣ የአሰሪዎች ሃላፊነት እና የሙያ ካሳ ክፍያ ተመኖች ማዋቀር።',
      burglary: 'የስርቆት እና ዝርፊያ መድን',
      burglaryDesc: 'በጥበቃ ደረጃ፣ በቦታ ስጋት እና በዋስትና መጠን ላይ በመመስረት የክፍያ ተመኖችን ያዋቅሩ።'
    },
    badges: {
      active: 'ንቁ',
      mostUsed: 'በብዛት ጥቅም ላይ የዋለ',
      new: 'አዲስ'
    },
    
    // Dashboard
    dashboard: 'ዳሽቦርድ',
    claimPipeline: 'የካሳ ጥያቄ ሂደት',
    realTimeAnalytics: '{module} የእውነተኛ ጊዜ ትንታኔ',
    switchModule: 'ሞጁል ይቀይሩ',
    rateConfig: 'የክፍያ ተመን ውቅር',
    viewAllClaims: 'ሁሉንም የካሳ ጥያቄዎች ይመልከቱ',
    activePipeline: 'ንቁ',
    processingStatusOverview: 'የሂደት ሁኔታ አጠቃላይ እይታ',
    
    // KPI Cards
    kpis: {
      'Total Premiums': 'ጠቅላላ አረቦን',
      'Active Policies': 'ንቁ ፖሊሲዎች',
      'Claims Filed': 'የቀረቡ የካሳ ጥያቄዎች',
      'Vehicles Covered': 'ኢንሹራንስ የተገባቸው ተሽከርካሪዎች',
      'Properties Insured': 'ዋስትና የተገባቸው ንብረቶች',
      'Shipments Covered': 'ዋስትና የተገቡ ጭነቶች',
      'Lives Covered': 'ዋስትና የተገቡ ህይወቶች',
      'Projects Covered': 'ዋስትና የተገቡ ፕሮጀክቶች',
      'Businesses Covered': 'ዋስትና የተገቡ ንግዶች',
      'Premises Covered': 'ዋስትና የተገቡ ህንፃዎች/ቦታዎች',
      'Travelers Covered': 'ዋስትና የተገቡ ተጓዦች'
    },
    subs: {
      'vs last month': 'ካለፈው ወር አንጻር',
      'across all classes': 'በሁሉም ምድቦች',
      'this month': 'በዚህ ወር',
      'on network': 'በአውታረ መረብ ላይ',
      'residential & commercial': 'የመኖሪያ እና የንግድ',
      'hull & cargo': 'የመርከብ አካል እና ጭነት',
      'individual & group': 'የግል እና የቡድን',
      'beneficiaries': 'ተጠቃሚዎች',
      'contractors & machinery': 'ተቋራጮች እና ማሽነሪዎች',
      'active sites': 'ንቁ የስራ ቦታዎች',
      'public & employers': 'የህዝብ እና የአሰሪዎች',
      'registered entities': 'የተመዘገቡ ተቋማት',
      'commercial & residential': 'የንግድ እና የመኖሪያ',
      'secured premises': 'ደህንነታቸው የተጠበቁ ቦታዎች',
      'single & multi-trip': 'የአንድ ጊዜ እና የብዙ ጉዞ',
      'total insured persons': 'ጠቅላላ ኢንሹራንስ የተገባቸው ሰዎች'
    },
    
    // Insights
    insights: {
      approvalRate: 'የማፅደቅ መጠን',
      avgClaimValue: 'አማካይ የካሳ መጠን',
      processTime: 'የማቀናበሪያ ጊዜ',
      lossRatio: 'የኪሳራ ጥምርታ',
      vsLastMonth: 'ካለፈው ወር አንጻር',
      daysFaster: 'ቀናት ፈጣን',
      faster: 'ፈጣን',
      slower: 'ቀስ ያለ'
    },
    
    // Pipeline statuses
    pipeline: {
      'Submitted': 'የቀረበ',
      'In Process': 'በሂደት ላይ',
      'Verified': 'የተረጋገጠ',
      'Approved': 'የፀደቀ',
      'Completed': 'የተጠናቀቀ'
    },
    
    // Activity
    recentActivity: 'የቅርብ ጊዜ እንቅስቃሴዎች',
    latestEvents: 'የቅርብ ጊዜ ክስተቶች',
    live: 'ቀጥታ',
    activities: {
      'New policy issued': 'አዲስ ፖሊሲ ተሰጥቷል',
      'Claim submitted': 'የካሳ ጥያቄ ቀርቧል',
      'Rate config updated': 'የክፍያ ተመን ውቅር ተዘምኗል',
      'Policy renewed': 'ፖሊሲ ታድሷል',
      'Claim approved': 'የካሳ ጥያቄ ፅድቋል'
    },
    times: {
      '1 hr ago': 'ከ1 ሰዓት በፊት',
      '3 hrs ago': 'ከ3 ሰዓት በፊት',
      'Yesterday': 'ትላንትና',
      '2 days ago': 'ከ2 ቀናት በፊት',
      '3 days ago': 'ከ3 ቀናት በፊት'
    },
    
    // Quick Actions
    quickActions: 'ፈጣን እርምጃዎች',
    commonTasks: 'የተለመዱ {module} ተግባራት',
    actions: {
      newClaim: 'አዲስ የካሳ ጥያቄ',
      submitClaim: 'የካሳ ጥያቄ ያቅርቡ',
      processClaims: 'ካሳ ጥያቄዎችን አከናውን',
      reviewPending: 'በመጠባበቅ ላይ ያሉ ጥያቄዎችን ይገምግሙ',
      rateConfiguration: 'የክፍያ ተመን ውቅር',
      configureRates: 'የአረቦን ክፍያዎችን ያዋቅሩ',
      switchModuleLabel: 'ሞጁል ይቀይሩ',
      goBackSelect: 'ወደ ሞጁል ምርጫ ይመለሱ'
    },
    
    // Fallback
    noModuleSelected: 'ምንም ሞጁል አልተመረጠም።',
    selectAModule: 'ሞጁል ይምረጡ'
  }
};

export const useLanguageStore = defineStore('language', () => {
  const currentLanguage = ref(localStorage.getItem('eic-lang') || 'en');

  const isAmharic = computed(() => currentLanguage.value === 'am');

  function setLanguage(lang) {
    if (lang === 'en' || lang === 'am') {
      currentLanguage.value = lang;
      localStorage.setItem('eic-lang', lang);
    }
  }

  function toggleLanguage() {
    setLanguage(currentLanguage.value === 'en' ? 'am' : 'en');
  }

  // Translation helper
  function t(key, params = {}, defaultVal = '') {
    const lang = currentLanguage.value;
    const parts = key.split('.');
    let val = translations[lang];

    for (const part of parts) {
      if (val && typeof val === 'object' && part in val) {
        val = val[part];
      } else {
        val = null;
        break;
      }
    }

    if (val === null || val === undefined) {
      // Fallback to English
      let fallbackVal = translations['en'];
      for (const part of parts) {
        if (fallbackVal && typeof fallbackVal === 'object' && part in fallbackVal) {
          fallbackVal = fallbackVal[part];
        } else {
          fallbackVal = null;
          break;
        }
      }
      val = fallbackVal !== null && fallbackVal !== undefined ? fallbackVal : (defaultVal || key);
    }

    // Replace params
    if (typeof val === 'string') {
      let result = val;
      for (const [k, v] of Object.entries(params)) {
        result = result.replace(`{${k}}`, v);
      }
      return result;
    }

    return val;
  }

  function translateValue(val) {
    if (!isAmharic.value) return val;
    if (typeof val === 'string' && val.startsWith('ETB ')) {
      return val.replace('ETB ', '') + ' ብር';
    }
    return val;
  }

  return { currentLanguage, isAmharic, setLanguage, toggleLanguage, t, translateValue };
});
