'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const ownerId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const editorId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
function harness(options = {}) {
  const calls = [];
  const env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', SUPABASE_SECRET_KEY: 'sb_secret_private', EDITOR_SHARED_PIN:'123456', EDITOR_AUTH_SECRET:'a'.repeat(32), ...options.env };
  const shared = { Buffer, AbortSignal, process: { env }, fetch: async (url, init) => {
    calls.push({url, init});
    let data;
    if (url.endsWith('/auth/v1/user')) data = {id:ownerId};
    else if (url.includes('user_id=eq.'+ownerId)) data = options.role === 'revoked' ? [] : [{role: options.role || 'owner'}];
    else if (url.includes('user_id=eq.')) data = [{role:options.targetRole || 'editor'}];
    else if (url.includes('email=eq.')) data = options.existing ? [{role:'editor'}] : [];
    else if (url.includes('/auth/v1/admin/users') && !init.method) data = {users:options.user ? [options.user] : []};
    else if (url.endsWith('/auth/v1/admin/users') || url.includes('/auth/v1/admin/users/')) data = {id:editorId};
    else if (url.includes('select=user_id,email,role')) data = [{user_id:ownerId,email:'owner@example.com',role:'owner'}];
    else data = null;
    return {ok:true,status:200,text:async()=>JSON.stringify(data)};
  }};
  const helperContext = { ...shared, module:{exports:{}} };
  vm.runInNewContext(fs.readFileSync(path.join(root,'lib/content-server.js'),'utf8'),helperContext);
  const pinContext={...shared,require:name=>name==='node:crypto'?require(name):helperContext.module.exports,module:{exports:{}}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'lib/editor-pin.js'),'utf8'),pinContext);
  const load = file => { const context={...shared,require:name=>name.endsWith('editor-pin')?pinContext.module.exports:helperContext.module.exports,module:{exports:{}}}; vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context); return context.module.exports; };
  const invoke = async (method='GET',body,token='test') => {
    const result={}; const res={setHeader(){},status(n){result.status=n;return this;},json(data){result.body=data;}};
    await load('api/content-editors.js')({method,body,headers:token?{authorization:'Bearer '+token}:{}},res);
    return result;
  };
  return {calls,invoke,helper:helperContext.module.exports,load};
}
test('anonymous, editor and revoked sessions cannot manage access',async()=>{
  assert.equal((await harness().invoke('GET',undefined,null)).status,401);
  assert.equal((await harness({role:'editor'}).invoke()).status,403);
  assert.equal((await harness({role:'revoked'}).invoke()).status,403);
});
test('owner can list editors but cannot remove any owner',async()=>{
  assert.equal((await harness().invoke()).status,200);
  assert.equal((await harness().invoke('DELETE',{userId:ownerId})).status,400);
  assert.equal((await harness({targetRole:'owner'}).invoke('DELETE',{userId:editorId})).status,400);
});
test('malformed JSON and invalid email are rejected',async()=>{
  assert.equal((await harness().invoke('POST','{')).status,400);
  assert.equal((await harness().invoke('POST',{email:'bad'})).status,400);
});
test('new editor receives immediate account and membership using exact email lookup',async()=>{
  const h=harness(); const result=await h.invoke('POST',{email:'ann_1@example.com'});
  assert.equal(result.status,200); assert.equal(result.body.ok,true);
  assert.ok(h.calls.some(c=>c.url.includes('email=eq.ann_1%40example.com')));
  assert.ok(h.calls.some(c=>c.url.endsWith('/rest/v1/content_editors') && c.init.method==='POST'));
});
test('existing editor cannot be added twice',async()=>{
  const h=harness({existing:true,user:{id:editorId,email:'editor@example.com'}});
  assert.equal((await h.invoke('POST',{email:'editor@example.com'})).status,409);
  assert.equal(h.calls.some(c=>c.init.method==='POST'),false);
});
test('existing membership cannot be replaced by adding the same email',async()=>{
  const h=harness({existing:true,user:{id:editorId,email:'editor@example.com',email_confirmed_at:'2026-10-01'}});
  assert.equal((await h.invoke('POST',{email:'editor@example.com'})).status,409);
  assert.equal(h.calls.some(c=>c.url.includes('/auth/v1/invite?')),false);
});
test('public configuration never exposes secret and rejects secret as public key',async()=>{
  const h=harness(); const result={}; const res={setHeader(){},status(n){result.status=n;return this;},json(data){result.body=data;}};
  await h.load('api/content-config.js')({method:'GET'},res);
  assert.equal(result.status,200); assert.equal(JSON.stringify(result.body).includes('sb_secret_private'),false);
  assert.equal(harness({env:{SUPABASE_PUBLISHABLE_KEY:'sb_secret_private'}}).helper.configuration().configured,false);
});

test('existing unrelated Auth account and any owner account are never overwritten',async()=>{
  const h=harness({user:{id:editorId,email:'editor@example.com'}});
  assert.equal((await h.invoke('POST',{email:'editor@example.com'})).status,409);
  assert.equal(h.calls.some(c=>c.init.method==='PUT'),false);
  const owner=harness({targetRole:'owner',user:{id:editorId,email:'editor@example.com',app_metadata:{genys_pin_editor:true}}});
  assert.equal((await owner.invoke('POST',{email:'editor@example.com'})).status,409);
  assert.equal(owner.calls.some(c=>c.init.method==='PUT'),false);
});
test('a revoked account created by this PIN editor can be added again',async()=>{
  const h=harness({user:{id:editorId,email:'editor@example.com',app_metadata:{genys_pin_editor:true}}});
  assert.equal((await h.invoke('POST',{email:'editor@example.com'})).status,200);
  assert.ok(h.calls.some(c=>c.init.method==='PUT'));
});
