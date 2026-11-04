/**
 * Normalizes a date or date string (YYYY-MM-DD or Date object)
 * to a standardized UTC midnight Date for consistent calendar-day matching.
 */
export function normalizeCalendarDate(input: string | Date): Date {
  if (typeof input === "string") {
    // Expected format: YYYY-MM-DD or ISO string
    const match = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match && match[1] && match[2] && match[3]) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    }
  }

  const d = new Date(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

export function formatCalendarDate(date: string | Date): string {
  const d = new Date(date);
  return d.toISOString().split("T")[0] || "";
}
