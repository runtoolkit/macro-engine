/**
 * String utilities.
 *
 * All functions are pure / stateless.
 */

// ── core manipulation ─────────────────────────────────────────

export const concat      = (...parts) => parts.join('');
export const repeat      = (s, n)     => s.repeat(n);
export const truncate    = (s, len)   => s.length > len ? s.slice(0, len) : s;
export const padLeft     = (s, len, ch = ' ') => s.padStart(len, ch);
export const insert      = (s, pos, sub) => s.slice(0, pos) + sub + s.slice(pos);
export const find        = (s, sub)   => s.indexOf(sub);
export const replace     = (s, from, to) => s.split(from).join(to);
export const split       = (s, delim)   => s.split(delim);
export const toLowercase = (s)        => s.toLowerCase();
export const toUppercase = (s)        => s.toUpperCase();

// ── conversion ────────────────────────────────────────────────

export const toNumber = (s) => {
  const n = Number(s);
  return isNaN(n) ? null : n;
};

export const toString = (v) => String(v);

// ── formatting ────────────────────────────────────────────────

/**
 * Format a number with thousand separators.
 * e.g. 1234567 → "1,234,567"
 */
export const formatNumber = (n, locale = 'en-US') =>
  n.toLocaleString(locale);

/**
 * Convert a tick count to a human-readable time string.

 * @param {number} ticks
 * @returns {string}  e.g. "1h 23m 45s"
 */
export const formatTicks = (ticks, tps = 20) => {
  let secs = Math.floor(ticks / tps);
  const h = Math.floor(secs / 3600); secs %= 3600;
  const m = Math.floor(secs / 60);   secs %= 60;
  const parts = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${secs}s`);
  return parts.join(' ');
};

/**
 * Ordinal suffix: 1 → "1st", 2 → "2nd", etc.
 */
export const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

/**
 * Pluralize: pluralize(3, 'item') → "3 items"
 */
export const pluralize = (n, word, plural = word + 's') =>
  `${n} ${n === 1 ? word : plural}`;

/**
 * Progress bar string.
 * e.g. progressBar(7, 10, 20) → "███████░░░░░░░░░░░░░"
 */
export const progressBar = (value, max, width = 20, filled = '█', empty = '░') => {
  const filledCount = Math.round((value / max) * width);
  return filled.repeat(filledCount) + empty.repeat(width - filledCount);
};

/**
 * Separator line.
 * e.g. separator(20) → "────────────────────"
 */
export const separator = (width = 40, char = '─') => char.repeat(width);
