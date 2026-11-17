const statusStyles = {
  safe: "bg-green-100 text-green-800",
  monitor: "bg-yellow-100 text-yellow-900",
  affected: "bg-orange-100 text-orange-900",
  evacuate: "bg-red-100 text-red-800",
  outdated: "bg-gray-100 text-gray-700",
  expired: "bg-gray-100 text-gray-700",
  pending: "bg-yellow-100 text-yellow-900",
  verified: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  duplicate: "bg-gray-100 text-gray-700",
  false: "bg-red-100 text-red-800",
};

const labels = {
  safe: "Safe",
  monitor: "Monitor",
  affected: "Affected",
  evacuate: "Evacuate",
  outdated: "Outdated",
  expired: "Expired",
  pending: "Pending",
  verified: "Verified",
  rejected: "Rejected",
};

export default function StatusPill({ status = "outdated" }) {
  const key = String(status).toLowerCase();

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[key] || statusStyles.outdated}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {labels[key] || status}
    </span>
  );
}
