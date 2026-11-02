// Standard Insurance's "Notification of Motor Accident" form (Motor-Claims-Notification-Form.pdf) with the
// customer's answers written on its blank lines. A port of the mobile app's claim_form_pdf.dart: the two
// form pages are the same images, and every answer sits at the position of its line on the original
// (points, from the top left of the 612 x 843 page).

export const PAGE = { width: 612, height: 843 };
export const INK = '#0B2A6F';
export const ORANGE = '#E67E22';

const s = (v) => String(v ?? '').trim();

function at(form, path) {
  let cur = form;
  for (const p of path) {
    if (cur && typeof cur === 'object') cur = cur[p];
    else return null;
  }
  return cur;
}

/** yyyy-mm-dd to dd/mm/yyyy, as written on the paper form */
export function formDate(iso) {
  const t = s(iso);
  const parts = t.length >= 10 ? t.slice(0, 10).split('-') : [];
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : t;
}

function reason(form) {
  const r = s(at(form, ['driver', 'reasonForDriving']));
  if (r === 'OTHER') return s(at(form, ['driver', 'reasonOther'])) || 'Other';
  return { OWNERSHIP: 'Ownership', EMPLOYED: 'Employed', RENT: 'Rent' }[r] || r;
}

const PATHS = {
  'ph.name': ['policyHolder', 'fullName'], 'ph.profession': ['policyHolder', 'profession'], 'ph.address': ['policyHolder', 'address'],
  'ph.subCity': ['policyHolder', 'subCity'], 'ph.kebele': ['policyHolder', 'kebele'], 'ph.houseNo': ['policyHolder', 'houseNo'],
  'ph.phone': ['policyHolder', 'phone'],
  'v.policyNo': ['vehicle', 'policyNo'], 'v.plateNo': ['vehicle', 'plateNo'], 'v.typeAndMake': ['vehicle', 'typeAndMake'],
  'v.use': ['vehicle', 'use'], 'v.year': ['vehicle', 'yearOfMake'],
  'd.name': ['driver', 'fullName'], 'd.address': ['driver', 'address'], 'd.subCity': ['driver', 'subCity'], 'd.kebele': ['driver', 'kebele'],
  'd.houseNo': ['driver', 'houseNo'], 'd.phone': ['driver', 'phone'], 'd.profession': ['driver', 'profession'], 'd.age': ['driver', 'age'],
  'd.licenceNo': ['driver', 'licenceNo'], 'd.grade': ['driver', 'grade'],
  'a.time': ['accident', 'time'], 'a.place': ['accident', 'place'], 'a.speed': ['accident', 'speed'],
  'a.distance': ['accident', 'distanceFromRoadSide'], 'a.condition': ['accident', 'vehicleCondition'], 'a.goods': ['accident', 'goodsCarried'],
  'o.owner': ['accident', 'otherParty', 'ownerName'], 'o.subCity': ['accident', 'otherParty', 'ownerSubCity'],
  'o.worda': ['accident', 'otherParty', 'ownerWoreda'], 'o.kebele': ['accident', 'otherParty', 'ownerKebele'],
  'o.phone': ['accident', 'otherParty', 'ownerPhone'], 'o.plate': ['accident', 'otherParty', 'plateNo'],
  'o.driver': ['accident', 'otherParty', 'driverName'],
};
const DATES = { 'd.issue': ['driver', 'licenceIssueDate'], 'd.expiry': ['driver', 'licenceExpiryDate'], 'a.date': ['accident', 'date'] };

/** The answer for each blank line, by key */
export function lineValue(form, key) {
  if (PATHS[key]) return s(at(form, PATHS[key]));
  if (DATES[key]) return formDate(at(form, DATES[key]));
  if (key === 'd.reason') return reason(form);
  if (key === 'a.responsible') {
    const r = s(at(form, ['accident', 'responsible']));
    return r === 'Not sure yet' ? '' : r;
  }
  return '';
}

// [page, key, x, y, width] of each single-line blank
export const LINES = [
  [1, 'ph.name', 130.2, 307.9, 207.6], [1, 'ph.profession', 439.5, 307.9, 99.1], [1, 'ph.address', 103.9, 333.3, 46.7],
  [1, 'ph.subCity', 190.0, 333.3, 34.8], [1, 'ph.kebele', 254.6, 333.3, 46.7], [1, 'ph.houseNo', 342.7, 333.3, 53.1],
  [1, 'ph.phone', 441.6, 333.3, 101.4], [1, 'v.policyNo', 89.9, 511.1, 127.4], [1, 'v.plateNo', 344.5, 511.1, 102.0],
  [1, 'v.typeAndMake', 166.3, 538.4, 81.2], [1, 'v.use', 328.8, 538.4, 72.9], [1, 'v.year', 487.9, 538.4, 58.4],
  [1, 'd.name', 168.8, 602.1, 302.3], [1, 'd.address', 90.0, 633.2, 54.5], [1, 'd.subCity', 186.8, 633.2, 41.7],
  [1, 'd.kebele', 268.5, 633.2, 41.5], [1, 'd.houseNo', 361.3, 633.2, 38.1], [1, 'd.phone', 513.2, 633.2, 38.4],
  [1, 'd.reason', 371.0, 662.8, 103.7], [1, 'd.profession', 165.8, 688.2, 146.3], [1, 'd.age', 426.7, 688.2, 47.6],
  [1, 'd.licenceNo', 145.3, 720.1, 70.3], [1, 'd.grade', 243.5, 720.1, 39.1], [1, 'd.issue', 335.6, 719.1, 50.7],
  [1, 'd.expiry', 443.6, 720.1, 56.2], [1, 'a.date', 90.5, 777.1, 102.7], [1, 'a.time', 257.5, 777.1, 75.7],
  [1, 'a.place', 383.6, 777.1, 76.8], [1, 'a.speed', 195.8, 812.5, 89.3], [1, 'a.distance', 443.9, 812.5, 71.2],
  [2, 'a.condition', 402.2, 41.2, 107.3], [2, 'a.goods', 366.8, 75.0, 146.9], [2, 'o.owner', 105.7, 214.6, 119.4],
  [2, 'o.subCity', 266.8, 214.6, 51.0], [2, 'o.worda', 352.6, 214.6, 51.0], [2, 'o.kebele', 444.3, 214.6, 27.0],
  [2, 'o.phone', 523.2, 214.6, 40.2], [2, 'o.plate', 117.2, 243.9, 117.6], [2, 'o.driver', 137.6, 273.9, 80.8],
  [2, 'a.responsible', 233.7, 297.7, 162.7],
];

