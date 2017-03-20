'use strict';

const urlEscape = require('url-escape-tag');
const BaseClient = require('./BaseClient');
const {MailchimpPayload} = require('../objects');
const logger = require('../logger');

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

    this.apiCall('post', urlEscape`/lists/${listId}/members`, payload, (err, reply) => {
      if (err)
        return callback(err);

      const problems = payload.detectProblems(reply);
      if (problems.hasProblems)
        logger.warn(problems, `Problems detected with Merge Tags of mailchimp list ${listId}`);

      callback(null, payload.toSubscriptionInfo(reply));
    });
  }
}

module.exports = MailchimpClient;
