const LABELS: Record<string, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  CHANGES: "Returned",
  APPROVED: "Approved",
  MACERATING: "Macerating",
  READY: "Ready",
  RELEASED: "Released",
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  CLOSED: "Closed",
};

export function Status({ value }: { value: string }) {
  const label = LABELS[value] ?? value;
  return <span className={`status status--${value.toLowerCase().replace("_", "-")}`}>{label}</span>;
}
