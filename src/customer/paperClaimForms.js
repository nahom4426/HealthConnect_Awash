// Standard Insurance's other claim notification forms, as published on standardinsurancesc.com
// (Forms and downloadables → Claim Notification Forms). Like the motor form (claimFormLayout.js), each
// is the original page as an image with the customer's answers written on its blank lines. These have
// no claims service behind them yet: the customer fills the form here, prints it or saves it as PDF,
// signs it and hands it in at a branch.
//
// Positions are points from the top left of the 612 x 792 page, read from the published PDFs:
// `at` is [page, x, y, width] of a one-line blank, `block` is [page, x, y of the first line, width,
// line height, lines, first-line indent] of an answer over ruled lines, and `also` repeats the answer
// on other blanks (the name lines next to the signatures).
import { fit, block, formDate } from '@/customer/claimFormLayout';
import carriersPage1 from '@/customer/assets/carriers_liability_page1.jpg';
import carriersPage2 from '@/customer/assets/carriers_liability_page2.jpg';
import cpmPage1 from '@/customer/assets/cpm_car_page1.jpg';
import workmensPage1 from '@/customer/assets/workmens_compensation_page1.jpg';

const SITE = 'https://standardinsurancesc.com/wp-content/uploads/2026/01';
export const LETTER = { width: 612, height: 792 };

const CARRIERS = {
  id: 'carriers-liability',
  title: 'Inland Carriers Liability',
  subtitle: 'Notification of Accident',
  summary: 'Goods you were carrying were lost or damaged in an accident.',
  pdf: `${SITE}/Carriers-Liability-Claims-Notification-Form.pdf`,
  page: LETTER,
  images: [carriersPage1, carriersPage2],
  prefill: { 'ph.name': 'name', 'ph.phone': 'phone' },
  required: ['ph.name', 'policyNo', 'a.date'],
  signNote: 'Sign the form (driver and insured) and bring it with the driving licence and the police report to your Standard Insurance branch.',
  sections: [
    {
      title: 'Policy holder',
      fields: [
        { key: 'ph.name', label: 'Name in full', at: [1, 203.6, 285.6, 113.5], also: [[2, 244.0, 473.2, 170.1]] },
        { key: 'ph.profession', label: 'Profession', at: [1, 441.4, 285.6, 116.7] },
        { key: 'ph.address', label: 'Address (town)', at: [1, 176.3, 318.8, 50.0] },
        { key: 'ph.subCity', label: 'Sub city', at: [1, 262.6, 318.8, 43.8] },
        { key: 'ph.kebele', label: 'Kebele', at: [1, 334.6, 318.8, 43.8] },
        { key: 'ph.houseNo', label: 'House no.', at: [1, 432.5, 318.8, 75.0] },
        { key: 'ph.phone', label: 'Telephone', type: 'tel', at: [1, 206.9, 354.7, 243.1] },
      ],
    },
    {
      title: 'Policy and vehicle',
      fields: [
        { key: 'policyNo', label: 'Policy no.', at: [1, 213.2, 424.0, 128.9] },
        { key: 'plateNo', label: 'Plate no.', at: [1, 433.4, 424.0, 124.7] },
      ],
    },
    {
      title: 'Driver',
      fields: [
        { key: 'd.name', label: 'Driver’s name in full', at: [1, 352.0, 495.5, 206.1], also: [[2, 241.0, 430.7, 101.1]] },
        { key: 'd.address', label: 'Address (town)', at: [1, 176.3, 534.5, 50.0] },
        { key: 'd.subCity', label: 'Sub city', at: [1, 262.5, 534.5, 43.9] },
        { key: 'd.kebele', label: 'Kebele', at: [1, 334.5, 534.5, 43.8] },
        { key: 'd.houseNo', label: 'House no.', at: [1, 432.5, 534.5, 75.0] },
        { key: 'd.phone', label: 'Telephone', type: 'tel', at: [1, 206.9, 570.4, 207.1] },
        { key: 'd.licenceNo', label: 'Driving licence no.', at: [1, 242.2, 610.0, 63.8] },
        { key: 'd.grade', label: 'Grade', at: [1, 349.8, 610.0, 39.4] },
        { key: 'd.expiry', label: 'Licence expiry date', type: 'date', at: [1, 511.5, 610.0, 46.6] },
      ],
    },
    {
      title: 'The accident',
      fields: [
        { key: 'a.date', label: 'Date of accident', type: 'date', at: [1, 205.5, 678.3, 136.6] },
        { key: 'a.time', label: 'Time', type: 'time', at: [1, 378.1, 678.3, 72.0] },
        { key: 'a.place', label: 'Place', at: [1, 483.1, 678.3, 75.0] },
        { key: 'a.type', label: 'Type of accident', at: [1, 223.7, 704.7, 334.4] },
        { key: 'a.cargoType', label: 'Type of cargo', at: [2, 248.9, 75.1, 309.2] },
        { key: 'a.cargoQty', label: 'Quantity of cargo', at: [2, 238.2, 112.9, 320.0] },
        { key: 'a.crane', label: 'Type of crane needed to lift it', at: [2, 354.7, 145.5, 203.4] },
        { key: 'a.police', label: 'Were particulars taken by police? If so, the police station and officer', rows: 2, block: [2, 135.0, 211.2, 423.0, 11, 2] },
        { key: 'a.description', label: 'Brief description of the accident', rows: 3, block: [2, 337.5, 232.9, 220.6, 9.5, 2] },
        { key: 'a.damage', label: 'Extent of damage to the cargo', rows: 2, block: [2, 342.7, 271.8, 215.0, 9.5, 2] },
      ],
    },
  ],
};

