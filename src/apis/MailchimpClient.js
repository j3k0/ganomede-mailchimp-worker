'use strict';

const urlEscape = require('url-escape-tag');
const BaseClient = require('./BaseClient');
const {MailchimpPayload} = require('../objects');

const toBase64 = (str) => Buffer.from(str, 'utf8').toString('base64');

class MailchimpClient extends BaseClient {
  constructor ({clientId, apiKey, dataCenter}) {
    super(`https://${dataCenter}.api.mailchimp.com/3.0`, {
      userAgent: clientId,
      headers: {'authorization': `Basic ${toBase64(`${clientId}:${apiKey}`)}`}
    });
  }

  subscribe (listId, request, callback) {
    const payload = new MailchimpPayload(request);
    this.apiCall('post', urlEscape`/lists/${listId}/members`, payload, callback);
  }
}

module.exports = MailchimpClient;
