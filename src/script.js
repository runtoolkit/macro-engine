/**
 * Script utilities for safe multi-command parsing.
 *
 * Supports:
 * - semicolon-separated commands
 * - newline-separated commands
 * - quoted strings and escaping
 * - line comments starting with # at the beginning of a line or after whitespace
 */

function isSeparator(ch, separators) {
  return separators.includes(ch);
}

function stripComments(source, { allowComments = true, commentMarkers = ['#'] } = {}) {
  if (!allowComments) return source;

  let output = '';
  let quote = null;
  let escaped = false;
  let atLineStart = true;
  let sawWhitespaceOnly = true;

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];

    if (escaped) {
      output += ch;
      escaped = false;
      atLineStart = false;
      sawWhitespaceOnly = false;
      continue;
    }

    if (ch === '\\') {
      output += ch;
      escaped = true;
      atLineStart = false;
      sawWhitespaceOnly = false;
      continue;
    }

    if (quote) {
      output += ch;
      if (ch === quote) quote = null;
      if (ch === '\n' || ch === '\r') {
        atLineStart = true;
        sawWhitespaceOnly = true;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      output += ch;
      atLineStart = false;
      sawWhitespaceOnly = false;
      continue;
    }

    if (ch === '\n' || ch === '\r') {
      output += ch;
      atLineStart = true;
      sawWhitespaceOnly = true;
      continue;
    }

    if (/\s/.test(ch)) {
      output += ch;
      if (atLineStart) sawWhitespaceOnly = true;
      continue;
    }

    const prev = source[i - 1] ?? '';
    const isLineComment = commentMarkers.some((marker) => {
      if (!source.startsWith(marker, i)) return false;
      if (marker === '#' && !(atLineStart || sawWhitespaceOnly || /\s/.test(prev))) return false;
      return true;
    });

    if (isLineComment) {
      while (i < source.length && source[i] !== '\n' && source[i] !== '\r') i++;
      output += source[i] ?? '';
      atLineStart = true;
      sawWhitespaceOnly = true;
      continue;
    }

    output += ch;
    atLineStart = false;
    sawWhitespaceOnly = false;
  }

  return output;
}

export function splitScript(source, {
  separators = [';', '\n'],
  allowComments = true,
  commentMarkers = ['#'],
} = {}) {
  if (typeof source !== 'string') throw new TypeError('Script source must be a string');

  const cleaned = stripComments(source, { allowComments, commentMarkers });
  const segments = [];
  let current = '';
  let quote = null;
  let escaped = false;

  for (const ch of cleaned) {
    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      current += ch;
      escaped = true;
      continue;
    }

    if (quote) {
      current += ch;
      if (ch === quote) quote = null;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }

    if (isSeparator(ch, separators)) {
      const trimmed = current.trim();
      if (trimmed) segments.push(trimmed);
      current = '';
      continue;
    }

    current += ch;
  }

  if (escaped) current += '\\';
  if (quote) throw new SyntaxError('Unclosed quote in script source');

  const trimmed = current.trim();
  if (trimmed) segments.push(trimmed);
  return segments;
}

export function parseScript(source, options = {}) {
  return splitScript(source, options);
}
