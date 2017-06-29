'use strict';

const async = require('async');
const lodash = require('lodash');
const logger = require('./logger');
const {SubscriptionInfo} = require('./objects');
const {
  createAction,
  IgnoreAction,
  SubscribeAction,
  UpdateEmailAction
} = require('./actions');

class SubscribesUsers {
  constructor ({
    newsletterName,
    mailchimpListId,
    usermetaClient,
    mailchimpClient,
    allowedFromValues
  }) {
    this.metaKey = ['newsletters', newsletterName].join('$');
    this.mailchimpListId = mailchimpListId;
    this.usermeta = usermetaClient;
    this.mailchimp = mailchimpClient;
    this.allowedFromValues = allowedFromValues;
  }

  readSubscription (userId, cb) {
    this.usermeta.read(userId, this.metaKey, (err, data) => {
      if (err)
        return cb(err);

      const info = lodash.get(data, `${userId}.${this.metaKey}`, false);

      return info
        ? cb(null, new SubscriptionInfo(JSON.parse(info)))
        : cb(new Error(`User \`${userId}\` has no subscription info saved`));
    });
  }

  saveSubscription (userId, subscriptionInfo, cb) {
    this.usermeta.write(
      userId,
      this.metaKey,
      JSON.stringify(subscriptionInfo),
      cb
    );
  }

  process (event, callback) {
    const action = createAction(event);

    switch (action.constructor) {
      case SubscribeAction:
        async.waterfall([
          this.mailchimp.subscribe.bind(this.mailchimp, this.mailchimpListId, action),
          this.saveSubscription.bind(this, action.userId)
        ], (err, metaReply) => callback(err));
        break;

      case UpdateEmailAction:
        async.waterfall([
          this.readSubscription.bind(this, action.userId),
          (subscription, cb) => this.mailchimp.updateSubscription(subscription, action, cb),
          this.saveSubscription.bind(this, action.userId)
        ], (err, metaReply) => callback(err));
        break;

      case IgnoreAction:
        logger.info({event, action}, `Event(id=${event.id}) resulted in ${action.constructor.name}: ${action.reason}`);
        setImmediate(callback, null, null);
        break;
    }
  }
}

module.exports = SubscribesUsers;
