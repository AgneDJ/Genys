'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../data/section-tables.js'),'utf8'),context);const normalize=context.window.SectionTables.normalize;
const defaults={id:'table',lt:'Name',en:'Name EN',headers:[{lt:'Laikas',en:'Time'},{lt:'Veikla',en:'Activity'}],rows:[[{lt:'9:30',en:'9:30'},{lt:'Pamokos',en:'Lessons'}]],legacy_title:'title',legacy_headers:['h0','h1'],legacy_rows:[['time','activity']]};
test('legacy cell edits migrate with the editable table name',()=>{
  const value=normalize(defaults,{title:{lt:'Ankstesnis',en:'Legacy'},time:{lt:'11:00',en:'11 a.m.'},h1:{lt:'Programa',en:'Program'}});
  assert.equal(value.lt,'Ankstesnis');assert.equal(value.rows[0][0].lt,'11:00');assert.equal(value.headers[1].en,'Program');
});
test('saved structured tables preserve independently edited names and dimensions',()=>{
  const saved={lt:'New caption',en:'English caption',headers:[{lt:'A',en:'A'},{lt:'B',en:'B'},{lt:'C',en:'C'}],rows:[[{lt:'one',en:'one'}],[{lt:'two',en:'two'}]]};
  const value=normalize(defaults,{table:saved,title:{lt:'Old title'}});
  assert.equal(value.lt,'New caption');assert.equal(value.headers.length,3);assert.equal(value.rows.length,2);assert.equal(value.rows[0].length,3);assert.equal(value.rows[0][2].lt,'');
});
test('editor models cannot mutate the original static defaults',()=>{
  const before=JSON.stringify(defaults);const value=normalize(defaults);value.rows[0][0].lt='Changed';value.headers.push({lt:'Extra',en:'Extra'});assert.equal(JSON.stringify(defaults),before);
});
test('oversized stored tables are bounded and missing tables retain usable defaults',()=>{
  const huge={headers:Array.from({length:20},()=>({lt:'H',en:'H'})),rows:Array.from({length:300},()=>Array.from({length:20},()=>({lt:'Cell',en:'Cell'})))};
  const value=normalize(defaults,{table:huge});assert.equal(value.headers.length,12);assert.equal(value.rows.length,200);assert.equal(value.rows[0].length,12);
  assert.equal(normalize(defaults,{table:{headers:[],rows:[]}}).headers.length,2);
});
