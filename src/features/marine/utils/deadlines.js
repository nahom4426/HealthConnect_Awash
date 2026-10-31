// Deadline colour (plan section 3): green over 7 days, amber 7 days or less, red overdue, grey met.
import { daysBetween, todayIso } from "./format";

export function deadlineTone(dueDate, status, today = todayIso()) {
  if (status === "MET") return "met";
  const d = daysBetween(today, dueDate);
  return d < 0 ? "overdue" : d <= 7 ? "due" : "open";
}
