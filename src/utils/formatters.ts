export const formatTimestamp = (
  timestamp: number | undefined,
  includeSeconds: boolean = false
): string => {
  if (!timestamp) return "Unknown";
  const date = new Date(timestamp);

  return date.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...(includeSeconds && { second: "2-digit" }),
  });
};
