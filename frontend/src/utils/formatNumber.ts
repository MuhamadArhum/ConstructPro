/**
 * Dynamic-precision number formatting.
 * Shows only significant decimal places (up to 10), no trailing zeros.
 *   12          → "12"
 *   12.5        → "12.5"
 *   12.0000123  → "12.0000123"
 */
export function fmtNum(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 10,
  });
}

/** PKR 12.0000123 */
export function fmtAmount(n: number | null | undefined, currency = 'PKR'): string {
  return `${currency} ${fmtNum(n ?? 0)}`;
}

/** Returns '-' when value is null/undefined, otherwise PKR X */
export function fmtAmountOrDash(n: number | null | undefined, currency = 'PKR'): string {
  if (n == null) return '-';
  return fmtAmount(n, currency);
}

/** Absolute value with currency — for ledger sign-handled-externally displays */
export function fmtAmountAbs(n: number | null | undefined, currency = 'PKR'): string {
  return `${currency} ${fmtNum(Math.abs(n ?? 0))}`;
}

/** Signed: positive → "PKR X", negative → "-PKR X" */
export function fmtAmountSigned(n: number | null | undefined, currency = 'PKR'): string {
  const val = n ?? 0;
  return val >= 0
    ? `${currency} ${fmtNum(Math.abs(val))}`
    : `-${currency} ${fmtNum(Math.abs(val))}`;
}
