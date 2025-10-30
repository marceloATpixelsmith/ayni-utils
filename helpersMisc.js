

function mapLookup(items, locale) {
  return (items || []).map(u => ({
    value: u.id,
    title: locale === 'en' ? u.title_en : u.title_es,
    color: u.color_code,
    icon: u.icon
  }));
}



function emailFromUsersById(users, id, idKey = 'id', emailKey = 'email') {
  // If id is null/undefined → return null
  if (id == null) return "(Unkown)";

  const uid = Number(id);

  // If users isn't an array or id isn't a finite number → return empty string
  if (!Array.isArray(users) || !Number.isFinite(uid)) return '';

  const hit = users.find(u => Number(u[idKey]) === uid);
  return (hit && hit[emailKey]) || '';
}



/**
 * =========================================================================================
 * FUNCTION: getBrowserBlock
 * PURPOSE:
 *     RETURNS BROWSER AND USER ENVIRONMENT INFO FOR LOGGING OR EMAIL NOTIFICATIONS.
 *     IF format = FALSE  → RETURNS A PLAIN OBJECT
 *     IF format = TRUE   → RETURNS AN HTML TABLE STRING
 *
 * USAGE:
 *     const info = getBrowserBlock();                    // RETURNS OBJECT
 *     const html = getBrowserBlock(true);                // RETURNS HTML STRING
 *     const html = getBrowserBlock(true, errObject);     // RETURNS HTML INCLUDING ERROR INFO
 * =========================================================================================
 */
function getBrowserBlock(format = false, errParam = null) {

  //======================================
  // SAFE ENVIRONMENT CHECKS
  //======================================
  const hasWindow = typeof window !== 'undefined' && window !== null;
  const hasNavigator = hasWindow && typeof window.navigator !== 'undefined' && window.navigator !== null;
  const hasDocument = hasWindow && typeof window.document !== 'undefined' && window.document !== null;

  //======================================
  // SAFE GETTER
  //======================================
  const safeGet = (fn, fallback = null) => {
    try {
      const v = fn();
      return typeof v === 'undefined' ? fallback : v;
    } catch (_) {
      return fallback;
    }
  };

  //======================================
  // SHORTCUT REFERENCES
  //======================================
  const nav = hasNavigator ? window.navigator : {};
  const scr = hasWindow && typeof window.screen !== 'undefined' ? window.screen : {};
  const loc = hasWindow && typeof window.location !== 'undefined' ? window.location : null;
  const conn = safeGet(() => (nav.connection || nav.mozConnection || nav.webkitConnection), null);

  //======================================
  // BUILD BASE OBJECT
  //======================================
  const block = {
    error: errParam ?? null,
    userAgent: safeGet(() => nav.userAgent, null),
    language: safeGet(() => nav.language || (Array.isArray(nav.languages) && nav.languages[0]) || null, null),
    platform: safeGet(() => nav.platform, null),
    hardwareConcurrency: safeGet(() => nav.hardwareConcurrency ?? null, null),
    deviceMemory: safeGet(() => (typeof nav.deviceMemory !== 'undefined' ? nav.deviceMemory : null), null),
    connection: conn
      ? {
          effectiveType: safeGet(() => conn.effectiveType ?? null, null),
          downlink: safeGet(() => conn.downlink ?? null, null),
          rtt: safeGet(() => conn.rtt ?? null, null)
        }
      : null,
    screen: scr && typeof scr.width !== 'undefined'
      ? {
          width: safeGet(() => scr.width, null),
          height: safeGet(() => scr.height, null),
          pixelRatio: safeGet(() => (hasWindow ? window.devicePixelRatio : null), null)
        }
      : null,
    timezone: safeGet(() => (typeof Intl !== 'undefined' && Intl.DateTimeFormat
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : null), null),
    href: safeGet(() => (loc && loc.href ? loc.href : null), null),
    pathname: safeGet(() => (loc && loc.pathname ? loc.pathname : null), null),
    referrer: safeGet(() => (hasDocument ? document.referrer || null : null), null),
    timestamp_utc: new Date().toISOString()
  };

  //======================================
  // IF FORMAT = FALSE, RETURN OBJECT
  //======================================
  if (!format) return block;

  //======================================
  // HELPER: HTML ESCAPER
  //======================================
  const esc = (v) => String(v ?? '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');

  //======================================
  // HELPER: FLATTEN OBJECT TO DOT-PATHS
  //======================================
  const flatten = (obj, prefix = '', out = {}) => {
    if (obj === null || typeof obj !== 'object') {
      out[prefix || 'value'] = obj;
      return out;
    }
    const isArr = Array.isArray(obj);
    for (const k in obj) {
      const path = prefix ? `${prefix}.${isArr ? `[${k}]` : k}` : k;
      const val = obj[k];
      if (val !== null && typeof val === 'object') {
        flatten(val, path, out);
      } else {
        out[path] = val;
      }
    }
    return out;
  };

  //======================================
  // BUILD TABLE ROWS
  //======================================
  const flat = flatten(block);
  const rows = Object.keys(flat).map((k) => {
    let v = flat[k];
    if (typeof v === 'undefined') v = null;
    if (typeof v === 'object' && v !== null) {
      try {
        v = JSON.stringify(v);
      } catch (_) {
        v = '[object]';
      }
    }
    return `<tr>
      <td style="padding:8px;border:1px solid #ddd;font-weight:600;vertical-align:top;">${esc(k)}</td>
      <td style="padding:8px;border:1px solid #ddd;vertical-align:top;word-break:break-word;">${esc(String(v))}</td>
    </tr>`;
  }).join('');

  //======================================
  // BUILD FINAL HTML TABLE
  //======================================
  const html = `
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;max-width:800px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.4;">
  <thead>
    <tr>
      <th align="left" style="padding:10px;border:1px solid #bbb;background:#f2f2f2;">VARIABLE</th>
      <th align="left" style="padding:10px;border:1px solid #bbb;background:#f2f2f2;">VALUE</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
</table>`.trim();

  //======================================
  // RETURN HTML STRING
  //======================================
  return html;
}

//======================================
// OPTIONAL GLOBAL EXPORTS
//======================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getBrowserBlock };
}
if (typeof window !== 'undefined') {
  window.getBrowserBlock = getBrowserBlock;
}




//----INTERNALS----

//SAFEKEYNORMALIZATION(STRINGIFY+TRIM)
function _toKey(v)
{
    if(v===null||v===undefined) { return ''; }
    return String(v).trim();
}

//SUPPORTSDEEPPATHSLIKE"user.id"OR"meta.registration_id"
function _getAtPath(obj, path)
{
    if(!obj||!path) { return undefined; }
    return path.split('.').reduce((o,k)=> (o==null?undefined:o[k]), obj);
}

//FINDSTABLEINDEXBYID:RETURNS0-BASEDINDEXOR-1IFNOTFOUND
function findTableIndexById(rows, id, keyPath='id')
{
    //NORMALIZEINPUTS
    if(!Array.isArray(rows)) { return -1; }

    const target=_toKey(id);

    for(let i=0;i<rows.length;i++)
    {
        const val=_getAtPath(rows[i], keyPath);
        if(_toKey(val)===target)
        {
            return i;
        }
    }
    return -1;
}
