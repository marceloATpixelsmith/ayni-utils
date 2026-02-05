// JS file: dateHelpers.js  (App-level or Page-level)
//
// HOW TO USE (UI Bakery):
//   // Date only:
//   formatDateLocal({{row.date}}, { locale: 'es-MX' })
//   formatDateLocal({{row.date}}, { locale: 'en-US', dateStyle: 'pretty' }) //→"Saturday July 4th, 2026"
//
//   // Single date+time with required phrasing ("at"/"a"):
//   formatDateTimeLocal({{row.start_at}}, { locale: 'en-US' })                 //→"7/6/2025 at 5:00pm"
//   formatDateTimeLocal({{row.start_at}}, { locale: 'es-MX' })                 //→"6/7/2025 a 5:00pm"
//   formatDateTimeLocal({{row.start_at}}, { locale: 'en-US', dateStyle: 'pretty' }) //→"Saturday July 4th, 2026 at 5:00pm"
//
//   // Ranges:
//   // same-day → EN "from 5:00pm - 7:00pm", ES "de 5:00pm a 7:00pm"
//   formatDateRangeLocal({{row.start_at}}, {{row.end_at}}, { locale: 'en-US' })
//   formatDateRangeLocal({{row.start_at}}, {{row.end_at}}, { locale: 'es-MX' })
//
//   // Ranges (PRETTY DATE STYLE):
//   formatDateRangeLocal({{row.start_at}}, {{row.end_at}}, { locale: 'en-US', dateStyle: 'pretty' }) //→"Saturday July 4th, 2026 from 5:00pm - 7:00pm"
//   formatDateRangeLocal({{row.start_at}}, {{row.end_at}}, { locale: 'es-MX', dateStyle: 'pretty' }) //→"Sábado 4 de julio de 2026 de 5:00pm a 7:00pm"
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

