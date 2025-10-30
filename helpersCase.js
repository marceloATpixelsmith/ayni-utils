/* utils_case.js
   Locale-aware case helpers for UI Bakery + i18next.
   All functions accept an optional `locale`. If omitted, they’ll use `i18n.language` (if present) or 'en'.
*/



// js/helpersFormatting.js
window.AyniUtils = window.AyniUtils || {};
window.AyniUtils.case = {
  version: '2025.10.30a',
  toYmd(d){
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;
  }
};


const CASE = (() => {
  const getLng = (lng) =>
    lng || (typeof i18n !== 'undefined' && i18n.language) || 'en';

  const toStr = (v) => (v == null ? '' : String(v));

  function upper(value, locale) {
    const lng = getLng(locale);
    return toStr(value).toLocaleUpperCase(lng);
  }

  function lower(value, locale) {
    const lng = getLng(locale);
    return toStr(value).toLocaleLowerCase(lng);
  }

  // Capitalize first letter only: "evento" -> "Evento"
  function cap(value, locale) {
    const lng = getLng(locale);
    const s = toStr(value);
    if (!s) return s;
    return s.charAt(0).toLocaleUpperCase(lng) + s.slice(1);
  }

  // Title case (Unicode-aware). Options:
  // - preserveAcronyms: keep ALL-CAPS words as is (default true)
  // - smallWords: keep common short words lowercased (en/es) except at start/end (default false)
  // Title case (Unicode-aware).
// Options:
// - preserveAcronyms: keep ALL-CAPS words as is (default true)
// - smallWords: keep common short words lowercased (en/es) except at start/end (default true)
function title(value, locale, opts = {}) {
  const lng = getLng(locale);
  const s = toStr(value);
  if (!s) return s;

  const { preserveAcronyms = true, smallWords = true } = opts;

  const SMALL_EN = new Set([
    'a','an','the','and','or','for','nor','but','of','on','in','to','at','by','as','per','via'
  ]);
  const SMALL_ES = new Set([
    'y','o','u','de','del','al','la','las','el','los','en','con','sin','para','por','a'
  ]);

  const smallSet = smallWords
    ? (lng.startsWith('es') ? SMALL_ES : SMALL_EN)
    : null;

  const parts = s.split(/(\P{L}+)/u); // keep delimiters
  const wordIdxs = [];
  for (let i = 0; i < parts.length; i++) {
    const chunk = parts[i];
    if (chunk && !/\P{L}+/u.test(chunk)) wordIdxs.push(i);
  }

  let seenWords = 0;

  const out = parts.map((chunk) => {
    if (!chunk || /\P{L}+/u.test(chunk)) return chunk;

    const isFirst = seenWords === 0;
    seenWords++;

    if (preserveAcronyms && chunk.length > 1 &&
        chunk === chunk.toLocaleUpperCase(lng)) {
      return chunk;
    }

    const lowerChunk = chunk.toLocaleLowerCase(lng);

    // NEW RULE: keep small words lowercase everywhere EXCEPT the very first word
    if (smallSet && !isFirst && smallSet.has(lowerChunk)) {
      return lowerChunk;
    }

    return chunk[0].toLocaleUpperCase(lng) + chunk.slice(1).toLocaleLowerCase(lng);
  });

  return out.join('');
}



  // Apply a named style: 'upper' | 'lower' | 'cap' | 'title'
  function apply(value, style, locale, options) {
    switch ((style || '').toLowerCase()) {
      case 'upper': return upper(value, locale);
      case 'lower': return lower(value, locale);
      case 'cap':   return cap(value, locale);
      case 'title': return title(value, locale, options);
      default:      return toStr(value);
    }
  }

  // Match the casing of a reference string (handy when you want "Event"/"EVENT"/"event" to follow UI context)
  function caseOf(reference, value, locale) {
    const ref = toStr(reference);
    if (!ref) return toStr(value);
    const isUpper = ref === ref.toLocaleUpperCase(getLng(locale));
    const isLower = ref === ref.toLocaleLowerCase(getLng(locale));
    // crude "Cap" check: first letter upper, rest not all caps
    const isCap = !isUpper && !isLower && /^[\p{L}]/u.test(ref) &&
                  ref[0] === ref[0].toLocaleUpperCase(getLng(locale));
    if (isUpper) return upper(value, locale);
    if (isLower) return lower(value, locale);
    if (isCap)   return cap(value, locale);
    // default to title if mixed
    return title(value, locale);
  }

  return { upper, lower, cap, title, apply, caseOf };
})();
