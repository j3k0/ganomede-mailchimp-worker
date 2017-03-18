'use strict';

const {
  SubscriptionRequest,
  SubscriptionInfo,
  MailchimpPayload
} = require('../src/objects');

describe('objects', () => {
  describe('SubscriptionRequest', () => {
    describe('.fromEvent()', () => {
      const event = (overrides) => Object.assign({
        channel: 'users/v1',
        type: 'CREATE',
        from: 'app that user registred from',
        data: {
          userId: 'alice',
          aliases: {
            email: 'alice@wonderland.com'
          },
          metadata: {
            some: 'stuff'
          }
        }
      }, overrides);

      it('creates SubscriptionInfo event', () => {
        expect(SubscriptionRequest.fromEvent(event())).to.eql({
          userId: 'alice',
          email: 'alice@wonderland.com',
          from: 'app that user registred from',
          metadata: {
            some: 'stuff'
          }
        });
      });

      it('only accepts CREATE events', () => {
        expect(SubscriptionRequest.fromEvent(event({type: 'x'}))).to.be.null;
      });

      it('only accepts events with matching `from` if allowedFromValues is specified', () => {
        expect(SubscriptionRequest.fromEvent(
          event(),
          {allowedFromValues: ['something else']}
        )).to.be.null;
      });
    });
  });

  describe('SubscriptionInfo', () => {

  });

  describe('MailchimpPayload', () => {
    const request = new SubscriptionRequest({
      userId: 'alice',
      email: 'alice@wonderland.com',
      from: 'app',
      metadata: {}
    });

    const payload = new MailchimpPayload(request);

    it('new MailchimpPayload() correctly initialized from request', () => {
      expect(payload).to.eql({
        email_address: 'alice@wonderland.com',
        status: 'subscribed',
        merge_fields: {
          G_USERID: 'alice',
          G_VIA: 'app'
        }
      });
    });

    it('#toSubscriptionInfo() includes all the redis things', () => {
      const reply = {
        id: 'some-md5',
        list_id: 'deadbeef',
        merge_fields: {something: 'true'} // intentionally omit G_VIA
      };

      const result = payload.toSubscriptionInfo(reply);

      expect(result).to.be.instanceof(SubscriptionInfo);
      expect(result).to.eql({
        type: 'mailchimp',
        listId: 'deadbeef',
        subscriptionId: 'some-md5',
        G_VIA: 'app'
      });
    });

    it('#detectProblems() lists missing merge_fields', () => {
      const problems = payload.detectProblems({
        merge_fields: {
          G_USERID: 'not-alice'
        }
      });

      expect(problems).to.eql({
        missing: ['G_VIA'],
        invalid: ['G_USERID']
      });
    });
  });
});
