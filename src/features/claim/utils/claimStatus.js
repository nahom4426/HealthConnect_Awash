// Display helpers for a provided service's claim status (serviceClaimStatus)

export function claimStatusOf(row) {
  return String(row?.serviceClaimStatus || row?.status || "PENDING").toUpperCase();
}

export function claimStatusLabel(rowOrStatus) {
  const s = typeof rowOrStatus === "string" ? rowOrStatus.toUpperCase() : claimStatusOf(rowOrStatus);
  return s
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Tailwind classes for the badge and its dot
export function claimStatusTone(rowOrStatus) {
  const s = typeof rowOrStatus === "string" ? rowOrStatus.toUpperCase() : claimStatusOf(rowOrStatus);
  if (s === "REJECTED") return { badge: "text-error-strong bg-error-soft border-error/20", dot: "bg-error" };
  if (s === "REJECTION_REQUESTED") return { badge: "text-error-strong bg-error-soft border-error/20", dot: "bg-error animate-pulse" };
  if (["PAID", "PAYED", "COMPLETED", "APPROVED", "AUTHORIZED"].includes(s))
    return { badge: "text-success-strong bg-success-soft border-success/20", dot: "bg-success" };
  if (["PROCESSED", "VERIFIED", "REQUESTED"].includes(s))
    return { badge: "text-primary bg-primary/10 border-primary/20", dot: "bg-primary" };
  return { badge: "text-warning-strong bg-warning-soft border-warning/20", dot: "bg-warning animate-pulse" };
}
