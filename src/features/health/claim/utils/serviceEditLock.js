/**
 * A provided service (cash or credit) can be edited only before it is claimed,
 * or after its claim was rejected. Once a claim is created or the service has
 * moved past PENDING (processed, authorized, approved, paid...), it is locked.
 */
export function canEditServiceProvided(row) {
  const status = String(row?.serviceClaimStatus || row?.status || "").toUpperCase();
  if (status === "REJECTED") return true;
  return !row?.claimUuid && (status === "" || status === "PENDING");
}

export function editLockReason(row) {
  if (canEditServiceProvided(row)) return "";
  const status = String(row?.serviceClaimStatus || row?.status || "").toUpperCase();
  if (status === "REJECTION_REQUESTED") return "Rejection requested — editable once it's rejected";
  return "A claim has been created for this service — editable only if it's rejected";
}
