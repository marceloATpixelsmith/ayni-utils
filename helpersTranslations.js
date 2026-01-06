//======================================
//HELPERS: TRANSLATIONS (APP-LEVEL JS FILE)
//EXPOSES: window.helpersTranslations  (usable from any JS step)
//======================================


//================== CONSTANTS/SMALL HELPERS ==================
const __HT_SEP = '|';
const __HT_isRef = function(s) { return typeof s === 'string' && s.includes('$t('); };
const __HT_deepClone = function(obj) { return JSON.parse(JSON.stringify(obj)); };

//================== PIPE SPLITTER(KEEPS $t(...) INTACT) ==================
function splitBundle(src, sep = __HT_SEP)
{
  const out = { en:{}, es:{} };
  (function walk(obj, dstEn, dstEs)
  {
    for (const k of Object.keys(obj || {}))
    {
      const v = obj[k];
      if (v && typeof v === 'object' && !Array.isArray(v))
      {
        dstEn[k] = {};
        dstEs[k] = {};
        walk(v, dstEn[k], dstEs[k]);
        continue;
      }
      if (typeof v === 'string')
      {
        if (__HT_isRef(v))
        {
          dstEn[k] = v; dstEs[k] = v;
        }
        else
        {
          const parts = v.split(sep);
          const left  = (parts[0] ?? '').trim();
          const right = (parts[1] ?? parts[0] ?? '').trim();
          dstEn[k] = left; dstEs[k] = right;
        }
      }
      else
      {
        dstEn[k] = v; dstEs[k] = v;
      }
    }
  })(src, out.en, out.es);
  return out;
}

//================== INLINE $t(...) RESOLVER(POST-INIT) ==================
function expandInlineRefsForLang(i18nInstance, lang, tree)
{
  const t = i18nInstance.getFixedT(lang);
  const REF_RE = /\$t\(\s*([^)]+?)\s*\)/g;
  (function walk(obj)
  {
    for (const k of Object.keys(obj || {}))
    {
      const v = obj[k];
      if (v && typeof v === 'object' && !Array.isArray(v)) { walk(v); continue; }
      if (typeof v === 'string' && v.includes('$t('))
      {
        let prev, curr = v;
        for (let i = 0; i < 5; i++)
        {
          prev = curr;
          curr = curr.replace(REF_RE, function(_m, key)
          {
            return t(String(key || '').trim(), { interpolation:{ skipOnVariables:true } });
          });
          if (curr === prev) { break; }
        }
        obj[k] = curr;
      }
    }
  })(tree);
  return tree;
}

//================== AUTO-CASE(EN: TITLE CASE, ES: SENTENCE CASE) ==================
function titleCaseEN(s)
{
  const parts = String(s).split(/(\s+|[-/]|[“”"‘’'(){}\[\]:;,.!?]+)/);
  const small = new Set(['a','an','and','as','at','but','by','for','in','nor','of','on','or','per','the','to','vs','via']);
  return parts.map(function(tok, idx, arr)
  {
    if (tok === '' || /^\s+$/.test(tok) || /[-/“”"‘’'(){}\[\]:;,.!?]/.test(tok)) { return tok; }
    if (/[A-Z]/.test(tok)) { return tok; }
    const low = tok.toLowerCase();
    const lastIndex = arr.length - 1;
    const isEdge = (function(){
      let left = idx - 1; while (left >= 0 && (/^\s+$/.test(arr[left]) || /[-/“”"‘’'(){}\[\]:;,.!?]/.test(arr[left]))) left--;
      let right = idx + 1; while (right <= lastIndex && (/^\s+$/.test(arr[right]) || /[-/“”"‘’'(){}\[\]:;,.!?]/.test(arr[right]))) right++;
      return (left < 0 || right > lastIndex);
    })();
    if (!isEdge && small.has(low)) { return low; }
    return low.charAt(0).toUpperCase() + low.slice(1);
  }).join('');
}

function sentenceCaseES(s)
{
  const str = String(s);
  const m = str.match(/^(\s*[¿¡]?\s*[«“"]?\s*)(.*)$/u);
  if (!m) { return str; }
  const pre  = m[1] || '';
  const rest = m[2] || '';
  const i = rest.search(/\p{L}/u);
  if (i === -1) { return pre + rest; }
  const head = rest.slice(0, i);
  const first = rest.charAt(i).toUpperCase();
  const tail = rest.slice(i + 1).replace(/(\p{L}[\p{L}\p{M}]*)/gu, function(word)
  {
    if (/[A-ZÁÉÍÓÚÜÑ]/.test(word)) { return word; }
    return word.toLowerCase();
  });
  return pre + head + first + tail;
}

//================== TRANSFORM ONLY TEXT OUTSIDE {{...}} AND <...> ==================
function transformOutsidePlaceholders(s, transformFn)
{
  const str = String(s);
  const re = /({{[^}]+}}|<[^>]+>)/g;
  let out = '', last = 0, m;
  while ((m = re.exec(str)))
  {
    out += transformFn(str.slice(last, m.index));
    out += m[0];
    last = m.index + m[0].length;
  }
  out += transformFn(str.slice(last));
  return out;
}

//================== AUTO-CASE TREE ==================
function autoCase(lang, tree)
{
  const apply = function(txt)
  {
    const fn = (lang === 'en') ? titleCaseEN : sentenceCaseES;
    return transformOutsidePlaceholders(txt, function(segment){ return fn(segment); });
  };

  (function walk(node)
  {
    if (Array.isArray(node))
    {
      for (let i = 0; i < node.length; i++)
      {
        const v = node[i];
        if (v && typeof v === 'object') { walk(v); }
        else if (typeof v === 'string' && !v.includes('$t(')) { node[i] = apply(v); }
      }
      return;
    }
    for (const k of Object.keys(node || {}))
    {
      const v = node[k];
      if (v && typeof v === 'object') { walk(v); continue; }
      if (typeof v !== 'string') { continue; }
      if (v.includes('$t('))     { continue; }
      node[k] = apply(v);
    }
  })(tree);

  return tree;
}

//================== FULL PIPELINE: SPLIT → EXPAND $t → AUTO-CASE ==================
function processBundle(i18nInstance, srcBundle, opts)
{
  const cfg = Object.assign({ sep:__HT_SEP, autoCase:true }, (opts || {}));
  const split = splitBundle(srcBundle, cfg.sep);
  const enTree = __HT_deepClone(split.en);
  const esTree = __HT_deepClone(split.es);
  expandInlineRefsForLang(i18nInstance, 'en', enTree);
  expandInlineRefsForLang(i18nInstance, 'es', esTree);
  if (cfg.autoCase)
  {
    autoCase('en', enTree);
    autoCase('es', esTree);
  }
  return { en:enTree, es:esTree };
}


//=========================================
// GET BROWSER LOCALE (EN/ES ONLY)
// RETURNS "en" OR "es"
//=========================================
function getBrowserLocale()
{
  const nav = (typeof navigator !== 'undefined') ? navigator : null;

  const raw =
    (
      nav?.language
      || (Array.isArray(nav?.languages) && nav.languages[0])
      || ''
    )
      .toString()
      .trim()
      .toLowerCase();

  //HANDLE "es-MX" ETC
  const two = raw.slice(0, 2);

  return (two === 'es') ? 'es' : 'en';
}
