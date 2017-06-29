'use strict';

const assert = require('assert');
const urlEscape = require('url-escape-tag');
const BaseClient = require('./BaseClient');
const {MailchimpPayload, SubscriptionInfo} = require('../objects');
const {SubscribeAction, UpdateEmailAction} = require('../actions');
const logger = require('../logger');

const toBase64 = (str) => Buffer.from(str, 'utf8').toString('base64');

class MailchimpClient extends BaseClient {
  constructor ({clientId, apiKey, dataCenter}) {
    super(`https://${dataCenter}.api.mailchimp.com/3.0`, {
      userAgent: clientId,
      headers: {'authorization': `Basic ${toBase64(`${clientId}:${apiKey}`)}`}
    });
  }

  _createCallback (listId, payload, callback) {
    return (err, reply) => {
      if (err)
        return callback(err);

      const problems = payload.detectProblems(reply);
      if (problems.hasProblems)
        logger.warn(problems, `Problems detected with Merge Tags of mailchimp list ${listId}`);

      callback(null, payload.toSubscriptionInfo(reply));
    };
  }

  subscribe (listId, request, callback) {
    assert(request instanceof SubscribeAction);
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

  updateSubscription (subscription, action, callback) {
    assert(subscription instanceof SubscriptionInfo);
    assert(action instanceof UpdateEmailAction);
    assert(subscription.type === 'mailchimp');

    const path = `/lists/${subscription.listId}/members/${subscription.subscriptionId}`;
    const payload = new MailchimpPayload(action);
    const cb = this._createCallback(subscription.listId, payload, callback);

    // We do not update `status` to `subscribe`, since user may have unsubscribed
    // and changing that without his permission would not be too nice.
    assert(delete payload.status);

    this.apiCall('patch', path, payload, cb);
  }
}

module.exports = MailchimpClient;
