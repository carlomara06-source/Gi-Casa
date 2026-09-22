// Manual Italian day names instead of toLocaleDateString("it-IT", …): that
// API's output depends on the runtime's loaded ICU data, which differs
// between the Node.js SSR pass and the browser and caused a hydration
// mismatch. A fixed table is deterministic everywhere.

const DOW = ["DOM", "LUN", "MAR", "MER", "GIO", "VEN", "SAB"];
const DOW_LONG = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];

export type BookingDay = { iso: string; dow: string; dayNum: string; long: string };

/** Whole days between a past Date and now. Kept out of component bodies —
 * calling Date.now() directly during render trips the purity lint rule. */
export function daysSince(date: Date): number {
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

/** Whole weeks between a past Date and now, minimum 1 (used for billing). */
export function weeksSince(date: Date): number {
  return Math.max(1, Math.ceil((Date.now() - date.getTime()) / (7 * 86400000)));
}

/** DD/MM/YYYY, computed manually for the same reason as buildBookingDays. */
export function formatDateIt(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
}

const MONTH_ABBR = ["GEN", "FEB", "MAR", "APR", "MAG", "GIU", "LUG", "AGO", "SET", "OTT", "NOV", "DIC"];

/** "06" / "SET" — for the stacked day/month tiles in visit lists. */
export function formatDayMonthShort(date: Date): { day: string; month: string } {
  return { day: String(date.getDate()).padStart(2, "0"), month: MONTH_ABBR[date.getMonth()] };
}

export function buildBookingDays(from: Date, count = 5): BookingDay[] {
  const days: BookingDay[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    d.setHours(0, 0, 0, 0);
    days.push({
      iso: d.toISOString(),
      dow: DOW[d.getDay()],
      dayNum: String(d.getDate()).padStart(2, "0"),
      long: `${DOW_LONG[d.getDay()]} ${d.getDate()}`,
    });
  }
  return days;
}
