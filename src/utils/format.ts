export function formatHour(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "numeric", hour12: true });
}

export function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (24 * 3600 * 1000));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function formatWind(mph: number): string {
  return `${Math.round(mph)} mph`;
}

export function formatRange(low: number, high: number): string {
  return `${Math.round(low)}–${Math.round(high)} mph`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
