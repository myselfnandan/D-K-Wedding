/** All wedding times are Indian Standard Time (UTC+05:30, no DST). */
export const IST_OFFSET_MIN = 330;
export const MIN = 60_000;

export const toMs = (iso: string) => {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) throw new Error(`Invalid date-time: ${iso}`);
  return t;
};

/** Local IST wall-clock parts for an epoch ms. */
export function istParts(ms: number) {
  const d = new Date(ms + IST_OFFSET_MIN * MIN);
  return {
    y: d.getUTCFullYear(),
    m: d.getUTCMonth() + 1,
    d: d.getUTCDate(),
    hh: d.getUTCHours(),
    mm: d.getUTCMinutes(),
    dow: d.getUTCDay(),
  };
}

/** Epoch ms for an IST date (YYYY-MM-DD) at "HH:MM". */
export function istAt(date: string, hhmm: string) {
  return toMs(`${date}T${hhmm}:00+05:30`);
}

export function istDate(ms: number) {
  const p = istParts(ms);
  return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
}

export function formatTime(ms: number) {
  const { hh, mm } = istParts(ms);
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'am' : 'pm'}`;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDay(ms: number) {
  const p = istParts(ms);
  return `${DAYS[p.dow]} ${p.d} ${MONTHS[p.m - 1]}`;
}

export function formatDateIso(date: string) {
  return formatDay(istAt(date, '12:00'));
}

export function formatDuration(minutes: number) {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} min`;
  if (r === 0) return `${h} h`;
  return `${h} h ${r} min`;
}

export const minutesBetween = (a: number, b: number) => Math.round((b - a) / MIN);

/** Floor to a 5-minute mark so suggested times read naturally and never later than computed. */
export const floor5 = (ms: number) => Math.floor(ms / (5 * MIN)) * 5 * MIN;
export const ceil5 = (ms: number) => Math.ceil(ms / (5 * MIN)) * 5 * MIN;

/** Countdown parts until target. */
export function countdown(target: number, now: number) {
  const diff = Math.max(0, target - now);
  const s = Math.floor(diff / 1000);
  return {
    done: diff === 0,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}