// Answer blocks that run over the ruled lines of page 2: [x, y of the first line, width, line height, lines]
export const BLOCKS = {
  description: [205, 113.0, 382, 17.6, 3],
  otherPolicies: [84, 336.5, 500, 11, 1],
  police: [84, 377.5, 500, 11.5, 2],
  passengers: [84, 427.5, 500, 11, 1],
  witnesses: [84, 473.5, 500, 11, 1],
  damageVehicle: [252, 536.0, 330, 11, 2],
  damageOther: [272, 565.5, 310, 11, 2],
};

export function blockTexts(form) {
  return {
    description: s(at(form, ['accident', 'description'])),
    otherPolicies: s(at(form, ['accident', 'otherPolicies'])),
    police: s(at(form, ['accident', 'police'])),
    passengers: s(at(form, ['accident', 'passengers'])),
    witnesses: s(at(form, ['accident', 'witnesses'])),
    damageVehicle: s(at(form, ['damage', 'insuredVehicle'])),
    damageOther: s(at(form, ['damage', 'otherProperty'])),
  };
}

const PER_CHAR = 0.54;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** One-line answer, shrunk to fit its blank (about 0.54 em per character); `top` and `left` in points. */
export function fit(text, x, y, width, { max = 9, min = 5.5 } = {}) {
  let size = max;
  if (text.length * PER_CHAR * size > width) size = clamp(width / (text.length * PER_CHAR), min, max);
  let shown = text;
  const capacity = Math.floor(width / (PER_CHAR * size));
  if (shown.length > capacity && capacity > 1) shown = `${shown.slice(0, capacity - 1)}…`;
  // A little gap so the answer does not touch the label before the blank
  return { text: shown, size, left: x + 2, top: y - 0.6, width };
}

/**
 * An answer over several ruled lines; the type gets smaller when the text is long. `indent` (points) is
 * for a first line that starts after its label, further right than the lines below it.
 */
export function block(text, [x, y, width, lineHeight, lines, indent = 0]) {
  let size = lineHeight > 12 ? 9 : 8.5;
  const perChar = 0.5;
  const room = (sz) => (width * lines - indent) / (perChar * sz);
  while (size > 6.5 && text.length > room(size)) size -= 0.5;
  const capacity = Math.floor(room(size));
  const shown = text.length > capacity && capacity > 1 ? `${text.slice(0, capacity - 1)}…` : text;
  return { text: shown, size, left: x, top: y, width, lineHeight, lines, indent };
}

/** Injured persons: name, address and identity columns; up to three rows fit on the form. */
const INJURED_ROWS_Y = [640.0, 658.5, 673.5];
export function injuredCells(form) {
  const list = (Array.isArray(form?.injuries) ? form.injuries : []).filter((i) => i && s(i.name));
  const cells = [];
  for (let i = 0; i < list.length && i < INJURED_ROWS_Y.length; i += 1) {
    const more = i === INJURED_ROWS_Y.length - 1 && list.length > INJURED_ROWS_Y.length ? `  (+${list.length - INJURED_ROWS_Y.length} more)` : '';
    cells.push(fit(`${s(list[i].name)}${more}`, 88, INJURED_ROWS_Y[i], 130));
    cells.push(fit(s(list[i].address), 252, INJURED_ROWS_Y[i], 130));
    cells.push(fit(s(list[i].identity), 417, INJURED_ROWS_Y[i], 130));
  }
  return cells.filter((c) => c.text);
}

/** Everything to write on each page: { 1: [...], 2: [...] } as positioned one-line cells, plus page 2 blocks. */
export function pageContent(form) {
  const pages = { 1: [], 2: [] };
  for (const [page, key, x, y, w] of LINES) {
    const v = lineValue(form, key);
    if (v) pages[page].push(fit(v, x, y, w));
  }
  const blocks = [];
  const texts = blockTexts(form);
  for (const [key, box] of Object.entries(BLOCKS)) {
    if (texts[key]) blocks.push(block(texts[key], box));
  }
  pages[2].push(...injuredCells(form));
  return { lines: pages, blocks };
}
