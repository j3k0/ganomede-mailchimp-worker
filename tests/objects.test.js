'use strict';

const lodash = require('lodash');
const samples = require('./samples');
const {
  SubscriptionRequest,
  SubscriptionInfo,
  MailchimpPayload
} = require('../src/objects');

describe('objects', () => {
  describe('SubscriptionRequest', () => {
    describe('.fromEvent()', () => {
      const event = (overrides) => lodash.merge({
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

      describe('returns IgnoredEventError', () => {
        const mustBeError = (actual, re) => {
          expect(actual).to.be.instanceof(SubscriptionRequest.IgnoredEventError);
          expect(actual.message).to[re instanceof RegExp ? 'match' : 'equal'](re);
        };

        it('if `type` is not CREATE', () => {
          mustBeError(
            SubscriptionRequest.fromEvent(event({type: 'x'})),
            '`event.type` "x" is ignored'
          );
        });

        it('if `from` does not match any of allowedFromValues', () => {
          mustBeError(
            SubscriptionRequest.fromEvent(event(), {allowedFromValues: ['something else']}),
            /^`event\.from` does not match any of allowed values/
          );
        });

        it('if `data.aliases.email` is malformed or missing', () => {
          const e = event();
          assert(delete e.data.aliases.email);
          mustBeError(
            SubscriptionRequest.fromEvent(e),
            /^`event\.data\.aliases\.email` is malformed or missing/
          );
        });

        it('if `data.metadata.newsletter` is false', () => {
          const e = event({data: {metadata: {newsletter: false}}});
          mustBeError(
            SubscriptionRequest.fromEvent(e),
            '`event.data.metadata.newsletter` is false'
          );
        });
      });
    });
  });

  describe('MailchimpPayload', () => {
    const request = new SubscriptionRequest({
      userId: 'alice',
      email: 'alice@wonderland.com',
      from: 'app',
      metadata: {
        country: 'Russia',
        yearofbirth: 2000,
        newsletter: true
      }
    });

    const payload = new MailchimpPayload(request);

    it('new MailchimpPayload() correctly initialized from request', () => {
      expect(payload).to.eql({
        email_address: 'alice@wonderland.com',
        status: 'subscribed',
        merge_fields: {
          G_USERID: 'alice',
          G_VIA: 'app',
          G_COUNTRY: 'Russia',
          G_YOB: 2000
        }
      });
    });

    it('#toSubscriptionInfo() includes all the redis things', () => {
      const result = payload.toSubscriptionInfo(samples.mailchimp.addMemberReply);

      expect(result).to.be.instanceof(SubscriptionInfo);
      expect(result).to.eql({
        type: 'mailchimp',
        listId: '85b0235cb4',
        subscriptionId: '488604a52f35acb808c17fcd36f96881',
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
        hasProblems: true,
        missing: ['G_VIA', 'G_COUNTRY', 'G_YOB'],
        invalid: ['G_USERID']
      });
    });
  });
});
