import { useEffect, useState } from 'react';

/** Current time, ticking every `ms`. `?now=2026-12-03T09:40:00+05:30` in the URL freezes it, for previews and testing. */
export function useNow(ms = 1000) {
  const override = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('now') : null;
  const fixed = override ? Date.parse(override) : NaN;
  const [now, setNow] = useState(() => (Number.isNaN(fixed) ? Date.now() : fixed));
  useEffect(() => {
    if (!Number.isNaN(fixed)) return;
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms, fixed]);
  return now;
}
