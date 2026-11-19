/**
 * Admin-only display figure: while the admin's real wallet is empty, their own screens show this
 * placeholder instead of ₦0. It is never stored, never spendable, and never shown to customers.
 * As soon as the admin's real balance is above ₦0, the real balance is shown instead.
 */
export const ADMIN_PLACEHOLDER_BALANCE = 5_200_000 * 100; // kobo

export function displayBalance(user: { role: string; balance: number }) {
  return user.role === 'ADMIN' && user.balance <= 0 ? ADMIN_PLACEHOLDER_BALANCE : user.balance;
}
