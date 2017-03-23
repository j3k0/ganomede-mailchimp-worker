'use strict';

const lodash = require('lodash');
const {GanomedeError} = require('./errors');
const resolveLocation = require('./resolve-location');
const {hasOwnProperty} = require('./utils');

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

    const {userId} = event.data;
    const metadata = lodash.get(event, 'data.metadata', {});
    const email = lodash.get(event, 'data.aliases.email');
    const newsletter = lodash.get(event, 'data.metadata.newsletter', true);

    if (!email) {
      return new SubscriptionRequest.IgnoredEventError(
        '`event.data.aliases.email` is malformed or missing (%j)',
        email
      );
    }

    if (!newsletter) {
      return new SubscriptionRequest.IgnoredEventError(
        '`event.data.metadata.newsletter` is false'
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

const safeAssign = (dst, dstProp, src, srcProp) => {
  if (src && hasOwnProperty(src, srcProp))
    dst[dstProp] = src[srcProp];
};

class MailchimpPayload {
  constructor (subscriptionRequest) {
    this.email_address = subscriptionRequest.email;
    this.status = 'subscribed';
    this.merge_fields = {
      G_USERID: subscriptionRequest.userId,
      G_VIA: subscriptionRequest.from
    };

    safeAssign(
      this.merge_fields, 'G_COUNTRY',
      subscriptionRequest.metadata, 'country'
    );

    safeAssign(
      this.merge_fields, 'G_YOB',
      subscriptionRequest.metadata, 'yearofbirth'
    );

    const location = resolveLocation(subscriptionRequest.metadata);
    if (location)
      this.location = location;
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

    return {
      hasProblems: (missing.length + invalid.length) > 0,
      missing,
      invalid
    };
  }
}

module.exports = {
  SubscriptionRequest,
  SubscriptionInfo,
  MailchimpPayload
};
