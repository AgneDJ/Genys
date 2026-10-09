'use strict';
const { configuration, send } = require('../lib/content-server');
const { pinConfiguration } = require('../lib/editor-pin');
module.exports = (req, res) => {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return send(res, 405, { error: 'Method not allowed.' }); }
  const config = configuration();
  return send(res, 200, config.configured ? { configured: true, pinConfigured: Boolean(config.secretKey) && pinConfiguration().configured, url: config.url, publishableKey: config.publishableKey } : { configured: false });
};
