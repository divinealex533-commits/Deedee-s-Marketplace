/** Kobo → "₦12,500" */
export function naira(kobo: number) {
  const value = Math.abs(kobo) / 100;
  return '₦' + value.toLocaleString('en-NG', { maximumFractionDigits: 2 });
}

/** Signed amount for transaction lists: "+₦5,000" / "−₦5,000" */
export function signedNaira(kobo: number) {
  return (kobo < 0 ? '−' : '+') + naira(kobo);
}

const LAGOS_OFFSET_MS = 60 * 60 * 1000; // Lagos is UTC+1 all year (no daylight saving)

/** "2026-11-19" in Lagos time */
export function lagosDay(d = new Date()) {
  return new Date(d.getTime() + LAGOS_OFFSET_MS).toISOString().slice(0, 10);
}

/** Midnight today in Lagos, as a real Date */
export function startOfLagosDay(d = new Date()) {
  const shifted = new Date(d.getTime() + LAGOS_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - LAGOS_OFFSET_MS);
}

export function formatDate(d: Date) {
  return d.toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function timeAgo(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}
