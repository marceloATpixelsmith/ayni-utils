

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
