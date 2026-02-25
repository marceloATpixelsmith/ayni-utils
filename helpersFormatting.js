// JS file: dateHelpers.js  (App-level or Page-level)
//
// HOW TO USE (UI Bakery):
//
// DATE ONLY
// formatDateLocal({{row.date}}, { locale: 'en' })
// formatDateLocal({{row.date}}, { locale: 'es' })
//
// PRETTY (NO WEEKDAY)
// formatDateLocal({{row.date}}, { locale: 'en', dateStyle: 'pretty' })
// → "July 4th, 2026"
// formatDateLocal({{row.date}}, { locale: 'es', dateStyle: 'pretty' })
// → "4 de julio de 2026"
//
// PRETTY WITH WEEKDAY
// formatDateLocal({{row.date}}, { locale: 'en', dateStyle: 'prettyDay' })
// → "Saturday July 4th, 2026"
// formatDateLocal({{row.date}}, { locale: 'es', dateStyle: 'prettyDay' })
// → "Sábado 4 de julio de 2026"
//
// NOTES
// - dateStyle: 'numeric' | 'pretty' | 'prettyDay'
// - Locale passed in can be 'en'/'es' OR full tags like 'en-US'/'es-MX'
// - Locale & TZ only from options or browser
// - Intl formatters cached

// ========================
// DEFAULTS
// ========================

const _DEFAULT_LOCALE =
  (typeof navigator !== 'undefined' && navigator.language) || 'en-US';

const _DEFAULT_TZ =
  (typeof Intl !== 'undefined' &&
    Intl.DateTimeFormat().resolvedOptions().timeZone) ||
  'UTC';

const _FMT_CACHE = Object.create(null);

// ==========================
// NORMALIZATION UTILS
// ==========================

