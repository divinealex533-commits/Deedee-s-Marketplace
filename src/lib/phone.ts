/** Normalises Nigerian numbers to 234XXXXXXXXXX. Returns null if it doesn't look like a phone number. */
export function normalizePhone(input: string): string | null {
  const d = (input || '').replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('0')) return '234' + d.slice(1);
  if (d.length === 10 && /^[789]/.test(d)) return '234' + d;
  if (d.length >= 11 && d.length <= 15) return d;
  return null;
}

/** 2348031234567 → 0803 ••• 4567 */
export function maskPhone(phone: string) {
  const local = phone.startsWith('234') ? '0' + phone.slice(3) : phone;
  return `${local.slice(0, 4)} ••• ${local.slice(-4)}`;
}
