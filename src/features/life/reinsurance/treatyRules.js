// Reinsurance table specs and form checks. Field names follow the OpenAPI DTOs
// (TreatyMember*, FclGroup*, FclMedicalUnderwritingRange*, ReinsuranceTreatyRequest),
// including the backend's own spellings (reinsurnaceCommission, retationLimit).
import { ParticipationType, ReinsuranceCoverage, TreatyStatus, TreatyType } from "../constants/statuses";

const treatyStatuses = Object.values(TreatyStatus);
const sum = (rows, key) => rows.reduce((s, r) => s + (Number.isFinite(r[key]) ? r[key] : 0), 0);

/**
 * Treaty members (TreatyMemberUpdateRequest). Reinsurer options come from the reinsurer list.
 * Shares are the % of the ceded risk each reinsurer takes. They usually add up to 100 % with
 * one leader, but a partly placed treaty is legitimate, so those are warnings, not errors.
 */
export function memberSpec(reinsurers = [], { withStatus = true } = {}) {
  const spec = {
    id: "treaty-member",
    title: "Members",
    idField: "treatyMemberUuid",
    columns: [
      { key: "reinsurerUuid", label: "Reinsurer", type: "select", wide: true, options: reinsurers.map((r) => ({ value: r.reinsurerUuid, label: r.name })) },
      { key: "participationType", label: "Role", type: "select", default: ParticipationType.Follower, options: Object.values(ParticipationType).map((v) => ({ value: v, label: v })) },
      { key: "share", label: "Share %", type: "decimal", min: 0, max: 100 },
      { key: "reinsurnaceCommission", label: "Reinsurance commission %", type: "decimal", min: 0, max: 100 },
      { key: "profitCommission", label: "Profit commission %", type: "decimal", min: 0, max: 100 },
      { key: "status", label: "Status", type: "status", statuses: treatyStatuses },
    ],
    uniqueBy: (r) => r.reinsurerUuid || "",
    uniqueLabel: "reinsurer",
    formatKey: (k) => reinsurers.find((r) => r.reinsurerUuid === k)?.name || k,
    checks: (rows) => {
      const live = rows.filter((r) => r.status !== TreatyStatus.REVISED);
      const warnings = [];
      if (live.length) {
        const total = Math.round(sum(live, "share") * 100) / 100;
        if (total !== 100) warnings.push(`Member shares add up to ${total} %, not 100 %.`);
        const leaders = live.filter((r) => r.participationType === ParticipationType.Leader).length;
        if (leaders !== 1) warnings.push(leaders ? `${leaders} members are marked Leader; a treaty normally has one.` : "No member is marked Leader.");
      }
      return { warnings };
    },
  };
  // MemberRequest (used when creating a whole treaty) has no status field
  if (!withStatus) spec.columns = spec.columns.filter((c) => c.key !== "status");
  return spec;
}

/** FclGroupRequest (new-treaty wizard) has no status field. */
export const fclGroupCreateSpec = { ...fclGroupSpecBase(), columns: fclGroupSpecBase().columns.filter((c) => c.key !== "status") };

function fclGroupSpecBase() {
  return {
    id: "fcl-group",
    title: "Group free cover limits",
    idField: "fclGroupUuid",
    columns: [
      { key: "minLives", label: "From lives", type: "int", min: 1 },
      { key: "maxLives", label: "To lives", type: "int", min: 1 },
      { key: "averageSumassuredMultiplier", label: "Avg. sum assured ×", type: "decimal", min: 0 },
      { key: "mfcl", label: "Free cover limit (ETB)", type: "decimal", min: 0 },
      { key: "status", label: "Status", type: "status", statuses: treatyStatuses },
    ],
    uniqueBy: (r) => `${r.minLives}-${r.maxLives}`,
    uniqueLabel: "group size band",
    rangePairs: [["minLives", "maxLives", "from lives"]],
    noOverlap: { from: "minLives", to: "maxLives", label: "Group size bands" },
  };
}

/** Group free cover limits by group size (FclGroupUpdateRequest). */
export const fclGroupSpec = fclGroupSpecBase();

/** ReinsuranceTreatyRequest form check. Returns field → message. */
export function validateTreaty(t) {
  const e = {};
  if (!Object.values(TreatyType).includes(t.treatyType)) e.treatyType = "Choose the treaty type";
  if (!String(t.treatyCode || "").trim()) e.treatyCode = "Treaty code is required";
  else if (t.treatyCode.length > 60) e.treatyCode = "At most 60 characters";
  if (String(t.treatyDescription || "").length > 500) e.treatyDescription = "At most 500 characters";
  if (!Object.values(ReinsuranceCoverage).includes(t.reinsuranceCoverage)) e.reinsuranceCoverage = "Choose what the treaty covers";
  for (const [k, label] of [["retationLimit", "Retention limit"], ["riderRetentionLimit", "Rider retention limit"], ["policyCession", "Policy cession"]]) {
    if (t[k] === "" || t[k] === null || t[k] === undefined) e[k] = `${label} is required`;
    else if (Number(t[k]) < 0) e[k] = "Cannot be negative";
  }
  if (t.policyCession !== "" && Number(t.policyCession) > 100) e.policyCession = "At most 100 %";
  if (!t.beginDate) e.beginDate = "Start date is required";
  if (!t.endDate) e.endDate = "End date is required";
  else if (t.beginDate && t.endDate <= t.beginDate) e.endDate = "Must be after the start date";
  return e;
}

/** FclMedicalUnderwritingRange (age band × sum assured band → required tests). */
export function validateRange(r) {
  const e = {};
  const num = (k) => (r[k] === "" || r[k] === null || r[k] === undefined ? null : Number(r[k]));
  for (const [k, label] of [["minAge", "From age"], ["maxAge", "To age"], ["lowerLimit", "From sum assured"], ["upperLimit", "To sum assured"]]) {
    const v = num(k);
    if (v === null || Number.isNaN(v)) e[k] = `${label} is required`;
    else if (v < 0) e[k] = "Cannot be negative";
  }
  if (!e.minAge && !e.maxAge && num("minAge") > num("maxAge")) e.maxAge = "Must be ≥ from age";
  if (!e.lowerLimit && !e.upperLimit && num("lowerLimit") > num("upperLimit")) e.upperLimit = "Must be ≥ from sum assured";
  if (["minAge", "maxAge"].some((k) => num(k) !== null && !Number.isInteger(num(k)))) e.maxAge ||= "Ages are whole years";
  return e;
}

/** Medical ranges of one insurance type must not overlap on both age and sum assured. */
export function overlappingRanges(ranges) {
  const out = [];
  for (let i = 0; i < ranges.length; i++) for (let j = i + 1; j < ranges.length; j++) {
    const a = ranges[i], b = ranges[j];
    if ((a.insuranceType || "Group") !== (b.insuranceType || "Group")) continue;
    const ages = a.minAge <= b.maxAge && b.minAge <= a.maxAge;
    const sums = a.lowerLimit <= b.upperLimit && b.lowerLimit <= a.upperLimit;
    if (ages && sums) out.push([a, b]);
  }
  return out;
}
