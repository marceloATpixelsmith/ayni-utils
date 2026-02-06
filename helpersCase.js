/* utils_case.js
   LOCALE-AWARE CASE HELPERS FOR UI BAKERY + I18NEXT.
   FUNCTIONS:
   -upper:       ALL CAPS
   -lower:       all lowercase
   -cap:         Capitalize first letter only (does NOT lowercase rest)
   -title:       Title Case (WORD-BY-WORD), WITH APOSTROPHE-SAFE TOKENIZING
   -sentence:    Sentence case (LOWERCASE ALL, THEN CAPITALIZE FIRST LETTER FOUND)
   -apply:       APPLY A NAMED STYLE
   -caseOf:      MATCH CASING OF A REFERENCE STRING
*/

const CASE = (() =>
{
  const getLng = (lng) =>
    lng || (typeof i18n !== 'undefined' && i18n.language) || 'en';

  const toStr = (v) => (v == null ? '' : String(v));

  function upper(value, locale)
  {
    const lng = getLng(locale);
    return toStr(value).toLocaleUpperCase(lng);
  }

  function lower(value, locale)
  {
    const lng = getLng(locale);
    return toStr(value).toLocaleLowerCase(lng);
  }

  //CAPITALIZE FIRST CHARACTER ONLY (DOES NOT FORCE LOWERCASE ON THE REST)
  //EX: "eVENTO" -> "EVENTO"
  function cap(value, locale)
  {
    const lng = getLng(locale);
    const s = toStr(value);

    if (!s)
    {
      return s;
    }

    return s.charAt(0).toLocaleUpperCase(lng) + s.slice(1);
  }

  //SENTENCE CASE:
  //- LOWERCASE THE ENTIRE STRING
  //- CAPITALIZE THE FIRST LETTER FOUND (SKIPPING LEADING SPACES/PUNCTUATION)
  //EX: "don't DO THIS" -> "Don't do this"
  //EX: "¿QUÉ ES ESTO?" -> "¿Qué es esto?"
  function sentence(value, locale)
  {
    const lng = getLng(locale);
    const s = toStr(value);

    if (!s)
    {
      return s;
    }

    const lowerAll = s.toLocaleLowerCase(lng);

    //FIND FIRST LETTER AFTER ANY LEADING NON-LETTERS
    const m = lowerAll.match(/^[^\p{L}]*(\p{L})/u);

    if (!m)
    {
      return lowerAll;
    }

    //m[0] INCLUDES LEADING NON-LETTERS + FIRST LETTER, SO INDEX OF FIRST LETTER IS m[0].length - 1
    const firstLetterIndex = m[0].length - 1;

    return (
      lowerAll.slice(0, firstLetterIndex) +
      lowerAll.charAt(firstLetterIndex).toLocaleUpperCase(lng) +
      lowerAll.slice(firstLetterIndex + 1)
    );
  }

  //TITLE CASE (UNICODE-AWARE) WITH APOSTROPHE-SAFE WORD TOKENIZING.
  //OPTIONS:
  //-preserveAcronyms: KEEP ALL-CAPS WORDS AS IS (DEFAULT TRUE)
  //-smallWords: KEEP COMMON SHORT WORDS LOWERCASED (EN/ES) EXCEPT AT START (DEFAULT TRUE)
  function title(value, locale, opts = {})
  {
    const lng = getLng(locale);
    const s = toStr(value);

    if (!s)
    {
      return s;
    }

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

    //TOKENIZE INTO "WORD" VS "DELIMITERS"
    //WORD TOKEN ALLOWS INTERNAL APOSTROPHES: "don't", "l'amour", "rock’n’roll"
    //INCLUDES STRAIGHT AND CURLY APOSTROPHES: ' AND ’
    const TOKENS_RE = /(\p{L}+(?:['’]\p{L}+)*)|([^\p{L}]+)/gu;

    const tokens = [];
    for (const m of s.matchAll(TOKENS_RE))
    {
      tokens.push(m[1] || m[2] || '');
    }

    let seenWords = 0;

    const out = tokens.map((chunk) =>
    {
      //PASS THROUGH NON-WORD TOKENS
      if (!chunk || !/^\p{L}/u.test(chunk))
      {
        return chunk;
      }

      const isFirst = seenWords === 0;
      seenWords++;

      //PRESERVE ACRONYMS / ALL-CAPS WORDS
      if (preserveAcronyms && chunk.length > 1 &&
          chunk === chunk.toLocaleUpperCase(lng))
      {
        return chunk;
      }

      const lowerChunk = chunk.toLocaleLowerCase(lng);

      //KEEP SMALL WORDS LOWERCASE EXCEPT THE FIRST WORD
      if (smallSet && !isFirst && smallSet.has(lowerChunk))
      {
        return lowerChunk;
      }

      //STANDARD TITLE-CASE FOR THIS TOKEN
      return chunk[0].toLocaleUpperCase(lng) + chunk.slice(1).toLocaleLowerCase(lng);
    });

    return out.join('');
  }

  //APPLY A NAMED STYLE:
  //'upper' | 'lower' | 'cap' | 'title' | 'sentence'
  function apply(value, style, locale, options)
  {
    switch ((style || '').toLowerCase())
    {
      case 'upper':
        return upper(value, locale);

      case 'lower':
        return lower(value, locale);

      case 'cap':
        return cap(value, locale);

      case 'title':
        return title(value, locale, options);

      case 'sentence':
        return sentence(value, locale);

      default:
        return toStr(value);
    }
  }

  //MATCH THE CASING OF A REFERENCE STRING
  //-IF REFERENCE IS ALL UPPER -> upper()
  //-IF REFERENCE IS ALL LOWER -> lower()
  //-IF REFERENCE LOOKS LIKE "Cap" -> cap()
  //-ELSE -> title()
  function caseOf(reference, value, locale)
  {
    const lng = getLng(locale);
    const ref = toStr(reference);

    if (!ref)
    {
      return toStr(value);
    }

    const isUpper = ref === ref.toLocaleUpperCase(lng);
    const isLower = ref === ref.toLocaleLowerCase(lng);

    const isCap = !isUpper && !isLower && /^[\p{L}]/u.test(ref) &&
                  ref[0] === ref[0].toLocaleUpperCase(lng);

    if (isUpper)
    {
      return upper(value, locale);
    }

    if (isLower)
    {
      return lower(value, locale);
    }

    if (isCap)
    {
      return cap(value, locale);
    }

    return title(value, locale);
  }

  return { upper, lower, cap, title, sentence, apply, caseOf };
})();
