// Individual term life ("benefit") rules. Fields follow BenefitRequest and IndividualRiderBenefitRequest.
// The backend prices both on save and ignores client premiums; GET /benefit/quote gives the priced
// quote before saving (contract 2026-10 #27). The UI never sends a premium.
import { BenefitStatus } from "../constants/statuses";
import { toDateTime } from "../constants/labels";

const blank = (v) => v === null || v === undefined || String(v).trim() === "";
const PHONE = /^\+?\d{7,12}$/;
export const GENDERS = ["Male", "Female"];

/** What each status allows. There is no issue / activate endpoint yet (gap G11). */
export function benefitActions(b = {}) {
  const draft = b.status === BenefitStatus.PENDING || !b.status;
  return { edit: draft, remove: draft, riders: draft };
}

/**
 * Query for GET /benefit/quote, or null until every pricing input is filled (the backend prices
 * an incomplete draft at 0). The backend works out the age (next birthday at the start date).
 * @param {object} f form state
 * @param {{ riderUuid: string, benefits: any }[]} riderRows riders to include
 */
export function quoteParams(f, riderRows = []) {
  if (!f.dateOfBirth || !GENDERS.includes(f.gender) || !f.beginDate) return null;
  if (!(Number(f.insuranceTerm) >= 1) || !(Number(f.termBenefit) > 0)) return null;
  const params = { dateOfBirth: f.dateOfBirth, gender: f.gender, beginDate: f.beginDate, term: Number(f.insuranceTerm), termBenefit: Number(f.termBenefit) };
  const riders = riderRows.filter((r) => r.riderUuid && Number(r.benefits) > 0).map((r) => `${r.riderUuid}:${Number(r.benefits)}`);
  if (riders.length) params.riders = riders.join(",");
  return params;
}

export function fromBenefit(b = {}) {
  return {
    firstName: b.firstName ?? "", fatherName: b.fatherName ?? "", grandFatherName: b.grandFatherName ?? "",
    gender: b.gender ?? "", personPhone: b.personPhone ?? "",
    dateOfBirth: b.dateOfBirth ? String(b.dateOfBirth).slice(0, 10) : "",
    beginDate: b.beginDate ? String(b.beginDate).slice(0, 10) : "",
    insuranceTerm: b.insuranceTerm ?? "", termBenefit: b.termBenefit ?? "",
  };
}

export function validateBenefit(f, today = new Date().toISOString().slice(0, 10)) {
  const e = {};
  for (const k of ["firstName", "fatherName", "grandFatherName"]) {
    if (blank(f[k])) e[k] = "Required";
    else if (String(f[k]).trim().length > 25) e[k] = "At most 25 characters";
  }
  if (!GENDERS.includes(f.gender)) e.gender = "Choose";
  if (blank(f.personPhone)) e.personPhone = "Required";
  else if (!PHONE.test(String(f.personPhone).trim())) e.personPhone = "Digits only, optionally starting with +";
  if (!f.dateOfBirth) e.dateOfBirth = "Required";
  else if (f.dateOfBirth >= today) e.dateOfBirth = "Must be in the past";
  if (!f.beginDate) e.beginDate = "Required";
  else if (f.dateOfBirth && f.beginDate <= f.dateOfBirth) e.beginDate = "Must be after the date of birth";
  if (blank(f.insuranceTerm)) e.insuranceTerm = "Required";
  else if (!Number.isInteger(Number(f.insuranceTerm)) || Number(f.insuranceTerm) < 1) e.insuranceTerm = "Whole number of years, at least 1";
  if (blank(f.termBenefit)) e.termBenefit = "Required";
  else if (!(Number(f.termBenefit) > 0)) e.termBenefit = "Must be more than 0";
  return e;
}

/** BenefitRequest without termPremium: the premium is the backend's to set. */
export function toBenefitRequest(f) {
  return {
    firstName: String(f.firstName).trim(), fatherName: String(f.fatherName).trim(), grandFatherName: String(f.grandFatherName).trim(),
    gender: f.gender, personPhone: String(f.personPhone).trim(),
    dateOfBirth: toDateTime(f.dateOfBirth), beginDate: toDateTime(f.beginDate),
    insuranceTerm: Number(f.insuranceTerm), termBenefit: Number(f.termBenefit),
  };
}

/** One rider on an individual policy. `rider` = RiderResponse (minLimit, maxLimit) when known. */
export function validateRiderBenefit(f, rider) {
  const e = {};
  if (!f.riderUuid) e.riderUuid = "Choose a rider";
  if (blank(f.benefits)) e.benefits = "Required";
  else if (!(Number(f.benefits) > 0)) e.benefits = "Must be more than 0";
  else if (rider) {
    const v = Number(f.benefits);
    if ((rider.minLimit != null && v < rider.minLimit) || (rider.maxLimit != null && v > rider.maxLimit)) {
      e.benefits = `Between ${rider.minLimit ?? 0} and ${rider.maxLimit ?? "no limit"}`;
    }
  }
  return e;
}

export function toRiderBenefitRequest(f, benefitUuid, status) {
  const body = { benefitUuid, riderUuid: f.riderUuid, benefits: Number(f.benefits) };
  if (status) body.status = status;
  return body;
}

/** Client-side paging for the unpaged GET /benefit/benefits/{status} */
export function pageOf(rows, page, size) {
  const totalPages = Math.max(1, Math.ceil(rows.length / size));
  const p = Math.min(Math.max(1, page), totalPages);
  return { rows: rows.slice((p - 1) * size, p * size), totalPages, page: p };
}

export const benefitName = (b = {}) => [b.firstName, b.fatherName, b.grandFatherName].filter(Boolean).join(" ");
