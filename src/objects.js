'use strict';

const resolveLocation = require('./resolve-location');
const {hasOwnProperty} = require('./utils');

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
  constructor (action) {
    this.email_address = action.email;
    this.status = 'subscribed';
    this.merge_fields = {
      G_USERID: action.userId,
      G_VIA: action.from
    };

    safeAssign(
      this.merge_fields, 'G_COUNTRY',
      action.metadata, 'country'
    );

    safeAssign(
      this.merge_fields, 'G_YOB',
      action.metadata, 'yearofbirth'
    );

    const location = resolveLocation(action.metadata);
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
  SubscriptionInfo,
  MailchimpPayload
};
