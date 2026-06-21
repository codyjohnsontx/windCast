import type { UnitSystem } from "../hooks/usePreferences";

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

export function formatWind(mph: number, unit: UnitSystem = "mph"): string {
  if (unit === "knots") return `${Math.round(mph / 1.15078)} kt`;
  if (unit === "mps") return `${Math.round((mph / 2.23694) * 10) / 10} m/s`;
  return `${Math.round(mph)} mph`;
}

export function formatRange(low: number, high: number, unit: UnitSystem = "mph"): string {
  return `${formatWindValue(low, unit)}-${formatWindValue(high, unit)} ${unitLabel(unit)}`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatAge(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.round(minutes / 60)} hr ago`;
}

function formatWindValue(mph: number, unit: UnitSystem): string {
  if (unit === "knots") return String(Math.round(mph / 1.15078));
  if (unit === "mps") return String(Math.round((mph / 2.23694) * 10) / 10);
  return String(Math.round(mph));
}

function unitLabel(unit: UnitSystem): string {
  if (unit === "knots") return "kt";
  if (unit === "mps") return "m/s";
  return "mph";
}
