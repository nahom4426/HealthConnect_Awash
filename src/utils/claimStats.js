// Digital-channel claim statuses grouped into the stages the dashboards show, and the figures
// both the launcher dashboard and the per-module dashboards derive from a claim list.

export const CLOSED_CLAIM_STATUSES = ['HANDOVER_COMPLETED', 'REJECTED'];

export const CLAIM_STAGES = [
  { status: 'Submitted',  codes: ['SUBMITTED'],                                    color: '#3b82f6' },
  { status: 'In Process', codes: ['IN_PROCESS', 'BID_ASSIGNED', 'BID_COMPLETED'],  color: '#f59e0b' },
  { status: 'In Repair',  codes: ['ASSIGN_TO_GARAGE', 'IN_MAINTENANCE'],           color: '#8b5cf6' },
  { status: 'Repaired',   codes: ['MAINTENANCE_COMPLETED'],                        color: '#10b981' },
  { status: 'Completed',  codes: ['HANDOVER_COMPLETED'],                           color: '#06b6d4' },
  { status: 'Rejected',   codes: ['REJECTED'],                                     color: '#e11d48' },
];

export const CLAIM_STATUS_LABELS = Object.fromEntries(
  CLAIM_STAGES.flatMap((stage) => stage.codes.map((code) => [code, stage.status])),
);
export const CLAIM_STATUS_COLORS = Object.fromEntries(
  CLAIM_STAGES.flatMap((stage) => stage.codes.map((code) => [code, stage.color])),
);

/** Approved amount once there is one, else the estimate. */
export const claimAmount = (c) => Number(c.approvedAmount ?? c.estimatedAmount) || 0;

export const claimTime = (c) => c.updatedAt || c.createdAt || c.incidentDate;

/** Claim count per stage, with each stage's share of all claims (0–100). */
export function claimPipeline(claims) {
  const total = claims.length;
  return CLAIM_STAGES.map((stage) => {
    const count = claims.filter((c) => stage.codes.includes(c.status)).length;
    return { ...stage, count, pct: total ? Math.round((count / total) * 100) : 0 };
  });
}

export function relativeTime(value, now = Date.now()) {
  const t = new Date(value).getTime();
  if (!t) return '';
  const mins = Math.round((now - t) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} hr ago`;
  return `${Math.round(mins / 1440)} days ago`;
}