const CPM_CAR = {
  id: 'cpm-car',
  title: 'CPM & CAR',
  subtitle: 'Claim Notification of CPM & CAR Accident',
  summary: 'Contractors’ plant and machinery or a contractor’s all risks project was damaged.',
  pdf: `${SITE}/CPM-and-CAR-Claims-Notification-Form.pdf`,
  page: LETTER,
  images: [cpmPage1],
  prefill: { 'ins.name': 'name' },
  required: ['ins.name', 'policyNo', 'a.date'],
  signNote: 'Sign the form (insured and operator) and bring it to your Standard Insurance branch.',
  sections: [
    {
      title: 'Insured',
      fields: [
        { key: 'ins.name', label: 'Name of insured', at: [1, 143.4, 149.4, 191.0], also: [[1, 86.8, 612.3, 123.4]] },
        { key: 'ins.address', label: 'Address (town)', at: [1, 101.8, 171.1, 31.7] },
        { key: 'ins.subCity', label: 'Sub city', at: [1, 167.7, 171.1, 43.8] },
        { key: 'ins.woreda', label: 'Woreda', at: [1, 227.9, 171.1, 51.8] },
        { key: 'ins.houseNo', label: 'House no.', at: [1, 323.6, 171.1, 120.0] },
        { key: 'policyNo', label: 'Policy no.', at: [1, 117.4, 193.6, 107.4] },
      ],
    },
    {
      title: 'Machinery',
      fields: [
        { key: 'm.type', label: 'Type of machinery', at: [1, 121.5, 223.9, 183.1] },
        { key: 'm.plate', label: 'Plate no.', at: [1, 120.7, 246.4, 63.5] },
        { key: 'm.model', label: 'Model no.', at: [1, 232.7, 246.4, 63.5] },
        { key: 'm.serial', label: 'Serial no.', at: [1, 336.3, 246.4, 160.0] },
        { key: 'm.year', label: 'Year of make', inputmode: 'numeric', at: [1, 130.5, 268.9, 91.3] },
      ],
    },
    {
      title: 'Operator',
      fields: [
        { key: 'op.name', label: 'Name of operator', at: [1, 120.9, 291.2, 203.1], also: [[1, 253.9, 612.3, 123.4]] },
        { key: 'op.address', label: 'Address (town)', at: [1, 103.6, 313.6, 31.7] },
        { key: 'op.subCity', label: 'Sub city', at: [1, 162.1, 313.6, 47.8] },
        { key: 'op.woreda', label: 'Woreda', at: [1, 228.3, 313.6, 47.7] },
        { key: 'op.houseNo', label: 'House no.', at: [1, 314.5, 313.6, 120.0] },
        { key: 'op.licenceNo', label: 'Driving licence no.', at: [1, 145.2, 336.1, 63.6] },
        { key: 'op.grade', label: 'Grade', at: [1, 236.0, 336.1, 39.8] },
        { key: 'op.expiry', label: 'Licence expiry date', type: 'date', at: [1, 336.7, 336.1, 120.0] },
      ],
    },
    {
      title: 'The accident',
      fields: [
        { key: 'a.date', label: 'Date of accident', type: 'date', at: [1, 121.1, 361.1, 99.4] },
        { key: 'a.place', label: 'Place of accident', at: [1, 272.6, 361.1, 180.0] },
        { key: 'a.type', label: 'Type of accident', at: [1, 132.3, 383.4, 179.0] },
        { key: 'a.description', label: 'Description of the accident', rows: 3, block: [1, 72.0, 416.6, 323.0, 10.5, 3, 89.3] },
        { key: 'dmg.own', label: 'Damage to the machine (own damage)', rows: 2, block: [1, 135.0, 471.8, 267.0, 10.7, 2, 27.0] },
        { key: 'dmg.thirdParty', label: 'Third party property damage (name and address)', rows: 2, block: [1, 72.0, 504.8, 331.0, 10.6, 2, 169.0] },
        { key: 'dmg.bodyInjury', label: 'Body injury (name and address)', at: [1, 183.6, 537.8, 219.2] },
        { key: 'police', label: 'Police station the accident was reported to', at: [1, 168.9, 549.5, 234.9] },
      ],
    },
  ],
};

