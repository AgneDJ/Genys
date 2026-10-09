'use strict';
function configuration() {
  const url = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '';
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  let publicKeyAllowed = Boolean(publishableKey) && !publishableKey.startsWith('sb_secret_');
  try { if (publishableKey.split('.').length === 3 && JSON.parse(Buffer.from(publishableKey.split('.')[1], 'base64url').toString()).role !== 'anon') publicKeyAllowed = false; } catch { publicKeyAllowed = false; }
  return { url, publishableKey, secretKey, configured: /^https:\/\//.test(url) && publicKeyAllowed };
}
function send(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(status).json(body);
}
async function supabase(config, path, options = {}, userToken) {
  const key = userToken ? config.publishableKey : config.secretKey;
  const headers = { apikey: key, 'Content-Type': 'application/json', ...options.headers };
  if (userToken) headers.Authorization = 'Bearer ' + userToken;
  else if (!key.startsWith('sb_secret_')) headers.Authorization = 'Bearer ' + key;
  const response = await fetch(config.url + path, { ...options, headers, signal: AbortSignal.timeout(12000) });
  const raw = await response.text();
  let data; try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }
  if (!response.ok) {
    const error = new Error(data?.msg || data?.message || data?.error_description || 'Content service request failed.');
    error.status = response.status;
    throw error;
  }
  return data;
}
async function requireOwner(req, config) {
  const token = /^Bearer (.+)$/i.exec(req.headers.authorization || '')?.[1];
  if (!token) { const error = new Error('Please log in.'); error.status = 401; throw error; }
  let user; try { user = await supabase(config, '/auth/v1/user', {}, token); }
  catch { const error = new Error('Please log in again.'); error.status = 401; throw error; }
  if (!user?.id) { const error = new Error('Please log in again.'); error.status = 401; throw error; }
  const members = await supabase(config, '/rest/v1/content_editors?select=role&user_id=eq.' + encodeURIComponent(user.id));
  if (!members?.some(member => member.role === 'owner')) {
    const error = new Error('Only the owner can manage access.'); error.status = 403; throw error;
  }
  return user;
}
function requestBody(req) {
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { throw Object.assign(new Error('Invalid request.'), { status: 400 }); }
  if (!body || typeof body !== 'object' || JSON.stringify(body).length > 2048) throw Object.assign(new Error('Invalid request.'), { status: 400 });
  return body;
}
module.exports = { configuration, send, supabase, requireOwner, requestBody };
