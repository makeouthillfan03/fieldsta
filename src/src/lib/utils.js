import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  if (!date) return "";
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date) {
  if (!date) return "";
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTime(date) {
  if (!date) return "";
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function currency(amount) {
  const n = Number(amount) || 0;
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export const JOB_STATUSES = [
  "new",
  "scheduled",
  "dispatched",
  "in-progress",
  "on-hold",
  "completed",
  "invoiced",
];

export const STATUS_LABELS = {
  new: "New",
  scheduled: "Scheduled",
  dispatched: "Dispatched",
  "in-progress": "In Progress",
  "on-hold": "On Hold",
  completed: "Completed",
  invoiced: "Invoiced",
};

export const STATUS_BADGE_VARIANT = {
  new: "secondary",
  scheduled: "secondary",
  dispatched: "warning",
  "in-progress": "warning",
  "on-hold": "destructive",
  completed: "success",
  invoiced: "success",
};

export const PRIORITY_LABELS = {
  emergency: "Emergency",
  standard: "Standard",
};

export const JOB_TYPE_LABELS = {
  install: "Install",
  repair: "Repair",
  maintenance: "Maintenance",
};

export const TECH_AVAILABILITY = [
  "available",
  "on-route",
  "on-site",
  "on-break",
  "off",
];

export const TECH_AVAILABILITY_LABELS = {
  available: "Available",
  "on-route": "On Route",
  "on-site": "On Site",
  "on-break": "On Break",
  off: "Off",
};
