'use strict';
const { configuration, send, supabase, requireOwner, requestBody } = require('../lib/content-server');
const { pinConfiguration, editorPassword, normalizedEmail } = require('../lib/editor-pin');
module.exports = async (req, res) => {
  if (!['GET','POST','DELETE'].includes(req.method)) { res.setHeader('Allow','GET, POST, DELETE'); return send(res,405,{error:'Method not allowed.'}); }
  const config = configuration();
  if (!config.configured || !config.secretKey) return send(res,503,{error:'Editor access management is not configured.'});
  try {
    const owner = await requireOwner(req, config);
    if (req.method === 'GET') {
      const members = await supabase(config, '/rest/v1/content_editors?select=user_id,email,role&order=created_at.asc');
      return send(res,200,members.map(member => ({userId:member.user_id,email:member.email,role:member.role})));
    }
    const body = requestBody(req);
    if (req.method === 'DELETE') {
      if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(body.userId || '')) return send(res,400,{error:'Invalid editor.'});
      if (body.userId === owner.id) return send(res,400,{error:'You cannot remove your own owner access.'});
      const target = await supabase(config, '/rest/v1/content_editors?select=role&user_id=eq.' + encodeURIComponent(body.userId));
      if (target.some(member => member.role === 'owner')) return send(res,400,{error:'Owner access cannot be removed here.'});
      await supabase(config, '/rest/v1/content_editors?user_id=eq.' + encodeURIComponent(body.userId) + '&role=eq.editor', {method:'DELETE'});
      return send(res,200,{ok:true});
    }
    const email = normalizedEmail(body.email);
    if (!email) return send(res,400,{error:'Enter a valid email address.'});
    const pinConfig = pinConfiguration();
    if (!pinConfig.configured) return send(res,503,{error:'Editor PIN access is not configured.'});
    const existing = await supabase(config, '/rest/v1/content_editors?select=user_id,role&email=eq.' + encodeURIComponent(email));
    if (existing.some(member => member.role === 'owner')) return send(res,409,{error:'This person already has owner access.'});
    if (existing.length) return send(res,409,{error:'This person already has access.'});
    let user;
    for (let page=1; page<=20; page++) {
      const result = await supabase(config, '/auth/v1/admin/users?page=' + page + '&per_page=200');
      user = result.users?.find(candidate => candidate.email?.toLowerCase() === email);
      if (user || !result.users || result.users.length < 200) break;
    }
    const account = {email,password:editorPassword(email,pinConfig),email_confirm:true,app_metadata:{genys_pin_editor:true}};
    if (user) {
      const roles=await supabase(config,'/rest/v1/content_editors?select=role&user_id=eq.'+encodeURIComponent(user.id));
      if (roles.some(member=>member.role==='owner')) return send(res,409,{error:'This person already has owner access.'});
      if (!user.app_metadata?.genys_pin_editor) return send(res,409,{error:'This email belongs to an existing account. Configure it separately before granting PIN access.'});
      user=await supabase(config,'/auth/v1/admin/users/'+encodeURIComponent(user.id),{method:'PUT',body:JSON.stringify(account)});
    } else {
      user=await supabase(config,'/auth/v1/admin/users',{method:'POST',body:JSON.stringify(account)});
    }
    user=user.user || user;
    if (!user?.id) throw new Error('The account was not created.');
    await supabase(config, '/rest/v1/content_editors', {method:'POST',body:JSON.stringify({user_id:user.id,email,role:'editor'})});
    return send(res,200,{ok:true,userId:user.id});
  } catch (error) {
    const status = error.status >= 400 && error.status < 500 ? error.status : 502;
    return send(res,status,{error:status===502 ? 'The content service is unavailable. Please try again.' : error.message});
  }
};