function _capitalizeFirst(s) {
  const txt = String(s || '');
  if (!txt) return '';
  return txt.charAt(0).toUpperCase() + txt.slice(1);
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

// ==========================
// PRETTY DATE
// EN: "Saturday July 4th, 2026"
// ES: "Sábado 4 de julio de 2026"
// ==========================

function _ordinalSuffixEN(dayNum) {
  const n = Number(dayNum);
  if (!Number.isFinite(n)) return '';
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

function _formatPrettyFull(ms, locale, tz) {
  const isEs = /^es(-|$)/i.test(locale);

  //GET WEEKDAY/MONTH/DAY/YEAR PARTS IN TARGET TZ
  const key = `${locale}|${tz}|prettyFull`;
  let dtf = _FMT_CACHE[key];
  if (!dtf) {
    dtf = Intl.DateTimeFormat(locale, {
      timeZone: tz,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    _FMT_CACHE[key] = dtf;
  }

  const parts = dtf.formatToParts(ms);

  let weekday = parts.find(p => p.type === 'weekday')?.value || '';
  let month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  const year = parts.find(p => p.type === 'year')?.value || '';

  //CAPITALIZE WEEKDAY (ES OFTEN COMES OUT LOWERCASE)
  weekday = _capitalizeFirst(weekday);

  //ES MONTHS ARE LOWERCASE BY CONVENTION; KEEP AS-IS
  //EN MONTHS ARE TITLECASE BY DEFAULT IN MOST LOCALES; KEEP AS-IS

  if (!weekday || !month || !day || !year) return '';

  if (!isEs) {
    //EN: "Saturday July 4th, 2026"
    const suf = _ordinalSuffixEN(day);
    return `${weekday} ${month} ${day}${suf}, ${year}`;
  }

  //ES: "Sábado 4 de julio de 2026"
  return `${weekday} ${day} de ${month} de ${year}`;
}

function _formatDateByStyle(ms, locale, tz, dateStyle) {
  return dateStyle === 'pretty'
    ? _formatPrettyFull(ms, locale, tz)
    : _formatNumericDate(ms, locale, tz);
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
 * → (OPTIONAL) "Saturday July 4th, 2026" | "Sábado 4 de julio de 2026" WITH { dateStyle:'pretty' }
 */
function formatDateLocal(input, options = {}) {
  if (input == null || input === '') return '';

  const locale = options.locale  || _DEFAULT_LOCALE;
  const tz     = options.timeZone || _DEFAULT_TZ;
  const dateStyle = options.dateStyle || 'numeric';

  const ms = _toEpochMs(input);
  if (ms == null) return '';

  return _formatDateByStyle(ms, locale, tz, dateStyle);
}

// ===============================
// PUBLIC: DATE + TIME (single)
// ===============================

/**
 * formatDateTimeLocal(input, options?)
 * EN → "7/6/2025 at 5:00pm"
 * ES → "6/7/2025 a 5:00pm"
 * PRETTY DATE (OPTION): "Saturday July 4th, 2026 at 5:00pm" | "Sábado 4 de julio de 2026 a 5:00pm"
 */
function formatDateTimeLocal(input, options = {}) {
  if (input == null || input === '') return '';

  const locale = options.locale  || _DEFAULT_LOCALE;
  const tz     = options.timeZone || _DEFAULT_TZ;
  const dateStyle = options.dateStyle || 'numeric';

  const ms = _toEpochMs(input);
  if (ms == null) return '';

  const dateStr = _formatDateByStyle(ms, locale, tz, dateStyle);
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
 * OPTIONS:
 *   - dateStyle: 'numeric' | 'pretty'   (DEFAULT 'numeric')
 *
 * Same-day (calendar day in tz):
 *   EN → "7/6/2025 from 5:00pm - 7:00pm"
 *   ES → "6/7/2025 de 5:00pm a 7:00pm"
 *
 * Same-day (PRETTY):
 *   EN → "Saturday July 4th, 2026 from 5:00pm - 7:00pm"
 *   ES → "Sábado 4 de julio de 2026 de 5:00pm a 7:00pm"
 *
 * Different days:
 *   EN → "6/7/2025 at 5:00pm to 7/7/2025 at 6:00am"
 *   ES → "7/6/2025 a las 5:00pm al 7/7/2025 a las 6:00am"
 *
 * Different days (PRETTY):
 *   EN → "Saturday July 4th, 2026 at 5:00pm to Sunday July 5th, 2026 at 6:00am"
 *   ES → "Sábado 4 de julio de 2026 a las 5:00pm al Domingo 5 de julio de 2026 a las 6:00am"
 */
function formatDateRangeLocal(startInput, endInput, options = {}) {
  if (!startInput || !endInput) return '';

  const locale = options.locale  || _DEFAULT_LOCALE;
  const tz     = options.timeZone || _DEFAULT_TZ;
  const dateStyle = options.dateStyle || 'numeric';

  const startMs = _toEpochMs(startInput);
  const endMs   = _toEpochMs(endInput);
  if (startMs == null || endMs == null) return '';

  const sameDay = _ymdInTZ(startMs, tz) === _ymdInTZ(endMs, tz);
  const isEs    = /^es(-|$)/i.test(locale);

  const sDate = _formatDateByStyle(startMs, locale, tz, dateStyle);
  const eDate = _formatDateByStyle(endMs,   locale, tz, dateStyle);
  const sTime = formatTimeCompact(startMs, { locale, timeZone: tz });
  const eTime = formatTimeCompact(endMs,   { locale, timeZone: tz });

  if (sameDay) {
    if (isEs) {
      // "6/7/2025 de 5:00pm a 7:00pm" OR "Sábado 4 de julio de 2026 de 5:00pm a 7:00pm"
      return `${sDate} de ${sTime} a ${eTime}`;
    }
    // EN: "7/6/2025 from 5:00pm - 7:00pm" OR "Saturday July 4th, 2026 from 5:00pm - 7:00pm"
    return `${sDate} from ${sTime} - ${eTime}`;
  } else {
    if (isEs) {
      // "7/6/2025 a las 5:00pm al 7/7/2025 a las 6:00am"
      // OR "Sábado 4 de julio de 2026 a las 5:00pm al Domingo 5 de julio de 2026 a las 6:00am"
      return `${sDate} a las ${sTime} al ${eDate} a las ${eTime}`;
    }
    // EN: "6/7/2025 at 5:00pm to 7/7/2025 at 6:00am"
    // OR "Saturday July 4th, 2026 at 5:00pm to Sunday July 5th, 2026 at 6:00am"
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
