(() => {
  'use strict';
  const MAX_ROWS=200, MAX_COLUMNS=12;
  const cell=value=>({lt:typeof value?.lt==='string'?value.lt:'',en:typeof value?.en==='string'?value.en:''});
  function normalize(field, overrides={}) {
    const saved=overrides[field.id];
    const typed=saved&&Array.isArray(saved.headers)&&saved.headers.length&&Array.isArray(saved.rows)&&saved.rows.length;
    const source=typed?saved:field;
    const headers=(source.headers||[]).slice(0,MAX_COLUMNS).map((value,index)=>cell(typed?value:overrides[field.legacy_headers?.[index]]||value));
    if(!headers.length)headers.push({lt:'',en:''});
    const rows=(source.rows||[]).slice(0,MAX_ROWS).map((row,index)=>headers.map((_,column)=>cell(typed?row?.[column]:overrides[field.legacy_rows?.[index]?.[column]]||row?.[column])));
    if(!rows.length)rows.push(headers.map(()=>({lt:'',en:''})));
    const title=typed?saved:overrides[field.legacy_title]||field;
    return {lt:typeof title.lt==='string'?title.lt:'',en:typeof title.en==='string'?title.en:'',headers,rows};
  }
  function render(table,value,language='lt') {
    const doc=table.ownerDocument;
    const text=item=>String(item?.[language]||item?.lt||'');
    const title=text(value),children=[];
    if(title){const caption=doc.createElement('caption');caption.textContent=title;children.push(caption);}
    const head=doc.createElement('thead'),headRow=doc.createElement('tr');
    const headers=(value.headers||[]).slice(0,MAX_COLUMNS);
    headers.forEach(item=>{const th=doc.createElement('th');th.scope='col';th.textContent=text(item);headRow.append(th);});
    head.append(headRow);children.push(head);
    const body=doc.createElement('tbody');
    (value.rows||[]).slice(0,MAX_ROWS).forEach(row=>{const tr=doc.createElement('tr');headers.forEach((_,index)=>{const td=doc.createElement('td');td.textContent=text(row?.[index]);tr.append(td);});body.append(tr);});
    children.push(body);table.replaceChildren(...children);
  }
  window.SectionTables={normalize,render,MAX_ROWS,MAX_COLUMNS};
})();
