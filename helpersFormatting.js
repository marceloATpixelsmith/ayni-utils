// JS file: dateHelpers.js  (App-level or Page-level)
//
// HOW TO USE (UI Bakery):
//   // Date only:
//   formatDateLocal({{row.date}}, { locale: 'es-MX' })
//
//   // Single date+time with required phrasing ("at"/"a"):
//   formatDateTimeLocal({{row.start_at}}, { locale: 'en-US' })   // → "7/6/2025 at 5:00pm"
//   formatDateTimeLocal({{row.start_at}}, { locale: 'es-MX' })   // → "6/7/2025 a 5:00pm"
//
//   // Ranges:
//   // same-day → EN "from 5:00pm - 7:00pm", ES "de 5:00pm a 7:00pm"
//   formatDateRangeLocal({{row.start_at}}, {{row.end_at}}, { locale: 'en-US' })
//   formatDateRangeLocal({{row.start_at}}, {{row.end_at}}, { locale: 'es-MX' })
//
// NOTES
// - No reads of `state`, `steps`, `actions`, or other reactive globals.
// - Locale/timeZone come only from options or browser defaults.
// - Caches Intl.DateTimeFormat instances to avoid allocations.

// ========================
// DEFAULTS (module scope)
// ========================


const _DEFAULT_LOCALE =
  (typeof navigator !== 'undefined' && navigator.language) || 'en-US';

const _DEFAULT_TZ =
  (typeof Intl !== 'undefined' &&
    Intl.DateTimeFormat().resolvedOptions().timeZone) ||
  'UTC';

// Cache of Intl.DateTimeFormat by key
const _FMT_CACHE = Object.create(null);

// ==========================
// SMALL NORMALIZATION UTILS
// ==========================

