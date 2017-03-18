'use strict';

const async = require('async');
const {SubscriptionRequest} = require('../src/objects');

// fn is a function with signature:
//  - (callback)
//  - (argument, callback)
//
// In first case, we just return fn.
// In second case, we guard against <argument> being null by invoking
//   callback(null, null)
// in that case.
//
// Callback is expected to have signature (error, result).
const guardVsNull = (fn) => {
  switch (fn.length) {
    case 1:
      return fn;

    case 2:
      return (arg, cb) => {
        return (arg === null)
          ? process.nextTick(cb, null, null)
          : fn(arg, cb);
      };

    default:
      throw new Error(`fn() has unsupported number of arguments (${fn.length})`);
  }
};

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
    const request = SubscriptionRequest.fromEvent(
      event,
      {allowedFromValues: this.allowedFromValues}
    );

    const steps = [
      (cb) => cb(null, request), // We need `request` in scope for `usermeta.write()`.
      (request, cb) => this.mailchimp.subscribe(this.mailchimpListId, request, cb),
      (info, cb) => this.usermeta.write(
        request.userId,
        this.metaKey,
        JSON.stringify(info),
        (err, res) => cb(err)
      )
    ].map(guardVsNull);

    async.waterfall(steps, callback);
  }
}

module.exports = SubscribesUsers;
