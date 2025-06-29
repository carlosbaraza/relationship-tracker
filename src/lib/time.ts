import {
  formatDistanceToNow,
  differenceInHours,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears,
} from "date-fns";

export function formatTimeSince(date: Date): string {
  // Always use UTC to avoid timezone issues
  const now = new Date();
  const utcNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);

  const days = differenceInDays(utcNow, utcDate);
  const weeks = differenceInWeeks(utcNow, utcDate);
  const months = differenceInMonths(utcNow, utcDate);
  const years = differenceInYears(utcNow, utcDate);

  // Always show minimum of days, no hours
  if (days === 0) {
    return "today";
  }

  // <7d: days only (e.g., "3d")
  if (days < 7) {
    return `${days}d`;
  }

  // <1month: weeks + days (e.g., "2w 3d")
  if (days < 30) {
    const remainingDays = days - weeks * 7;
    if (remainingDays > 0) {
      return `${weeks}w ${remainingDays}d`;
    }
    return `${weeks}w`;
  }

  // <1year: months + weeks (e.g., "3m 2w")
  if (months < 12) {
    const remainingDays = days - months * 30;
    const remainingWeeks = Math.floor(remainingDays / 7);
    if (remainingWeeks > 0) {
      return `${months}m ${remainingWeeks}w`;
    }
    return `${months}m`;
  }

  // ≥1year: years + months (e.g., "1y 3m")
  const remainingMonths = months - years * 12;
  if (remainingMonths > 0) {
    return `${years}y ${remainingMonths}m`;
  }
  return `${years}y`;
}
