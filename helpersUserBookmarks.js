


function jsonParseBookmark(data, name) {
  // FIND THE ROW FOR THIS BOOKMARK
  const row = (data).find(b => b.bookmark === name);

  // IF NO ROW OR EMPTY, RETURN AN EMPTY ARRAY
  if (!row || !row.value) {
    return [];
  }

  // TRY TO PARSE AS JSON, FALL BACK TO COMMA-SPLIT
  try {
    return JSON.parse(row.value);
  } catch {
    return row.value.split(',').map(v => Number(v.trim())).filter(Boolean);
  }
}


function toIntArray(v) {
  if (Array.isArray(v)) return v.map(n => Number(n)).filter(Number.isFinite);
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return [];
    try {
      const j = JSON.parse(s);
      return Array.isArray(j) ? j.map(Number).filter(Number.isFinite) : [];
    } catch {
      return s.split(',').map(x => Number(x.trim())).filter(Number.isFinite);
    }
  }
  return [];
}

// file name: bookmarks_utils.js  (any name)
// top-level function so it's globally callable in bindings

function toBookmarkValue(x) {
  // NULL/UNDEFINED → DB NULL
  if (x == null) return null;

  // ARRAY → JSON string (e.g., ["a","b"])
  if (Array.isArray(x)) return JSON.stringify(x);

  // STRING → if it's a JSON-encoded string, unwrap it; otherwise return as-is
  if (typeof x === 'string') {
    // normalize line breaks if you want (optional)
    // const s = x.replace(/\r?\n/g, '\n');
    try {
      const parsed = JSON.parse(x);
      if (typeof parsed === 'string') return parsed; // unwrap "hello" -> hello
    } catch (_) {/* not JSON, use as-is */}
    return x;
  }

  // EVERYTHING ELSE → toString
  return String(x);
}
