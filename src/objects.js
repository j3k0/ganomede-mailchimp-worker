'use strict';

const lodash = require('lodash');
const {GanomedeError} = require('./errors');

class SubscriptionRequest {
  constructor ({userId, email, from, metadata}) {
    this.userId = userId;
    this.email = email;
    this.from = from;
    this.metadata = metadata;
  }

  static fromEvent (event, {allowedFromValues} = {}) {
    const {type, from} = event;

    if (type !== 'CREATE')
      return new SubscriptionRequest.IgnoredEventError('`event.type` %j is ignored', type);

    if (allowedFromValues && !allowedFromValues.includes(from)) {
      return new SubscriptionRequest.IgnoredEventError(
        '`event.from` does not match any of allowed values %j',
        allowedFromValues
      );
    }

    const {userId, metadata} = event.data;
    const email = lodash.get(event, 'data.aliases.email');

    if (!email) {
      return new SubscriptionRequest.IgnoredEventError(
        '`event.data.aliases.email is malformed or missing (%j)',
        email
      );
    }

    return new SubscriptionRequest({
      userId,
      email,
      from,
      metadata
    });
  }
}

SubscriptionRequest.IgnoredEventError = class IgnoredEventError extends GanomedeError {};

class SubscriptionInfo {
  constructor ({type, listId, subscriptionId, G_VIA}) {
    this.type = type;
    this.listId = listId;
    this.subscriptionId = subscriptionId;
    this.G_VIA = G_VIA;
  }
}

class MailchimpPayload {
  constructor (subscriptionRequest) {
    this.email_address = subscriptionRequest.email;
    this.status = 'subscribed';
    this.merge_fields = {
      G_USERID: subscriptionRequest.userId,
      G_VIA: subscriptionRequest.from
    };
  }

  toSubscriptionInfo (mailchimpReply) {
    return new SubscriptionInfo({
      type: 'mailchimp',
      listId: mailchimpReply.list_id,
      subscriptionId: mailchimpReply.id,
      G_VIA: this.merge_fields.G_VIA
    });
  }

  detectProblems (mailchimpReply) {
    const requested = Object.keys(this.merge_fields);
    const created = Object.keys(mailchimpReply.merge_fields);
    const missing = [];
    const invalid = [];

    requested.forEach(field => {
      if (!created.includes(field))
        missing.push(field);
      else if (mailchimpReply.merge_fields[field] !== this.merge_fields[field])
        invalid.push(field);
    });

    return {missing, invalid};
  }
}

module.exports = {
  SubscriptionRequest,
  SubscriptionInfo,
  MailchimpPayload
};
