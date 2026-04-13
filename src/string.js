/**
 * String utilities.
 *
 * All functions are pure / stateless.
 */

function toText(value) {
  return String(value ?? '');
}

function toFiniteNumber(value, name) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new TypeError(`${name} must be a finite number`);
  return n;
}

function toNonNegativeInteger(value, name) {
  const n = Math.floor(toFiniteNumber(value, name));
  if (n < 0) throw new RangeError(`${name} must be >= 0`);
  return n;
}

// ── core manipulation ─────────────────────────────────────────

export const concat      = (...parts) => parts.map(toText).join('');
export const repeat      = (s, n)     => toText(s).repeat(toNonNegativeInteger(n, 'n'));
export const truncate    = (s, len)   => {
  const text = toText(s);
  const limit = toNonNegativeInteger(len, 'len');
  return text.length > limit ? text.slice(0, limit) : text;
};
export const padLeft     = (s, len, ch = ' ') => toText(s).padStart(toNonNegativeInteger(len, 'len'), toText(ch).slice(0, 1) || ' ');
export const insert      = (s, pos, sub) => {
  const text = toText(s);
  const index = Math.max(0, Math.min(text.length, Math.trunc(toFiniteNumber(pos, 'pos'))));
  return text.slice(0, index) + toText(sub) + text.slice(index);
};
export const find        = (s, sub)   => toText(s).indexOf(toText(sub));
export const replace     = (s, from, to) => toText(s).split(toText(from)).join(toText(to));
export const split       = (s, delim)   => toText(s).split(delim == null ? '' : delim);
export const toLowercase = (s)        => toText(s).toLowerCase();
export const toUppercase = (s)        => toText(s).toUpperCase();

// ── conversion ────────────────────────────────────────────────

export const toNumber = (s) => {
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
};

export const toString = (v) => String(v);

// ── formatting ────────────────────────────────────────────────

/**
 * Format a number with thousand separators.
 * e.g. 1234567 → "1,234,567"
 */
export const formatNumber = (n, locale = 'en-US') => {
  const value = toFiniteNumber(n, 'n');
  return value.toLocaleString(locale);
};

/**
 * Convert a tick count to a human-readable time string.
 *
 * @param {number} ticks
 * @returns {string}  e.g. "1h 23m 45s"
 */
export const formatTicks = (ticks, tps = 20) => {
  const tickCount = toFiniteNumber(ticks, 'ticks');
  const rate = toFiniteNumber(tps, 'tps');
  if (rate <= 0) throw new RangeError('tps must be greater than 0');
  let secs = Math.floor(tickCount / rate);
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
  const maxValue = toFiniteNumber(max, 'max');
  if (maxValue <= 0) throw new RangeError('max must be greater than 0');
  const barWidth = toNonNegativeInteger(width, 'width');
  if (barWidth === 0) return '';
  const filledCount = Math.max(0, Math.min(barWidth, Math.round((toFiniteNumber(value, 'value') / maxValue) * barWidth)));
  return toText(filled).repeat(filledCount) + toText(empty).repeat(barWidth - filledCount);
};

/**
 * Separator line.
 * e.g. separator(20) → "────────────────────"
 */
export const separator = (width = 40, char = '─') => toText(char).repeat(toNonNegativeInteger(width, 'width'));