const WORKMENS = {
  id: 'workmens-compensation',
  title: 'Workmen’s Compensation',
  subtitle: 'Workmen’s Compensation Notification Form',
  summary: 'An employee was injured at work or fell ill from it. Filled by the employer within five days.',
  pdf: `${SITE}/Workmens-Compensation-Claims-Notification-Form.pdf`,
  page: LETTER,
  images: [workmensPage1],
  prefill: { employer: 'name', phone: 'phone' },
  required: ['employer', 'policyNo', 'w.name', 'a.date'],
  signNote: 'Stamp and sign the form as the employer, have the witnesses sign it, and return it to your Standard Insurance branch within five days of the accident.',
  sections: [
    {
      title: 'Employer',
      fields: [
        { key: 'employer', label: 'Employer', at: [1, 126.9, 247.2, 302.7] },
        { key: 'town', label: 'Town', at: [1, 145.3, 267.2, 104.5] },
        { key: 'subCity', label: 'Sub city', at: [1, 277.8, 267.2, 55.1] },
        { key: 'woreda', label: 'Woreda', at: [1, 370.6, 267.2, 66.0] },
        { key: 'houseNo', label: 'House no.', at: [1, 468.8, 267.2, 71.6] },
        { key: 'phone', label: 'Telephone', type: 'tel', at: [1, 95.2, 286.2, 113.5] },
        { key: 'activity', label: 'Activity', at: [1, 119.6, 305.2, 126.7] },
        { key: 'policyNo', label: 'Policy no.', at: [1, 326.2, 305.2, 165.0] },
      ],
    },
    {
      title: 'Injured employee',
      fields: [
        { key: 'w.name', label: 'Name of the injured person (in full)', at: [1, 237.5, 324.2, 253.2] },
        { key: 'w.dob', label: 'Date of birth', type: 'date', at: [1, 141.6, 343.1, 109.9] },
        { key: 'w.category', label: 'Category of work', at: [1, 158.0, 362.1, 126.5] },
        { key: 'w.registration', label: 'Registration no.', at: [1, 359.9, 362.1, 88.0] },
        { key: 'w.dailyWage', label: 'Daily wage (Birr)', inputmode: 'decimal', at: [1, 151.0, 476.0, 76.9] },
        { key: 'w.monthlySalary', label: 'Monthly salary (Birr)', inputmode: 'decimal', at: [1, 166.9, 495.0, 60.6] },
      ],
    },
    {
      title: 'The accident',
      fields: [
        { key: 'a.date', label: 'Date of accident', type: 'date', at: [1, 155.6, 381.1, 115.6] },
        { key: 'a.place', label: 'Place of accident', at: [1, 366.0, 381.1, 82.4] },
        { key: 'a.informed', label: 'When was the employer informed?', type: 'date', at: [1, 302.4, 400.1, 60.6] },
        { key: 'a.time', label: 'Time of the accident', type: 'time', at: [1, 462.4, 400.1, 60.5] },
        { key: 'a.description', label: 'Brief description of the accident', rows: 3, block: [1, 78.0, 419.1, 442.0, 19, 3, 144.0] },
      ],
    },
    {
      title: 'Witnesses',
      fields: [
        { key: 'wit.1', label: 'Witness 1 name', at: [1, 77.7, 589.9, 132.0] },
        { key: 'wit.2', label: 'Witness 2 name', at: [1, 77.7, 608.9, 132.0] },
        { key: 'wit.3', label: 'Witness 3 name', at: [1, 77.7, 627.8, 132.0] },
      ],
    },
  ],
};

export const PAPER_FORMS = [CARRIERS, CPM_CAR, WORKMENS];
export const paperForm = (id) => PAPER_FORMS.find((f) => f.id === id) || null;

/** The motor form is filed online (claimFormLayout.js); listed beside the others on the forms page. */
export const MOTOR_FORM = {
  id: 'motor',
  title: 'Motor',
  subtitle: 'Notification of Motor Accident',
  summary: 'Your vehicle was in an accident, damaged, stolen or caused damage to others.',
  pdf: `${SITE}/Motor-Claims-Notification-Form.pdf`,
};

export const formFields = (def) => def.sections.flatMap((sec) => sec.fields);

/** An empty answer for every field, with the customer's name and phone where the form asks for them. */
export function blankValues(def, profile = {}) {
  const values = Object.fromEntries(formFields(def).map((f) => [f.key, '']));
  for (const [key, from] of Object.entries(def.prefill || {})) values[key] = profile[from] || '';
  return values;
}

/** The keys of required fields left empty */
export function missingFields(def, values) {
  return def.required.filter((key) => !String(values?.[key] ?? '').trim());
}

/** What goes on the paper for a field: dates as dd/mm/yyyy, like the motor form */
function shown(field, values) {
  const v = String(values?.[field.key] ?? '').trim();
  return field.type === 'date' ? formDate(v) : v;
}

/** Everything to write on each page: [{ cells, blocks }] per page, as positioned cells. */
export function paperPageContent(def, values) {
  const pages = def.images.map(() => ({ cells: [], blocks: [] }));
  for (const field of formFields(def)) {
    const text = shown(field, values);
    if (!text) continue;
    if (field.block) {
      const [page, ...box] = field.block;
      pages[page - 1].blocks.push(block(text, box));
      continue;
    }
    for (const [page, x, y, w] of [field.at, ...(field.also || [])]) pages[page - 1].cells.push(fit(text, x, y, w));
  }
  return pages;
}
