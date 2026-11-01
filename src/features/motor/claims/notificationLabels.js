// Field labels of the motor claim entry form in English and Amharic. The Amharic is copied
// word for word from Standard's Motor-Claims-Notification-Form.pdf (its spelling kept), so the
// screen reads like the paper the customer filled in.

export const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'አማርኛ' },
];

export const NOTIFICATION_LABELS = {
  'sec.1': { en: 'Particulars of policy holder', am: 'ስለ መድን ገቢው መግለጫ' },
  'sec.2': { en: 'Particulars of policy and vehicle', am: 'ስለ ፖሊስ ውና ተሸከርካሪው መግለጫ' },
  'sec.3': { en: 'Particulars of driver', am: 'ስለ አሽከርካሪው መግለጫ' },
  'sec.4': { en: 'Details of accident', am: 'ስለ አደጋው መግለጫ' },
  'sec.5': { en: 'Details of damage / injury', am: 'ስለደረሰው ጉዳት መግለጫ' },
  'sec.6': { en: 'Injuries to persons', am: 'በአደጋው ስለተገዱ ሰዎች መግለጫ ይስጡ' },

  fullName: { en: 'Name in full', am: 'ሙሉ ስም' },
  profession: { en: 'Profession', am: 'ስራው ወይም ሙያው' },
  address: { en: 'Address', am: 'አድራሻ' },
  subCity: { en: 'Sub-City', am: 'ክ/ከተማ' },
  woreda: { en: 'Woreda', am: 'ወረዳ' },
  kebele: { en: 'Kebele', am: 'ቀበሌ' },
  houseNo: { en: 'House No', am: 'የቤት ቁጥር' },
  phone: { en: 'Phone No', am: 'ስልክ ቁጥር' },
  vatRegistered: { en: 'Registered for VAT?', am: 'የተጨማሪ እሴት ታክስ ተመዝጋቢ ነዎት?' },
  yes: { en: 'Yes', am: 'አዎ' },
  no: { en: 'No', am: 'አይደለም' },
  vatNumber: { en: 'VAT Registration No.', am: 'የተጨማሪ እሰሴት ታክስ መለያ ቁጥር' },
  vatAttach: { en: '(attach copy of the VAT registration certificate)', am: '(የተጨማሪ እሴት ታክስ ምዝገባ የምስክር ወረቀቱን ቅጂ ያያይዙ)' },

  policyNo: { en: 'Policy No', am: 'የፖሊሲ ቁጥር' },
  plateNo: { en: 'Plate No', am: 'የሰሌዳ ቁጥር' },
  typeAndMake: { en: 'Type & make of vehicle', am: 'የተሸከርካሪው ዓይነት' },
  vehicleUse: { en: 'Use of vehicle', am: 'የአገልግሎት ዓይነት' },
  yearOfMake: { en: 'Year of make', am: 'የተሰራበት ዘመን' },

  driverName: { en: "Driver's name in full", am: 'ተሸከርካሪውን ይነዳው የነበረው ሰው ሙሉ ስም' },
  reasonForDriving: { en: 'Reason for driving the vehicle', am: 'ተሸከርካሪውን ለመንዳት ያስቻለው ምክንያት' },
  'reason.OWNERSHIP': { en: 'Ownership', am: 'በባለቤትነት' },
  'reason.EMPLOYED': { en: 'Employed', am: 'በቅጥር' },
  'reason.RENT': { en: 'Rent', am: 'በኪራይ' },
  'reason.OTHER': { en: 'Other', am: 'በሌላ ምክንያት' },
  reasonOther: { en: 'Specify', am: 'ይግለፁ' },
  driverProfession: { en: 'Profession / Occupation', am: 'ስራ ወይም ሙያ' },
  age: { en: 'Age', am: 'ዕድሜ' },
  licenceNo: { en: 'Driving licence No', am: 'የመንጃ ፈቃድ ቁጥር' },
  grade: { en: 'Grade', am: 'ደረጃ' },
  issueDate: { en: 'Issue date', am: 'ፈቃዱ የተሠጠበት ቀን' },
  expiryDate: { en: 'Expiry date', am: 'ፈቃዱ የሚያልቅበት ቀን' },

  accidentDate: { en: 'Date', am: 'የአደጋ ቀን' },
  time: { en: 'Time', am: 'ሰዓት' },
  place: { en: 'Place', am: 'ቦታ' },
  speed: { en: 'Speed of vehicle', am: 'ተሽከርካሪው የነበረው ፍጥነት' },
  distance: { en: 'Distance from road side', am: 'ከመንገድ ጠርዝ የነበረው ርቀት' },
  vehicleCondition: { en: 'Condition of horn, brake, lights and general condition of the vehicle', am: 'ስለተሽከርካሪው ጥሩንባ ፤መብራቶች እና ስለ ተሸከርካሪው ጠቅላላ ሁኔታ ይግለፁ' },
  goodsCarried: { en: 'Nature, weight and volume of goods carried by the vehicle', am: 'ተሸከርካሪው ላይ ስለ ነበረው የጭነት መጠን እና ዓይነት በዝርዝር ይግለፁ' },
  description: { en: 'Description of the accident', am: 'ስለአደጋው አደራረስሁኔታ ዝርዝር መግለጫ ይስጡ' },
  otherParty: { en: 'Owner and driver of other vehicle(s) or other properties involved', am: 'በአደጋው የተጎዳ የሌላ ወገን ተሸከርካሪ ወይም ንብረት ካለ ንብረቱን የሹፌሩን ስም ከነአድራሻው ይግለፁ' },
  owner: { en: 'Owner', am: 'የባለቤቱ ስም' },
  otherPlate: { en: 'Plate No', am: 'የሰሌዳ' },
  otherDriver: { en: "Driver's name", am: 'የአሽከርካረው ስም' },
  responsible: { en: 'Who is responsible for the accident?', am: 'ጥፋቱ የማን ይመስሎታል?' },
  otherPolicies: { en: 'Other policies on this vehicle (give particulars)', am: 'ይህን አደጋ በተመለከተ ሌላ የመድን ዋስትና አለዎት ካለዎት ይግለፁ' },
  police: { en: "Were particulars taken by police? Police station, officer's name and ID No", am: 'የአደጋው ዝርዝር ሁኔታ በፖሊስ ተመዝግቧል? ከተመዘገበ የጣቢያውን ስም የፖሊሱን ስም እና መታወቂያ ቁጥሩን ይግለፁ' },
  passengers: { en: 'Names and addresses of persons in your vehicle', am: 'በአደጋው ጊዜ በእርስዎ ተሸከርካሪ ውስጥ የነበሩትን ሰዎች ስም እና አድራሻ ይለግፁ' },
  witnesses: { en: 'Independent witnesses (names, addresses). If not taken, why?', am: 'ከተሳፋሪዎች በስተቀር በአቅራቢያው የነበሩ ምስክሮች ስምና አድራሻ ይግለፁ የምስክሮች ስም የልወሰዱ ከሆነ ምክንያቱን ያስረዱ' },

  damageInsured: { en: 'Damage to insured vehicle', am: 'መድን በተገባለት ተሽከርካሪ ላይ የደረሰውን ጉዳት ይግለፁ' },
  damageOther: { en: 'Damage to other vehicle or property', am: 'በሶስተኛው ወገን ተሸከርካሪ ወይም ንብረት ላይ የደረሰውን ጉዳት ይግለፁ' },
  injuredName: { en: 'Name', am: 'የተጎጂው ስም' },
  injuredAddress: { en: 'Address', am: 'አድራሻ' },
  injuredIdentity: { en: 'Who they are', am: 'የተጎጂው ማንነት' },

  notice: {
    en: 'Tell the policy holder: do not make any offer or promise of payment or admit liability in any way. Forward any claim document or court summons to the company without replying to it.',
    am: 'የካሳ ሂደቱን አስቸጋሪ ስለሚያደርገው ማንኛውንም የክፍያ ስምምነት ከመፈፀም ወይም ኃላፊነትን ከመቀበል ድርጊት እንዲቆጠቡ እንዲሁም ማንኛውም አይነት ደብዳቤ ወይም ሰነድ (ለምሳሌ የካሣ ክፍያ ጥያቄ ወይም የፍ/ቤት መጥሪያ ትዕዛዝ … ወዘተ) የሚደርስዎ ቢሆን ምንም ዓይነት ምላሽ ከመስጠትዎ በፊት ከነሙሉ ዝርዝሩ ለኩባንያው እንዲያስተላልፉ እናሳስባለን፡',
  },
};

/** Label for key in lang; the other language's text when one is missing. */
export function notificationLabel(key, lang = 'en') {
  const entry = NOTIFICATION_LABELS[key];
  if (!entry) return key;
  return entry[lang] || entry.en;
}
