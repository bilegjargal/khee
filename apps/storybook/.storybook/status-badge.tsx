import { STATUS_TAGS, type Status } from "./khee-docs.ts";

const LABELS: Record<Status, string> = {
  experimental: "Experimental",
  stable: "Stable",
};

/** Reads a component's single status tag. Returns undefined if it is missing or ambiguous. */
export function statusOf(tags: readonly string[]): Status | undefined {
  const found = STATUS_TAGS.filter((status) => tags.includes(status));
  return found.length === 1 ? found[0] : undefined;
}

export function StatusBadge({ tags }: { tags: readonly string[] }) {
  const status = statusOf(tags);
  return (
    <p className="khee-sb-status sb-unstyled" data-status={status ?? "unknown"}>
      Status: {status ? LABELS[status] : "Unknown"}
    </p>
  );
}
