'use strict';
const { configuration, send, supabase, requestBody } = require('../lib/content-server');
const { pinConfiguration, editorPassword, matchesPin, normalizedEmail, consumeAttempt } = require('../lib/editor-pin');
module.exports = async (req,res) => {
  if (req.method !== 'POST') { res.setHeader('Allow','POST'); return send(res,405,{error:'Method not allowed.'}); }
  const config=configuration(), pinConfig=pinConfiguration();
  if (!config.configured || !config.secretKey || !pinConfig.configured) return send(res,503,{error:'Editor PIN access is not configured.'});
  try {
    const body=requestBody(req), email=normalizedEmail(body.email);
    if (!email || typeof body.pin !== 'string' || body.pin.length > 12) return send(res,400,{error:'Enter your email and PIN.'});
    await consumeAttempt(req,email,config,pinConfig);
    if (!matchesPin(body.pin,pinConfig.pin)) return send(res,401,{error:'Incorrect email or PIN.'});
    const members=await supabase(config,'/rest/v1/content_editors?select=user_id,role,email&email=eq.'+encodeURIComponent(email));
    const member=members?.find(row=>row.role==='editor' && row.email.toLowerCase()===email);
    if (!member) return send(res,401,{error:'Incorrect email or PIN.'});
    const response=await fetch(config.url+'/auth/v1/token?grant_type=password', {method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({email,password:editorPassword(email,pinConfig)}),signal:AbortSignal.timeout(12000)});
    const data=await response.json();
    if (!response.ok || !data.access_token || data.user?.id !== member.user_id) return send(res,401,{error:'Incorrect email or PIN.'});
    return send(res,200,{access_token:data.access_token,refresh_token:data.refresh_token,expires_in:data.expires_in,token_type:data.token_type,user:{id:data.user.id,email:data.user.email}});
  } catch(error) {
    const status=error.status===400 || error.status===429 ? error.status : 502;
    if(status===429)res.setHeader('Retry-After','900');
    return send(res,status,{error:status===502?'The sign-in service is unavailable. Please try again.':error.message});
  }
};
