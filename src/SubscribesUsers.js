'use strict';

const async = require('async');
const logger = require('./logger');
const {
  createAction,
  IgnoreAction,
  SubscribeAction
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

  process (event, callback) {
    const action = createAction(event);

    switch (action.constructor) {
      case SubscribeAction:
        async.waterfall([
          this.mailchimp.subscribe.bind(this.mailchimp, this.mailchimpListId, action),
          (subInfo, cb) => this.usermeta.write(
            action.userId,
            this.metaKey,
            JSON.stringify(subInfo),
            cb
          )
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