function _toEpochMs(input)
{
    if (input instanceof Date) return input.getTime();
    if (typeof input === 'number') return input < 1e12 ? input * 1000 : input;
    if (typeof input === 'string')
    {
        const parsed = Date.parse(input);
        return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
}

function _ymdInTZ(ms, tz)
{
    const parts = Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(ms);

    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;

    return y && m && d ? `${y}-${m}-${d}` : '';
}

function _capitalizeFirst(s)
{
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

//NORMALIZE LOCALE INPUT
//ACCEPTS: 'en' | 'es' | 'en-US' | 'es-MX' | ETC
//DEFAULTS: en -> en-US, es -> es-MX
function _normalizeLocale(locale)
{
    const raw =
        String(locale || _DEFAULT_LOCALE || 'en-US')
            .trim();

    const base =
        raw.toLowerCase();

    if (base === 'en') return 'en-US';
    if (base === 'es') return 'es-MX';

    //IF USER PASSES 'en_US' STYLE, NORMALIZE TO BCP-47
    if (raw.indexOf('_') !== -1)
    {
        return raw.replace(/_/g, '-');
    }

    return raw;
}

function _isEsLocale(locale)
{
    return /^es(-|$)/i.test(locale);
}

// ==========================
// NUMERIC DATE
// ==========================

function _formatNumericDate(ms, locale, tz)
{
    const parts = Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(ms);

    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value?.replace(/^0/, '');
    const d = parts.find(p => p.type === 'day')?.value?.replace(/^0/, '');

    if (!y || !m || !d) return '';

    const isEs = _isEsLocale(locale);
    return isEs ? `${d}/${m}/${y}` : `${m}/${d}/${y}`;
}

// ==========================
// PRETTY DATE HELPERS
// ==========================

function _ordinalSuffixEN(n)
{
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 13) return 'th';
    switch (n % 10)
    {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

// PRETTY WITHOUT WEEKDAY
// EN: "July 4th, 2026"
// ES: "4 de julio de 2026"
function _formatPretty(ms, locale, tz)
{
    const isEs = _isEsLocale(locale);

    const key = `${locale}|${tz}|pretty`;
    let dtf = _FMT_CACHE[key];
    if (!dtf)
    {
        dtf = Intl.DateTimeFormat(locale, {
            timeZone: tz,
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        _FMT_CACHE[key] = dtf;
    }

    const parts = dtf.formatToParts(ms);
    const day = Number(parts.find(p => p.type === 'day')?.value);
    const month = parts.find(p => p.type === 'month')?.value;
    const year = parts.find(p => p.type === 'year')?.value;

    if (!day || !month || !year) return '';

    if (!isEs)
    {
        return `${month} ${day}${_ordinalSuffixEN(day)}, ${year}`;
    }

    return `${day} de ${month} de ${year}`;
}

// PRETTY WITH WEEKDAY
// EN: "Saturday July 4th, 2026"
// ES: "Sábado 4 de julio de 2026"
function _formatPrettyDay(ms, locale, tz)
{
    const isEs = _isEsLocale(locale);

    const key = `${locale}|${tz}|prettyDay`;
    let dtf = _FMT_CACHE[key];
    if (!dtf)
    {
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

    let weekday = parts.find(p => p.type === 'weekday')?.value;
    const day = Number(parts.find(p => p.type === 'day')?.value);
    const month = parts.find(p => p.type === 'month')?.value;
    const year = parts.find(p => p.type === 'year')?.value;

    weekday = _capitalizeFirst(weekday);

    if (!weekday || !day || !month || !year) return '';

    if (!isEs)
    {
        return `${weekday} ${month} ${day}${_ordinalSuffixEN(day)}, ${year}`;
    }

    return `${weekday} ${day} de ${month} de ${year}`;
}

function _formatDateByStyle(ms, locale, tz, dateStyle)
{
    if (dateStyle === 'prettyDay') return _formatPrettyDay(ms, locale, tz);
    if (dateStyle === 'pretty') return _formatPretty(ms, locale, tz);
    return _formatNumericDate(ms, locale, tz);
}

// ===============================
// COMPACT TIME
// ===============================

function formatTimeCompact(input, options = {})
{
    if (input == null || input === '') return '';

    const locale = _normalizeLocale(options.locale || _DEFAULT_LOCALE);
    const tz = options.timeZone || _DEFAULT_TZ;

    const ms = _toEpochMs(input);
    if (ms == null) return '';

    const key = `${locale}|${tz}|timeCompact`;
    let dtf = _FMT_CACHE[key];
    if (!dtf)
    {
        dtf = Intl.DateTimeFormat(locale, {
            timeZone: tz,
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        _FMT_CACHE[key] = dtf;
    }

    const parts = dtf.formatToParts(ms);
    let hour = parts.find(p => p.type === 'hour')?.value.replace(/^0/, '');
    const min = parts.find(p => p.type === 'minute')?.value;
    const dp = parts.find(p => p.type === 'dayPeriod')?.value
        .toLowerCase()
        .replace(/\./g, '')
        .replace(/\s+/g, '');

    return `${hour}:${min}${dp.startsWith('p') ? 'pm' : 'am'}`;
}

// ===============================
// PUBLIC API
// ===============================

function formatDateLocal(input, options = {})
{
    if (input == null || input === '') return '';

    const locale = _normalizeLocale(options.locale || _DEFAULT_LOCALE);
    const tz = options.timeZone || _DEFAULT_TZ;
    const dateStyle = options.dateStyle || 'numeric';

    const ms = _toEpochMs(input);
    if (ms == null) return '';

    return _formatDateByStyle(ms, locale, tz, dateStyle);
}

function formatDateTimeLocal(input, options = {})
{
    if (input == null || input === '') return '';

    const locale = _normalizeLocale(options.locale || _DEFAULT_LOCALE);
    const tz = options.timeZone || _DEFAULT_TZ;
    const dateStyle = options.dateStyle || 'numeric';

    const ms = _toEpochMs(input);
    if (ms == null) return '';

    const dateStr = _formatDateByStyle(ms, locale, tz, dateStyle);
    const timeStr = formatTimeCompact(ms, { locale, timeZone: tz });

    const isEs = _isEsLocale(locale);
    return isEs ? `${dateStr} a ${timeStr}` : `${dateStr} at ${timeStr}`;
}

function formatDateRangeLocal(startInput, endInput, options = {})
{
    if (!startInput || !endInput) return '';

    const locale = _normalizeLocale(options.locale || _DEFAULT_LOCALE);
    const tz = options.timeZone || _DEFAULT_TZ;
    const dateStyle = options.dateStyle || 'numeric';

    const startMs = _toEpochMs(startInput);
    const endMs = _toEpochMs(endInput);
    if (startMs == null || endMs == null) return '';

    const sameDay = _ymdInTZ(startMs, tz) === _ymdInTZ(endMs, tz);
    const isEs = _isEsLocale(locale);

    const sDate = _formatDateByStyle(startMs, locale, tz, dateStyle);
    const eDate = _formatDateByStyle(endMs, locale, tz, dateStyle);
    const sTime = formatTimeCompact(startMs, { locale, timeZone: tz });
    const eTime = formatTimeCompact(endMs, { locale, timeZone: tz });

    if (sameDay)
    {
        return isEs
            ? `${sDate} de ${sTime} a ${eTime}`
            : `${sDate} from ${sTime} - ${eTime}`;
    }

    return isEs
        ? `${sDate} a las ${sTime} al ${eDate} a las ${eTime}`
        : `${sDate} at ${sTime} to ${eDate} at ${eTime}`;
}

// ==========================
// STRING UTIL
// ==========================

function CRtoBR(s)
{
    if (s == null) return '';
    return String(s).replace(/\r\n|\r|\n/g, '<br/>');
}

if (typeof module !== 'undefined')
{
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
//==============================
function parseStrictJSON(cleanMe)
{
    const txt = String(cleanMe ?? '')
        .replace(/^[\uFEFF\s]*```(?:json)?\s*/i, '')
        .replace(/```[\s\uFEFF]*$/i, '')
        .replace(/[\u200B-\u200D\u2060\u00A0]/g, '')
        .trim();
    return JSON.parse(txt);
}
