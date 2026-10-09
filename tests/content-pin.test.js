'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm'), path=require('node:path');
const root=path.join(__dirname,'..');
function harness(options={}) {
  const calls=[]; const id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',SUPABASE_SECRET_KEY:'sb_secret_private',EDITOR_SHARED_PIN:'012345',EDITOR_AUTH_SECRET:'s'.repeat(32),...options.env};
  const globals={process:{env},Buffer,AbortSignal,fetch:async(url,init)=>{
    calls.push({url,init}); let data;
    if(url.includes('/rpc/')) data=options.limited?false:true;
    else if(url.includes('/content_editors?')) data=options.role==='revoked'?[]:[{user_id:id,email:'editor@example.com',role:options.role||'editor'}];
    else if(url.includes('/token?')) data={access_token:'user-session',refresh_token:'user-refresh',expires_in:3600,token_type:'bearer',user:{id,email:'editor@example.com'}};
    return {ok:true,text:async()=>JSON.stringify(data),json:async()=>data};
  }};
  const helper={...globals,module:{exports:{}}}; vm.runInNewContext(fs.readFileSync(path.join(root,'lib/content-server.js'),'utf8'),helper);
  const pin={...globals,module:{exports:{}},require:name=>name==='node:crypto'?require(name):helper.module.exports}; vm.runInNewContext(fs.readFileSync(path.join(root,'lib/editor-pin.js'),'utf8'),pin);
  const context={...globals,module:{exports:{}},require:name=>name.endsWith('editor-pin')?pin.module.exports:helper.module.exports}; vm.runInNewContext(fs.readFileSync(path.join(root,'api/content-login.js'),'utf8'),context);
  return {calls,pin:pin.module.exports,async invoke(body={email:'editor@example.com',pin:'012345'},method='POST'){
    const result={headers:{}}; const res={setHeader(k,v){result.headers[k]=v;},status(n){result.status=n;return this;},json(data){result.body=data;}};
    await context.module.exports({method,body,headers:{},socket:{remoteAddress:'127.0.0.1'}},res);return result;
  }};
}
test('approved email and shared PIN receive only the user session',async()=>{
  const h=harness(), r=await h.invoke(); assert.equal(r.status,200); assert.equal(r.body.access_token,'user-session');
  assert.equal(JSON.stringify(r.body).includes('sb_secret_private'),false); assert.equal(JSON.stringify(r.body).includes('012345'),false);
  const credentials=JSON.parse(h.calls.find(c=>c.url.includes('/token?')).init.body); assert.notEqual(credentials.password,'012345');
});
test('incorrect PIN, missing email, revoked email and owner email cannot use PIN login',async()=>{
  assert.equal((await harness().invoke({email:'editor@example.com',pin:'999999'})).status,401);
  assert.equal((await harness().invoke({email:'',pin:'012345'})).status,400);
  assert.equal((await harness({role:'revoked'}).invoke()).status,401);
  assert.equal((await harness({role:'owner'}).invoke()).status,401);
});
test('limiter runs before credentials and blocks token requests',async()=>{
  const h=harness({limited:true}), r=await h.invoke(); assert.equal(r.status,429); assert.equal(r.headers['Retry-After'],'900');
  assert.equal(h.calls.some(c=>c.url.includes('/token?')),false);
  const attempt=JSON.parse(h.calls[0].init.body); assert.match(attempt.attempt_key,/^[a-f0-9]{64}$/); assert.equal(attempt.attempt_limit,30);
});
test('configuration fails closed and derived passwords are stable per email',async()=>{
  assert.equal((await harness({env:{EDITOR_SHARED_PIN:''}}).invoke()).status,503);
  assert.equal((await harness({env:{EDITOR_AUTH_SECRET:'short'}}).invoke()).status,503);
  const p=harness().pin,c={secret:'s'.repeat(32)};
  assert.equal(p.editorPassword('Editor@example.com',c),p.editorPassword('editor@example.com',c));
  assert.notEqual(p.editorPassword('editor@example.com',c),p.editorPassword('other@example.com',c));
  assert.equal(p.matchesPin('12345','012345'),false);
});