function _toEpochMs(input) {
  if (input instanceof Date) return input.getTime();
  if (typeof input === 'number') return input < 1e12 ? input * 1000 : input;
  if (typeof input === 'string') {
    const parsed = Date.parse(input);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function _ymdInTZ(ms, tz) {
  const parts = Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(ms);
  const y = parts.find(p => p.type === 'year')?.value;
  const m = parts.find(p => p.type === 'month')?.value;
  const d = parts.find(p => p.type === 'day')?.value;
  return y && m && d ? `${y}-${m}-${d}` : '';
}

// ==========================
// NUMERIC DATE "M/D/YYYY" or "D/M/YYYY"
// ==========================

function _formatNumericDate(ms, locale, tz) {
  // Build YYYY,MM,DD once and reorder
  const parts = Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(ms);
  const y = parts.find(p => p.type === 'year')?.value;
  const m = parts.find(p => p.type === 'month')?.value?.replace(/^0/, '') || '';
  const d = parts.find(p => p.type === 'day')?.value?.replace(/^0/, '') || '';
  if (!y || !m || !d) return '';

  // For Spanish (es-*): D/M/YYYY; otherwise default EN: M/D/YYYY
  const isEs = /^es(-|$)/i.test(locale);
  return isEs ? `${d}/${m}/${y}` : `${m}/${d}/${y}`;
}

// ===============================
// COMPACT TIME UTILITY (6:00pm)
// ===============================

/**
 * formatTimeCompact(input, options)
 *   → "6:00pm" | "9:15am"
 *   - No leading zero in hour
 *   - No spaces/dots before/inside AM/PM
 *   - Lowercase "am"/"pm"
 */
function formatTimeCompact(input, options = {}) {
  if (input == null || input === '') return '';

  const locale = options.locale  || _DEFAULT_LOCALE;
  const tz     = options.timeZone || _DEFAULT_TZ;
  const sec    = !!options.seconds;

  const ms = _toEpochMs(input);
  if (ms == null) return '';

  const key = `${locale}|${tz}|timeParts|sec:${sec}`;
  let dtf = _FMT_CACHE[key];
  if (!dtf) {
    dtf = Intl.DateTimeFormat(locale, {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      ...(sec ? { second: '2-digit' } : {}),
      hour12: true
    });
    _FMT_CACHE[key] = dtf;
  }

  const parts = dtf.formatToParts(ms);
  let hour   = parts.find(p => p.type === 'hour')?.value || '';
  const min  = parts.find(p => p.type === 'minute')?.value || '';
  const secv = sec ? (parts.find(p => p.type === 'second')?.value || '') : '';
  const dpRaw = (parts.find(p => p.type === 'dayPeriod')?.value || '');
  // Normalize dp: remove dots/spaces and lowercase
  const dp = dpRaw.toLowerCase().replace(/\./g, '').replace(/\s+/g, '');
  const ampm = /^p/.test(dp) ? 'pm' : 'am';

  // Remove leading zero from hour
  hour = hour.replace(/^0(\d)$/, '$1');

  return sec ? `${hour}:${min}:${secv}${ampm}` : `${hour}:${min}${ampm}`;
}

// ===============================
// PUBLIC: DATE ONLY
// ===============================

/**
 * formatDateLocal(input, options?)
 * → "7/6/2025" (en) | "6/7/2025" (es)
 */
function formatDateLocal(input, options = {}) {
  if (input == null || input === '') return '';

  const locale = options.locale  || _DEFAULT_LOCALE;
  const tz     = options.timeZone || _DEFAULT_TZ;

  const ms = _toEpochMs(input);
  if (ms == null) return '';

  return _formatNumericDate(ms, locale, tz);
}

// ===============================
// PUBLIC: DATE + TIME (single)
// ===============================

/**
 * formatDateTimeLocal(input, options?)
 * EN → "7/6/2025 at 5:00pm"
 * ES → "6/7/2025 a 5:00pm"
 */
function formatDateTimeLocal(input, options = {}) {
  if (input == null || input === '') return '';

  const locale = options.locale  || _DEFAULT_LOCALE;
  const tz     = options.timeZone || _DEFAULT_TZ;

  const ms = _toEpochMs(input);
  if (ms == null) return '';

  const dateStr = _formatNumericDate(ms, locale, tz);
  const timeStr = formatTimeCompact(ms, { locale, timeZone: tz });

  const isEs = /^es(-|$)/i.test(locale);
  // Single datetime: ES uses "a", EN uses "at"
  return isEs ? `${dateStr} a ${timeStr}` : `${dateStr} at ${timeStr}`;
}

// =====================================
// PUBLIC: DATE RANGE WITH RULED WORDING
// =====================================

/**
 * formatDateRangeLocal(startInput, endInput, options?)
 *
 * Same-day (calendar day in tz):
 *   EN → "7/6/2025 from 5:00pm - 7:00pm"
 *   ES → "6/7/2025 de 5:00pm a 7:00pm"
 *
 * Different days:
 *   EN → "6/7/2025 at 5:00pm to 7/7/2025 at 6:00am"
 *   ES → "7/6/2025 a las 5:00pm al 7/7/2025 a las 6:00am"
 */
function formatDateRangeLocal(startInput, endInput, options = {}) {
  if (!startInput || !endInput) return '';

  const locale = options.locale  || _DEFAULT_LOCALE;
  const tz     = options.timeZone || _DEFAULT_TZ;

  const startMs = _toEpochMs(startInput);
  const endMs   = _toEpochMs(endInput);
  if (startMs == null || endMs == null) return '';

  const sameDay = _ymdInTZ(startMs, tz) === _ymdInTZ(endMs, tz);
  const isEs    = /^es(-|$)/i.test(locale);

  const sDate = _formatNumericDate(startMs, locale, tz);
  const eDate = _formatNumericDate(endMs,   locale, tz);
  const sTime = formatTimeCompact(startMs, { locale, timeZone: tz });
  const eTime = formatTimeCompact(endMs,   { locale, timeZone: tz });

  if (sameDay) {
    if (isEs) {
      // "6/7/2025 de 5:00pm a 7:00pm"
      return `${sDate} de ${sTime} a ${eTime}`;
    }
    // EN: "7/6/2025 from 5:00pm - 7:00pm"
    return `${sDate} from ${sTime} - ${eTime}`;
  } else {
    if (isEs) {
      // "7/6/2025 a las 5:00pm al 7/7/2025 a las 6:00am"
      return `${sDate} a las ${sTime} al ${eDate} a las ${eTime}`;
    }
    // EN: "6/7/2025 at 5:00pm to 7/7/2025 at 6:00am"
    return `${sDate} at ${sTime} to ${eDate} at ${eTime}`;
  }
}

// ==========================
// SMALL STRING CONVENIENCE
// ==========================

function CRtoBR(s) {
  if (s == null) return '';
  return String(s).replace(/\r\n|\r|\n/g, '<br/>');
}

// Export (if needed)
if (typeof module !== 'undefined') {
  module.exports = {
    formatDateLocal,
    formatDateTimeLocal,
    formatDateRangeLocal,
    formatTimeCompact,
    CRtoBR
  };
}

//==============================
//parseStrictJson(cleanMe) -> object
//CLEAN REMNANTS (FENCES/ZERO-WIDTHS) THEN JSON.PARSE
//==============================
function parseStrictJSON(cleanMe)
{
    const txt = String(cleanMe ?? '')
        .replace(/^[\uFEFF\s]*```(?:json)?\s*/i, '')   //REMOVE ```json
        .replace(/```[\s\uFEFF]*$/i, '')              //REMOVE ```
        .replace(/[\u200B-\u200D\u2060\u00A0]/g, '')  //ZERO-WIDTH & NBSP
        .trim();
    return JSON.parse(txt);
}
