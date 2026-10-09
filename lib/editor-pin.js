'use strict';
const { createHmac, createHash, timingSafeEqual } = require('node:crypto');
const { supabase } = require('./content-server');
function pinConfiguration() {
  const pin = process.env.EDITOR_SHARED_PIN || '';
  const secret = process.env.EDITOR_AUTH_SECRET || '';
  return { pin, secret, configured: /^\d{6,12}$/.test(pin) && secret.length >= 32 };
}
function editorPassword(email, config) {
  return createHmac('sha256', config.secret).update('editor-password:' + email.toLowerCase()).digest('base64url') + '!aA1';
}
function matchesPin(value, expected) {
  const digest = text => createHash('sha256').update(String(text)).digest();
  return timingSafeEqual(digest(value), digest(expected));
}
function normalizedEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
async function consumeAttempt(req, email, config, pinConfig) {
  // Vercel overwrites X-Forwarded-For with the client IP. Local runs use the socket.
  const ip = process.env.VERCEL ? String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim() : req.socket?.remoteAddress || 'local';
  const key = value => createHmac('sha256', pinConfig.secret).update(value).digest('hex');
  for (const [identity, limit] of [['ip:' + ip,30], ['email:' + email,5]]) {
    const allowed = await supabase(config, '/rest/v1/rpc/content_login_attempt', {method:'POST',body:JSON.stringify({attempt_key:key(identity),attempt_limit:limit})});
    if (allowed !== true) throw Object.assign(new Error('Too many attempts. Please try again in 15 minutes.'), {status:429});
  }
}
module.exports = { pinConfiguration, editorPassword, matchesPin, normalizedEmail, consumeAttempt };
